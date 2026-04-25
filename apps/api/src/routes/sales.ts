import { Router } from 'express';
import { randomUUID } from 'crypto';
import { protect, authorize } from '../middleware/auth';
import User from '../models/User';
import Lead from '../models/Lead';
import Package from '../models/Package';
import SalesOrder from '../models/SalesOrder';
import PackagePurchase from '../models/PackagePurchase';
import Commission from '../models/Commission';
import EmiInstallment from '../models/EmiInstallment';
import Withdrawal from '../models/Withdrawal';
import Transaction from '../models/Transaction';
import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import Course from '../models/Course';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import { activateOrder } from '../services/orderActivation';

function getPhonePeClient() {
  const clientId = process.env.PHONEPE_CLIENT_ID || '';
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET || '';
  const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
  const env = process.env.NODE_ENV === 'production' && process.env.PHONEPE_ENV === 'PRODUCTION'
    ? Env.PRODUCTION : Env.SANDBOX;
  return StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
}


const router = Router();
const guard = [protect, authorize('salesperson', 'admin', 'superadmin')];

// ── Dashboard stats ─────────────────────────────────────────────────────────
router.get('/stats', ...guard, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      convertedLeads,
      pendingOrders,
      tokenCollected,
      thisMonthCommissions,
      user,
    ] = await Promise.all([
      Lead.countDocuments({ assignedTo: userId }),
      Lead.countDocuments({ assignedTo: userId, stage: 'paid' }),
      SalesOrder.countDocuments({ salesperson: userId, status: { $in: ['pending', 'token_paid', 'partial'] } }),
      SalesOrder.countDocuments({ salesperson: userId, tokenPaid: true }),
      Commission.aggregate([
        { $match: { earner: userId, createdAt: { $gte: startOfMonth }, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      User.findById(userId).select('totalEarnings wallet'),
    ]);

    res.json({
      success: true,
      stats: {
        totalLeads,
        convertedLeads,
        pendingOrders,
        tokenCollected,
        myEarnings: (user as any)?.totalEarnings || 0,
        myWallet: (user as any)?.wallet || 0,
        thisMonthEarnings: thisMonthCommissions[0]?.total || 0,
      },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── My Leads ────────────────────────────────────────────────────────────────
router.get('/leads', ...guard, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const { search, stage, dateFilter, page = 1, limit = 20 } = req.query;

    const filter: any = { assignedTo: userId };
    if (stage) filter.stage = stage;
    if (dateFilter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    } else if (dateFilter === '7d') {
      const start = new Date(); start.setDate(start.getDate() - 7);
      filter.createdAt = { $gte: start };
    } else if (dateFilter === '30d') {
      const start = new Date(); start.setDate(start.getDate() - 30);
      filter.createdAt = { $gte: start };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total, stageAgg, followUpToday] = await Promise.all([
      Lead.find(filter).sort('-updatedAt').skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
      // Stage summary always from ALL assigned leads (no date/stage filter)
      Lead.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      // Follow-ups due today
      Lead.countDocuments({
        assignedTo: userId,
        'followUps': { $elemMatch: {
          done: false,
          scheduledAt: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) }
        }}
      }),
    ]);

    const stageSummary: Record<string, number> = {};
    for (const s of stageAgg) stageSummary[s._id] = s.count;

    res.json({ success: true, leads, total, page: Number(page), pages: Math.ceil(total / Number(limit)), stageSummary, followUpToday });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Update Lead ──────────────────────────────────────────────────────────────
router.patch('/leads/:id', ...guard, async (req: any, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const { stage, noteText, followUp, tokenAmount, tokenCollected, lostReason } = req.body;

    if (stage) lead.stage = stage;
    if (lostReason) lead.lostReason = lostReason;
    if (typeof tokenAmount === 'number') (lead as any).tokenAmount = tokenAmount;
    if (typeof tokenCollected === 'boolean') (lead as any).tokenCollected = tokenCollected;

    if (noteText) {
      lead.notes.push({ text: noteText, by: req.user._id, createdAt: new Date() });
    }
    if (followUp) {
      lead.followUps.push(followUp);
    }

    lead.lastContactedAt = new Date();
    await lead.save();

    res.json({ success: true, lead });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── My Orders ────────────────────────────────────────────────────────────────
router.get('/orders', ...guard, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter: any = { salesperson: userId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      SalesOrder.find(filter)
        .populate('package', 'name tier price')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      SalesOrder.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Create Order ─────────────────────────────────────────────────────────────
router.post('/orders', ...guard, async (req: any, res) => {
  try {
    const salesperson = req.user;
    const {
      customer,
      packageId,
      paymentType,
      tokenAmount,
      notes,
      leadId,
    } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    }
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Package is required' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Calculate commission
    let commissionAmount = 0;
    if (pkg.salesTeamCommission?.value) {
      if (pkg.salesTeamCommission.type === 'percentage') {
        commissionAmount = (pkg.price * pkg.salesTeamCommission.value) / 100;
      } else {
        commissionAmount = pkg.salesTeamCommission.value;
      }
    }

    // Find or create customer user account
    let customerUser = await User.findOne({
      $or: [
        { phone: customer.phone },
        ...(customer.email ? [{ email: customer.email }] : []),
      ],
    });

    let customerTempPassword: string | undefined;
    if (!customerUser) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let tempPass = '';
      for (let i = 0; i < 10; i++) tempPass += chars[Math.floor(Math.random() * chars.length)];
      customerTempPassword = tempPass;

      customerUser = new User({
        name: customer.name,
        email: customer.email || `${customer.phone}@sales.trulearnix.com`,
        phone: customer.phone,
        password: tempPass,
        role: 'student',
        isVerified: false,
        state: customer.state,
        referredBy: salesperson._id,
      });
      await customerUser.save();
    }

    const totalAmount = pkg.price; // always full package price; tokenAmount is stored separately

    const order = new SalesOrder({
      salesperson: salesperson._id,
      customer,
      package: pkg._id,
      packageTier: pkg.tier,
      packagePrice: pkg.price,
      promoCode: salesperson.affiliateCode,
      paymentType: paymentType || 'full',
      tokenAmount: paymentType === 'token' ? tokenAmount : undefined,
      emiDays: paymentType === 'emi' ? (pkg.emiDays && pkg.emiDays.length ? pkg.emiDays : [0, 15, 30, 45]) : undefined,
      totalAmount,
      paidAmount: 0,
      status: 'pending',
      commissionAmount,
      commissionPaid: false,
      notes,
      userId: customerUser?._id,
      customerTempPassword,
    });

    await order.save();

    // Link lead if provided
    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, {
        salesOrderId: order._id,
        tokenAmount: paymentType === 'token' ? tokenAmount : undefined,
      });
    }

    res.status(201).json({ success: true, order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Get Order Detail ─────────────────────────────────────────────────────────
router.get('/orders/:id', ...guard, async (req: any, res) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user.role === 'salesperson') filter.salesperson = req.user._id;

    const order = await SalesOrder.findOne(filter)
      .populate('package', 'name tier price features salesTeamCommission')
      .populate('salesperson', 'name email phone affiliateCode')
      .populate('userId', 'name email phone packageTier isAffiliate');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // For EMI orders, attach installments
    let installments: any[] = [];
    if (order.paymentType === 'emi' && order.userId) {
      const purchase = await PackagePurchase.findOne({ user: order.userId, referredBy: order.salesperson }).sort('-createdAt').select('_id');
      if (purchase) {
        installments = await EmiInstallment.find({ packagePurchase: purchase._id }).sort('installmentNumber').lean();
      }
    }

    res.json({ success: true, order, installments });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Verify / Mark Payment ─────────────────────────────────────────────────────
router.post('/orders/:id/verify-payment', ...guard, async (req: any, res) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user.role === 'salesperson') filter.salesperson = req.user._id;

    const order = await SalesOrder.findOne(filter).populate('package');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { paymentMethod = 'manual', paidAmount } = req.body;
    const amountPaid = paidAmount || order.totalAmount;
    order.paidAmount = amountPaid;

    if (order.paymentType === 'token' && amountPaid < order.totalAmount) {
      // Token collected — wait for remaining payment
      order.status = 'token_paid'; order.tokenPaid = true;
      await Lead.findOneAndUpdate(
        { salesOrderId: order._id },
        { stage: 'token_collected', tokenCollected: true, tokenAmount: order.tokenAmount }
      );
    } else if (amountPaid >= order.totalAmount) {
      // Full amount received manually — needs admin approval before access is granted
      order.status = 'pending_approval';
    } else {
      order.status = 'partial';
    }

    order.slipGeneratedAt = new Date();
    await order.save();
    res.json({ success: true, order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Regenerate Payment Link ──────────────────────────────────────────────────
router.post('/orders/:id/payment-link', ...guard, async (req: any, res) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user.role === 'salesperson') filter.salesperson = req.user._id;

    const order = await SalesOrder.findOne(filter);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Generate a simple shareable link (can be enhanced with Razorpay payment links)
    const baseUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const paymentLink = `${baseUrl}/pay/order/${order._id}`;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    order.paymentLink = paymentLink;
    order.paymentLinkExpiry = expiry;
    await order.save();

    res.json({ success: true, paymentLink, expiresAt: expiry });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── My Affiliate Link ────────────────────────────────────────────────────────
router.get('/link', ...guard, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('affiliateCode name');
    const packages = await Package.find({ isActive: true }).select('name tier price promoDiscountPercent').sort('displayOrder');

    const baseUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const code = (user as any)?.affiliateCode || '';

    const packageLinks = packages.map(pkg => ({
      id: pkg._id,
      name: pkg.name,
      tier: pkg.tier,
      price: pkg.price,
      promoDiscountPercent: pkg.promoDiscountPercent,
      checkoutUrl: `${baseUrl}/checkout?type=package&packageId=${pkg._id}&promo=${code}`,
      registerUrl: `${baseUrl}/register?ref=${code}&next=/checkout?type=package%26packageId=${pkg._id}%26promo=${code}`,
    }));

    const courses = await Course.find({ status: 'published', salesRefDiscountPercent: { $gt: 0 } })
      .select('title slug price discountPrice salesRefDiscountPercent thumbnail')
      .sort('-createdAt').limit(50);

    const courseLinks = courses.map((c: any) => {
      const basePrice = c.discountPrice || c.price;
      const refPrice = Math.round(basePrice * (1 - (c.salesRefDiscountPercent || 0) / 100));
      return {
        id: c._id, title: c.title, slug: c.slug,
        basePrice, refPrice, discountPercent: c.salesRefDiscountPercent || 0,
        thumbnail: c.thumbnail,
        refUrl: `${baseUrl}/courses/${c.slug}?ref=${code}`,
      };
    });

    res.json({
      success: true,
      affiliateCode: code,
      packageLinks,
      courseLinks,
      generalLink: `${baseUrl}/register?ref=${code}`,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Active Packages ──────────────────────────────────────────────────────────
router.get('/packages', ...guard, async (_req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .select('name tier price features salesTeamCommission emiAvailable emiDays badge')
      .sort('displayOrder');
    res.json({ success: true, packages });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PUBLIC: Get order for payment page (no auth) ─────────────────────────────
router.get('/public/order/:id', async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('package', 'name tier price features emiAvailable emiDays')
      .populate('salesperson', 'name phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: {
      _id: order._id, status: order.status,
      customer: order.customer, package: (order as any).package,
      packageTier: order.packageTier, paymentType: order.paymentType,
      totalAmount: order.totalAmount, paidAmount: order.paidAmount,
      tokenAmount: order.tokenAmount, emiDays: (order as any).emiDays,
      salesperson: (order as any).salesperson,
    }});
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC: Initiate PhonePe for initial payment ──────────────────────────────
router.post('/public/order/:id/phonepe', async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id).populate('package', 'name tier');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'paid') return res.json({ success: true, status: 'paid' });
    if (order.status === 'cancelled') return res.status(400).json({ success: false, message: 'Order cancelled' });

    let amountToPay = order.totalAmount;
    if (order.paymentType === 'token') {
      amountToPay = order.tokenAmount || order.totalAmount;
    } else if (order.paymentType === 'emi') {
      const emiDaysArr: number[] = (order as any).emiDays?.length ? (order as any).emiDays : [0, 15, 30, 45];
      amountToPay = Math.ceil(order.totalAmount / emiDaysArr.length);
    }
    const merchantOrderId = `SO_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/pay/order/${order._id}?merchantOrderId=${merchantOrderId}`;

    const client = getPhonePeClient();
    const ppResponse = await client.pay(
      StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(Math.round(amountToPay * 100))
        .redirectUrl(redirectUrl)
        .message(`TruLearnix — ${(order as any).package?.name || order.packageTier}`)
        .build()
    );
    (order as any).phonepeMerchantOrderId = merchantOrderId;
    await order.save();
    res.json({ success: true, redirectUrl: ppResponse.redirectUrl, merchantOrderId });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC: Check PhonePe status (initial payment) ───────────────────────────
router.get('/public/order/:id/phonepe-status', async (req, res) => {
  try {
    const { merchantOrderId } = req.query as { merchantOrderId: string };
    if (!merchantOrderId) return res.status(400).json({ success: false, message: 'merchantOrderId required' });

    const order = await SalesOrder.findById(req.params.id).populate('package');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'paid') return res.json({ success: true, state: 'COMPLETED', status: 'paid' });
    if (order.status === 'token_paid') return res.json({ success: true, state: 'COMPLETED', status: 'token_paid' });

    const statusResp = await getPhonePeClient().getOrderStatus(merchantOrderId);

    if (statusResp.state === 'COMPLETED') {
      let amountPaid: number;
      if (order.paymentType === 'emi') {
        // Only first installment was charged for EMI; use deterministic calc
        const emiDaysArr: number[] = (order as any).emiDays?.length ? (order as any).emiDays : [0, 15, 30, 45];
        amountPaid = statusResp.amount ? statusResp.amount / 100 : Math.ceil(order.totalAmount / emiDaysArr.length);
      } else {
        amountPaid = statusResp.amount ? statusResp.amount / 100 : (order.tokenAmount || order.totalAmount);
      }
      order.paidAmount = amountPaid;

      if (order.paymentType === 'token' && amountPaid < order.totalAmount) {
        order.status = 'token_paid'; order.tokenPaid = true;
        await order.save();
        await Lead.findOneAndUpdate(
          { salesOrderId: order._id },
          { stage: 'token_collected', tokenCollected: true, tokenAmount: order.tokenAmount }
        );
        return res.json({ success: true, state: 'COMPLETED', status: 'token_paid' });
      } else {
        order.status = 'paid';
        await order.save();
        const full = await SalesOrder.findById(order._id).populate('package');
        await activateOrder(full, 'razorpay', merchantOrderId);
        return res.json({ success: true, state: 'COMPLETED', status: 'paid' });
      }
    }
    res.json({ success: true, state: statusResp.state || 'PENDING' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC: Initiate PhonePe for REMAINING payment (after token) ─────────────
router.post('/public/order/:id/phonepe-remaining', async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id).populate('package', 'name tier');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'token_paid') return res.status(400).json({ success: false, message: 'Order not in token_paid state' });

    const { paymentType = 'full' } = req.body;
    const remaining = order.totalAmount - order.paidAmount;

    // For EMI: fetch package emiDays and charge only first installment
    let amountToCharge = remaining;
    if (paymentType === 'emi') {
      const pkg = await Package.findById(order.package).select('emiDays');
      const emiDaysArr: number[] = pkg?.emiDays && pkg.emiDays.length ? pkg.emiDays as number[] : [0, 15, 30, 45];
      amountToCharge = Math.ceil(remaining / emiDaysArr.length);
      // Snapshot emiDays onto order so activateOrder can use them
      (order as any).emiDays = emiDaysArr;
      await order.save();
    }

    const merchantOrderId = `SR_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const redirectUrl = `${webUrl}/pay/order/${order._id}?merchantOrderId=${merchantOrderId}&mode=remaining&paymentType=${paymentType}`;

    const ppResponse = await getPhonePeClient().pay(
      StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(Math.round(amountToCharge * 100))
        .redirectUrl(redirectUrl)
        .message(`TruLearnix — Remaining Payment`)
        .build()
    );
    (order as any).phonepeMerchantOrderId = merchantOrderId;
    await order.save();
    res.json({ success: true, redirectUrl: ppResponse.redirectUrl, merchantOrderId });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC: Check PhonePe status (remaining payment) ─────────────────────────
router.get('/public/order/:id/phonepe-status-remaining', async (req, res) => {
  try {
    const { merchantOrderId, paymentType = 'full' } = req.query as any;
    if (!merchantOrderId) return res.status(400).json({ success: false, message: 'merchantOrderId required' });

    const order = await SalesOrder.findById(req.params.id).populate('package');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'paid') return res.json({ success: true, state: 'COMPLETED', status: 'paid' });

    const statusResp = await getPhonePeClient().getOrderStatus(merchantOrderId);

    if (statusResp.state === 'COMPLETED') {
      order.paymentType = paymentType === 'emi' ? 'emi' : 'full';
      if (paymentType === 'emi') {
        // paidAmount = token already paid + first EMI installment of remaining
        const emiDaysArr: number[] = (order as any).emiDays?.length ? (order as any).emiDays : [0, 15, 30, 45];
        const remaining = order.totalAmount - (order.tokenAmount || 0);
        order.paidAmount = (order.tokenAmount || 0) + Math.ceil(remaining / emiDaysArr.length);
      } else {
        order.paidAmount = order.totalAmount;
      }
      order.status = 'paid';
      await order.save();
      const full = await SalesOrder.findById(order._id).populate('package');
      await activateOrder(full, 'razorpay', merchantOrderId);
      return res.json({ success: true, state: 'COMPLETED', status: 'paid' });
    }
    res.json({ success: true, state: statusResp.state || 'PENDING' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── My EMI Commissions ────────────────────────────────────────────────────────
router.get('/emi-commissions', ...guard, async (req: any, res) => {
  try {
    const installments = await EmiInstallment.find({ partnerUser: req.user._id })
      .populate({ path: 'packagePurchase', populate: { path: 'package', select: 'name tier' } })
      .sort('-createdAt');

    // Attach customer name from SalesOrder (sales panel orders) or User (direct checkout)
    const enriched = await Promise.all(installments.map(async (inst: any) => {
      let customerName = '';
      let orderStatus = '';
      try {
        const purchase = inst.packagePurchase as any;
        if (purchase) {
          const so = await SalesOrder.findOne({ userId: purchase.user }).select('customer status').lean();
          if (so) {
            customerName = so.customer?.name || '';
            orderStatus = so.status || '';
          } else {
            // Direct checkout (affiliate link) — get name from User
            const u = await User.findById(purchase.user).select('name').lean();
            customerName = (u as any)?.name || '';
            orderStatus = 'paid';
          }
        }
      } catch {}
      return {
        _id: inst._id, installmentNumber: inst.installmentNumber,
        totalInstallments: inst.totalInstallments,
        amount: inst.amount, dueDate: inst.dueDate, paidAt: inst.paidAt,
        status: inst.status, paymentLink: inst.paymentLink,
        commissionAmount: inst.partnerCommissionAmount,
        commissionPaid: inst.partnerCommissionPaid,
        packageName: (inst.packagePurchase as any)?.package?.name || '',
        packageTier: (inst.packagePurchase as any)?.package?.tier || '',
        customerName, orderStatus,
      };
    }));

    // Summary
    const totalCommission = enriched.reduce((s, i) => s + (i.commissionAmount || 0), 0);
    const earnedCommission = enriched.filter(i => i.commissionPaid).reduce((s, i) => s + (i.commissionAmount || 0), 0);
    const pendingCommission = enriched.filter(i => !i.commissionPaid && i.status !== 'paid').reduce((s, i) => s + (i.commissionAmount || 0), 0);

    res.json({ success: true, installments: enriched, totalCommission, earnedCommission, pendingCommission });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET/POST /api/sales/kyc ───────────────────────────────────────────────────
const salesGuard = [protect, authorize('salesperson', 'admin', 'superadmin')];

router.get('/kyc', ...salesGuard, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('kyc name email phone avatar');
    res.json({ success: true, kyc: user?.kyc || { status: 'pending' }, user: { name: user?.name, email: user?.email, phone: user?.phone, avatar: user?.avatar } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/kyc', ...salesGuard, async (req: any, res) => {
  try {
    const { avatar, pan, panName, panPhoto, aadhar, aadharName, aadharPhoto, bankAccount, bankIfsc, bankName, bankHolderName } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      kyc: { pan, panName, panPhoto, aadhar, aadharName, aadharPhoto, bankAccount, bankIfsc, bankName, bankHolderName, status: 'submitted', submittedAt: new Date() },
      ...(avatar ? { avatar } : {}),
    });
    res.json({ success: true, message: 'KYC submitted successfully. Our team will verify within 1-3 business days.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/sales/withdrawals ────────────────────────────────────────────────
router.get('/withdrawals', ...salesGuard, async (req: any, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    const user = await User.findById(req.user._id).select('wallet totalWithdrawn kyc name affiliateCode').lean() as any;
    res.json({
      success: true,
      withdrawals,
      wallet: user?.wallet || 0,
      totalWithdrawn: user?.totalWithdrawn || 0,
      kycStatus: user?.kyc?.status || 'pending',
      bankAccount: user?.kyc?.bankAccount || '',
      partnerName: user?.name || '',
      affiliateCode: user?.affiliateCode || '',
      partnerPan: user?.kyc?.pan || '',
      partnerBankAccount: user?.kyc?.bankAccount || '',
      partnerBankIfsc: user?.kyc?.bankIfsc || '',
      partnerBankHolder: user?.kyc?.bankHolderName || user?.name || '',
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/sales/withdraw ──────────────────────────────────────────────────
router.post('/withdraw', ...salesGuard, async (req: any, res) => {
  try {
    if (req.user.kyc?.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'KYC verification required before withdrawal. Please complete and get your KYC approved.' });
    }
    const { amount } = req.body;
    const amt = Number(amount);
    if (!amt || amt < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500' });
    if (amt > (req.user.wallet || 0)) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    const existing = await Withdrawal.findOne({ user: req.user._id, hrStatus: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request. Please wait for it to be processed.' });
    const tdsRate = 2;
    const tdsAmount = Math.round(amt * tdsRate / 100);
    const gatewayFee = 4.40;
    const gatewayFeeGst = Math.round(gatewayFee * 0.18 * 100) / 100;
    const totalGatewayFee = Math.round((gatewayFee + gatewayFeeGst) * 100) / 100;
    const netAmount = amt - tdsAmount - totalGatewayFee;
    const debited = await User.findOneAndUpdate(
      { _id: req.user._id, wallet: { $gte: amt } },
      { $inc: { wallet: -amt, totalWithdrawn: amt } },
      { new: true }
    );
    if (!debited) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance (may have changed). Refresh and try again.' });
    }
    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount: amt,
      method: 'bank',
      accountName: req.user.kyc?.bankHolderName,
      accountNumber: req.user.kyc?.bankAccount,
      ifscCode: req.user.kyc?.bankIfsc,
      status: 'pending',
      hrStatus: 'pending',
      tdsRate,
      tdsAmount,
      gatewayFee: totalGatewayFee,
      gatewayFeeGst,
      netAmount,
    });
    res.json({ success: true, message: 'Withdrawal request submitted. HR will review and process within 3-5 business days.', withdrawal });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/sales/achievements ──────────────────────────────────────────────
router.get('/achievements', ...salesGuard, async (req: any, res) => {
  try {
    const [user, orderCount, existingAchievements, userAchievements] = await Promise.all([
      User.findById(req.user._id).select('totalEarnings name avatar createdAt').lean(),
      SalesOrder.countDocuments({ salesperson: req.user._id, status: 'paid' }),
      (Achievement as any).find({ enabled: true, category: 'sales' }).sort({ order: 1 }).lean(),
      (UserAchievement as any).find({ userId: req.user._id }).lean(),
    ]);

    let allAchievements = existingAchievements;

    // Seed sales-specific defaults if none exist
    if (allAchievements.length === 0) {
      const AchievementModel = Achievement as any;
      await AchievementModel.insertMany([
        { title: 'Sales Star', description: 'Welcome to the TruLearnix Sales Team!', badge: '⭐', triggerType: 'join', triggerValue: 0, requirement: 'Join Sales Team', posterTheme: 0, order: 0, category: 'sales', enabled: true },
        { title: 'First Sale', description: 'Closed your very first sale!', badge: '🎯', triggerType: 'first_earn', triggerValue: 0, requirement: 'Close 1 sale', posterTheme: 1, order: 1, category: 'sales', enabled: true },
        { title: '5 Sales Club', description: 'Closed 5 successful sales!', badge: '🔥', triggerType: 'earn_amount', triggerValue: 1, requirement: 'Close 5 sales', posterTheme: 5, order: 2, category: 'sales', enabled: true },
        { title: '20 Sales Warrior', description: 'Closed 20 successful sales!', badge: '⚡', triggerType: 'earn_amount', triggerValue: 1, requirement: 'Close 20 sales', posterTheme: 2, order: 3, category: 'sales', enabled: true },
        { title: '₹10K Earner', description: 'Crossed ₹10,000 in total Partnership earnings!', badge: '💰', triggerType: 'earn_amount', triggerValue: 10000, requirement: 'Earn ₹10,000', posterTheme: 2, order: 4, category: 'sales', enabled: true },
        { title: '₹50K Sales Pro', description: 'Crossed ₹50,000 in total Partnership earnings!', badge: '🏆', triggerType: 'earn_amount', triggerValue: 50000, requirement: 'Earn ₹50,000', posterTheme: 3, order: 5, category: 'sales', enabled: true },
        { title: 'Lakhpati Seller', description: 'Crossed ₹1,00,000 in total Partnership earnings!', badge: '👑', triggerType: 'earn_amount', triggerValue: 100000, requirement: 'Earn ₹1 Lakh', posterTheme: 4, order: 6, category: 'sales', enabled: true },
        { title: '50 Sales Legend', description: 'Crossed ₹5 Lakh in Partnership earnings!', badge: '🦁', triggerType: 'earn_amount', triggerValue: 500000, requirement: 'Earn ₹5 Lakh', posterTheme: 1, order: 7, category: 'sales', enabled: true },
      ]);
      allAchievements = await AchievementModel.find({ enabled: true, category: 'sales' }).sort({ order: 1 }).lean();
    }

    const earnedMap: Record<string, Date> = {};
    userAchievements.forEach((ua: any) => { earnedMap[ua.achievementId.toString()] = ua.earnedAt; });

    const toUnlock: string[] = [];
    for (const ach of allAchievements) {
      if (earnedMap[ach._id.toString()]) continue;
      let earned = false;
      switch (ach.triggerType) {
        case 'join': earned = true; break;
        case 'first_earn': earned = (user?.totalEarnings || 0) > 0; break;
        case 'earn_amount': earned = (user?.totalEarnings || 0) >= ach.triggerValue; break;
        case 'order_count': earned = orderCount >= ach.triggerValue; break;
      }
      if (earned) toUnlock.push(ach._id.toString());
    }

    if (toUnlock.length > 0) {
      const now = new Date();
      await (UserAchievement as any).bulkWrite(toUnlock.map((achId: string) => ({
        updateOne: {
          filter: { userId: req.user._id, achievementId: achId },
          update: { $setOnInsert: { userId: req.user._id, achievementId: achId, earnedAt: now } },
          upsert: true,
        },
      })));
      toUnlock.forEach((id: string) => { earnedMap[id] = new Date(); });
    }

    const achievements = allAchievements.map((ach: any) => ({
      _id: ach._id, title: ach.title, description: ach.description, badge: ach.badge,
      triggerType: ach.triggerType, requirement: ach.requirement, posterTheme: ach.posterTheme,
      order: ach.order, earned: !!earnedMap[ach._id.toString()], earnedAt: earnedMap[ach._id.toString()] || null,
    }));

    res.json({ success: true, achievements, user: { name: user?.name, avatar: user?.avatar, totalEarnings: user?.totalEarnings, orderCount } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/sales/earnings ───────────────────────────────────────────────────
router.get('/earnings', ...salesGuard, async (req: any, res) => {
  try {
    const { period = '30', from, to } = req.query as any;
    let startDate: Date, endDate = new Date();
    if (period === 'custom' && from && to) {
      startDate = new Date(from); endDate = new Date(to); endDate.setHours(23, 59, 59, 999);
    } else if (period === 'today') {
      startDate = new Date(); startDate.setHours(0, 0, 0, 0);
    } else if (period === '7') {
      startDate = new Date(Date.now() - 7 * 86400000);
    } else {
      startDate = new Date(Date.now() - 30 * 86400000);
    }

    const commissions = await Commission.find({ earner: req.user._id, createdAt: { $gte: startDate, $lte: endDate } })
      .populate('buyer', 'name').sort({ createdAt: -1 }).lean() as any[];

    const totalEarnings = commissions.reduce((s, c) => s + (c.commissionAmount || 0), 0);
    const byPackage: Record<string, number> = {};
    commissions.forEach((c: any) => {
      const key = c.buyerPackageTier || c.saleType || 'Other';
      byPackage[key] = (byPackage[key] || 0) + (c.commissionAmount || 0);
    });

    const recentCommissions = commissions.slice(0, 20).map((c: any) => ({
      _id: c._id,
      amount: c.commissionAmount,
      type: c.saleType,
      packageTier: c.buyerPackageTier,
      customerName: (c.buyer as any)?.name || 'Customer',
      createdAt: c.createdAt,
      status: c.status || 'approved',
    }));

    // Monthly breakdown (last 6 months)
    const monthly: { month: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const mTotal = commissions
        .filter((c: any) => new Date(c.createdAt) >= mStart && new Date(c.createdAt) <= mEnd)
        .reduce((s, c) => s + (c.amount || 0), 0);
      monthly.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), total: mTotal });
    }

    const user = await User.findById(req.user._id).select('wallet totalEarnings').lean() as any;
    res.json({ success: true, totalEarnings, byPackage, recentCommissions, monthly, wallet: user?.wallet || 0, allTimeEarnings: user?.totalEarnings || 0 });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
