import { Router } from 'express';
import User, { COMMISSION_RATES, PACKAGE_PRICES, PackageTier } from '../models/User';
import Commission from '../models/Commission';
import Transaction from '../models/Transaction';
import Lead from '../models/Lead';
import Package from '../models/Package';
import Course from '../models/Course';
import PlatformSettings from '../models/PlatformSettings';
import Withdrawal from '../models/Withdrawal';
import { protect } from '../middleware/auth';
import { resolvePeriod, periodMatch as buildPeriodMatch } from '../utils/dateRange';

const router = Router();

// Guard: must be affiliate OR manager/salesperson (they earn commissions too)
const affiliateGuard = async (req: any, res: any, next: any) => {
  const isManagerOrSales = ['manager', 'salesperson'].includes(req.user.role);
  if (!req.user.isAffiliate && !isManagerOrSales) {
    return res.status(403).json({ success: false, message: 'Partner panel locked. Purchase a package to unlock.', locked: true });
  }
  next();
};

// ── GET /api/partner/dashboard ────────────────────────────────────────────────
router.get('/dashboard', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { period, from, to } = req.query as any;

    // Build period date filter for stats — IST-anchored
    const now = new Date();
    const range = resolvePeriod(period, from, to);
    const periodStart = range.start;
    const periodEnd = range.end;

    const user = await User.findById(req.user._id)
      .select('name avatar affiliateCode wallet totalEarnings totalWithdrawn packageTier commissionRate isAffiliate createdAt upline1 kyc managerName managerPhone managerId industrialEarning industrialEarningSource isIndustrialPartner')
      .populate('upline1', 'name email packageTier')
      .populate('managerId', 'name email phone');

    // Load the user's own package to get their package _id for matrix lookup
    const userPkg = user?.packageTier
      ? await Package.findOne({ $or: [{ tier: new RegExp(`^${user.packageTier}$`, 'i') }, { name: user.packageTier }], isActive: true })
          .select('_id commissionRate commissionRateType commissionLevel2 commissionLevel2Type commissionLevel3 commissionLevel3Type')
      : null;

    // Load ALL active packages with their partnerEarnings matrix to build per-package commission table
    const allPackages = await Package.find({ isActive: true })
      .select('_id name tier price partnerEarnings commissionRate commissionRateType commissionLevel2 commissionLevel2Type commissionLevel3 commissionLevel3Type')
      .sort({ price: 1 });

    const [l1, l2, l3] = await Promise.all([
      User.countDocuments({ upline1: req.user._id }),
      User.countDocuments({ upline2: req.user._id }),
      User.countDocuments({ upline3: req.user._id }),
    ]);

    // IST-anchored "this month" and "last 7 days" boundaries
    const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const monthStartUTC = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1));
    const monthStart = new Date(monthStartUTC.getTime() - IST_OFFSET_MS);
    const istToday = new Date(istNow); istToday.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date(istToday.getTime() - IST_OFFSET_MS - 7 * 24 * 60 * 60 * 1000);

    // Period-specific date range for filtered stats
    const periodMatch: any = { earner: req.user._id };
    if (periodStart) periodMatch.createdAt = { $gte: periodStart, ...(periodEnd ? { $lte: periodEnd } : {}) };

    const [monthlyEarnings, weeklyEarnings, totalCommissions, pendingCommissions, periodEarnings] = await Promise.all([
      Commission.aggregate([{ $match: { earner: req.user._id, createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
      Commission.aggregate([{ $match: { earner: req.user._id, createdAt: { $gte: weekStart } } }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
      Commission.countDocuments({ earner: req.user._id }),
      Commission.countDocuments({ earner: req.user._id, status: 'pending' }),
      periodStart
        ? Commission.aggregate([{ $match: periodMatch }, { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }])
        : Promise.resolve(null),
    ]);

    // Rank
    const rank = await User.countDocuments({ isAffiliate: true, totalEarnings: { $gt: user?.totalEarnings || 0 } });

    // Last 6 months trend
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trend = await Commission.aggregate([
      { $match: { earner: req.user._id, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Build per-package commission for this partner's tier using partnerEarnings matrix
    const packageCommissions = allPackages.map((pkg: any) => {
      const matrixEntry = pkg.partnerEarnings?.find(
        (r: any) => userPkg && (
          r.earnerTier?.toString() === userPkg._id?.toString() ||
          r.earnerTier?.toLowerCase() === user?.packageTier?.toLowerCase()
        )
      );
      const hasMatrix = matrixEntry && (matrixEntry.value > 0);
      let commission = 0;
      if (hasMatrix) {
        commission = matrixEntry.type === 'percentage'
          ? Math.round((pkg.price || 0) * matrixEntry.value / 100)
          : Math.round(matrixEntry.value);
      } else {
        // fallback to package-level L1 commission
        commission = pkg.commissionRateType === 'flat'
          ? Math.round(pkg.commissionRate || 0)
          : Math.round((pkg.price || 0) * Math.min(pkg.commissionRate || 0, 100) / 100);
      }

      // L2 & L3 earn amounts — use matrix if available, fallback to legacy fields
      const hasMatrixL2 = matrixEntry && (matrixEntry.l2Value > 0);
      const l2Earn = hasMatrixL2
        ? (matrixEntry.l2Type === 'flat'
          ? Math.round(matrixEntry.l2Value)
          : Math.round((pkg.price || 0) * matrixEntry.l2Value / 100))
        : (pkg.commissionLevel2Type === 'flat'
          ? Math.round(pkg.commissionLevel2 || 0)
          : Math.round((pkg.price || 0) * (pkg.commissionLevel2 || 0) / 100));

      const hasMatrixL3 = matrixEntry && (matrixEntry.l3Value > 0);
      const l3Earn = hasMatrixL3
        ? (matrixEntry.l3Type === 'flat'
          ? Math.round(matrixEntry.l3Value)
          : Math.round((pkg.price || 0) * matrixEntry.l3Value / 100))
        : (pkg.commissionLevel3Type === 'flat'
          ? Math.round(pkg.commissionLevel3 || 0)
          : Math.round((pkg.price || 0) * (pkg.commissionLevel3 || 0) / 100));

      return {
        packageId: pkg._id,
        name: pkg.name,
        tier: pkg.tier,
        price: pkg.price,
        l1Earn: commission,
        l2Earn,
        l3Earn,
      };
    });

    const commissionRates = { l1Rate: 0, l1Type: 'flat' };

    res.json({
      success: true,
      user: { name: user?.name, avatar: user?.avatar, affiliateCode: user?.affiliateCode, packageTier: user?.packageTier, commissionRate: user?.commissionRate, createdAt: user?.createdAt, kyc: user?.kyc },
      commissionRates,
      packageCommissions,
      referralLink: `${process.env.WEB_URL || 'https://trulearnix.com'}?ref=${user?.affiliateCode}`,
      sponsor: user?.upline1,
      manager: (user as any)?.managerId || (user?.managerName ? { name: user.managerName, phone: user.managerPhone } : null),
      stats: {
        wallet: user?.wallet || 0, totalEarnings: user?.totalEarnings || 0,
        totalWithdrawn: user?.totalWithdrawn || 0,
        industrialEarning: (user as any)?.industrialEarning || 0,
        industrialEarningSource: (user as any)?.industrialEarningSource || '',
        isIndustrialPartner: (user as any)?.isIndustrialPartner || false,
        monthly: monthlyEarnings[0]?.total || 0,
        monthEarnings: monthlyEarnings[0]?.total || 0,
        weekly: weeklyEarnings[0]?.total || 0,
        rank: rank + 1, totalCommissions, pendingCommissions,
        referrals: { l1, l2, l3, total: l1 + l2 + l3 },
        l1Count: l1, l2Count: l2, l3Count: l3, totalReferrals: l1 + l2 + l3,
        periodEarnings: periodEarnings ? (periodEarnings[0]?.total || 0) : null,
        periodCount: periodEarnings ? (periodEarnings[0]?.count || 0) : null,
        activePeriod: period || null,
      },
      trend,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/earnings ─────────────────────────────────────────────────
router.get('/earnings', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { period, from, to } = req.query as any;

    // Build date filter — IST-anchored. 'all' / unknown returns no constraint.
    const range = resolvePeriod(period, from, to);
    const dateFilter = buildPeriodMatch(range);

    const baseMatch = { earner: req.user._id, ...dateFilter };

    const [byLevel, byTier, recent, monthly] = await Promise.all([
      Commission.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$level', total: { $sum: '$commissionAmount' }, count: { $sum: 1 }, avgSale: { $avg: '$saleAmount' } } },
        { $sort: { _id: 1 } }
      ]),
      Commission.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$buyerPackageTier', total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Commission.find(baseMatch)
        .populate('buyer', 'name packageTier')
        .sort('-createdAt').limit(20)
        .select('commissionAmount saleAmount level buyerPackageTier createdAt status'),
      Commission.aggregate([
        { $match: baseMatch },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]),
    ]);

    // Best selling tier
    const bestTier = byTier[0]?._id || 'N/A';
    // Avg per referral
    const user = await User.findById(req.user._id).select('totalEarnings');
    const l1Count = await User.countDocuments({ upline1: req.user._id });
    const avgPerReferral = l1Count > 0 ? Math.round((user?.totalEarnings || 0) / l1Count) : 0;

    // Convert byLevel array to {l1, l2, l3} object expected by frontend
    const byLevelObj = {
      l1: byLevel.find((r: any) => r._id === 1)?.total || 0,
      l2: byLevel.find((r: any) => r._id === 2)?.total || 0,
      l3: byLevel.find((r: any) => r._id === 3)?.total || 0,
    };

    // Convert byTier array to {tier: amount} object, normalizing tier name variants to slug.
    // Fetch tiers from Package collection so admin-added tiers work automatically.
    // Sort by length desc so longer tiers (e.g. 'proedge') are matched before shorter substrings ('pro').
    const allTiers = (await Package.distinct('tier', { isActive: true })).filter(Boolean) as string[];
    const TIER_SLUGS = allTiers.map(t => t.toLowerCase()).sort((a, b) => b.length - a.length);
    const normalizeTierKey = (val: string) => {
      if (!val) return val;
      const lower = val.toLowerCase();
      if (TIER_SLUGS.includes(lower)) return lower;
      return TIER_SLUGS.find(s => lower.includes(s)) || val;
    };
    const byTierObj: Record<string, number> = {};
    byTier.forEach((r: any) => {
      if (!r._id) return;
      const key = normalizeTierKey(r._id);
      byTierObj[key] = (byTierObj[key] || 0) + (r.total || 0);
    });

    // Format recent commissions for frontend
    const recentFormatted = recent.map((c: any) => ({
      _id: c._id,
      amount: c.commissionAmount,
      level: c.level,
      from: c.buyer,
      createdAt: c.createdAt,
      status: c.status,
    }));

    // Format monthly for frontend
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyFormatted = monthly.reverse().map((m: any) => ({
      month: `${monthNames[(m._id.month || 1) - 1]} ${m._id.year}`,
      total: m.total || 0,
      count: m.count || 0,
    }));

    res.json({ success: true, byLevel: byLevelObj, byTier: byTierObj, recent: recentFormatted, monthly: monthlyFormatted, bestTier, avgPerReferral });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/leaderboard ──────────────────────────────────────────────
router.get('/leaderboard', protect, affiliateGuard, async (req: any, res) => {
  try {
    const period = (req.query.period as string) || 'all';

    // Compute start date based on period
    let startDate: Date | null = null;
    const now = new Date();
    if (period === '24h') {
      // reset to midnight today IST (UTC+5:30) = UTC 00:00 - 05:30 = prev day 18:30 UTC
      const midnight = new Date(now);
      midnight.setUTCHours(18, 30, 0, 0);
      if (midnight > now) midnight.setUTCDate(midnight.getUTCDate() - 1);
      startDate = midnight;
    } else if (period === 'week') {
      // start of current Mon
      const d = new Date(now);
      const day = d.getDay(); // 0=Sun
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      d.setHours(0, 0, 0, 0);
      startDate = d;
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), q * 3, 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    let leaderboard: any[];
    let myEarnings: number;
    let myRankPos: number;

    if (!startDate) {
      // All-time: include industrial earnings in display total
      const top = await User.find({
        isAffiliate: true,
        role: { $nin: ['admin', 'superadmin', 'manager', 'mentor', 'salesperson'] },
        $or: [{ totalEarnings: { $gt: 0 } }, { industrialEarning: { $gt: 0 } }]
      })
        .select('name avatar packageTier totalEarnings commissionRate totalReferrals createdAt industrialEarning isIndustrialPartner')
        .limit(200).lean();
      // Sort by combined (real + industrial) and take top 50
      const sorted = top
        .map((u: any) => ({ ...u, periodEarnings: (u.totalEarnings || 0) + (u.industrialEarning || 0) }))
        .sort((a: any, b: any) => b.periodEarnings - a.periodEarnings)
        .slice(0, 50);
      leaderboard = sorted;
      myEarnings = (req.user.totalEarnings || 0) + ((req.user as any).industrialEarning || 0);
      myRankPos = leaderboard.findIndex((u: any) => String(u._id) === String(req.user._id)) + 1;
      if (myRankPos === 0) myRankPos = leaderboard.length + 1;
    } else {
      // Period-based: aggregate Commission records
      const agg = await Commission.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $in: ['paid', 'pending', 'approved'] } } },
        { $group: { _id: '$earner', periodEarnings: { $sum: '$commissionAmount' } } },
        { $sort: { periodEarnings: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
            pipeline: [{ $match: { isAffiliate: true, role: { $nin: ['admin', 'superadmin', 'manager', 'mentor', 'salesperson'] } } }, { $project: { name: 1, avatar: 1, packageTier: 1, commissionRate: 1, totalReferrals: 1, industrialEarning: 1, isIndustrialPartner: 1 } }]
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
        {
          $project: {
            _id: '$user._id',
            name: '$user.name',
            avatar: '$user.avatar',
            packageTier: '$user.packageTier',
            commissionRate: '$user.commissionRate',
            totalReferrals: '$user.totalReferrals',
            industrialEarning: '$user.industrialEarning',
            isIndustrialPartner: '$user.isIndustrialPartner',
            periodEarnings: 1,
          }
        }
      ]);
      leaderboard = agg;

      // My earnings in period
      const myAgg = await Commission.aggregate([
        { $match: { earner: req.user._id, createdAt: { $gte: startDate }, status: { $in: ['paid', 'pending', 'approved'] } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);
      myEarnings = myAgg[0]?.total || 0;
      myRankPos = leaderboard.findIndex((u: any) => String(u._id) === String(req.user._id)) + 1;
      if (myRankPos === 0) myRankPos = leaderboard.length + 1;
    }

    const myData = await User.findById(req.user._id).select('name avatar packageTier totalEarnings commissionRate totalReferrals industrialEarning isIndustrialPartner').lean();

    res.json({
      success: true,
      leaderboard,
      myRank: myRankPos,
      myPeriodEarnings: myEarnings,
      me: myData,
      period,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/m-type ───────────────────────────────────────────────────
router.get('/m-type', protect, affiliateGuard, async (req: any, res) => {
  try {
    const [l1, l2, l3] = await Promise.all([
      User.find({ upline1: req.user._id }).select('name avatar packageTier totalEarnings isAffiliate createdAt').sort('-totalEarnings').limit(20),
      User.find({ upline2: req.user._id }).select('name avatar packageTier totalEarnings isAffiliate createdAt upline1').sort('-createdAt').limit(20),
      User.find({ upline3: req.user._id }).select('name avatar packageTier isAffiliate createdAt').sort('-createdAt').limit(20),
    ]);

    const totalTeamEarnings = await Commission.aggregate([
      { $match: { earner: req.user._id } },
      { $group: { _id: '$level', total: { $sum: '$commissionAmount' } } }
    ]);

    const user = await User.findById(req.user._id).select('name avatar packageTier totalEarnings affiliateCode');

    res.json({ success: true, me: user, l1, l2, l3, teamEarnings: totalTeamEarnings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/referrals ────────────────────────────────────────────────
router.get('/referrals', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { level = '1', page = '1' } = req.query;
    const lv = parseInt(level as string) || 1;
    const pg = parseInt(page as string) || 1;
    const limit = 20;

    // L1: referred by this user (referredBy) OR has upline1 set
    // L2/L3: upline fields set during purchase
    let filter: any;
    if (lv === 1) {
      filter = { $or: [{ referredBy: req.user._id }, { upline1: req.user._id }] };
    } else if (lv === 2) {
      filter = { upline2: req.user._id };
    } else {
      filter = { upline3: req.user._id };
    }

    const PAID_TIERS = (await Package.distinct('tier', { isActive: true, tier: { $ne: 'free' } })).filter(Boolean) as string[];

    const [refs, total] = await Promise.all([
      User.find(filter)
        .select('name email phone avatar packageTier isAffiliate totalEarnings wallet createdAt lastLogin packagePurchasedAt referredBy upline1')
        .sort('-createdAt').skip((pg - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    // Stats — use packagePurchasedAt OR paid course purchase to detect paid members
    const Payment = (await import('../models/Payment')).default;
    const allRefs = await User.find(filter).select('packageTier packagePurchasedAt');
    const allRefIds = allRefs.map((r: any) => r._id);
    const coursePayers = await Payment.find({ user: { $in: allRefIds }, status: 'paid' }).distinct('user');
    const coursePayerSet = new Set(coursePayers.map((id: any) => id.toString()));
    const paidCount = allRefs.filter((r: any) => !!r.packagePurchasedAt || coursePayerSet.has(r._id.toString())).length;
    const freeCount = allRefs.length - paidCount;

    // Commission earned from L1 referrals
    const [totalEarningsAgg] = await Commission.aggregate([
      { $match: { earner: req.user._id, level: lv } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);
    const totalEarnings = totalEarningsAgg?.total || 0;

    // Per-referral contribution + EMI info + course purchase info
    let refsWithContrib: any[] = refs.map((r: any) => r.toObject());
    if (refs.length > 0) {
      const buyerIds = refs.map((r: any) => r._id);
      const [contribMap, emiMap, coursePaymentMap] = await Promise.all([
        Commission.aggregate([
          { $match: { earner: req.user._id, buyer: { $in: buyerIds } } },
          { $group: { _id: '$buyer', total: { $sum: '$commissionAmount' } } }
        ]),
        // Get EMI purchase info for each buyer
        (async () => {
          const PackagePurchase = (await import('../models/PackagePurchase')).default;
          const EmiInstallment = (await import('../models/EmiInstallment')).default;
          const emiPurchases = await PackagePurchase.find({ user: { $in: buyerIds }, isEmi: true, status: 'paid' }).select('user amount gstAmount');
          const emiUserIds = emiPurchases.map((p: any) => p._id);
          const paidCounts = await EmiInstallment.aggregate([
            { $match: { packagePurchase: { $in: emiUserIds }, status: 'paid' } },
            { $group: { _id: '$packagePurchase', paidCount: { $sum: 1 } } }
          ]);
          const paidByPurchase: Record<string, number> = {};
          paidCounts.forEach((p: any) => { paidByPurchase[p._id.toString()] = p.paidCount; });
          const result: Record<string, { isEmi: boolean; emiPaid: number; emiTotal: number; installmentAmount: number }> = {};
          emiPurchases.forEach((p: any) => {
            const totalAmt = p.amount + p.gstAmount;
            result[p.user.toString()] = {
              isEmi: true,
              emiPaid: paidByPurchase[p._id.toString()] || 1,
              emiTotal: 4,
              installmentAmount: Math.ceil(totalAmt / 4),
            };
          });
          return result;
        })(),
        // Get course purchases for each buyer
        Payment.aggregate([
          { $match: { user: { $in: buyerIds }, status: 'paid' } },
          { $group: { _id: '$user', totalAmount: { $sum: '$amount' }, count: { $sum: 1 }, firstPurchase: { $min: '$createdAt' } } }
        ]),
      ]);
      const contribById: Record<string, number> = {};
      contribMap.forEach((c: any) => { contribById[c._id.toString()] = c.total; });
      const coursePaymentById: Record<string, { coursePurchasedAt: Date; coursePurchaseCount: number; coursePurchaseTotal: number }> = {};
      coursePaymentMap.forEach((c: any) => {
        coursePaymentById[c._id.toString()] = { coursePurchasedAt: c.firstPurchase, coursePurchaseCount: c.count, coursePurchaseTotal: c.totalAmount };
      });
      refsWithContrib = refsWithContrib.map((r: any) => ({
        ...r,
        contribution: contribById[r._id.toString()] || 0,
        ...(emiMap[r._id.toString()] || {}),
        ...(coursePaymentById[r._id.toString()] || {}),
      }));
    }

    res.json({
      success: true,
      referrals: refsWithContrib,
      total,
      totalPages: Math.ceil(total / limit),
      page: pg,
      stats: { total: allRefs.length, paid: paidCount, free: freeCount, totalEarnings },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/crm ──────────────────────────────────────────────────────
router.get('/crm', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { stage, page = '1' } = req.query;
    const pg = parseInt(page as string) || 1;
    const filter: any = { assignedTo: req.user._id };
    if (stage) filter.stage = stage;

    const [leads, total, stageCounts] = await Promise.all([
      Lead.find(filter).sort('-createdAt').skip((pg - 1) * 20).limit(20),
      Lead.countDocuments(filter),
      Lead.aggregate([
        { $match: { assignedTo: req.user._id } },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]),
    ]);

    const counts: Record<string, number> = {};
    for (const s of stageCounts) counts[s._id] = s.count;

    res.json({ success: true, leads, total, pages: Math.ceil(total / 20), stageCounts: counts });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PATCH /api/partner/crm/lead/:id — update lead stage / notes ───────────────
router.patch('/crm/lead/:id', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { stage, note } = req.body;
    const lead = await Lead.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (stage) lead.stage = stage;
    if (note) lead.notes.push({ text: note, by: req.user._id, createdAt: new Date() });
    await lead.save();
    res.json({ success: true, lead });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/partner/crm/lead — capture lead via affiliate link
router.post('/crm/lead', async (req: any, res) => {
  try {
    const { name, email, phone, source, affiliateCode } = req.body;
    if (!email && !phone) return res.status(400).json({ success: false, message: 'Email or phone required' });

    const affiliate = affiliateCode ? await User.findOne({ affiliateCode }).select('_id') : null;

    const lead = await Lead.create({
      name: name || 'Unknown', email, phone, source: source || 'affiliate_link',
      status: 'new', assignedTo: affiliate?._id,
    });
    res.json({ success: true, lead });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/training ─────────────────────────────────────────────────
router.get('/training', protect, affiliateGuard, async (req: any, res) => {
  try {
    const PartnerTraining = (await import('../models/PartnerTraining')).default;
    const { PartnerTrainingProgress } = await import('../models/PartnerTraining');
    const Popup = (await import('../models/Popup')).default;

    const [modules, completed, webinars] = await Promise.all([
      PartnerTraining.find({ isPublished: true }).sort('order day').lean(),
      PartnerTrainingProgress.find({ user: req.user._id }).select('module').lean(),
      Popup.find({ type: 'event', isActive: true }).sort('-priority -createdAt').limit(10),
    ]);

    const completedIds = new Set(completed.map((c: any) => String(c.module)));
    const training = modules.map((m: any) => ({ ...m, completed: completedIds.has(String(m._id)) }));

    res.json({ success: true, training, webinars, totalModules: modules.length, completedCount: completed.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/partner/training/:id/complete ───────────────────────────────────
router.post('/training/:id/complete', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { PartnerTrainingProgress } = await import('../models/PartnerTraining');
    await PartnerTrainingProgress.updateOne(
      { user: req.user._id, module: req.params.id },
      { $setOnInsert: { user: req.user._id, module: req.params.id, completedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET/POST /api/partner/kyc ─────────────────────────────────────────────────
router.get('/kyc', protect, affiliateGuard, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('kyc name email phone avatar');
    res.json({ success: true, kyc: user?.kyc || { status: 'pending' }, user: { name: user?.name, email: user?.email, phone: user?.phone, avatar: user?.avatar } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/kyc', protect, affiliateGuard, async (req: any, res) => {
  try {
    const { pan, panName, panPhoto, aadhar, aadharName, aadharPhoto, bankAccount, bankIfsc, bankName, bankHolderName, avatar } = req.body;
    if (!pan || !aadhar || !bankAccount || !bankIfsc) {
      return res.status(400).json({ success: false, message: 'PAN, Aadhar and bank details are required' });
    }
    const update: any = {
      kyc: {
        pan: pan.toUpperCase(), panName, panPhoto,
        aadhar, aadharName, aadharPhoto,
        bankAccount, bankIfsc: bankIfsc.toUpperCase(), bankName, bankHolderName,
        status: 'submitted', submittedAt: new Date(),
      }
    };
    if (avatar) update.avatar = avatar;
    await User.findByIdAndUpdate(req.user._id, update);
    res.json({ success: true, message: 'KYC submitted successfully! Verification takes 1-2 business days.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/link ─────────────────────────────────────────────────────
router.get('/link', protect, affiliateGuard, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('affiliateCode');
    const baseUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const code = user?.affiliateCode || '';

    const [packages, courses, platformSettings] = await Promise.all([
      Package.find({ isActive: true }).select('name tier price promoDiscountPercent').sort({ price: 1 }),
      Course.find({ status: 'published' }).select('title slug thumbnail price discountPrice salesRefDiscountPercent').sort({ createdAt: -1 }),
      PlatformSettings.findOne(),
    ]);

    const packageLinks = packages.map((pkg: any) => ({
      id: pkg._id,
      name: pkg.name,
      tier: pkg.tier,
      price: pkg.price,
      promoDiscountPercent: pkg.promoDiscountPercent || 0,
      checkoutUrl: `${baseUrl}/checkout?package=${pkg._id}&promo=${code}`,
      referralUrl: `${baseUrl}/packages?ref=${code}`,
    }));

    const courseLinks = courses.map((course: any) => {
      const basePrice = course.discountPrice || course.price;
      const discPct = course.salesRefDiscountPercent || 0;
      const refPrice = discPct > 0 ? Math.round(basePrice * (1 - discPct / 100)) : basePrice;
      return {
        id: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        price: course.price,
        basePrice,
        refPrice,
        discountPercent: discPct,
        referralUrl: `${baseUrl}/courses/${course.slug}?ref=${code}`,
      };
    });

    res.json({
      success: true,
      affiliateCode: code,
      packageLinks,
      courseLinks,
      webinar: {
        link: platformSettings?.webinarLink || '',
        title: platformSettings?.webinarTitle || '',
        date: platformSettings?.webinarDate || '',
      },
      presentationVideoLink: platformSettings?.presentationVideoLink || '',
      generalLinks: {
        home: `${baseUrl}?ref=${code}`,
        courses: `${baseUrl}/courses?ref=${code}`,
        packages: `${baseUrl}/packages?ref=${code}`,
        register: `${baseUrl}/register?ref=${code}`,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/qualification ───────────────────────────────────────────
router.get('/qualification', protect, affiliateGuard, async (req: any, res) => {
  try {
    const Qualification = (await import('../models/Qualification')).default as any;
    const Commission = (await import('../models/Commission')).default as any;
    const PackagePurchase = (await import('../models/PackagePurchase')).default as any;
    const user = await User.findById(req.user._id).select('name avatar totalEarnings packageTier affiliateCode');
    const l1Count = await User.countDocuments({ upline1: req.user._id });
    const l1Paid = await User.countDocuments({ upline1: req.user._id, packageTier: { $ne: 'free' } });

    const lifetimeMetricMap: Record<string, number> = {
      l1Paid,
      totalEarnings: user?.totalEarnings || 0,
      l1Count,
      tierUpgrade: ['pro','proedge','elite','supreme'].includes(user?.packageTier || '') ? 999999 : 0,
    };

    // Compute a milestone's metric scoped to its [startDate, endDate] window.
    // When a milestone has no window at all → use lifetime totals (legacy behavior).
    const scopedMetric = async (m: any): Promise<number> => {
      if (!m.startDate && !m.endDate) return lifetimeMetricMap[m.metricType] ?? 0;

      const dateRange: any = {};
      if (m.startDate) dateRange.$gte = new Date(m.startDate);
      if (m.endDate)   dateRange.$lte = new Date(m.endDate);

      switch (m.metricType) {
        case 'totalEarnings': {
          const agg = await Commission.aggregate([
            { $match: { earner: req.user._id, status: { $ne: 'rejected' }, createdAt: dateRange } },
            { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
          ]);
          return agg[0]?.total || 0;
        }
        case 'l1Paid': {
          // Distinct L1 partners who completed a paid package purchase within window
          const directIds = await User.find({ upline1: req.user._id }).distinct('_id');
          if (directIds.length === 0) return 0;
          const buyers = await PackagePurchase.distinct('user', {
            user: { $in: directIds },
            status: 'paid',
            createdAt: dateRange,
          });
          return buyers.length;
        }
        case 'l1Count': {
          // L1 partners who joined (signed up) within the window
          return await User.countDocuments({ upline1: req.user._id, createdAt: dateRange });
        }
        case 'tierUpgrade': {
          // User upgraded to a paid tier within the window
          const upgraded = await PackagePurchase.exists({
            user: req.user._id,
            status: 'paid',
            packageTier: { $in: ['pro','proedge','elite','supreme'] },
            createdAt: dateRange,
          });
          return upgraded ? 999999 : 0;
        }
        default: return 0;
      }
    };

    // Load from DB, then filter by active campaign window (startDate/endDate optional);
    // fall back to hardcoded defaults if none exist.
    const now = new Date();
    let dbMilestones = await Qualification.find({ isActive: true }).sort({ order: 1 });
    dbMilestones = dbMilestones.filter((m: any) => {
      if (m.startDate && new Date(m.startDate) > now) return false;
      if (m.endDate && new Date(m.endDate) < now) return false;
      return true;
    });

    let milestones: any[];
    if (dbMilestones.length > 0) {
      milestones = await Promise.all(dbMilestones.map(async (m: any) => {
        const current = await scopedMetric(m);
        return {
          id: m._id, title: m.title, description: m.description,
          icon: m.icon, reward: m.reward, rewardType: m.rewardType,
          target: m.target, current, unit: m.unit,
          achieved: current >= m.target,
          badgeGradient: m.badgeGradient, certificateEnabled: m.certificateEnabled,
          order: m.order,
          startDate: m.startDate || null, endDate: m.endDate || null,
        };
      }));
    } else {
      milestones = [
        { id: 'first_sale', title: 'First Sale', description: 'Make your first referral sale', icon: '🎯', reward: '₹500 Bonus', rewardType: 'bonus', target: 1, current: l1Paid, unit: 'paid referrals', achieved: l1Paid >= 1, badgeGradient: 'from-sky-500 to-blue-600', certificateEnabled: true },
        { id: 'five_sales', title: 'Power Starter', description: '5 paid referrals in your L1', icon: '⚡', reward: 'Power Starter Badge', rewardType: 'badge', target: 5, current: l1Paid, unit: 'paid referrals', achieved: l1Paid >= 5, badgeGradient: 'from-violet-500 to-purple-600', certificateEnabled: true },
        { id: 'ten_sales', title: 'Growth Champion', description: '10 paid referrals in your network', icon: '🏆', reward: 'Feature on Leaderboard', rewardType: 'feature', target: 10, current: l1Paid, unit: 'paid referrals', achieved: l1Paid >= 10, badgeGradient: 'from-amber-500 to-orange-500', certificateEnabled: true },
        { id: 'earn_10k', title: '₹10,000 Earner', description: 'Total earnings cross ₹10,000', icon: '💰', reward: 'Elite Badge + Priority Support', rewardType: 'badge', target: 10000, current: user?.totalEarnings || 0, unit: '₹ earned', achieved: (user?.totalEarnings || 0) >= 10000, badgeGradient: 'from-emerald-500 to-teal-600', certificateEnabled: true },
        { id: 'earn_50k', title: '₹50,000 Club', description: 'Total earnings cross ₹50,000', icon: '🥇', reward: '₹2,000 Bonus + Certificate', rewardType: 'certificate', target: 50000, current: user?.totalEarnings || 0, unit: '₹ earned', achieved: (user?.totalEarnings || 0) >= 50000, badgeGradient: 'from-rose-500 to-pink-600', certificateEnabled: true },
        { id: 'earn_1l', title: 'Lakhpati Partner', description: 'Total earnings cross ₹1,00,000', icon: '👑', reward: 'Supreme Upgrade + Hall of Fame', rewardType: 'upgrade', target: 100000, current: user?.totalEarnings || 0, unit: '₹ earned', achieved: (user?.totalEarnings || 0) >= 100000, badgeGradient: 'from-yellow-400 to-amber-500', certificateEnabled: true },
        { id: 'team_25', title: 'Team Builder', description: 'Build a team of 25+ partners', icon: '👥', reward: 'Team Builder Trophy', rewardType: 'trophy', target: 25, current: l1Count, unit: 'L1 partners', achieved: l1Count >= 25, badgeGradient: 'from-cyan-500 to-blue-600', certificateEnabled: true },
        { id: 'pro_tier', title: 'Pro Partner', description: 'Upgrade to Pro or higher tier', icon: '🚀', reward: 'Pro Exclusive Benefits', rewardType: 'upgrade', target: 1, current: ['pro','proedge','elite','supreme'].includes(user?.packageTier || '') ? 999999 : 0, unit: 'tier upgrade', achieved: ['pro','proedge','elite','supreme'].includes(user?.packageTier || ''), badgeGradient: 'from-indigo-500 to-violet-600', certificateEnabled: false },
      ];
    }

    res.json({
      success: true, milestones,
      user: { name: user?.name, avatar: user?.avatar, affiliateCode: user?.affiliateCode },
      summary: { l1Count, l1Paid, totalEarnings: user?.totalEarnings || 0, tier: user?.packageTier },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/emi-commissions ─────────────────────────────────────────
router.get('/emi-commissions', protect, affiliateGuard, async (req: any, res) => {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;

    const installments = await EmiInstallment.find({ partnerUser: req.user._id })
      .populate('user', 'name email phone packageTier')
      .populate('packagePurchase', 'packageTier amount totalAmount')
      .sort({ createdAt: -1 })
      .lean();

    // Summary stats
    const totalPendingComm = installments
      .filter((i: any) => !i.partnerCommissionPaid && i.partnerCommissionAmount > 0 && i.status !== 'paid')
      .reduce((sum: number, i: any) => sum + (i.partnerCommissionAmount || 0), 0);

    const totalEarnedComm = installments
      .filter((i: any) => i.partnerCommissionPaid)
      .reduce((sum: number, i: any) => sum + (i.partnerCommissionAmount || 0), 0);

    res.json({
      success: true,
      installments,
      stats: {
        totalPendingCommission: totalPendingComm,
        totalEarnedCommission: totalEarnedComm,
        totalInstallments: installments.length,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/achievements ────────────────────────────────────────────
router.get('/achievements', protect, affiliateGuard, async (req: any, res) => {
  try {
    const Achievement = (await import('../models/Achievement')).default as any;
    const UserAchievement = (await import('../models/UserAchievement')).default as any;

    const user = await User.findById(req.user._id).select('totalEarnings packageTier name avatar createdAt affiliateCode');
    const l1Count = await User.countDocuments({ upline1: req.user._id });
    const l1Paid = await User.countDocuments({ upline1: req.user._id, packageTier: { $ne: 'free' } });

    let allAchievements = await Achievement.find({ enabled: true }).sort({ order: 1 });

    // Seed defaults if DB is genuinely empty (before window filter)
    if (allAchievements.length === 0) {
      await Achievement.insertMany([
        { title: 'TruLearnix Partner', description: 'Welcome to the TruLearnix Partner Network!', badge: '🎉', triggerType: 'join', triggerValue: 0, requirement: 'Join TruLearnix', posterTheme: 0, order: 0 },
        { title: 'First Commission', description: 'Earned your very first commission!', badge: '💸', triggerType: 'first_earn', triggerValue: 0, requirement: 'Earn first commission', posterTheme: 1, order: 1 },
        { title: '₹10K Milestone', description: 'Crossed ₹10,000 in total earnings!', badge: '💰', triggerType: 'earn_amount', triggerValue: 10000, requirement: 'Earn ₹10,000', posterTheme: 2, order: 2 },
        { title: '₹30K Club', description: 'Crossed ₹30,000 in total earnings!', badge: '🔥', triggerType: 'earn_amount', triggerValue: 30000, requirement: 'Earn ₹30,000', posterTheme: 3, order: 3 },
        { title: 'Lakhpati Partner', description: 'Crossed ₹1,00,000 in total earnings!', badge: '👑', triggerType: 'earn_amount', triggerValue: 100000, requirement: 'Earn ₹1 Lakh', posterTheme: 4, order: 4 },
        { title: 'Power of 5', description: '5 paid referrals in your direct team!', badge: '⚡', triggerType: 'paid_referrals', triggerValue: 5, requirement: '5 paid referrals', posterTheme: 5, order: 5 },
        { title: 'Team Leader', description: 'Built a direct team of 10+ partners!', badge: '👥', triggerType: 'referrals', triggerValue: 10, requirement: '10 referrals', posterTheme: 0, order: 6 },
        { title: 'Pro Partner', description: 'Upgraded to Pro or higher package!', badge: '🚀', triggerType: 'tier', triggerValue: 0, requirement: 'Upgrade to Pro+', posterTheme: 1, order: 7 },
      ]);
      allAchievements = await Achievement.find({ enabled: true }).sort({ order: 1 });
    }

    // Apply campaign window filter (post-seed so defaults aren't re-inserted)
    const nowTs = new Date();
    allAchievements = allAchievements.filter((a: any) => {
      if (a.startDate && new Date(a.startDate) > nowTs) return false;
      if (a.endDate && new Date(a.endDate) < nowTs) return false;
      return true;
    });

    // Get existing user achievements
    const userAchievements = await UserAchievement.find({ userId: req.user._id });
    const earnedMap: Record<string, Date> = {};
    userAchievements.forEach((ua: any) => { earnedMap[ua.achievementId.toString()] = ua.earnedAt; });

    // Auto-unlock logic
    const toUnlock: string[] = [];
    for (const ach of allAchievements) {
      if (earnedMap[ach._id.toString()]) continue;
      let earned = false;
      switch (ach.triggerType) {
        case 'join': earned = true; break;
        case 'first_earn': earned = (user?.totalEarnings || 0) > 0; break;
        case 'earn_amount': earned = (user?.totalEarnings || 0) >= ach.triggerValue; break;
        case 'referrals': earned = l1Count >= ach.triggerValue; break;
        case 'paid_referrals': earned = l1Paid >= ach.triggerValue; break;
        case 'tier': earned = ['pro','proedge','elite','supreme'].includes(user?.packageTier || ''); break;
      }
      if (earned) toUnlock.push(ach._id.toString());
    }

    if (toUnlock.length > 0) {
      await Promise.all(toUnlock.map((achId: string) =>
        UserAchievement.updateOne(
          { userId: req.user._id, achievementId: achId },
          { $setOnInsert: { userId: req.user._id, achievementId: achId, earnedAt: new Date() } },
          { upsert: true }
        )
      ));
      toUnlock.forEach((id: string) => { earnedMap[id] = new Date(); });
    }

    const achievements = allAchievements.map((ach: any) => ({
      _id: ach._id,
      title: ach.title,
      description: ach.description,
      badge: ach.badge,
      triggerType: ach.triggerType,
      requirement: ach.requirement,
      posterTheme: ach.posterTheme,
      order: ach.order,
      startDate: ach.startDate || null,
      endDate: ach.endDate || null,
      earned: !!earnedMap[ach._id.toString()],
      earnedAt: earnedMap[ach._id.toString()] || null,
    }));

    res.json({ success: true, achievements, user: { name: user?.name, avatar: user?.avatar, packageTier: user?.packageTier, totalEarnings: user?.totalEarnings, affiliateCode: (user as any)?.affiliateCode } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/partner/withdrawals ─────────────────────────────────────────────
router.get('/withdrawals', protect, affiliateGuard, async (req: any, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id })
      .sort('-createdAt')
      .select('amount method status hrStatus rejectionReason hrRejectionReason tdsAmount netAmount createdAt processedAt razorpayPayoutId');
    // req.user already loaded by protect middleware — no extra DB call needed
    res.json({
      success: true,
      withdrawals,
      wallet: req.user.wallet || 0,
      totalWithdrawn: req.user.totalWithdrawn || 0,
      kycStatus: req.user.kyc?.status || 'pending',
      bankAccount: req.user.kyc?.bankAccount || '',
      // For slip generation
      partnerName: req.user.name || '',
      partnerPan: req.user.kyc?.pan || '',
      partnerAddress: req.user.kyc?.address || '',
      partnerBankAccount: req.user.kyc?.bankAccount || '',
      partnerBankIfsc: req.user.kyc?.bankIfsc || '',
      partnerBankHolder: req.user.kyc?.bankHolderName || req.user.name || '',
      affiliateCode: req.user.affiliateCode || '',
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/partner/withdraw ────────────────────────────────────────────────
router.post('/withdraw', protect, affiliateGuard, async (req: any, res) => {
  try {
    // req.user already loaded by protect middleware — no extra DB call needed
    if (req.user.kyc?.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'KYC verification required before withdrawal. Please complete and get your KYC approved.' });
    }

    const { amount } = req.body;
    const amt = Number(amount);
    if (!amt || amt < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500' });
    if (amt > (req.user.wallet || 0)) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });

    // Check no pending withdrawal already exists
    const existing = await Withdrawal.findOne({ user: req.user._id, hrStatus: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request. Please wait for it to be processed.' });

    // TDS: 2% on all withdrawals
    const tdsRate = 2;
    const tdsAmount = Math.round(amt * tdsRate / 100);
    // RazorpayX gateway fee: IMPS ₹4.40 + 18% GST = ₹5.19
    const gatewayFee = 4.40;
    const gatewayFeeGst = Math.round(gatewayFee * 0.18 * 100) / 100;
    const totalGatewayFee = Math.round((gatewayFee + gatewayFeeGst) * 100) / 100;
    const netAmount = amt - tdsAmount - totalGatewayFee;

    // Atomic deduction — fails if concurrent request already drained wallet
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

export default router;
