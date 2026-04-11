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

const router = Router();

function getClient() {
  const clientId = process.env.PHONEPE_CLIENT_ID || '';
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET || '';
  const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
  const env = process.env.NODE_ENV === 'production' && process.env.PHONEPE_ENV === 'PRODUCTION'
    ? Env.PRODUCTION : Env.SANDBOX;
  return StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
}

async function creditMLM(purchasedUserId: string, saleAmount: number, purchaseId: string, tier: string) {
  const buyer = await User.findById(purchasedUserId).populate('referredBy');
  if (!buyer) return;
  const level1Id = buyer.upline1 || (buyer.referredBy as any)?._id || buyer.referredBy;
  if (!level1Id) return;
  const level1 = await User.findById(level1Id);
  if (!level1 || !level1.isAffiliate) return;
  const levels = [{ user: level1, rate: level1.commissionRate || 10, level: 1 }];
  if (level1.upline1) {
    const level2 = await User.findById(level1.upline1);
    if (level2?.isAffiliate) levels.push({ user: level2, rate: 5, level: 2 });
    if (level2?.upline1) {
      const level3 = await User.findById(level2.upline1);
      if (level3?.isAffiliate) levels.push({ user: level3, rate: 2, level: 3 });
    }
  }
  for (const { user: earner, rate, level } of levels) {
    const commAmt = Math.round(saleAmount * rate / 100);
    await Commission.create({
      earner: earner._id, earnerTier: earner.packageTier,
      earnerCommissionRate: earner.commissionRate, buyer: purchasedUserId,
      buyerPackageTier: tier, level, levelRate: rate,
      saleAmount, commissionAmount: commAmt, packagePurchaseId: purchaseId, status: 'approved',
    });
    await User.findByIdAndUpdate(earner._id, { $inc: { wallet: commAmt, totalEarnings: commAmt } });
    await Transaction.create({
      user: earner._id, type: 'credit', category: 'affiliate_commission',
      amount: commAmt, description: `L${level} commission — ${tier} package purchased`,
      referenceId: purchaseId, status: 'completed',
    });
    earner.notifications.push({
      type: 'commission',
      message: `🎉 ₹${commAmt} earned! L${level} commission from a ${tier} purchase.`,
      read: false, createdAt: new Date(),
    });
    await earner.save();
  }
  if (!buyer.upline1) {
    buyer.upline1 = level1Id;
    if (levels[1]) buyer.upline2 = levels[1].user._id;
    if (levels[2]) buyer.upline3 = levels[2].user._id;
    await buyer.save();
  }
}

