import { Router } from 'express';
import { randomUUID } from 'crypto';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import { protect } from '../middleware/auth';
import User, { COMMISSION_RATES } from '../models/User';
import Package from '../models/Package';
import PackagePurchase from '../models/PackagePurchase';
import Payment from '../models/Payment';
import Enrollment from '../models/Enrollment';
import Coupon from '../models/Coupon';
import Transaction from '../models/Transaction';
import Commission from '../models/Commission';
import EmiInstallment from '../models/EmiInstallment';
import { sendPurchaseWelcomeEmail, sendSponsorPurchaseAlert } from '../services/emailService';
import { sendPurchaseWelcomeTemplate, sendSponsorSaleTemplate } from '../services/whatsappMetaService';
import { ensureCompulsoryEnrollments } from '../services/enrollmentService';
import redisClient from '../config/redis';
import { checkEarningMilestones } from '../services/milestoneService';
import { getUpgradeCredit } from '../utils/upgradeCredit';

const router = Router();

function getClient() {
  const clientId = process.env.PHONEPE_CLIENT_ID || '';
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET || '';
  const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
  const env = process.env.NODE_ENV === 'production' && process.env.PHONEPE_ENV === 'PRODUCTION'
    ? Env.PRODUCTION : Env.SANDBOX;
  return StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
}

function calcCommAmt(saleAmount: number, rate: number, rateType: string): number {
  if (rateType === 'flat') return Math.round(rate);
  return Math.round(saleAmount * rate / 100);
}

async function resolveFullCommission(partnerUserId: string, purchaseAmount: number, packageId?: string): Promise<number> {
  const partner = await User.findById(partnerUserId);
  if (!partner?.isAffiliate) return 0;
  const soldPkg = packageId ? await Package.findById(packageId).select('commissionRate commissionRateType partnerEarnings') : null;
  const earnerPkg = partner.packageTier
    ? await Package.findOne({ $or: [{ tier: partner.packageTier }, { name: partner.packageTier }], isActive: true }).select('_id')
    : null;
  const matrixEntry = soldPkg?.partnerEarnings?.find(
    (r: any) => earnerPkg && r.earnerTier?.toString() === earnerPkg._id?.toString()
  );
  return matrixEntry?.value > 0
    ? Math.round(matrixEntry.value)
    : calcCommAmt(purchaseAmount, soldPkg?.commissionRate || 0, soldPkg?.commissionRateType || 'percentage');
}

