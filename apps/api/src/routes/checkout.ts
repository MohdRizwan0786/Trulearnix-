import { Router } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { protect, optionalAuth } from '../middleware/auth';
import { getUpgradeCredit, UPGRADE_WINDOW_DAYS } from '../utils/upgradeCredit';
import User, { COMMISSION_RATES } from '../models/User';
import Package from '../models/Package';
import PackagePurchase from '../models/PackagePurchase';
import Payment from '../models/Payment';
import Enrollment from '../models/Enrollment';
import Coupon from '../models/Coupon';
import Transaction from '../models/Transaction';
import Commission from '../models/Commission';
import EmiInstallment from '../models/EmiInstallment';
import { ensureCompulsoryEnrollments } from '../services/enrollmentService';
import PlatformSettings from '../models/PlatformSettings';
import { getOrCreateActiveBatch, onStudentEnrolled } from '../services/batchService';
import { checkEarningMilestones } from '../services/milestoneService';

// Cache GST rate to avoid DB hit on every request
let _cachedGstRate: number | null = null;
let _gstCacheTime = 0;
async function getGstRate(): Promise<number> {
  const now = Date.now();
  if (_cachedGstRate !== null && now - _gstCacheTime < 5 * 60 * 1000) return _cachedGstRate;
  const settings = await PlatformSettings.findOne().select('gstRate').lean();
  _cachedGstRate = settings?.gstRate ?? 18;
  _gstCacheTime = now;
  return _cachedGstRate;
}

const router = Router();

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ── helpers ───────────────────────────────────────────────────────────────────
function verifySignature(orderId: string, paymentId: string, signature: string) {
  const body = orderId + '|' + paymentId;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');
  return expected === signature;
}

function calcComm(saleAmount: number, type: string, value: number): number {
  if (!value) return 0;
  return type === 'flat' ? value : Math.round(saleAmount * value / 100);
}

async function creditMLM(purchasedUserId: string, saleAmount: number, purchaseId: string, tier: string, soldPkg?: any) {
  try {
    const buyer = await User.findById(purchasedUserId).populate('referredBy');
    if (!buyer) return;

    // Resolve uplines from referral chain if not set
    const level1Id = buyer.upline1 || (buyer.referredBy as any)?._id || buyer.referredBy;
    if (!level1Id) return;

    const level1 = await User.findById(level1Id);
    if (!level1 || !level1.isAffiliate) return;

    const uplineUsers: { user: any; mlmLevel: number }[] = [{ user: level1, mlmLevel: 1 }];
    const level2Id = level1.upline1 || level1.referredBy;
    if (level2Id) {
      const level2 = await User.findById(level2Id);
      if (level2?.isAffiliate) {
        uplineUsers.push({ user: level2, mlmLevel: 2 });
        const level3Id = level2.upline1 || level2.referredBy;
        if (level3Id) {
          const level3 = await User.findById(level3Id);
          if (level3?.isAffiliate) uplineUsers.push({ user: level3, mlmLevel: 3 });
        }
      }
    }

    for (const { user: earner, mlmLevel } of uplineUsers) {
      try {
        // Idempotency: skip if already credited for this purchase + level
        const alreadyCredited = await Commission.findOne({
          buyer: purchasedUserId, packagePurchaseId: purchaseId, level: mlmLevel,
        });
        if (alreadyCredited) continue;

        const earnerTier = (earner.packageTier || 'free').toLowerCase();

        // L1: look up partnerEarnings matrix by earner's package _id
        const earnerPkg = soldPkg?.partnerEarnings?.length
          ? await Package.findOne({ tier: earnerTier }).select('_id')
          : null;
        const matrixRow = earnerPkg
          ? soldPkg?.partnerEarnings?.find((r: any) => r.earnerTier?.toString() === earnerPkg._id?.toString())
          : null;

        let commAmt = 0;
        let rateUsed = 0;

        if (mlmLevel === 1) {
          if (matrixRow) {
            commAmt = calcComm(saleAmount, matrixRow.type, matrixRow.value);
            rateUsed = matrixRow.value;
          } else {
            const fallbackRate = earner.commissionRate || 0;
            commAmt = Math.round(saleAmount * fallbackRate / 100);
            rateUsed = fallbackRate;
          }
        } else if (mlmLevel === 2) {
          commAmt = calcComm(saleAmount, soldPkg?.commissionLevel2Type || 'flat', soldPkg?.commissionLevel2 || 0);
          rateUsed = soldPkg?.commissionLevel2 || 0;
        } else {
          commAmt = calcComm(saleAmount, soldPkg?.commissionLevel3Type || 'flat', soldPkg?.commissionLevel3 || 0);
          rateUsed = soldPkg?.commissionLevel3 || 0;
        }

        if (commAmt <= 0) continue;

        await Commission.create({
          earner: earner._id, earnerTier, earnerCommissionRate: rateUsed,
          buyer: purchasedUserId, buyerPackageTier: tier,
          level: mlmLevel, levelRate: rateUsed,
          saleAmount, commissionAmount: commAmt, packagePurchaseId: purchaseId, status: 'approved',
        });
        const prevEarnings = earner.totalEarnings || 0;
        const updatedEarner = await User.findByIdAndUpdate(earner._id, { $inc: { wallet: commAmt, totalEarnings: commAmt } }, { new: true });
        if (updatedEarner) {
          checkEarningMilestones(earner._id.toString(), prevEarnings, updatedEarner.totalEarnings, updatedEarner.name, updatedEarner.avatar, updatedEarner.affiliateCode).catch(() => {});
        }
        await Transaction.create({
          user: earner._id, type: 'credit', category: 'affiliate_commission',
          amount: commAmt, description: `L${mlmLevel} Partnership earning — ${tier} package sold`,
          referenceId: purchaseId, status: 'completed',
        });
        await User.findByIdAndUpdate(earner._id, {
          $push: { notifications: { type: 'commission', message: `🎉 ₹${commAmt} earned! L${mlmLevel} Partnership earning from ${tier} package sale.`, read: false, createdAt: new Date() } }
        });
        // Push notification to earner
        try {
          const { notify } = await import('../services/pushService');
          await notify(earner._id, `💰 ₹${commAmt} Partnership earning Earned!`, `You earned a Level ${mlmLevel} Partnership earning from a ${tier} package sale.`, { type: 'commission', url: '/partner/earnings', tag: 'commission' });
        } catch {}
      } catch (levelErr: any) {
        console.error(`[MLM Commission Error] L${mlmLevel} for purchase ${purchaseId}:`, levelErr.message);
      }
    }

    // ── Manager commission (for the L1 partner's manager) ──────────────────
    try {
      const mgCommRate = soldPkg?.managerCommission;
      if (mgCommRate && mgCommRate.value > 0 && level1?.managerId) {
        const manager = await User.findById(level1.managerId).select('_id wallet totalEarnings');
        if (manager) {
          const alreadyCredited = await Commission.findOne({
            buyer: purchasedUserId, packagePurchaseId: purchaseId, level: 99,
          });
          if (!alreadyCredited) {
            const mgAmt = calcComm(saleAmount, mgCommRate.type || 'percentage', mgCommRate.value);
            if (mgAmt > 0) {
              await Commission.create({
                earner: manager._id, earnerTier: 'manager', earnerCommissionRate: mgCommRate.value,
                buyer: purchasedUserId, buyerPackageTier: tier,
                level: 99, levelRate: mgCommRate.value,
                saleAmount, commissionAmount: mgAmt, packagePurchaseId: purchaseId, status: 'approved',
              });
              await User.findByIdAndUpdate(manager._id, { $inc: { wallet: mgAmt, totalEarnings: mgAmt } });
              await Transaction.create({
                user: manager._id, type: 'credit', category: 'affiliate_commission',
                amount: mgAmt, description: `Manager Partnership earning — ${tier} package sold by partner`,
                referenceId: purchaseId, status: 'completed',
              });
              await User.findByIdAndUpdate(manager._id, {
                $push: { notifications: { type: 'commission', message: `💼 ₹${mgAmt} manager Partnership earning from ${tier} package sale!`, read: false, createdAt: new Date() } }
              });
            }
          }
        }
      }
    } catch (mgErr: any) {
      console.error('[Manager Commission Error]', mgErr.message);
    }

    // Set upline chain for future (non-critical)
    try {
      if (!buyer.upline1) {
        await User.findByIdAndUpdate(purchasedUserId, {
          upline1: level1Id,
          ...(uplineUsers[1] ? { upline2: uplineUsers[1].user._id } : {}),
          ...(uplineUsers[2] ? { upline3: uplineUsers[2].user._id } : {}),
        });
      }
    } catch (uplineErr: any) {
      console.error('[MLM Upline Set Error]', uplineErr.message);
    }
  } catch (e: any) {
    console.error('[creditMLM Error]', e.message);
  }
}

