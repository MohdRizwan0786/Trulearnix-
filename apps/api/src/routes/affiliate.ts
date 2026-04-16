import { Router } from 'express';
import User, { COMMISSION_RATES, PACKAGE_PRICES, PackageTier } from '../models/User';
import Commission from '../models/Commission';
import Transaction from '../models/Transaction';
import Withdrawal from '../models/Withdrawal';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// GET /api/affiliate/stats — full dashboard stats
router.get('/stats', protect, async (req: any, res) => {
  try {
    if (!req.user.isAffiliate) {
      return res.status(403).json({ success: false, message: 'Affiliate panel locked. Purchase a package to unlock.' });
    }

    const user = await User.findById(req.user._id).select('affiliateCode wallet totalEarnings totalWithdrawn packageTier commissionRate isAffiliate');

    // Direct referrals (Level 1)
    const [l1Count, l2Count, l3Count] = await Promise.all([
      User.countDocuments({ upline1: req.user._id }),
      User.countDocuments({ upline2: req.user._id }),
      User.countDocuments({ upline3: req.user._id }),
    ]);

    // Commission breakdown
    const commissions = await Commission.aggregate([
      { $match: { earner: req.user._id } },
      { $group: { _id: '$level', total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
    ]);

    const thisMonth = new Date();
    thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const monthlyEarnings = await Commission.aggregate([
      { $match: { earner: req.user._id, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);

    // Predictive: if user upgrades to next tier, how much more could they earn?
    const tierOrder: PackageTier[] = ['starter', 'pro', 'elite', 'supreme'];
    const currentTierIdx = tierOrder.indexOf(user!.packageTier as PackageTier);
    const nextTier = tierOrder[currentTierIdx + 1];
    let upgradeSimulation = null;
    if (nextTier && l1Count > 0) {
      const avgSale = user!.totalEarnings / Math.max(l1Count, 1);
      const currentRate = COMMISSION_RATES[user!.packageTier as PackageTier];
      const nextRate = COMMISSION_RATES[nextTier];
      upgradeSimulation = {
        nextTier,
        nextTierPrice: PACKAGE_PRICES[nextTier],
        currentMonthlyEst: Math.round(avgSale * 4),
        upgradeMonthlyEst: Math.round((avgSale / currentRate) * nextRate * 4),
      };
    }

    res.json({
      success: true,
      affiliateCode: user?.affiliateCode,
      referralLink: `${process.env.WEB_URL}?ref=${user?.affiliateCode}`,
      packageTier: user?.packageTier,
      commissionRate: user?.commissionRate,
      wallet: user?.wallet || 0,
      totalEarnings: user?.totalEarnings || 0,
      totalWithdrawn: user?.totalWithdrawn || 0,
      referrals: { l1: l1Count, l2: l2Count, l3: l3Count, total: l1Count + l2Count + l3Count },
      commissions,
      monthlyEarnings: monthlyEarnings[0]?.total || 0,
      upgradeSimulation,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/affiliate/referrals — downline tree
router.get('/referrals', protect, async (req: any, res) => {
  try {
    if (!req.user.isAffiliate) return res.status(403).json({ success: false, message: 'Affiliate panel locked' });

    const [l1, l2, l3] = await Promise.all([
      User.find({ upline1: req.user._id }).select('name email packageTier isAffiliate createdAt wallet').sort('-createdAt'),
      User.find({ upline2: req.user._id }).select('name email packageTier isAffiliate createdAt').sort('-createdAt'),
      User.find({ upline3: req.user._id }).select('name email packageTier isAffiliate createdAt').sort('-createdAt'),
    ]);
    res.json({ success: true, l1, l2, l3 });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/affiliate/commissions — commission history
router.get('/commissions', protect, async (req: any, res) => {
  try {
    if (!req.user.isAffiliate) return res.status(403).json({ success: false, message: 'Affiliate panel locked' });
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [commissions, total] = await Promise.all([
      Commission.find({ earner: req.user._id }).populate('buyer', 'name').sort('-createdAt').skip(skip).limit(Number(limit)),
      Commission.countDocuments({ earner: req.user._id }),
    ]);
    res.json({ success: true, commissions, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/affiliate/withdraw — request withdrawal
router.post('/withdraw', protect, async (req: any, res) => {
  try {
    if (!req.user.isAffiliate) return res.status(403).json({ success: false, message: 'Affiliate panel locked' });
    const { amount, method, upiId, accountNumber, ifscCode, accountName } = req.body;

    const user = await User.findById(req.user._id).select('wallet');
    if (!user || user.wallet < amount) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    if (amount < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal is ₹500' });

    // Deduct wallet
    await User.findByIdAndUpdate(req.user._id, { $inc: { wallet: -amount, totalWithdrawn: amount } });

    const withdrawal = await Withdrawal.create({ user: req.user._id, amount, method, upiId, accountNumber, ifscCode, accountName });

    await Transaction.create({
      user: req.user._id,
      type: 'debit',
      category: 'withdrawal',
      amount,
      description: `Withdrawal request via ${method}`,
      referenceId: withdrawal._id.toString(),
      status: 'pending',
      balanceAfter: (user.wallet || 0) - amount,
    });

    res.json({ success: true, message: 'Withdrawal requested. Will be processed within 24-48 hours.', withdrawal });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/affiliate/withdrawals — withdrawal history
router.get('/withdrawals', protect, async (req: any, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort('-createdAt').limit(20);
    res.json({ success: true, withdrawals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/affiliate/leaderboard — public leaderboard
router.get('/leaderboard', async (_req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [top, monthlyAgg, refCounts] = await Promise.all([
      // Include both affiliate users AND industrial partners
      User.find({
        $or: [{ isAffiliate: true }, { isIndustrialPartner: true }],
        isActive: true,
      })
        .select('name packageTier totalEarnings industrialEarning isIndustrialPartner industrialEarningSource streak xpPoints level')
        .limit(200),

      Commission.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: '$earner', monthlyEarnings: { $sum: '$commissionAmount' } } },
      ]),

      User.aggregate([
        { $match: { upline1: { $exists: true } } },
        { $group: { _id: '$upline1', count: { $sum: 1 } } },
      ]),
    ]);

    // Monthly earnings map
    const monthlyMap: Record<string, number> = {};
    monthlyAgg.forEach((m: any) => { monthlyMap[m._id.toString()] = m.monthlyEarnings; });

    // Referral counts map
    const refMap: Record<string, number> = {};
    refCounts.forEach((r: any) => { refMap[r._id.toString()] = r.count; });

    // Sort by combined earnings (affiliate + industrial) descending
    const sorted = top.sort((a: any, b: any) => {
      const aTotal = (a.totalEarnings || 0) + (a.industrialEarning || 0);
      const bTotal = (b.totalEarnings || 0) + (b.industrialEarning || 0);
      return bTotal - aTotal;
    }).slice(0, 50);

    const leaderboard = sorted.map((u: any, i: number) => {
      const id = u._id.toString();
      const nameParts = u.name.trim().split(' ');
      const maskedName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : nameParts[0];

      const tier = ['elite', 'supreme'].includes(u.packageTier) ? 'Elite'
        : u.packageTier === 'pro' ? 'Pro' : 'Starter';

      const combinedEarnings = (u.totalEarnings || 0) + (u.industrialEarning || 0);

      return {
        rank: i + 1,
        name: maskedName,
        packageTier: u.packageTier,
        tier,
        totalEarnings: combinedEarnings,
        affiliateEarnings: u.totalEarnings || 0,
        industrialEarning: u.industrialEarning || 0,
        isIndustrialPartner: u.isIndustrialPartner || false,
        industrialEarningSource: u.industrialEarningSource || '',
        monthlyEarnings: monthlyMap[id] || 0,
        streak: u.streak || 0,
        xpPoints: u.xpPoints || 0,
        level: u.level || 1,
        invites: refMap[id] || 0,
      };
    });

    res.json({ success: true, leaderboard });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin: GET /api/affiliate/all-withdrawals
router.get('/all-withdrawals', protect, authorize('superadmin', 'admin'), async (_req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('user', 'name email phone').sort('-createdAt').limit(100);
    res.json({ success: true, withdrawals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin: PATCH /api/affiliate/withdrawals/:id
router.patch('/withdrawals/:id', protect, authorize('superadmin', 'admin'), async (req: any, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, {
      status, rejectionReason, processedBy: req.user._id, processedAt: new Date()
    }, { new: true });
    res.json({ success: true, withdrawal });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
