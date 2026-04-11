import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import Package from '../models/Package';
import PackagePurchase from '../models/PackagePurchase';
import Commission from '../models/Commission';
import User, { COMMISSION_RATES, PackageTier } from '../models/User';
import Transaction from '../models/Transaction';
import Notification from '../models/Notification';

const razorpay = process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('your_')
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! })
  : null;

const GST_RATE = 0.18;

// GET /api/packages — public
export const getPackages = async (req: any, res: Response) => {
  try {
    const packages = await Package.find({ isActive: true }).sort('displayOrder');
    res.json({ success: true, packages });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/packages/:id — public, single package
export const getPackageById = async (req: any, res: Response) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, package: pkg });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/packages/order — create Razorpay order for package purchase
export const createPackageOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { tier, packageId, affiliateCode } = req.body;

    // Support both _id (new) and tier slug (legacy)
    const pkg = packageId
      ? await Package.findById(packageId)
      : await Package.findOne({ tier, isActive: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    // Prevent re-purchasing same package
    const existing = await (await import('../models/PackagePurchase')).default.findOne({
      user: req.user._id, package: pkg._id, status: 'completed'
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have this package' });
    }

    // Resolve referrer
    let referredBy;
    if (affiliateCode && affiliateCode !== req.user.affiliateCode) {
      const referrer = await User.findOne({ affiliateCode });
      if (referrer && referrer.isAffiliate) referredBy = referrer._id;
    } else {
      referredBy = req.user.referredBy;
    }

    const gstAmount = Math.round(pkg.price * GST_RATE);
    const totalAmount = pkg.price + gstAmount;

    if (!razorpay) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured' });
    }

    const order = await (razorpay as any).orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `pkg_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), tier: pkg.tier || pkg._id.toString(), packageId: pkg._id.toString() }
    });

    const purchase = await PackagePurchase.create({
      user: req.user._id,
      package: pkg._id,
      packageTier: pkg.tier || pkg._id.toString(),
      amount: pkg.price,
      gstAmount,
      totalAmount,
      razorpayOrderId: order.id,
      affiliateCode: affiliateCode || undefined,
      referredBy,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      purchaseId: purchase._id,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/packages/verify — verify payment + unlock affiliate + trigger MLM commissions
export const verifyPackagePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expected !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const purchase = await PackagePurchase.findOneAndUpdate(
      { razorpayOrderId, status: 'created' },
      { razorpayPaymentId, razorpaySignature, status: 'paid' },
      { new: true }
    );
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase record not found' });

    const tier = purchase.packageTier as PackageTier;
    const commissionRate = COMMISSION_RATES[tier];

    // Upgrade user package
    const updatedUser = await User.findByIdAndUpdate(
      purchase.user,
      {
        packageTier: tier,
        isAffiliate: true,
        commissionRate,
        packagePurchasedAt: new Date(),
        $inc: { xpPoints: 500 },
      },
      { new: true }
    );

    // Credit 3-level MLM commissions
    await creditMLMCommissions(purchase, updatedUser);

    // Notify user
    await Notification.create({
      user: purchase.user,
      title: '🎉 Package Activated!',
      message: `Your ${tier} package is active. Affiliate panel unlocked. Start earning now!`,
      type: 'success',
      channel: 'inapp',
    });

    res.json({ success: true, message: 'Package activated! Affiliate panel unlocked.', tier });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

async function creditMLMCommissions(purchase: any, buyer: any) {
  // RULE: Commission % = earner's OWN tier rate (not buyer's tier rate)
  // Level 1 = buyer's upline1 (direct referrer) at their tier %
  // Level 2 = buyer's upline2 at fixed 5%
  // Level 3 = buyer's upline3 at fixed 2%

  const saleAmount = purchase.amount; // base price without GST

  // Resolve uplines from buyer's referral chain
  const uplines: { userId: any; level: 1 | 2 | 3 }[] = [];

  if (buyer.upline1) uplines.push({ userId: buyer.upline1, level: 1 });
  if (buyer.upline2) uplines.push({ userId: buyer.upline2, level: 2 });
  if (buyer.upline3) uplines.push({ userId: buyer.upline3, level: 3 });

  // If uplines not set, try referredBy
  if (uplines.length === 0 && buyer.referredBy) {
    const l1 = await User.findById(buyer.referredBy);
    if (l1 && l1.isAffiliate) {
      uplines.push({ userId: l1._id, level: 1 });
      if (l1.referredBy) {
        const l2 = await User.findById(l1.referredBy);
        if (l2 && l2.isAffiliate) {
          uplines.push({ userId: l2._id, level: 2 });
          if (l2.referredBy) {
            const l3 = await User.findById(l2.referredBy);
            if (l3 && l3.isAffiliate) uplines.push({ userId: l3._id, level: 3 });
          }
        }
      }
      // Update buyer's upline chain for future
      await User.findByIdAndUpdate(buyer._id, {
        upline1: uplines[0]?.userId,
        upline2: uplines[1]?.userId,
        upline3: uplines[2]?.userId,
      });
    }
  }

  for (const upline of uplines) {
    const earner = await User.findById(upline.userId);
    if (!earner || !earner.isAffiliate) continue;

    let levelRate: number;
    if (upline.level === 1) {
      levelRate = COMMISSION_RATES[earner.packageTier as PackageTier]; // earner's own tier %
    } else if (upline.level === 2) {
      levelRate = 5; // fixed
    } else {
      levelRate = 2; // fixed
    }

    const commissionAmount = Math.round((saleAmount * levelRate) / 100);
    if (commissionAmount <= 0) continue;

    // Create commission record
    await Commission.create({
      earner: earner._id,
      earnerTier: earner.packageTier,
      earnerCommissionRate: earner.commissionRate,
      buyer: buyer._id,
      buyerPackageTier: purchase.packageTier,
      level: upline.level,
      levelRate,
      saleAmount,
      commissionAmount,
      packagePurchaseId: purchase._id,
    });

    // Credit wallet
    await User.findByIdAndUpdate(earner._id, {
      $inc: { wallet: commissionAmount, totalEarnings: commissionAmount },
    });

    // Transaction record
    await Transaction.create({
      user: earner._id,
      type: 'credit',
      category: 'affiliate_commission',
      amount: commissionAmount,
      description: `Level ${upline.level} commission — ${purchase.packageTier} package sale (${levelRate}%)`,
      referenceId: purchase._id.toString(),
      status: 'completed',
      balanceAfter: (earner.wallet || 0) + commissionAmount,
    });

    // In-app notification
    await Notification.create({
      user: earner._id,
      title: `💰 Commission Earned — ₹${commissionAmount}`,
      message: `Level ${upline.level} commission credited for a ${purchase.packageTier} package sale.`,
      type: 'commission',
      channel: 'inapp',
    });
  }
}

// GET /api/packages/my — get current user's package info
export const getMyPackage = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('packageTier isAffiliate commissionRate packagePurchasedAt wallet totalEarnings affiliateCode');
    const purchases = await PackagePurchase.find({ user: req.user._id, status: 'paid' }).sort('-createdAt').limit(5);
    res.json({ success: true, user, purchases });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/packages/commission-matrix — show the full commission matrix
export const getCommissionMatrix = async (_req: any, res: Response) => {
  const tiers = ['starter', 'pro', 'elite', 'supreme'];
  const prices = { starter: 4999, pro: 9999, elite: 19999, supreme: 29999 };
  const rates = { starter: 10, pro: 15, elite: 22, supreme: 30 };

  const matrix = tiers.map(myTier => ({
    myTier,
    myRate: rates[myTier as keyof typeof rates],
    earnings: tiers.map(saleTier => ({
      saleTier,
      salePrice: prices[saleTier as keyof typeof prices],
      l1Earn: Math.round(prices[saleTier as keyof typeof prices] * rates[myTier as keyof typeof rates] / 100),
    }))
  }));

  res.json({ success: true, matrix, mlm: { level2: '5% fixed', level3: '2% fixed' } });
};