async function creditMLM(purchasedUserId: string, saleAmount: number, purchaseId: string, tier: string, packageId?: string) {
  try {
    const buyer = await User.findById(purchasedUserId).populate('referredBy');
    if (!buyer) return;
    const level1Id = buyer.upline1 || (buyer.referredBy as any)?._id || buyer.referredBy;
    if (!level1Id) return;
    const level1 = await User.findById(level1Id);
    if (!level1 || !level1.isAffiliate) return;

    // Idempotency: skip if already credited for this purchase
    const alreadyCredited = await Commission.findOne({ buyer: purchasedUserId, packagePurchaseId: purchaseId, level: 1 });
    if (alreadyCredited) return;

    const soldPkg = packageId
      ? await Package.findById(packageId).select('commissionRate commissionRateType partnerEarnings')
      : null;
    const earnerPkg = level1.packageTier
      ? await Package.findOne({ $or: [{ tier: level1.packageTier }, { name: level1.packageTier }], isActive: true }).select('_id')
      : null;
    const matrixEntry = soldPkg?.partnerEarnings?.find(
      (r: any) => earnerPkg && r.earnerTier?.toString() === earnerPkg._id?.toString()
    );
    const commAmt = matrixEntry?.value > 0
      ? Math.round(matrixEntry.value)
      : calcCommAmt(saleAmount, soldPkg?.commissionRate || 0, soldPkg?.commissionRateType || 'percentage');

    if (commAmt > 0) {
      await Commission.create({
        earner: level1._id, earnerTier: level1.packageTier,
        earnerCommissionRate: commAmt, buyer: purchasedUserId,
        buyerPackageTier: tier, level: 1, levelRate: commAmt,
        saleAmount, commissionAmount: commAmt, packagePurchaseId: purchaseId, status: 'approved',
      });
      const prevL1Earnings = level1.totalEarnings || 0;
      const updatedLevel1 = await User.findByIdAndUpdate(level1._id, { $inc: { wallet: commAmt, totalEarnings: commAmt } }, { new: true });
      if (updatedLevel1) {
        checkEarningMilestones(level1._id.toString(), prevL1Earnings, updatedLevel1.totalEarnings, updatedLevel1.name, updatedLevel1.avatar, updatedLevel1.affiliateCode).catch(() => {});
      }
      await Transaction.create({
        user: level1._id, type: 'credit', category: 'affiliate_commission',
        amount: commAmt, description: `Partnership earning — ${tier || 'package'} purchased`,
        referenceId: purchaseId, status: 'completed',
        balanceAfter: updatedLevel1?.wallet || 0,
      });
      await User.findByIdAndUpdate(level1._id, {
        $push: { notifications: { type: 'commission', message: `🎉 ₹${commAmt} Partnership earning from a ${tier || 'package'} purchase!`, read: false, createdAt: new Date() } }
      });
    }

    // Manager commission
    try {
      const mgCommRate = soldPkg?.managerCommission;
      if (mgCommRate && mgCommRate.value > 0 && (level1 as any).managerId) {
        const manager = await User.findById((level1 as any).managerId).select('_id');
        if (manager) {
          const alreadyCredited = await Commission.findOne({ buyer: purchasedUserId, packagePurchaseId: purchaseId, level: 99 });
          if (!alreadyCredited) {
            const mgAmt = mgCommRate.type === 'flat' ? mgCommRate.value : Math.round(saleAmount * mgCommRate.value / 100);
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

    // Set upline (non-critical)
    if (!buyer.upline1) {
      await User.findByIdAndUpdate(purchasedUserId, { upline1: level1Id });
    }
  } catch (e: any) {
    console.error('[PhonePe creditMLM Error]', e.message);
  }
}

// ── POST /api/phonepe/guest-course ── (no auth, for referral link buyers) ────
router.post('/guest-course', async (req: any, res) => {
  try {
    const { name, email, phone, courseId, promoCode } = req.body;
    if (!name || !email || !phone || !courseId) {
      return res.status(400).json({ success: false, message: 'Name, email, phone and courseId are required' });
    }

    const { generateAccessToken, generateRefreshToken } = await import('../utils/generateToken');
    const bcrypt = await import('bcryptjs');
    const Course = (await import('../models/Course')).default;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const basePrice = (course as any).discountPrice || (course as any).price || 0;
    const itemName = (course as any).title;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let isNewUser = false;
    let plainPassword = '';

    if (!user) {
      isNewUser = true;
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      plainPassword = 'Tl@' + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const hashed = await bcrypt.default.hash(plainPassword, 10);

      // Check if promoCode is a valid affiliate code and set referredBy
      let referredBy = null;
      if (promoCode) {
        const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
        if (referrer) referredBy = referrer._id;
      }

      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashed,
        role: 'student',
        isVerified: true,
        referredBy,
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = await Enrollment.findOne({ student: user._id, course: courseId });
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'This email is already enrolled in this course. Please login to access it.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    // Store plainPassword in Redis for welcome msg after payment
    if (isNewUser && plainPassword) {
      await redisClient.set(`reg-pw:${user._id}`, plainPassword, { EX: 86400 });
    }

    // PhonePe order
    const merchantOrderId = `TL_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/checkout/phonepe-status?orderId=${merchantOrderId}&type=course&courseId=${courseId}&isEmi=false`;

    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(basePrice * 100))
      .redirectUrl(redirectUrl)
      .message(itemName)
      .build();

    const ppResponse = await client.pay(request);

    // Save Payment record
    const payment = await Payment.create({
      user: user._id, course: courseId, amount: basePrice,
      razorpayOrderId: merchantOrderId, status: 'created', affiliateCode: promoCode || '',
    });
    if (promoCode) {
      const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
      if (referrer) { (payment as any).affiliateUser = referrer._id; await payment.save(); }
    }

    return res.json({
      success: true,
      redirectUrl: ppResponse.redirectUrl,
      merchantOrderId,
      accessToken,
      refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, packageTier: user.packageTier, wallet: user.wallet, isAffiliate: user.isAffiliate },
      isNewUser,
    });
  } catch (e: any) {
    console.error('[PhonePe guest-course]', e?.message || e);
    res.status(500).json({ success: false, message: e?.message || 'Payment initiation failed' });
  }
});

// ── POST /api/phonepe/guest-package ── (no auth, skips OTP) ──────────────────
router.post('/guest-package', async (req: any, res) => {
  try {
    const { name, email, phone, tier, packageId: pkgIdParam, promoCode, couponCode, isEmi } = req.body;
    if (!name || !email || !phone || (!tier && !pkgIdParam)) {
      return res.status(400).json({ success: false, message: 'Name, email, phone and package are required' });
    }

    const { generateAccessToken, generateRefreshToken } = await import('../utils/generateToken');
    const bcrypt = await import('bcryptjs');

    const pkg = pkgIdParam
      ? await Package.findById(pkgIdParam)
      : await Package.findOne({ tier, isActive: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    const pkgTier = pkg.tier || pkg.name;
    const itemName = `${pkg.name} Package`;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let isNewUser = false;
    let plainPassword = '';

    if (!user) {
      isNewUser = true;
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      plainPassword = 'Tl@' + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const hashed = await bcrypt.default.hash(plainPassword, 10);
      let referredBy = null;
      if (promoCode) {
        const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
        if (referrer) referredBy = referrer._id;
      }
      user = await User.create({
        name: name.trim(), email: email.toLowerCase().trim(), phone: phone.trim(),
        password: hashed, role: 'student', isVerified: true, referredBy,
      });
    } else {
      // Existing user — check tier upgrade eligibility
      const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3, supreme: 4 };
      if ((TIER_ORDER[user.packageTier] ?? 0) > (TIER_ORDER[pkgTier] ?? 0)) {
        return res.status(400).json({ success: false, message: 'You already have a higher or equal tier. Please login to manage your account.' });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    if (isNewUser && plainPassword) {
      await redisClient.set(`reg-pw:${user._id}`, plainPassword, { EX: 86400 });
    }

    // Price calculation
    let basePrice = pkg.price;
    let promoDiscount = 0;
    let couponDiscount = 0;
    let affiliateUser: any = null;

    if (promoCode) {
      const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        affiliateUser = referrer;
        const pkgDiscountPct = pkg.promoDiscountPercent || 0;
        if (pkgDiscountPct > 0) promoDiscount = Math.round(basePrice * pkgDiscountPct / 100);
      }
    }
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon && coupon.usedCount < coupon.maxUses && new Date() < coupon.expiresAt) {
        couponDiscount = coupon.type === 'percent'
          ? Math.round(basePrice * coupon.value / 100)
          : Math.min(coupon.value, basePrice);
      }
    }

    const afterDiscount = Math.max(0, basePrice - promoDiscount - couponDiscount);
    const gst = Math.round(afterDiscount * 0.18);
    const fullPackagePrice = afterDiscount + gst;
    const EMI_MONTHS = 4;
    const isEmiOrder = !!isEmi;
    const { isToken, tokenMode } = req.body;

    let payNow = fullPackagePrice;
    let paymentType: 'full' | 'emi' | 'token_emi' | 'token_full' = 'full';
    let tokenAmountVal = 0;

    // 10-day upgrade credit (existing users on full payment only)
    let upgradeCreditAmt = 0;
    let upgradeFromPurchaseId: any = null;
    let upgradeDeltaBase = afterDiscount;
    let upgradeDeltaGst = gst;
    if (!isNewUser && !isEmiOrder && !isToken) {
      const info = await getUpgradeCredit(user._id, fullPackagePrice, pkg._id);
      if (info.eligible) {
        upgradeCreditAmt = info.upgradeCredit;
        upgradeFromPurchaseId = info.prevPurchaseId;
        const deltaTotal = Math.max(0, fullPackagePrice - upgradeCreditAmt);
        upgradeDeltaBase = Math.round(deltaTotal / 1.18);
        upgradeDeltaGst = Math.max(0, deltaTotal - upgradeDeltaBase);
        payNow = deltaTotal;
      }
    }

    if (isToken && (pkg as any).tokenAvailable && (pkg as any).tokenAmount > 0) {
      tokenAmountVal = (pkg as any).tokenAmount;
      payNow = tokenAmountVal;
      paymentType = tokenMode === 'emi' ? 'token_emi' : 'token_full';
    } else if (isEmiOrder) {
      payNow = Math.ceil(fullPackagePrice / EMI_MONTHS);
      paymentType = 'emi';
    }

    const merchantOrderId = `TL_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/checkout/phonepe-status?orderId=${merchantOrderId}&type=package&tier=${pkgTier}&isEmi=${isEmiOrder}&paymentType=${paymentType}`;

    const msgSuffix = paymentType === 'emi' ? ` — Installment 1 of ${EMI_MONTHS}` : paymentType.startsWith('token') ? ' — Token/Advance' : '';
    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(payNow * 100))
      .redirectUrl(redirectUrl)
      .message(`${itemName}${msgSuffix}`)
      .build();

    const ppResponse = await client.pay(request);

    const isUpgradeOrder = upgradeCreditAmt > 0;
    await PackagePurchase.create({
      user: user._id, package: pkg._id, packageTier: pkgTier,
      amount: paymentType.startsWith('token')
        ? tokenAmountVal
        : (isUpgradeOrder ? upgradeDeltaBase : afterDiscount),
      gstAmount: paymentType.startsWith('token')
        ? 0
        : (isUpgradeOrder ? upgradeDeltaGst : gst),
      totalAmount: paymentType.startsWith('token')
        ? tokenAmountVal
        : (isUpgradeOrder ? (upgradeDeltaBase + upgradeDeltaGst) : fullPackagePrice),
      razorpayOrderId: merchantOrderId, status: 'created',
      affiliateCode: promoCode || '', affiliatePartnerCode: promoCode || '',
      isEmi: isEmiOrder || paymentType === 'token_emi',
      emiMonth: (isEmiOrder || paymentType === 'token_emi') ? 1 : undefined,
      emiTotal: (isEmiOrder || paymentType === 'token_emi') ? EMI_MONTHS : undefined,
      paymentType,
      tokenAmount: paymentType.startsWith('token') ? tokenAmountVal : undefined,
      fullPackagePrice: (paymentType.startsWith('token') || isUpgradeOrder) ? fullPackagePrice : undefined,
      ...(isUpgradeOrder ? { upgradeCredit: upgradeCreditAmt, upgradeFromPurchase: upgradeFromPurchaseId } : {}),
      ...(affiliateUser ? { affiliateUser: affiliateUser._id } : {}),
    });

    return res.json({
      success: true, redirectUrl: ppResponse.redirectUrl, merchantOrderId,
      accessToken, refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, packageTier: user.packageTier, wallet: user.wallet, isAffiliate: user.isAffiliate },
      isNewUser,
    });
  } catch (e: any) {
    console.error('[PhonePe guest-package]', e?.message || e);
    res.status(500).json({ success: false, message: e?.message || 'Payment initiation failed' });
  }
});

// ── POST /api/phonepe/create-order ───────────────────────────────────────────
router.post('/create-order', protect, async (req: any, res) => {
  try {
    const { type, tier, courseId, couponCode, promoCode, isEmi } = req.body;

    const pkgIdParam = req.body.packageId; // accept packageId directly
    let basePrice = 0, gst = 0, discount = 0, itemName = '', packageId: any = null;

    if (type === 'package') {
      const pkg = pkgIdParam
        ? await Package.findById(pkgIdParam)
        : await Package.findOne({ tier, isActive: true });
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
      const pkgTierResolved = pkg.tier || pkg.name;
      const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3, supreme: 4 };
      if ((TIER_ORDER[req.user.packageTier] ?? 0) > (TIER_ORDER[pkgTierResolved] ?? 0)) {
        return res.status(400).json({ success: false, message: 'You already have a higher tier' });
      }
      basePrice = pkg.price;
      packageId = pkg._id;
      itemName = `${pkg.name} Package`;
      (req as any)._resolvedTier = pkgTierResolved;
      (req as any)._resolvedPkg = pkg;
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
        if (type === 'package' && packageId) {
          const purchasePkg = await Package.findById(packageId).select('promoDiscountPercent');
          const pkgDiscountPct = purchasePkg?.promoDiscountPercent || 0;
          if (pkgDiscountPct > 0) promoDiscount = Math.round(basePrice * pkgDiscountPct / 100);
        }
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
    gst = type === 'package' ? Math.round(afterDiscount * 0.18) : 0;
    const fullPkgPrice = afterDiscount + gst;

    // Payment type resolution
    const EMI_MONTHS = 4;
    const { isToken: isTokenReq, tokenMode: tokenModeReq } = req.body;
    const resolvedPkg = (req as any)._resolvedPkg;
    let payNow = fullPkgPrice;
    let paymentType2: 'full' | 'emi' | 'token_emi' | 'token_full' = 'full';
    let tokenAmtVal = 0;
    let isEmiOrder2 = type === 'package' && !!isEmi;

    // 10-day upgrade credit (applies only to authenticated full payments)
    let upgradeCreditAmt = 0;
    let upgradeFromPurchaseId: any = null;
    let upgradeDeltaBase = afterDiscount;
    let upgradeDeltaGst = gst;
    if (type === 'package' && !isEmi && !isTokenReq && packageId) {
      const info = await getUpgradeCredit(req.user._id, fullPkgPrice, packageId);
      if (info.eligible) {
        upgradeCreditAmt = info.upgradeCredit;
        upgradeFromPurchaseId = info.prevPurchaseId;
        const deltaTotal = Math.max(0, fullPkgPrice - upgradeCreditAmt);
        upgradeDeltaBase = Math.round(deltaTotal / 1.18);
        upgradeDeltaGst = Math.max(0, deltaTotal - upgradeDeltaBase);
        payNow = deltaTotal;
      }
    }

    if (type === 'package' && isTokenReq && resolvedPkg?.tokenAvailable && resolvedPkg?.tokenAmount > 0) {
      tokenAmtVal = resolvedPkg.tokenAmount;
      payNow = tokenAmtVal;
      paymentType2 = tokenModeReq === 'emi' ? 'token_emi' : 'token_full';
      isEmiOrder2 = paymentType2 === 'token_emi';
    } else if (isEmiOrder2) {
      payNow = Math.ceil(fullPkgPrice / EMI_MONTHS);
      paymentType2 = 'emi';
    }

    const merchantOrderId = `TL_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const resolvedTier = (req as any)._resolvedTier || tier;
    const redirectUrl = `${webUrl}/checkout/phonepe-status?orderId=${merchantOrderId}&type=${type}${resolvedTier ? `&tier=${resolvedTier}` : ''}${courseId ? `&courseId=${courseId}` : ''}&isEmi=${isEmiOrder2}&paymentType=${paymentType2}`;

    const msgSuffix2 = paymentType2 === 'emi' ? ` — Installment 1 of ${EMI_MONTHS}` : paymentType2.startsWith('token') ? ' — Token/Advance' : '';
    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(payNow * 100))
      .redirectUrl(redirectUrl)
      .message(`${itemName}${msgSuffix2}`)
      .build();

    const ppResponse = await client.pay(request);

    if (type === 'package') {
      const isUpgradeOrder = upgradeCreditAmt > 0;
      await PackagePurchase.create({
        user: req.user._id, package: packageId, packageTier: (req as any)._resolvedTier || tier,
        amount: paymentType2.startsWith('token')
          ? tokenAmtVal
          : (isUpgradeOrder ? upgradeDeltaBase : afterDiscount),
        gstAmount: paymentType2.startsWith('token')
          ? 0
          : (isUpgradeOrder ? upgradeDeltaGst : gst),
        totalAmount: paymentType2.startsWith('token')
          ? tokenAmtVal
          : (isUpgradeOrder ? (upgradeDeltaBase + upgradeDeltaGst) : fullPkgPrice),
        razorpayOrderId: merchantOrderId,
        status: 'created', affiliateCode: promoCode || '',
        isEmi: isEmiOrder2, emiMonth: isEmiOrder2 ? 1 : undefined, emiTotal: isEmiOrder2 ? EMI_MONTHS : undefined,
        affiliatePartnerCode: promoCode || '',
        paymentType: paymentType2,
        tokenAmount: paymentType2.startsWith('token') ? tokenAmtVal : undefined,
        fullPackagePrice: (paymentType2.startsWith('token') || isUpgradeOrder) ? fullPkgPrice : undefined,
        ...(isUpgradeOrder ? { upgradeCredit: upgradeCreditAmt, upgradeFromPurchase: upgradeFromPurchaseId } : {}),
      });
    } else {
      const payment = await Payment.create({
        user: req.user._id, course: courseId, amount: fullPkgPrice,
        razorpayOrderId: merchantOrderId,
        status: 'created', affiliateCode: promoCode || '',
      });
      if (promoCode) {
        const referrer = await User.findOne({ affiliateCode: promoCode.toUpperCase().trim() });
        if (referrer) (payment as any).affiliateUser = referrer._id;
        await payment.save();
      }
    }

    return res.json({
      success: true,
      redirectUrl: ppResponse.redirectUrl,
      merchantOrderId,
      amount: Math.round(payNow * 100),
      itemName,
      isEmi: isEmiOrder2,
      emiMonths: EMI_MONTHS,
      emiInstallmentAmount: isEmiOrder2 ? Math.ceil(fullPkgPrice / EMI_MONTHS) : undefined,
      paymentType: paymentType2,
      tokenAmount: tokenAmtVal || undefined,
      upgradeCredit: upgradeCreditAmt || undefined,
      fullPackagePrice: upgradeCreditAmt > 0 ? fullPkgPrice : undefined,
    });
  } catch (e: any) {
    console.error('[PhonePe create-order]', e?.message || e);
    res.status(500).json({ success: false, message: e?.message || 'Payment initiation failed' });
  }
});

// ── GET /api/phonepe/status/:merchantOrderId ─────────────────────────────────
router.get('/status/:merchantOrderId', protect, async (req: any, res) => {
  try {
    const { merchantOrderId } = req.params;
    const { type, tier, courseId, couponCode, promoCode, isEmi } = req.query;
    const isEmiOrder = isEmi === 'true';
    const EMI_MONTHS = 4;

    const client = getClient();
    const statusResp = await client.getOrderStatus(merchantOrderId);

    if (statusResp.state !== 'COMPLETED') {
      return res.json({ success: false, state: statusResp.state, message: 'Payment not completed' });
    }

    if (type === 'package') {
      const purchase = await PackagePurchase.findOne({ razorpayOrderId: merchantOrderId, user: req.user._id });
      if (!purchase) return res.status(404).json({ success: false, message: 'Purchase record not found' });
      if (purchase.status === 'paid') return res.json({ success: true, state: 'COMPLETED', message: 'Already fulfilled', tier: purchase.packageTier, isEmi: purchase.isEmi });

      purchase.status = 'paid';
      purchase.razorpayPaymentId = statusResp.orderId;
      await purchase.save();

      const pkgTier = purchase.packageTier as any;
      // Use Package.commissionRate set by admin; fall back to hardcoded COMMISSION_RATES
      const purchasedPkg = await Package.findById(purchase.package).select('commissionRate');
      const commissionRate = (purchasedPkg?.commissionRate && purchasedPkg.commissionRate > 0)
        ? purchasedPkg.commissionRate
        : (COMMISSION_RATES[pkgTier as keyof typeof COMMISSION_RATES] ?? 10);
      await User.findByIdAndUpdate(req.user._id, {
        packageTier: pkgTier, isAffiliate: true,
        commissionRate,
        packagePurchasedAt: new Date(), packageSuspended: false,
        $inc: { xpPoints: 500 },
      });
      ensureCompulsoryEnrollments(req.user._id.toString()).catch(err =>
        console.error('[phonepe-compulsory]', err?.message)
      );

      // Resolve EMI partner + commission before creating installments
      let emiPartnerUserId: any = null;
      let emiPerInstallmentComm = 0;
      let emiInstallmentAmt = 0;
      if (isEmiOrder) {
        // For token_emi: installments on remaining balance; for emi: on full amount
        const pType = (purchase as any).paymentType || 'emi';
        const emiBase = pType === 'token_emi'
          ? Math.max(0, ((purchase as any).fullPackagePrice || 0) - ((purchase as any).tokenAmount || 0))
          : purchase.amount + purchase.gstAmount;
        emiInstallmentAmt = Math.ceil(emiBase / EMI_MONTHS);
        const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
        const now = new Date();

        const promoCodeStr = purchase.affiliateCode || (promoCode as string) || '';
        if (promoCodeStr) {
          const partnerUser = await User.findOne({ affiliateCode: promoCodeStr.toUpperCase().trim() });
          if (partnerUser) emiPartnerUserId = partnerUser._id;
        }
        if (emiPartnerUserId) {
          const fullComm = await resolveFullCommission(emiPartnerUserId.toString(), purchase.amount, purchase.package?.toString());
          emiPerInstallmentComm = Math.round(fullComm / EMI_MONTHS);
        }

        // Idempotency: only create schedule if not already exists
        const existingInst = await EmiInstallment.findOne({ packagePurchase: purchase._id });
        if (!existingInst) {
          await EmiInstallment.create({
            user: req.user._id, packagePurchase: purchase._id,
            installmentNumber: 1, totalInstallments: EMI_MONTHS, amount: emiInstallmentAmt,
            dueDate: now, paidAt: now, razorpayOrderId: merchantOrderId,
            razorpayPaymentId: statusResp.orderId, status: 'paid',
            partnerUser: emiPartnerUserId,
            partnerCommissionAmount: emiPerInstallmentComm,
            partnerCommissionPaid: emiPerInstallmentComm > 0,
          });
          const dayOffsets = [15, 30, 45];
          for (let i = 2; i <= EMI_MONTHS; i++) {
            const dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + dayOffsets[i - 2]);
            const inst = await EmiInstallment.create({
              user: req.user._id, packagePurchase: purchase._id,
              installmentNumber: i, totalInstallments: EMI_MONTHS,
              amount: emiInstallmentAmt, dueDate, status: 'pending',
              partnerUser: emiPartnerUserId,
              partnerCommissionAmount: emiPerInstallmentComm,
              partnerCommissionPaid: false,
            });
            await EmiInstallment.findByIdAndUpdate(inst._id, { paymentLink: `${webUrl}/pay/emi/${inst._id}` });
          }
        }
      }

      try {
        if (couponCode) await Coupon.findOneAndUpdate({ code: (couponCode as string).toUpperCase().trim() }, { $inc: { usedCount: 1 } });
      } catch {}

      // ── NON-CRITICAL: commission ──────────────────────────────────────────
      try {
        if (isEmiOrder) {
          if (emiPartnerUserId && emiPerInstallmentComm > 0) {
            const alreadyCredited = await Commission.findOne({ buyer: req.user._id, packagePurchaseId: purchase._id, level: 1 });
            if (!alreadyCredited) {
              await Commission.create({
                earner: emiPartnerUserId, earnerTier: (await User.findById(emiPartnerUserId))?.packageTier || 'free',
                earnerCommissionRate: emiPerInstallmentComm * EMI_MONTHS,
                buyer: req.user._id, buyerPackageTier: pkgTier,
                level: 1, levelRate: emiPerInstallmentComm,
                saleAmount: emiInstallmentAmt, commissionAmount: emiPerInstallmentComm,
                packagePurchaseId: purchase._id, status: 'approved',
              });
              const updatedPartner = await User.findByIdAndUpdate(emiPartnerUserId, { $inc: { wallet: emiPerInstallmentComm, totalEarnings: emiPerInstallmentComm } }, { new: true });
              await Transaction.create({
                user: emiPartnerUserId, type: 'credit', category: 'affiliate_commission',
                amount: emiPerInstallmentComm,
                description: `EMI Partnership earning — Installment 1/${EMI_MONTHS} — ${pkgTier} package`,
                referenceId: purchase._id.toString(), status: 'completed',
                balanceAfter: updatedPartner?.wallet || 0,
              });
              await User.findByIdAndUpdate(emiPartnerUserId, {
                $push: { notifications: { type: 'commission', message: `🎉 ₹${emiPerInstallmentComm} EMI Partnership earning (Installment 1/${EMI_MONTHS}) — ${pkgTier}!`, read: false, createdAt: new Date() } }
              });
              await User.findByIdAndUpdate(req.user._id, { upline1: emiPartnerUserId });
            }
          }
        } else {
          await creditMLM(req.user._id.toString(), purchase.amount, purchase._id.toString(), pkgTier, purchase.package?.toString());
        }
      } catch (commErr: any) {
        console.error('[PhonePe Package Commission Error]', commErr.message);
      }

      // ── NON-CRITICAL: notify sponsor (earning email + WhatsApp) ───────────
      try {
        const buyerForNotify = await User.findById(req.user._id).select('name email referredBy upline1');
        const sponsorId = (buyerForNotify as any)?.upline1 || (buyerForNotify as any)?.referredBy;
        const sponsor = sponsorId ? await User.findById(sponsorId).select('name email phone') : null;
        if (buyerForNotify && sponsor) {
          const pkgDoc = await Package.findById(purchase.package).select('name tier');
          const pkgName = (pkgDoc as any)?.name || pkgTier;
          const comm = await Commission.findOne({ buyer: buyerForNotify._id, earner: sponsor._id, packagePurchaseId: purchase._id, level: 1 }).sort({ createdAt: -1 });
          const commAmount = comm?.commissionAmount || 0;
          const earningsUrl = `${process.env.WEB_URL}/partner/earnings`;
          await Promise.all([
            sendSponsorPurchaseAlert(sponsor.email, sponsor.name, buyerForNotify.name, buyerForNotify.email, pkgName, commAmount),
            sponsor.phone ? sendSponsorSaleTemplate(sponsor.phone, sponsor.name || '', buyerForNotify.name, pkgName, commAmount, earningsUrl) : Promise.resolve(),
          ]);
        }
      } catch (notifyErr: any) {
        console.error('[PhonePe Package SponsorNotify Error]', notifyErr?.message || notifyErr);
      }

      // ── NON-CRITICAL: welcome notification ───────────────────────────────
      try {
        await User.findByIdAndUpdate(req.user._id, {
          $push: { notifications: { type: 'package', message: `🎉 Welcome to ${pkgTier}! Your account is now upgraded.`, read: false, createdAt: new Date() } }
        });
      } catch {}

      const user = await User.findById(req.user._id);
      if (user) {

        // Send login credentials via email + WhatsApp
        const pkg = await Package.findOne({ tier: pkgTier, isActive: true }).select('name');
        const pkgName = pkg?.name || pkgTier;
        let password = await redisClient.get(`reg-pw:${user._id}`);
        if (!password) {
          // Generate new password if registration one expired
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
          password = 'Tl@' + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          user.password = password;
          await user.save();
        }
        await redisClient.del(`reg-pw:${user._id}`);

        try { await sendPurchaseWelcomeEmail(user.email, user.name, pkgName, user.email, password); } catch {}
        if (user.phone) {
          const loginUrl = `${process.env.WEB_URL}/login`;
          try { await sendPurchaseWelcomeTemplate(user.phone, user.name, pkgName, user.email, password, loginUrl); } catch {}
        }
      }

      return res.json({ success: true, state: 'COMPLETED', message: `Welcome to ${pkgTier}!`, tier: pkgTier, isEmi: isEmiOrder });
    }

    if (type === 'course') {
      const payment = await Payment.findOne({ razorpayOrderId: merchantOrderId, user: req.user._id }).populate('affiliateUser');
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
      if (payment.status === 'paid') return res.json({ success: true, state: 'COMPLETED', message: 'Already enrolled', courseId });

      // ── CRITICAL: mark confirmed ──────────────────────────────────────────
      payment.status = 'paid';
      payment.razorpayPaymentId = statusResp.orderId;
      await payment.save();

      // ── CRITICAL: enroll student ──────────────────────────────────────────
      const alreadyEnrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
      if (!alreadyEnrolled) {
        await Enrollment.create({
          student: req.user._id, course: courseId,
          paymentId: statusResp.orderId, orderId: merchantOrderId, amount: payment.amount,
        });
        const Course = (await import('../models/Course')).default;
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
      }

      // ── NON-CRITICAL: affiliate status for buyer ──────────────────────────
      try {
        await User.findOneAndUpdate(
          { _id: req.user._id, isAffiliate: { $ne: true } },
          { isAffiliate: true, commissionRate: 25 }
        );
      } catch {}

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
              const updatedAffiliate = await User.findByIdAndUpdate(affiliate._id, { $inc: { wallet: commAmt, totalEarnings: commAmt } }, { new: true });
              await Transaction.create({
                user: affiliate._id, type: 'credit', category: 'affiliate_commission',
                amount: commAmt, description: 'Partner commission — course sale', referenceId: payment._id, status: 'completed',
                balanceAfter: updatedAffiliate?.wallet || 0,
              });
              await Commission.create({
                earner: affiliate._id, earnerTier: affiliate.packageTier || 'free',
                earnerCommissionRate: commRate, buyer: req.user._id,
                buyerPackageTier: 'course', level: 1, levelRate: commRate,
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
        console.error('[PhonePe Course Commission Error]', commErr.message);
      }

      // ── NON-CRITICAL: notify affiliate (earning email + WhatsApp) ─────────
      try {
        const affiliateId = (payment as any).affiliateUser?._id || (payment as any).affiliateUser;
        if (affiliateId) {
          const affiliate = await User.findById(affiliateId).select('name email phone');
          const buyerForNotify = await User.findById(req.user._id).select('name email');
          if (affiliate && buyerForNotify) {
            const Course = (await import('../models/Course')).default;
            const courseDoc = await Course.findById(courseId as any).select('title');
            const courseName = (courseDoc as any)?.title || 'a course';
            const comm = await Commission.findOne({ buyer: buyerForNotify._id, earner: affiliate._id, paymentId: payment._id }).sort({ createdAt: -1 });
            const commAmount = comm?.commissionAmount || 0;
            const earningsUrl = `${process.env.WEB_URL}/partner/earnings`;
            await Promise.all([
              sendSponsorPurchaseAlert(affiliate.email, affiliate.name, buyerForNotify.name, buyerForNotify.email, courseName, commAmount),
              affiliate.phone ? sendSponsorSaleTemplate(affiliate.phone, affiliate.name || '', buyerForNotify.name, courseName, commAmount, earningsUrl) : Promise.resolve(),
            ]);
          }
        }
      } catch (notifyErr: any) {
        console.error('[PhonePe Course SponsorNotify Error]', notifyErr?.message || notifyErr);
      }

      // ── NON-CRITICAL: coupon ──────────────────────────────────────────────
      try {
        if (couponCode) await Coupon.findOneAndUpdate({ code: (couponCode as string).toUpperCase().trim() }, { $inc: { usedCount: 1 } });
      } catch {}

      // ── NON-CRITICAL: welcome credentials (new users) ─────────────────────
      try {
        const buyer = await User.findById(req.user._id);
        if (buyer) {
          let password = await redisClient.get(`reg-pw:${buyer._id}`);
          if (password) {
            await redisClient.del(`reg-pw:${buyer._id}`);
            const Course = (await import('../models/Course')).default;
            const courseDoc = await Course.findById(courseId).select('title');
            const courseName = (courseDoc as any)?.title || 'your course';
            try { await sendPurchaseWelcomeEmail(buyer.email, buyer.name, courseName, buyer.email, password); } catch {}
            if (buyer.phone) {
              const loginUrl = `${process.env.WEB_URL}/login`;
              try { await sendPurchaseWelcomeTemplate(buyer.phone, buyer.name, courseName, buyer.email, password, loginUrl); } catch {}
            }
          }
        }
      } catch {}

      return res.json({ success: true, state: 'COMPLETED', message: 'Enrollment successful!', courseId });
    }

    return res.status(400).json({ success: false, message: 'Invalid type' });
  } catch (e: any) {
    console.error('[PhonePe status]', e?.message || e);
    res.status(500).json({ success: false, message: e?.message || 'Status check failed' });
  }
});

// ── GET /api/phonepe/emi ──────────────────────────────────────────────────────
router.get('/emi', protect, async (req: any, res) => {
  try {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 7);
    await EmiInstallment.updateMany(
      { user: req.user._id, status: 'pending', dueDate: { $lt: overdueDate } },
      { status: 'overdue' }
    );
    const hasOverdue = await EmiInstallment.findOne({ user: req.user._id, status: 'overdue' });
    await User.findByIdAndUpdate(req.user._id, { packageSuspended: !!hasOverdue });
    const installments = await EmiInstallment.find({ user: req.user._id }).sort({ installmentNumber: 1 }).populate('packagePurchase');
    res.json({ success: true, installments, isSuspended: !!hasOverdue });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
});

// ── POST /api/phonepe/emi/pay ─────────────────────────────────────────────────
router.post('/emi/pay', protect, async (req: any, res) => {
  try {
    const { installmentId } = req.body;
    const installment = await EmiInstallment.findOne({ _id: installmentId, user: req.user._id });
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (installment.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    const prevUnpaid = await EmiInstallment.findOne({
      packagePurchase: installment.packagePurchase,
      installmentNumber: { $lt: installment.installmentNumber },
      status: { $ne: 'paid' },
    });
    if (prevUnpaid) return res.status(400).json({ success: false, message: 'Pay previous installments first' });

    const chargeAmount = installment.amount - ((installment as any).walletAmountUsed || 0);
    if (chargeAmount <= 0) {
      installment.status = 'paid';
      installment.paidAt = new Date();
      await installment.save();
      return res.json({ success: true, alreadyPaid: true, message: 'Already fully paid via wallet.' });
    }

    const merchantOrderId = `TL_EMI_${installmentId}_${Date.now()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/checkout/phonepe-emi-status?installmentId=${installmentId}&orderId=${merchantOrderId}`;

    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(chargeAmount * 100))
      .redirectUrl(redirectUrl)
      .message(`EMI Installment ${installment.installmentNumber} of ${installment.totalInstallments}`)
      .build();

    const ppResponse = await client.pay(request);

    installment.razorpayOrderId = merchantOrderId;
    await installment.save();

    res.json({ success: true, redirectUrl: ppResponse.redirectUrl, merchantOrderId, installmentId });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
});

// ── POST /api/phonepe/emi/pay-wallet ─────────────────────────────────────────
// Use wallet balance (fully or partially) to pay an EMI installment
router.post('/emi/pay-wallet', protect, async (req: any, res) => {
  try {
    const { installmentId } = req.body;
    const installment = await EmiInstallment.findOne({ _id: installmentId, user: req.user._id });
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (installment.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    // Ensure previous installments are paid
    const prevUnpaid = await EmiInstallment.findOne({
      packagePurchase: installment.packagePurchase,
      installmentNumber: { $lt: installment.installmentNumber },
      status: { $ne: 'paid' },
    });
    if (prevUnpaid) return res.status(400).json({ success: false, message: 'Pay previous installments first' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const walletBalance = user.wallet || 0;
    if (walletBalance <= 0) return res.status(400).json({ success: false, message: 'No wallet balance available' });

    const alreadyUsed = (installment as any).walletAmountUsed || 0;
    const stillNeeded = installment.amount - alreadyUsed;
    if (stillNeeded <= 0) {
      installment.status = 'paid'; installment.paidAt = new Date();
      await installment.save();
      return res.json({ success: true, fullyPaid: true, message: 'Installment already fully covered by wallet.' });
    }
    const walletToUse = Math.min(walletBalance, stillNeeded);
    const remaining = stillNeeded - walletToUse;

    // Deduct from wallet
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { wallet: -walletToUse } },
      { new: true }
    );
    await Transaction.create({
      user: user._id, type: 'debit', category: 'emi_payment',
      amount: walletToUse,
      description: `Wallet used for EMI installment ${installment.installmentNumber}/${installment.totalInstallments}`,
      referenceId: String(installment._id), status: 'completed',
      balanceAfter: updatedUser?.wallet || 0,
    });

    (installment as any).walletAmountUsed = alreadyUsed + walletToUse;

    // ── Full wallet payment ──
    if (remaining === 0) {
      installment.status = 'paid';
      installment.paidAt = new Date();
      await installment.save();

      // Unlock access if no more pending/overdue
      const stillDue = await EmiInstallment.findOne({
        packagePurchase: installment.packagePurchase,
        status: { $in: ['pending', 'overdue'] },
        _id: { $ne: installment._id },
      });
      if (!stillDue) await User.findByIdAndUpdate(user._id, { packageSuspended: false });

      // Credit partner commission
      if (installment.partnerUser && !installment.partnerCommissionPaid && installment.partnerCommissionAmount > 0) {
        const commAmt = installment.partnerCommissionAmount;
        const updatedPartner = await User.findByIdAndUpdate(
          installment.partnerUser,
          { $inc: { wallet: commAmt, totalEarnings: commAmt } },
          { new: true }
        );
        await Transaction.create({
          user: installment.partnerUser, type: 'credit', category: 'affiliate_commission',
          amount: commAmt,
          description: `EMI installment ${installment.installmentNumber} Partnership earning`,
          referenceId: String(installment._id), status: 'completed',
          balanceAfter: updatedPartner?.wallet || 0,
        });
        await EmiInstallment.findByIdAndUpdate(installment._id, { partnerCommissionPaid: true });
        await User.findByIdAndUpdate(installment.partnerUser, {
          $push: { notifications: { type: 'commission', message: `₹${commAmt} EMI Partnership earning received (Inst ${installment.installmentNumber}/${installment.totalInstallments})`, read: false, createdAt: new Date() } }
        });
      }

      return res.json({
        success: true, fullyPaid: true,
        message: `₹${walletToUse} deducted from wallet. Installment fully paid!`,
        walletUsed: walletToUse, remaining: 0,
      });
    }

    // ── Partial wallet payment — create PhonePe order for remaining ──
    await installment.save();

    const merchantOrderId = `TL_EMI_${installmentId}_${Date.now()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/checkout/phonepe-emi-status?installmentId=${installmentId}&orderId=${merchantOrderId}`;

    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(remaining * 100))
      .redirectUrl(redirectUrl)
      .message(`EMI Installment ${installment.installmentNumber}/${installment.totalInstallments} — remaining after wallet`)
      .build();

    const ppResponse = await client.pay(request);
    installment.razorpayOrderId = merchantOrderId;
    await installment.save();

    return res.json({
      success: true, fullyPaid: false,
      message: `₹${walletToUse} deducted from wallet. Pay ₹${remaining} more to complete.`,
      walletUsed: walletToUse, remaining,
      redirectUrl: ppResponse.redirectUrl,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
});

// ── GET /api/phonepe/emi/status ───────────────────────────────────────────────
// Public endpoint — verified by installmentId + orderId pair (no login required)
router.get('/emi/status', async (req: any, res) => {
  try {
    const { installmentId, orderId } = req.query;
    const installment = await EmiInstallment.findOne({ _id: installmentId, razorpayOrderId: orderId });
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (installment.status === 'paid') return res.json({ success: true, message: 'Already paid' });

    const client = getClient();
    const statusResp = await client.getOrderStatus(orderId as string);

    if (statusResp.state !== 'COMPLETED') {
      return res.json({ success: false, state: statusResp.state, message: 'Payment not completed' });
    }

    installment.status = 'paid';
    installment.paidAt = new Date();
    installment.razorpayPaymentId = statusResp.orderId;
    await installment.save();

    const anyOverdue = await EmiInstallment.findOne({ packagePurchase: installment.packagePurchase, status: 'overdue', _id: { $ne: installment._id } });
    if (!anyOverdue) await User.findByIdAndUpdate(installment.user, { packageSuspended: false });

    const remaining = await EmiInstallment.findOne({ packagePurchase: installment.packagePurchase, status: { $in: ['pending', 'overdue'] }, _id: { $ne: installment._id } });
    if (!remaining) await User.findByIdAndUpdate(installment.user, { packageSuspended: false });

    // Credit partner commission for this installment
    if (installment.partnerUser && !installment.partnerCommissionPaid && installment.partnerCommissionAmount > 0) {
      const updatedPartner = await User.findByIdAndUpdate(
        installment.partnerUser,
        { $inc: { wallet: installment.partnerCommissionAmount, totalEarnings: installment.partnerCommissionAmount } },
        { new: true }
      );
      await Transaction.create({
        user: installment.partnerUser, type: 'credit', category: 'affiliate_commission',
        amount: installment.partnerCommissionAmount,
        description: `EMI installment ${installment.installmentNumber} commission`,
        referenceId: String(installment._id), status: 'completed',
        balanceAfter: updatedPartner?.wallet || 0,
      });
      await EmiInstallment.findByIdAndUpdate(installment._id, { partnerCommissionPaid: true });
    }

    res.json({ success: true, message: 'EMI payment successful!' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
  }
});

// ── GET /api/phonepe/emi/pay-link/:installmentId ──────────────────────────────
// Public endpoint — no auth required, installmentId acts as token
router.get('/emi/pay-link/:installmentId', async (req: any, res) => {
  try {
    const { installmentId } = req.params;
    const installment = await EmiInstallment.findById(installmentId)
      .populate('packagePurchase')
      .populate('user', 'name email phone');
    if (!installment) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (installment.status === 'paid') {
      return res.json({ success: true, alreadyPaid: true, message: 'This installment has already been paid.' });
    }

    const purchase = installment.packagePurchase as any;
    const packageName = purchase?.packageTier || 'Package';

    // Amount to charge = total - already paid from wallet
    const chargeAmount = installment.amount - ((installment as any).walletAmountUsed || 0);
    if (chargeAmount <= 0) {
      // Fully covered by wallet already — just mark paid
      installment.status = 'paid';
      installment.paidAt = new Date();
      await installment.save();
      return res.json({ success: true, alreadyPaid: true, message: 'Already fully paid via wallet.' });
    }

    // Create a fresh PhonePe order for this installment
    const merchantOrderId = `TL_EMI_${installmentId}_${Date.now()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/checkout/phonepe-emi-status?installmentId=${installmentId}&orderId=${merchantOrderId}`;

    const client = getClient();
    const walletUsed = (installment as any).walletAmountUsed || 0;
    const msgSuffix = walletUsed > 0 ? ` (₹${walletUsed} paid via wallet)` : '';
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(chargeAmount * 100))
      .redirectUrl(redirectUrl)
      .message(`EMI Installment ${installment.installmentNumber} of ${installment.totalInstallments}${msgSuffix}`)
      .build();

    const ppResponse = await client.pay(request);

    // Save order id on installment
    installment.razorpayOrderId = merchantOrderId;
    await installment.save();

    return res.json({
      success: true,
      installment: {
        _id: installment._id,
        installmentNumber: installment.installmentNumber,
        totalInstallments: installment.totalInstallments,
        amount: installment.amount,
        walletAmountUsed: walletUsed,
        chargeAmount,
        dueDate: installment.dueDate,
        status: installment.status,
      },
      redirectUrl: ppResponse.redirectUrl,
      amount: chargeAmount,
      dueDate: installment.dueDate,
      packageName,
    });
  } catch (e: any) {
    console.error('[PhonePe emi/pay-link]', e?.message || e);
    res.status(500).json({ success: false, message: e?.message || 'Failed to create payment link' });
  }
});

// ── POST /api/phonepe/callback ───────────────────────────────────────────────
router.post('/callback', async (req, res) => {
  try {
    const authorization = req.headers['authorization'] as string || '';
    const body = JSON.stringify(req.body);
    const username = process.env.PHONEPE_CALLBACK_USERNAME || '';
    const password = process.env.PHONEPE_CALLBACK_PASSWORD || '';
    const client = getClient();
    const callbackResp = client.validateCallback(username, password, authorization, body);
    const { orderId, state } = (callbackResp as any).payload || {};
    if (state === 'COMPLETED' && orderId) {
      console.log(`[PhonePe callback] Order ${orderId} state=${state}`);
    }
    res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('[PhonePe callback]', e?.message || e);
    res.status(400).json({ success: false });
  }
});

export default router;
