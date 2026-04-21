import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import User from '../models/User';
import PartnerTip from '../models/PartnerTip';
import PartnerGoal from '../models/PartnerGoal';
import Commission from '../models/Commission';
import EmiInstallment from '../models/EmiInstallment';
import Withdrawal from '../models/Withdrawal';

const router = Router();
const guard = [protect, authorize('manager', 'admin', 'superadmin')];

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', ...guard, async (req: any, res) => {
  try {
    const managerId = req.user._id;
    const partners = await User.find({ managerId }).select('_id totalEarnings wallet packageTier isAffiliate affiliateCode');

    const totalPartners    = partners.length;
    const activePartners   = partners.filter(p => (p as any).packageTier !== 'free').length;
    const totalEarnings    = partners.reduce((s, p) => s + ((p as any).totalEarnings || 0), 0);

    // Referrals made by assigned partners this month
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const partnerIds = partners.map(p => p._id);
    const monthlyReferrals = await User.countDocuments({
      referredBy: { $in: partnerIds },
      createdAt: { $gte: startOfMonth },
    });

    const [totalGoals, completedGoals, unreadTips, managerUser, myMonthlyCommissions] = await Promise.all([
      PartnerGoal.countDocuments({ manager: managerId, status: 'active' }),
      PartnerGoal.countDocuments({ manager: managerId, status: 'completed' }),
      PartnerTip.countDocuments({ manager: managerId, isRead: false }),
      User.findById(managerId).select('totalEarnings wallet'),
      Commission.aggregate([
        { $match: { earner: managerId, createdAt: { $gte: startOfMonth }, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
    ]);
    const myEarnings = (managerUser as any)?.totalEarnings || 0;
    const myWallet   = (managerUser as any)?.wallet || 0;
    const myMonthlyEarnings = myMonthlyCommissions[0]?.total || 0;

    res.json({ success: true, stats: {
      totalPartners, activePartners, totalEarnings, monthlyReferrals,
      totalGoals, completedGoals, unreadTips,
      myEarnings, myWallet, myMonthlyEarnings,
    }});
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── List assigned partners ────────────────────────────────────────────────────
router.get('/partners', ...guard, async (req: any, res) => {
  try {
    const { search, tier, page = 1, limit = 20 } = req.query as any;
    const filter: any = { managerId: req.user._id };
    if (tier) filter.packageTier = tier;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { affiliateCode: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [partners, total] = await Promise.all([
      User.find(filter)
        .select('name email phone avatar packageTier affiliateCode totalEarnings wallet commissionRate isActive createdAt packagePurchasedAt kyc referredBy upline1')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(filter),
    ]);

    const partnerIds = partners.map(p => p._id);
    const [refCounts, goalCounts] = await Promise.all([
      User.aggregate([
        { $match: { referredBy: { $in: partnerIds } } },
        { $group: { _id: '$referredBy', l1Count: { $sum: 1 } } },
      ]),
      PartnerGoal.aggregate([
        { $match: { partner: { $in: partnerIds }, manager: req.user._id } },
        { $group: { _id: '$partner', goalsCount: { $sum: 1 }, activeGoals: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
      ]),
    ]);
    const refMap  = new Map(refCounts.map((r: any) => [r._id.toString(), r.l1Count]));
    const goalMap = new Map(goalCounts.map((g: any) => [g._id.toString(), g]));
    const enriched = partners.map((p: any) => {
      const gd = goalMap.get(p._id.toString()) || {};
      return { ...p.toObject(), l1Count: refMap.get(p._id.toString()) || 0, goalsCount: (gd as any).goalsCount || 0, activeGoals: (gd as any).activeGoals || 0 };
    });

    res.json({ success: true, partners: enriched, total, pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Partner detail ────────────────────────────────────────────────────────────
router.get('/partners/:id', ...guard, async (req: any, res) => {
  try {
    const partner = await User.findOne({ _id: req.params.id, managerId: req.user._id })
      .select('-password -otp -otpExpiry');
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found or not assigned to you' });

    // L1 referrals
    const l1 = await User.find({ referredBy: partner._id })
      .select('name email packageTier totalEarnings createdAt packagePurchasedAt affiliateCode')
      .sort('-createdAt').limit(20);

    const l1Total = await User.countDocuments({ referredBy: partner._id });
    const l1Paid  = await User.countDocuments({ referredBy: partner._id, packageTier: { $ne: 'free' } });

    // Recent commissions
    const commissions = await Commission.find({ affiliate: partner._id })
      .sort('-createdAt').limit(10)
      .populate('buyer', 'name email');

    // Tips from this manager
    const tips = await PartnerTip.find({ partner: partner._id, manager: req.user._id })
      .sort('-createdAt').limit(20);

    // Goals
    const goals = await PartnerGoal.find({ partner: partner._id, manager: req.user._id })
      .sort('-createdAt');

    res.json({ success: true, partner, l1, l1Total, l1Paid, commissions, tips, goals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Send tip/message to partner ───────────────────────────────────────────────
router.post('/partners/:id/tips', ...guard, async (req: any, res) => {
  try {
    const { message, category = 'tip' } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });

    // Verify partner is assigned to this manager
    const partner = await User.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!partner) return res.status(403).json({ success: false, message: 'Not your assigned partner' });

    const tip = await PartnerTip.create({ manager: req.user._id, partner: req.params.id, message, category });
    res.status(201).json({ success: true, tip });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Delete tip ────────────────────────────────────────────────────────────────
router.delete('/tips/:tipId', ...guard, async (req: any, res) => {
  try {
    await PartnerTip.findOneAndDelete({ _id: req.params.tipId, manager: req.user._id });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Create goal for partner ───────────────────────────────────────────────────
router.post('/partners/:id/goals', ...guard, async (req: any, res) => {
  try {
    const { title, description, targetValue, metric, unit, dueDate, reward } = req.body;
    if (!title || !targetValue) return res.status(400).json({ success: false, message: 'Title and target required' });

    const partner = await User.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!partner) return res.status(403).json({ success: false, message: 'Not your assigned partner' });

    // Auto-set currentValue based on metric
    let currentValue = 0;
    if (metric === 'referrals') {
      currentValue = await User.countDocuments({ referredBy: req.params.id });
    } else if (metric === 'earnings') {
      currentValue = (partner as any).totalEarnings || 0;
    }

    const goal = await PartnerGoal.create({
      manager: req.user._id, partner: req.params.id,
      title, description, targetValue: Number(targetValue), currentValue,
      metric: metric || 'referrals', unit: unit || 'referrals',
      dueDate, reward, status: 'active',
    });
    res.status(201).json({ success: true, goal });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Update goal (progress or status) ─────────────────────────────────────────
router.patch('/goals/:goalId', ...guard, async (req: any, res) => {
  try {
    const goal = await PartnerGoal.findOneAndUpdate(
      { _id: req.params.goalId, manager: req.user._id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, goal });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Delete goal ───────────────────────────────────────────────────────────────
router.delete('/goals/:goalId', ...guard, async (req: any, res) => {
  try {
    await PartnerGoal.findOneAndDelete({ _id: req.params.goalId, manager: req.user._id });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Leaderboard of my partners ────────────────────────────────────────────────
router.get('/leaderboard', ...guard, async (req: any, res) => {
  try {
    const partners = await User.find({ managerId: req.user._id })
      .select('name avatar affiliateCode packageTier totalEarnings wallet commissionRate')
      .sort('-totalEarnings').limit(20);

    const lbIds = partners.map(p => p._id);
    const lbRefCounts = await User.aggregate([
      { $match: { referredBy: { $in: lbIds } } },
      { $group: { _id: '$referredBy', l1Count: { $sum: 1 }, l1Paid: { $sum: { $cond: [{ $ne: ['$packageTier', 'free'] }, 1, 0] } } } },
    ]);
    const lbMap = new Map(lbRefCounts.map((r: any) => [r._id.toString(), r]));
    const enriched = partners.map(p => {
      const rc = lbMap.get(p._id.toString()) || {};
      return { ...p.toObject(), l1Count: (rc as any).l1Count || 0, l1Paid: (rc as any).l1Paid || 0 };
    });

    res.json({ success: true, leaderboard: enriched });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Partner tips visible to partner (partner reads own tips) ──────────────────
router.get('/my-tips', protect, async (req: any, res) => {
  try {
    const tips = await PartnerTip.find({ partner: req.user._id })
      .populate('manager', 'name avatar phone')
      .sort('-createdAt').limit(50);
    await PartnerTip.updateMany({ partner: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, tips });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Partner goals visible to partner ─────────────────────────────────────────
router.get('/my-goals', protect, async (req: any, res) => {
  try {
    const goals = await PartnerGoal.find({ partner: req.user._id })
      .populate('manager', 'name avatar phone')
      .sort('-createdAt');
    res.json({ success: true, goals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── My EMI Commissions (from partner's EMI sales) ────────────────────────────
router.get('/emi-commissions', ...guard, async (req: any, res) => {
  try {
    const managerId = req.user._id;
    const installments = await EmiInstallment.find({ managerUser: managerId })
      .populate({ path: 'packagePurchase', populate: { path: 'package', select: 'name tier' } })
      .populate('partnerUser', 'name affiliateCode')
      .sort('-createdAt');

    const enriched = installments.map((inst: any) => ({
      _id: inst._id,
      installmentNumber: inst.installmentNumber,
      totalInstallments: inst.totalInstallments,
      amount: inst.amount,
      dueDate: inst.dueDate,
      paidAt: inst.paidAt,
      status: inst.status,
      commissionAmount: inst.managerCommissionAmount,
      commissionPaid: inst.managerCommissionPaid,
      packageName: inst.packagePurchase?.package?.name || '',
      packageTier: inst.packagePurchase?.package?.tier || '',
      partnerName: inst.partnerUser?.name || '',
      partnerCode: inst.partnerUser?.affiliateCode || '',
      customerUserId: inst.user,
    }));

    const totalCommission = enriched.reduce((s, i) => s + (i.commissionAmount || 0), 0);
    const earnedCommission = enriched.filter(i => i.commissionPaid).reduce((s, i) => s + (i.commissionAmount || 0), 0);
    const pendingCommission = enriched.filter(i => !i.commissionPaid && i.status !== 'paid').reduce((s, i) => s + (i.commissionAmount || 0), 0);

    res.json({ success: true, installments: enriched, totalCommission, earnedCommission, pendingCommission });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /manager/withdrawals — manager's own withdrawal history ───────────────
router.get('/withdrawals', ...guard, async (req: any, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id })
      .sort('-createdAt').lean();
    const manager = await User.findById(req.user._id).select('wallet totalWithdrawn kyc');
    res.json({ success: true, withdrawals, wallet: (manager as any)?.wallet || 0, totalWithdrawn: (manager as any)?.totalWithdrawn || 0 });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /manager/withdraw — manager requests withdrawal ─────────────────────
router.post('/withdraw', ...guard, async (req: any, res) => {
  try {
    const mgr = await User.findById(req.user._id).select('kyc wallet totalWithdrawn name');
    if (!mgr) return res.status(404).json({ success: false, message: 'User not found' });
    if ((mgr as any).kyc?.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'KYC verification required before withdrawal. Please complete and get your KYC approved.' });
    }

    const { amount } = req.body;
    const amt = Number(amount);
    if (!amt || amt < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500' });
    if (amt > ((mgr as any).wallet || 0)) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });

    const existing = await Withdrawal.findOne({ user: req.user._id, hrStatus: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request. Please wait for it to be processed.' });

    const tdsRate = 2;
    const tdsAmount = Math.round(amt * tdsRate / 100);
    const gatewayFee = 4.40;
    const gatewayFeeGst = Math.round(gatewayFee * 0.18 * 100) / 100;
    const totalGatewayFee = Math.round((gatewayFee + gatewayFeeGst) * 100) / 100;
    const netAmount = amt - tdsAmount - totalGatewayFee;

    await User.findByIdAndUpdate(req.user._id, { $inc: { wallet: -amt, totalWithdrawn: amt } });

    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount: amt,
      method: 'bank',
      accountName: (mgr as any).kyc?.bankHolderName,
      accountNumber: (mgr as any).kyc?.bankAccount,
      ifscCode: (mgr as any).kyc?.bankIfsc,
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

export default router;