// ── GET /api/checkout/item ─────────────────────────────────────────────────
router.get('/item', optionalAuth, async (req: any, res) => {
  try {
    const { type, tier, packageId, courseId } = req.query;

    if (type === 'package') {
      const pkg = packageId
        ? await Package.findById(packageId)
        : await Package.findOne({ tier, isActive: true });
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
      const gstRate = await getGstRate();
      const gst = Math.round(pkg.price * gstRate / 100);
      const total = pkg.price + gst;

      let upgrade: any = null;
      if (req.user?._id) {
        const info = await getUpgradeCredit(req.user._id, total, pkg._id);
        if (info.eligible) {
          upgrade = {
            eligible: true,
            upgradeCredit: info.upgradeCredit,
            payNow: Math.max(0, total - info.upgradeCredit),
            daysRemaining: info.daysRemaining,
            windowDays: info.windowDays,
            prevPurchaseId: info.prevPurchaseId,
          };
        } else {
          upgrade = { eligible: false, reason: info.reason, windowDays: UPGRADE_WINDOW_DAYS };
        }
      }

      return res.json({
        success: true, item: {
          type: 'package', id: pkg._id, tier: pkg.tier, name: pkg.name,
          price: pkg.price, gst, total,
          features: pkg.features, emiAvailable: pkg.emiAvailable,
          emiDays: (pkg.emiDays && pkg.emiDays.length ? pkg.emiDays : [0, 15, 30, 45]),
          emiMonthlyAmount: pkg.emiMonthlyAmount || Math.ceil(pkg.price / 4),
          badge: pkg.badge,
          upgrade,
        }
      });
    }

    if (type === 'course') {
      const Course = (await import('../models/Course')).default;
      const course = await Course.findById(courseId).select('title thumbnail price discountPrice instructor description');
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      const enrolled = req.user ? await Enrollment.findOne({ student: req.user._id, course: courseId }) : null;
      return res.json({
        success: true, item: {
          type: 'course', id: course._id, name: course.title,
          thumbnail: (course as any).thumbnail, instructor: (course as any).instructor,
          price: (course as any).discountPrice || (course as any).price,
          originalPrice: (course as any).price, gst: 0,
          total: (course as any).discountPrice || (course as any).price,
          emiAvailable: false, alreadyEnrolled: !!enrolled,
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid type' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/checkout/validate-code ──────────────────────────────────────
router.post('/validate-code', async (req: any, res) => {
  try {
    const { code, codeType, type, tier, packageId: pkgIdParam, courseId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

    if (codeType === 'promo') {
      // Partner/referral code
      const referrer = await User.findOne({ affiliateCode: code.toUpperCase().trim() });
      if (!referrer) return res.status(404).json({ success: false, message: 'Invalid partner code. Please check the code and try again.' });
      if (req.user && referrer._id.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: 'You cannot use your own promo code.' });

      // Get package's promoDiscountPercent — prefer packageId over tier name
      let basePrice = 0, discountPct = 0;
      if (type === 'package') {
        let pkg: any = null;
        if (pkgIdParam) {
          pkg = await Package.findById(pkgIdParam);
        } else if (tier && tier.length < 20) { // tier is a name like 'starter', not an ObjectId
          pkg = await Package.findOne({ tier, isActive: true });
        }
        basePrice = pkg?.price || 0;
        discountPct = pkg?.promoDiscountPercent || 0;
      } else if (courseId) {
        const Course = (await import('../models/Course')).default;
        const course = await Course.findById(courseId);
        basePrice = (course as any)?.discountPrice || (course as any)?.price || 0;
      }

      const referrerFirstName = referrer.name.split(' ')[0];
      const discount = discountPct > 0 ? Math.round(basePrice * discountPct / 100) : 0;
      const msg = discount > 0
        ? `Code applied! You get ₹${discount} off (${discountPct}% discount) — referred by ${referrerFirstName}`
        : `Code applied! Referred by ${referrerFirstName}.`;

      return res.json({ success: true, valid: true, message: msg, discount, discountPercent: discountPct, referrerId: referrer._id, referrerName: referrerFirstName });
    }

    if (codeType === 'coupon') {
      const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
      if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
      if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Coupon has reached max usage' });
      if (new Date() > coupon.expiresAt) return res.status(400).json({ success: false, message: 'Coupon has expired' });

      // Get base price (support both packageId and tier lookups)
      let basePrice = 0;
      let resolvedTier = tier;
      if (type === 'package') {
        const pkg = pkgIdParam
          ? await Package.findById(pkgIdParam)
          : await Package.findOne({ tier, isActive: true });
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
        basePrice = pkg.price;
        resolvedTier = pkg.tier;
      } else {
        const Course = (await import('../models/Course')).default;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        basePrice = (course as any)?.discountPrice || (course as any)?.price || 0;
      }

      // Check tier applicability for packages
      if (type === 'package' && coupon.applicableTiers.length > 0 && !coupon.applicableTiers.includes(resolvedTier)) {
        return res.status(400).json({ success: false, message: `This coupon is not valid for the ${resolvedTier} package` });
      }

      if (basePrice < coupon.minOrderValue) {
        return res.status(400).json({ success: false, message: `Minimum order value ₹${coupon.minOrderValue} required` });
      }

      const discount = coupon.type === 'percent'
        ? Math.round(basePrice * coupon.value / 100)
        : Math.min(coupon.value, basePrice);

      return res.json({ success: true, valid: true, discount, couponType: coupon.type, couponValue: coupon.value, message: `Coupon applied! ₹${discount} off` });
    }

    return res.status(400).json({ success: false, message: 'Invalid code type' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/checkout/create-order ───────────────────────────────────────
router.post('/create-order', protect, async (req: any, res) => {
  try {
    const { type, tier, courseId, promoCode, couponCode, isEmi, isToken, tokenMode, name, email } = req.body;
    // tier field now accepts either tier slug or package _id
    const pkgIdentifier = tier;

    let basePrice = 0, gst = 0, discount = 0, itemName = '', packageId: any = null;
    let pkgDoc: any = null;

    if (type === 'package') {
      const pkg = mongoose.Types.ObjectId.isValid(pkgIdentifier)
        ? await Package.findById(pkgIdentifier)
        : await Package.findOne({ tier: pkgIdentifier, isActive: true });
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
      pkgDoc = pkg;
      basePrice = pkg.price;
      packageId = pkg._id;
      itemName = `${pkg.name} Package`;
    } else if (type === 'course') {
      const Course = (await import('../models/Course')).default;
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

      const enrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
      if (enrolled) return res.status(400).json({ success: false, message: 'Already enrolled' });

      basePrice = (course as any).discountPrice || (course as any).price;
      itemName = (course as any).title;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    // Apply promo code discount (based on package's promoDiscountPercent)
    let promoDiscount = 0;
    if (promoCode) {
      const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
      if (referrer && referrer._id.toString() !== req.user._id.toString()) {
        // Get discount % from the package being purchased
        let pkgDiscountPct = 0;
        if (type === 'package' && packageId) {
          const purchasePkg = await Package.findById(packageId).select('promoDiscountPercent');
          pkgDiscountPct = purchasePkg?.promoDiscountPercent || 0;
        } else if (type === 'package' && tier) {
          const purchasePkg = await Package.findOne({ tier, isActive: true }).select('promoDiscountPercent');
          pkgDiscountPct = purchasePkg?.promoDiscountPercent || 0;
        }
        if (pkgDiscountPct > 0) promoDiscount = Math.round(basePrice * pkgDiscountPct / 100);
      }
    }

    // Apply coupon
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon && coupon.usedCount < coupon.maxUses && new Date() < coupon.expiresAt) {
        discount = coupon.type === 'percent'
          ? Math.round(basePrice * coupon.value / 100)
          : Math.min(coupon.value, basePrice);
      }
    }

    const totalDiscount = promoDiscount + discount;
    const afterDiscount = Math.max(0, basePrice - totalDiscount);
    const gstRateForOrder = type === 'package' ? await getGstRate() : 0;
    gst = type === 'package' ? Math.round(afterDiscount * gstRateForOrder / 100) : 0;
    let totalAmount = afterDiscount + gst;
    const fullPackagePrice = totalAmount; // full price before any EMI/token/upgrade reduction

    // Determine payment type and amount to pay now
    let isEmiOrder = false;
    let emiInstallmentAmount = totalAmount;
    let emiMonths = 4;
    let paymentType: 'full' | 'emi' | 'token_emi' | 'token_full' = 'full';
    let tokenAmountToPay = 0;

    // 10-day upgrade credit (full-payment upgrades only — not allowed with EMI/token)
    let upgradeCreditAmt = 0;
    let upgradeFromPurchaseId: any = null;
    let upgradeDeltaBase = afterDiscount;
    let upgradeDeltaGst = gst;
    if (type === 'package' && !isEmi && !isToken && packageId) {
      const info = await getUpgradeCredit(req.user._id, totalAmount, packageId);
      if (info.eligible) {
        upgradeCreditAmt = info.upgradeCredit;
        upgradeFromPurchaseId = info.prevPurchaseId;
        const deltaTotal = Math.max(0, totalAmount - upgradeCreditAmt);
        // Split delta proportionally so commissions only apply to delta base
        upgradeDeltaBase = Math.round(deltaTotal / (1 + (gstRateForOrder / 100)));
        upgradeDeltaGst = Math.max(0, deltaTotal - upgradeDeltaBase);
        totalAmount = deltaTotal;
      }
    }

    if (type === 'package') {
      if (isToken && pkgDoc?.tokenAvailable && pkgDoc?.tokenAmount > 0) {
        // Token payment (advance)
        tokenAmountToPay = pkgDoc.tokenAmount;
        totalAmount = tokenAmountToPay;
        if (tokenMode === 'emi') {
          paymentType = 'token_emi';
          isEmiOrder = true;
          emiMonths = 4;
        } else {
          paymentType = 'token_full';
        }
      } else if (isEmi) {
        emiMonths = 4;
        emiInstallmentAmount = Math.ceil(totalAmount / emiMonths);
        totalAmount = emiInstallmentAmount; // pay first installment now
        isEmiOrder = true;
        paymentType = 'emi';
      }
    }

    const order = await rzp.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { type, tier: tier || '', courseId: courseId || '', userId: req.user._id.toString() },
    });

    // Create purchase record
    if (type === 'package') {
      const isUpgradeOrder = upgradeCreditAmt > 0;
      const purchaseData: any = {
        user: req.user._id, package: packageId, packageTier: tier,
        amount: paymentType.startsWith('token')
          ? tokenAmountToPay
          : (isUpgradeOrder ? upgradeDeltaBase : afterDiscount),
        gstAmount: paymentType.startsWith('token')
          ? 0
          : (isUpgradeOrder ? upgradeDeltaGst : gst),
        totalAmount: paymentType.startsWith('token')
          ? tokenAmountToPay
          : (isUpgradeOrder ? (upgradeDeltaBase + upgradeDeltaGst) : (afterDiscount + gst)),
        razorpayOrderId: order.id, status: 'created',
        affiliateCode: promoCode || '', isEmi: isEmiOrder,
        emiMonth: isEmiOrder ? 1 : undefined, emiTotal: isEmiOrder ? emiMonths : undefined,
        paymentType,
        tokenAmount: paymentType.startsWith('token') ? tokenAmountToPay : undefined,
        fullPackagePrice: paymentType.startsWith('token') || isUpgradeOrder ? fullPackagePrice : undefined,
        ...(isUpgradeOrder ? { upgradeCredit: upgradeCreditAmt, upgradeFromPurchase: upgradeFromPurchaseId } : {}),
      };
      const purchase = await PackagePurchase.create(purchaseData);
      return res.json({
        success: true, orderId: order.id, amount: Math.round(totalAmount * 100),
        currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID, purchaseId: purchase._id,
        itemName, isEmi: isEmiOrder, emiInstallmentAmount, emiMonths, paymentType,
        tokenAmount: tokenAmountToPay || undefined,
        upgradeCredit: upgradeCreditAmt || undefined,
        fullPackagePrice: isUpgradeOrder ? fullPackagePrice : undefined,
      });
    } else {
      // Course
      const payment = await Payment.create({
        user: req.user._id, course: courseId, amount: totalAmount,
        razorpayOrderId: order.id, status: 'created',
        affiliateCode: promoCode || '',
      });
      if (promoCode) {
        const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
        if (referrer) (payment as any).affiliateUser = referrer._id;
        await payment.save();
      }
      return res.json({
        success: true, orderId: order.id, amount: Math.round(totalAmount * 100),
        currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID, purchaseId: payment._id,
        itemName, isEmi: false,
      });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/checkout/verify ─────────────────────────────────────────────
router.post('/verify', protect, async (req: any, res) => {
  try {
    const { type, razorpayOrderId, razorpayPaymentId, razorpaySignature, purchaseId, couponCode, promoCode, isEmi } = req.body;

    if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    if (type === 'package') {
      const purchase = await PackagePurchase.findById(purchaseId).populate('package');
      if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

      // Idempotency: already processed → return success immediately
      if (purchase.status === 'paid') {
        return res.json({ success: true, message: `Welcome to ${(purchase.package as any)?.name || purchase.packageTier}!`, tier: purchase.packageTier, isEmi: purchase.isEmi });
      }

      // ── CRITICAL: mark payment confirmed ─────────────────────────────────
      purchase.razorpayPaymentId = razorpayPaymentId;
      purchase.razorpaySignature = razorpaySignature;
      purchase.status = 'paid';
      await purchase.save();

      const pkg = purchase.package as any;
      const tier = purchase.packageTier as any;

      // ── CRITICAL: grant package access ───────────────────────────────────
      // Prefer live admin-configured rate from the Package doc
      const liveRate = (pkg && typeof pkg.commissionRate === 'number') ? pkg.commissionRate : null;
      const fallbackRate = COMMISSION_RATES[tier as keyof typeof COMMISSION_RATES] ?? 10;
      await User.findByIdAndUpdate(req.user._id, {
        packageTier: tier,
        isAffiliate: true,
        commissionRate: liveRate ?? fallbackRate,
        packagePurchasedAt: new Date(),
        packageSuspended: false,
        $inc: { xpPoints: 500 },
      });
      ensureCompulsoryEnrollments(req.user._id.toString()).catch(err =>
        console.error('[checkout-compulsory]', err?.message)
      );

      // ── NON-CRITICAL: EMI schedule ────────────────────────────────────────
      if (purchase.isEmi) {
        try {
          const emiDays: number[] = (pkg?.emiDays && pkg.emiDays.length) ? pkg.emiDays : [0, 15, 30, 45];
          const EMI_TOTAL = emiDays.length;
          // For token_emi: installments are on the REMAINING balance (fullPackagePrice - tokenAmount)
          // For regular emi: installments are on the full package price
          const emiBase = (purchase as any).paymentType === 'token_emi'
            ? Math.max(0, ((purchase as any).fullPackagePrice || 0) - ((purchase as any).tokenAmount || 0))
            : purchase.amount + purchase.gstAmount;
          const totalAmt = emiBase;
          const installmentAmt = Math.ceil(totalAmt / EMI_TOTAL);
          const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
          const now = new Date();

          let partnerUserId: any = null;
          let managerUserId: any = null;
          const promoCodeStr = purchase.affiliateCode || promoCode || '';
          if (promoCodeStr) {
            const partnerUser = await User.findOne({ affiliateCode: (promoCodeStr as string).toUpperCase().trim() }).select('_id managerId');
            if (partnerUser) {
              partnerUserId = partnerUser._id;
              if ((partnerUser as any).managerId) managerUserId = (partnerUser as any).managerId;
            }
          }

          // Use package's salesTeamCommission rate for partner
          let perInstallmentComm = 0;
          if (partnerUserId && pkg?.salesTeamCommission) {
            const sc = pkg.salesTeamCommission;
            const rate = sc.type === 'flat' ? sc.value / EMI_TOTAL : Math.floor(installmentAmt * sc.value / 100);
            perInstallmentComm = Math.floor(rate);
          }

          // Manager commission per installment from package's managerCommission
          let perInstallmentMgrComm = 0;
          if (managerUserId && pkg?.managerCommission) {
            const mc = pkg.managerCommission;
            const rate = mc.type === 'flat' ? mc.value / EMI_TOTAL : Math.floor(installmentAmt * mc.value / 100);
            perInstallmentMgrComm = Math.floor(rate);
          }

          // Only create schedule if not already exists
          const existingInst = await EmiInstallment.findOne({ packagePurchase: purchase._id });
          if (!existingInst) {
            // Installment 1 — already paid now
            await EmiInstallment.create({
              user: req.user._id, packagePurchase: purchase._id,
              installmentNumber: 1, totalInstallments: EMI_TOTAL, amount: installmentAmt,
              dueDate: now, paidAt: now, razorpayOrderId, razorpayPaymentId, status: 'paid',
              partnerUser: partnerUserId, partnerCommissionAmount: perInstallmentComm,
              partnerCommissionPaid: perInstallmentComm > 0,
              managerUser: managerUserId, managerCommissionAmount: perInstallmentMgrComm,
              managerCommissionPaid: perInstallmentMgrComm > 0,
            });
            // Credit installment 1 commissions immediately
            if (perInstallmentComm > 0 && partnerUserId) {
              await User.findByIdAndUpdate(partnerUserId, { $inc: { wallet: perInstallmentComm, totalEarnings: perInstallmentComm } });
            }
            if (perInstallmentMgrComm > 0 && managerUserId) {
              await User.findByIdAndUpdate(managerUserId, { $inc: { wallet: perInstallmentMgrComm, totalEarnings: perInstallmentMgrComm } });
            }
            // Remaining installments
            for (let i = 2; i <= EMI_TOTAL; i++) {
              const dueDate = new Date(now);
              dueDate.setDate(dueDate.getDate() + emiDays[i - 1]);
              const inst = await EmiInstallment.create({
                user: req.user._id, packagePurchase: purchase._id,
                installmentNumber: i, totalInstallments: EMI_TOTAL,
                amount: installmentAmt, dueDate, status: 'pending',
                partnerUser: partnerUserId, partnerCommissionAmount: perInstallmentComm, partnerCommissionPaid: false,
                managerUser: managerUserId, managerCommissionAmount: perInstallmentMgrComm, managerCommissionPaid: false,
              });
              await EmiInstallment.findByIdAndUpdate(inst._id, { paymentLink: `${webUrl}/pay/emi/${inst._id}` });
            }
          }
        } catch (emiErr: any) {
          console.error('[EMI Schedule Error]', emiErr.message);
        }
      }

      // ── NON-CRITICAL: coupon, commission, notification ────────────────────
      try {
        if (couponCode) await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase().trim() }, { $inc: { usedCount: 1 } });
      } catch (couponErr: any) {
        console.error('[Coupon Increment Error]', couponErr.message);
      }

      try {
        const emiMonthsFinal = 4;
        const commSaleAmount = purchase.isEmi ? Math.ceil(purchase.amount / emiMonthsFinal) : purchase.amount;
        await creditMLM(req.user._id.toString(), commSaleAmount, purchase._id.toString(), tier, pkg);
      } catch (mlmErr: any) {
        console.error('[MLM Credit Error]', mlmErr.message);
      }

      try {
        await User.findByIdAndUpdate(req.user._id, {
          $push: { notifications: { type: 'package', message: `🎉 Welcome to ${pkg?.name || tier}! Your account is now upgraded.`, read: false, createdAt: new Date() } }
        });
      } catch (notifErr: any) {
        console.error('[Package Notification Error]', notifErr.message);
      }

      // Push notification to buyer
      try {
        const { notify } = await import('../services/pushService');
        await notify(req.user._id, `🎉 Welcome to ${pkg?.name || tier}!`, `Your account is now upgraded. Start your learning journey now!`, { type: 'success', url: '/student/courses', tag: 'package-purchase' });
      } catch {}

      // Fire-and-forget: invoice email + WhatsApp
      (async () => {
        try {
          const buyer = await User.findById(req.user._id).select('name email phone');
          if (!buyer) return;
          const { sendInvoiceEmail } = await import('../services/emailService');
          const { sendInvoiceTemplate } = await import('../services/whatsappMetaService');
          const pkgName = pkg?.name || tier;
          const invoiceNumber = `TLX-${purchase._id.toString().slice(-8).toUpperCase()}`;
          const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

          const pType = (purchase as any).paymentType || (purchase.isEmi ? 'emi' : 'full');
          if (pType === 'token_emi' || pType === 'token_full') {
            const tokenAmt = (purchase as any).tokenAmount || purchase.totalAmount;
            const fullPrice = (purchase as any).fullPackagePrice || 0;
            await sendInvoiceEmail(buyer.email, {
              invoiceNumber, invoiceDate,
              userName: buyer.name, userEmail: buyer.email,
              packageName: pkgName,
              paymentType: pType === 'token_emi' ? 'token_emi' : 'token_full',
              amountPaid: tokenAmt,
              fullPackagePrice: fullPrice,
            });
            if (buyer.phone) {
              const desc = `${pkgName} — Token/Advance Payment`;
              await sendInvoiceTemplate(buyer.phone, buyer.name, desc, tokenAmt, invoiceNumber);
            }
          } else if (pType === 'emi') {
            const nextInst = await EmiInstallment.findOne({ packagePurchase: purchase._id, installmentNumber: 2 });
            const totalInstallments = (nextInst as any)?.totalInstallments || 4;
            const installmentAmt = Math.ceil((purchase.amount + purchase.gstAmount) / totalInstallments);
            await sendInvoiceEmail(buyer.email, {
              invoiceNumber, invoiceDate,
              userName: buyer.name, userEmail: buyer.email,
              packageName: pkgName,
              paymentType: 'emi',
              amountPaid: installmentAmt,
              totalInstallments,
            });
            if (buyer.phone) {
              const desc = `${pkgName} — EMI Installment 1 of ${totalInstallments}`;
              await sendInvoiceTemplate(buyer.phone, buyer.name, desc, installmentAmt, invoiceNumber);
            }
          } else {
            const totalPaid = purchase.totalAmount || (purchase.amount + purchase.gstAmount);
            await sendInvoiceEmail(buyer.email, {
              invoiceNumber, invoiceDate,
              userName: buyer.name, userEmail: buyer.email,
              packageName: pkgName,
              paymentType: 'full',
              amountPaid: totalPaid,
              gstAmount: purchase.gstAmount,
            });
            if (buyer.phone) {
              const desc = `${pkgName} — Full Payment`;
              await sendInvoiceTemplate(buyer.phone, buyer.name, desc, totalPaid, invoiceNumber);
            }
          }
        } catch (e: any) {
          console.error('[invoice-notify]', e.message);
        }
      })();

      return res.json({ success: true, message: `Welcome to ${pkg?.name || tier}!`, tier, isEmi: purchase.isEmi });
    }

    if (type === 'course') {
      const payment = await Payment.findById(purchaseId).populate('affiliateUser');
      if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

      // Idempotency: already processed → return success
      if (payment.status === 'paid') {
        return res.json({ success: true, message: 'Enrollment successful!', courseId: payment.course });
      }

      // ── CRITICAL: mark payment confirmed ─────────────────────────────────
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = 'paid';
      await payment.save();

      // ── CRITICAL: enroll student ──────────────────────────────────────────
      const alreadyEnrolled = await Enrollment.findOne({ student: req.user._id, course: payment.course });
      if (!alreadyEnrolled) {
        const activeBatch = await getOrCreateActiveBatch(payment.course.toString());
        await Enrollment.create({
          student: req.user._id, course: payment.course,
          paymentId: razorpayPaymentId, orderId: razorpayOrderId, amount: payment.amount,
          ...(activeBatch ? { batch: activeBatch._id } : {}),
        });
        if (activeBatch) await onStudentEnrolled(activeBatch._id.toString());
        const Course = (await import('../models/Course')).default;
        await Course.findByIdAndUpdate(payment.course, { $inc: { enrolledCount: 1 } });
      }

      // ── NON-CRITICAL: grant affiliate status to course buyer ──────────────
      try {
        await User.findOneAndUpdate(
          { _id: req.user._id, isAffiliate: { $ne: true } },
          { isAffiliate: true, commissionRate: 25 }
        );
      } catch (affErr: any) {
        console.error('[Course Buyer Affiliate Error]', affErr.message);
      }

      // ── NON-CRITICAL: partner commission ─────────────────────────────────
      try {
        const affiliateId = (payment as any).affiliateUser?._id || (payment as any).affiliateUser;
        if (affiliateId) {
          const affiliate = await User.findById(affiliateId);
          if (affiliate) {
            const affiliatePkg = await Package.findOne({ tier: affiliate.packageTier }).lean();
            const crc = affiliatePkg?.courseReferralCommission;
            const commRate = crc?.value ?? parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '10');
            const commAmt = crc?.value > 0
              ? (crc.type === 'flat' ? crc.value : Math.round(payment.amount * crc.value / 100))
              : Math.round(payment.amount * parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '10') / 100);
            const alreadyCredited = await Commission.findOne({ buyer: req.user._id, paymentId: payment._id });
            if (!alreadyCredited && commAmt > 0) {
              const prevAffEarnings = affiliate.totalEarnings || 0;
              const updatedAffiliate = await User.findByIdAndUpdate(affiliate._id, { $inc: { wallet: commAmt, totalEarnings: commAmt } }, { new: true });
              if (updatedAffiliate) {
                checkEarningMilestones(affiliate._id.toString(), prevAffEarnings, updatedAffiliate.totalEarnings, updatedAffiliate.name, updatedAffiliate.avatar, updatedAffiliate.affiliateCode).catch(() => {});
              }
              await Transaction.create({
                user: affiliate._id, type: 'credit', category: 'affiliate_commission',
                amount: commAmt, description: `Partner commission — course sale`, referenceId: payment._id, status: 'completed',
                balanceAfter: updatedAffiliate?.wallet || 0,
              });
              await Commission.create({
                earner: affiliate._id,
                earnerTier: affiliate.packageTier || 'free',
                earnerCommissionRate: commRate,
                buyer: req.user._id,
                buyerPackageTier: 'course',
                level: 1, levelRate: commRate,
                saleAmount: payment.amount, commissionAmount: commAmt,
                paymentId: payment._id, saleType: 'course', status: 'approved',
              });
              await User.findByIdAndUpdate(affiliate._id, {
                $push: { notifications: { type: 'commission', message: `🎉 ₹${commAmt} earned! Partnership earning from a course sale.`, read: false, createdAt: new Date() } }
              });
            }
          }
        }
      } catch (commErr: any) {
        console.error('[Course Commission Error]', commErr.message);
      }

      // ── NON-CRITICAL: coupon ──────────────────────────────────────────────
      try {
        if (couponCode) await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase().trim() }, { $inc: { usedCount: 1 } });
      } catch (couponErr: any) {
        console.error('[Coupon Increment Error]', couponErr.message);
      }

      return res.json({ success: true, message: 'Enrollment successful!', courseId: payment.course });
    }

    return res.status(400).json({ success: false, message: 'Invalid type' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /api/checkout/emi ─────────────────────────────────────────────────
router.get('/emi', protect, async (req: any, res) => {
  try {
    // Auto-mark overdue installments
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 7); // 7 day grace period
    await EmiInstallment.updateMany(
      { user: req.user._id, status: 'pending', dueDate: { $lt: overdueDate } },
      { status: 'overdue' }
    );

    // Check if any overdue → suspend user
    const hasOverdue = await EmiInstallment.findOne({ user: req.user._id, status: 'overdue' });
    await User.findByIdAndUpdate(req.user._id, { packageSuspended: !!hasOverdue });

    const installments = await EmiInstallment.find({ user: req.user._id })
      .sort({ installmentNumber: 1 }).populate('packagePurchase');

    res.json({ success: true, installments, isSuspended: !!hasOverdue });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/checkout/emi/pay ────────────────────────────────────────────
router.post('/emi/pay', protect, async (req: any, res) => {
  try {
    const { installmentId } = req.body;
    const installment = await EmiInstallment.findOne({ _id: installmentId, user: req.user._id });
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (installment.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    // Check previous installments are paid
    const prevUnpaid = await EmiInstallment.findOne({
      packagePurchase: installment.packagePurchase,
      installmentNumber: { $lt: installment.installmentNumber },
      status: { $ne: 'paid' },
    });
    if (prevUnpaid) return res.status(400).json({ success: false, message: 'Pay previous installments first' });

    const order = await rzp.orders.create({
      amount: Math.round(installment.amount * 100),
      currency: 'INR',
      receipt: `emi_${installmentId}_${Date.now()}`,
      notes: { installmentId, userId: req.user._id.toString(), type: 'emi' },
    });

    installment.razorpayOrderId = order.id;
    await installment.save();

    res.json({ success: true, orderId: order.id, amount: Math.round(installment.amount * 100), currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID, installmentId });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/checkout/emi/verify ─────────────────────────────────────────
router.post('/emi/verify', protect, async (req: any, res) => {
  try {
    const { installmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const installment = await EmiInstallment.findOne({ _id: installmentId, user: req.user._id });
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });

    installment.status = 'paid';
    installment.paidAt = new Date();
    installment.razorpayPaymentId = razorpayPaymentId;
    installment.razorpaySignature = razorpaySignature;
    await installment.save();

    // Check if all paid → restore access
    const remaining = await EmiInstallment.findOne({ packagePurchase: installment.packagePurchase, status: { $in: ['pending', 'overdue'] } });
    if (!remaining) {
      await User.findByIdAndUpdate(req.user._id, { packageSuspended: false });
    }
    // If overdue was the issue, restore temporarily
    const anyOverdue = await EmiInstallment.findOne({ packagePurchase: installment.packagePurchase, status: 'overdue' });
    if (!anyOverdue) await User.findByIdAndUpdate(req.user._id, { packageSuspended: false });

    // Credit partner commission for this installment
    if ((installment as any).partnerUser && !(installment as any).partnerCommissionPaid && (installment as any).partnerCommissionAmount > 0) {
      await User.findByIdAndUpdate((installment as any).partnerUser, {
        $inc: { wallet: (installment as any).partnerCommissionAmount, totalEarnings: (installment as any).partnerCommissionAmount },
      });
      await Transaction.create({
        user: (installment as any).partnerUser, type: 'credit', category: 'affiliate_commission',
        amount: (installment as any).partnerCommissionAmount,
        description: `EMI installment ${installment.installmentNumber} Partnership earning`,
        referenceId: installment._id, status: 'completed',
      });
      await EmiInstallment.findByIdAndUpdate(installment._id, { partnerCommissionPaid: true });
    }

    // Credit manager commission for this installment
    if ((installment as any).managerUser && !(installment as any).managerCommissionPaid && (installment as any).managerCommissionAmount > 0) {
      await User.findByIdAndUpdate((installment as any).managerUser, {
        $inc: { wallet: (installment as any).managerCommissionAmount, totalEarnings: (installment as any).managerCommissionAmount },
      });
      await Transaction.create({
        user: (installment as any).managerUser, type: 'credit', category: 'affiliate_commission',
        amount: (installment as any).managerCommissionAmount,
        description: `Manager EMI installment ${installment.installmentNumber} Partnership earning`,
        referenceId: installment._id, status: 'completed',
      });
      await EmiInstallment.findByIdAndUpdate(installment._id, { managerCommissionPaid: true });
    }

    // Credit MLM for this installment's share
    const purchaseForComm = await PackagePurchase.findById(installment.packagePurchase).populate('package');
    if (purchaseForComm) {
      await creditMLM(req.user._id.toString(), installment.amount, purchaseForComm._id.toString(), purchaseForComm.packageTier || '', purchaseForComm.package as any);
    }

    // Fire-and-forget: invoice email + WhatsApp for EMI installment
    (async () => {
      try {
        const buyer = await User.findById(req.user._id).select('name email phone');
        if (!buyer) return;
        const { sendInvoiceEmail } = await import('../services/emailService');
        const { sendInvoiceTemplate } = await import('../services/whatsappMetaService');

        const emiPkg = purchaseForComm?.package as any;
        const pkgName = emiPkg?.name || purchaseForComm?.packageTier || 'Package';
        const invoiceNumber = `TLX-E${installment.installmentNumber}-${installment._id.toString().slice(-6).toUpperCase()}`;
        const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const allPaid = !remaining;
        const nextInst = allPaid ? null : await EmiInstallment.findOne({
          packagePurchase: installment.packagePurchase,
          status: { $in: ['pending', 'overdue'] },
        }).sort({ installmentNumber: 1 });

        await sendInvoiceEmail(buyer.email, {
          invoiceNumber, invoiceDate,
          userName: buyer.name, userEmail: buyer.email,
          packageName: pkgName,
          paymentType: 'emi_installment',
          amountPaid: installment.amount,
          installmentNumber: installment.installmentNumber,
          totalInstallments: (installment as any).totalInstallments,
          nextDueDate: nextInst ? new Date((nextInst as any).dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
          nextInstallmentAmount: nextInst ? (nextInst as any).amount : undefined,
          allInstallmentsPaid: allPaid,
        });

        if (buyer.phone) {
          const totalInst = (installment as any).totalInstallments || '?';
          const desc = allPaid
            ? `${pkgName} — EMI ${installment.installmentNumber}/${totalInst} (Final, fully paid)`
            : `${pkgName} — EMI Installment ${installment.installmentNumber}/${totalInst}`;
          await sendInvoiceTemplate(buyer.phone, buyer.name, desc, installment.amount, invoiceNumber);
        }
      } catch (e: any) {
        console.error('[emi-invoice-notify]', e.message);
      }
    })();

    res.json({ success: true, message: 'EMI payment successful!' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