// ── POST /api/phonepe/create-order ───────────────────────────────────────────
router.post('/create-order', protect, async (req: any, res) => {
  try {
    const { type, tier, courseId, couponCode, promoCode, isEmi } = req.body;

    let basePrice = 0, gst = 0, discount = 0, itemName = '', packageId: any = null;

    if (type === 'package') {
      const pkg = await Package.findOne({ tier, isActive: true });
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
      const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3, supreme: 4 };
      if (TIER_ORDER[req.user.packageTier] > TIER_ORDER[tier]) {
        return res.status(400).json({ success: false, message: 'You already have a higher tier' });
      }
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

    // Apply coupon
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon && coupon.usedCount < coupon.maxUses && new Date() < coupon.expiresAt) {
        discount = coupon.type === 'percent'
          ? Math.round(basePrice * coupon.value / 100)
          : Math.min(coupon.value, basePrice);
      }
    }

    const afterDiscount = basePrice - discount;
    gst = type === 'package' ? Math.round(afterDiscount * 0.18) : 0;
    const totalAmount = afterDiscount + gst;

    // EMI: only first installment amount
    const EMI_MONTHS = 3;
    const isEmiOrder = type === 'package' && !!isEmi;
    const payNow = isEmiOrder ? Math.ceil(totalAmount / EMI_MONTHS) : totalAmount;

    const merchantOrderId = `TL_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const webUrl = process.env.WEB_URL || 'https://peptly.in';
    const redirectUrl = `${webUrl}/checkout/phonepe-status?orderId=${merchantOrderId}&type=${type}${tier ? `&tier=${tier}` : ''}${courseId ? `&courseId=${courseId}` : ''}&isEmi=${isEmiOrder}`;

    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(payNow * 100))
      .redirectUrl(redirectUrl)
      .message(isEmiOrder ? `${itemName} — Installment 1 of ${EMI_MONTHS}` : itemName)
      .build();

    const ppResponse = await client.pay(request);

    if (type === 'package') {
      await PackagePurchase.create({
        user: req.user._id, package: packageId, packageTier: tier,
        amount: afterDiscount, gstAmount: gst, totalAmount: afterDiscount + gst,
        razorpayOrderId: merchantOrderId,
        status: 'created', affiliateCode: promoCode || '',
        isEmi: isEmiOrder, emiMonth: isEmiOrder ? 1 : undefined, emiTotal: isEmiOrder ? EMI_MONTHS : undefined,
      });
    } else {
      const payment = await Payment.create({
        user: req.user._id, course: courseId, amount: totalAmount,
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
      isEmi: isEmiOrder,
      emiMonths: EMI_MONTHS,
      emiInstallmentAmount: isEmiOrder ? Math.ceil(totalAmount / EMI_MONTHS) : undefined,
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
    const EMI_MONTHS = 3;

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
      await User.findByIdAndUpdate(req.user._id, {
        packageTier: pkgTier, isAffiliate: true,
        commissionRate: COMMISSION_RATES[pkgTier as keyof typeof COMMISSION_RATES] || 10,
        packagePurchasedAt: new Date(), packageSuspended: false,
        $inc: { xpPoints: 500 },
      });

      // Create EMI installment records
      if (isEmiOrder) {
        const totalAmt = purchase.amount + purchase.gstAmount;
        const installmentAmt = Math.ceil(totalAmt / EMI_MONTHS);
        const now = new Date();
        // Mark installment 1 as paid
        await EmiInstallment.create({
          user: req.user._id, packagePurchase: purchase._id,
          installmentNumber: 1, totalInstallments: EMI_MONTHS, amount: installmentAmt,
          dueDate: now, paidAt: now, razorpayOrderId: merchantOrderId,
          razorpayPaymentId: statusResp.orderId, status: 'paid',
        });
        // Create pending installments 2 & 3
        for (let i = 2; i <= EMI_MONTHS; i++) {
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + (i - 1) * 30);
          await EmiInstallment.create({
            user: req.user._id, packagePurchase: purchase._id,
            installmentNumber: i, totalInstallments: EMI_MONTHS,
            amount: installmentAmt, dueDate, status: 'pending',
          });
        }
      }

      if (couponCode) await Coupon.findOneAndUpdate({ code: (couponCode as string).toUpperCase().trim() }, { $inc: { usedCount: 1 } });
      await creditMLM(req.user._id.toString(), purchase.amount, purchase._id.toString(), pkgTier);

      const user = await User.findById(req.user._id);
      if (user) {
        user.notifications.push({ type: 'package', message: `🎉 Welcome to ${pkgTier}! Your account is now upgraded.`, read: false, createdAt: new Date() });
        await user.save();
      }

      return res.json({ success: true, state: 'COMPLETED', message: `Welcome to ${pkgTier}!`, tier: pkgTier, isEmi: isEmiOrder });
    }

    if (type === 'course') {
      const payment = await Payment.findOne({ razorpayOrderId: merchantOrderId, user: req.user._id }).populate('affiliateUser');
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
      if (payment.status === 'paid') return res.json({ success: true, state: 'COMPLETED', message: 'Already enrolled', courseId });

      payment.status = 'paid';
      payment.razorpayPaymentId = statusResp.orderId;
      await payment.save();

      await Enrollment.create({
        student: req.user._id, course: courseId,
        paymentId: statusResp.orderId, orderId: merchantOrderId, amount: payment.amount,
      });

      const Course = (await import('../models/Course')).default;
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

      if ((payment as any).affiliateUser) {
        const affiliate = (payment as any).affiliateUser;
        const commRate = parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '10');
        const commAmt = Math.round(payment.amount * commRate / 100);
        await User.findByIdAndUpdate(affiliate._id, { $inc: { wallet: commAmt, totalEarnings: commAmt } });
        await Transaction.create({
          user: affiliate._id, type: 'credit', category: 'affiliate_commission',
          amount: commAmt, description: 'Partner commission — course sale', referenceId: payment._id, status: 'completed',
        });
      }

      if (couponCode) await Coupon.findOneAndUpdate({ code: (couponCode as string).toUpperCase().trim() }, { $inc: { usedCount: 1 } });

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

    const merchantOrderId = `TL_EMI_${installmentId}_${Date.now()}`;
    const webUrl = process.env.WEB_URL || 'https://peptly.in';
    const redirectUrl = `${webUrl}/checkout/phonepe-emi-status?installmentId=${installmentId}&orderId=${merchantOrderId}`;

    const client = getClient();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(installment.amount * 100))
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

// ── GET /api/phonepe/emi/status ───────────────────────────────────────────────
router.get('/emi/status', protect, async (req: any, res) => {
  try {
    const { installmentId, orderId } = req.query;
    const installment = await EmiInstallment.findOne({ _id: installmentId, user: req.user._id });
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

    const anyOverdue = await EmiInstallment.findOne({ packagePurchase: installment.packagePurchase, status: 'overdue' });
    if (!anyOverdue) await User.findByIdAndUpdate(req.user._id, { packageSuspended: false });

    const remaining = await EmiInstallment.findOne({ packagePurchase: installment.packagePurchase, status: { $in: ['pending', 'overdue'] } });
    if (!remaining) await User.findByIdAndUpdate(req.user._id, { packageSuspended: false });

    res.json({ success: true, message: 'EMI payment successful!' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message });
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
