import { Router } from 'express';
import User from '../models/User';
import PackagePurchase from '../models/PackagePurchase';
import Commission from '../models/Commission';
import Lead from '../models/Lead';
import Enrollment from '../models/Enrollment';
import LiveClass from '../models/LiveClass';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect, authorize('superadmin', 'admin'));

// GET /api/analytics/dashboard — main admin dashboard
router.get('/dashboard', async (_req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const lastMonth = new Date(thisMonth); lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      totalUsers, newUsersToday, newUsersMonth,
      totalRevenue, revenueThisMonth, revenueLastMonth,
      totalLeads, hotLeads, leadsThisMonth,
      totalAffiliates, paidAffiliates,
      activePackages, commissionsPaid,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: today } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: thisMonth } }),
      PackagePurchase.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: lastMonth, $lt: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Lead.countDocuments({}),
      Lead.countDocuments({ aiScoreLabel: 'hot' }),
      Lead.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ isAffiliate: true }),
      User.countDocuments({ isAffiliate: true, packageTier: { $ne: 'free' } }),
      User.aggregate([{ $match: { packageTier: { $ne: 'free' } } }, { $group: { _id: '$packageTier', count: { $sum: 1 } } }]),
      Commission.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
    ]);

    const thisMonthRev = revenueThisMonth[0]?.total || 0;
    const lastMonthRev = revenueLastMonth[0]?.total || 1;
    const revenueGrowth = (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1);

    res.json({
      success: true,
      users: { total: totalUsers, today: newUsersToday, thisMonth: newUsersMonth },
      revenue: { total: totalRevenue[0]?.total || 0, thisMonth: thisMonthRev, lastMonth: lastMonthRev, growth: revenueGrowth },
      leads: { total: totalLeads, hot: hotLeads, thisMonth: leadsThisMonth },
      affiliates: { total: totalAffiliates, paid: paidAffiliates },
      packages: activePackages,
      commissionsPaid: commissionsPaid[0]?.total || 0,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/overview — unified analytics for all filters
router.get('/overview', async (req, res) => {
  try {
    const { period = '30d', from: fromQ, to: toQ } = req.query as any;

    let from: Date, to: Date;
    if (fromQ && toQ) {
      from = new Date(fromQ); from.setHours(0, 0, 0, 0);
      to = new Date(toQ); to.setHours(23, 59, 59, 999);
    } else {
      to = new Date();
      from = new Date();
      const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 30;
      from.setDate(from.getDate() - days);
      from.setHours(0, 0, 0, 0);
    }

    // Previous period for comparison
    const periodMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevTo = new Date(from.getTime() - 1);

    const [
      revCurrent, revPrevious,
      usersCurrent, usersPrevious,
      leadsCurrent, leadsPrevious,
      purchasesCurrent,
      revByDay, usersByDay, leadsByDay,
      revByTier, usersByTier,
      topLeadStages,
    ] = await Promise.all([
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: from, $lte: to } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: prevFrom, $lte: prevTo } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'student', createdAt: { $gte: from, $lte: to } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: prevFrom, $lte: prevTo } }),
      Lead.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Lead.countDocuments({ createdAt: { $gte: prevFrom, $lte: prevTo } }),
      PackagePurchase.countDocuments({ status: 'paid', createdAt: { $gte: from, $lte: to } }),
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: 'student', createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$packageTier', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
      ]),
      User.aggregate([
        { $match: { role: 'student', createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$packageTier', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const rev = revCurrent[0]?.total || 0;
    const prevRev = revPrevious[0]?.total || 0;
    const revGrowth = prevRev > 0 ? (((rev - prevRev) / prevRev) * 100).toFixed(1) : null;
    const userGrowth = usersPrevious > 0 ? (((usersCurrent - usersPrevious) / usersPrevious) * 100).toFixed(1) : null;
    const leadGrowth = leadsPrevious > 0 ? (((leadsCurrent - leadsPrevious) / leadsPrevious) * 100).toFixed(1) : null;

    res.json({
      success: true,
      kpis: {
        revenue: { value: rev, prev: prevRev, growth: revGrowth, orders: revCurrent[0]?.count || 0 },
        users: { value: usersCurrent, prev: usersPrevious, growth: userGrowth },
        leads: { value: leadsCurrent, prev: leadsPrevious, growth: leadGrowth },
        purchases: purchasesCurrent,
      },
      charts: { revByDay, usersByDay, leadsByDay },
      breakdown: { revByTier, usersByTier, topLeadStages },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/revenue — revenue over time
router.get('/revenue', async (req, res) => {
  try {
    const { period = '30d', from: fromQ, to: toQ } = req.query as any;
    let from: Date, to: Date = new Date();
    if (period === 'today') {
      from = new Date(); from.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && fromQ) {
      from = new Date(fromQ); if (toQ) to = new Date(toQ);
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
      from = new Date(); from.setDate(from.getDate() - days);
    }

    const dateMatch = { status: 'paid', createdAt: { $gte: from, $lte: to } };
    const revenue = await PackagePurchase.aggregate([
      { $match: dateMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const byTier = await PackagePurchase.aggregate([
      { $match: dateMatch },
      { $group: { _id: '$packageTier', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, revenue, byTier });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/unit-economics — LTV, CAC, payback
router.get('/unit-economics', async (_req, res) => {
  try {
    const [totalPurchases, totalUsers, commissions] = await Promise.all([
      PackagePurchase.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      User.countDocuments({ packageTier: { $ne: 'free' } }),
      Commission.aggregate([{ $match: {} }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
    ]);

    const totalRevenue = totalPurchases[0]?.total || 0;
    const purchaseCount = totalPurchases[0]?.count || 1;
    const avgOrderValue = Math.round(totalRevenue / purchaseCount);
    const commissionPaid = commissions[0]?.total || 0;

    // Estimated CAC (platform runs ads — assume 20% of revenue)
    const estimatedAdSpend = totalRevenue * 0.20;
    const cac = totalUsers > 0 ? Math.round(estimatedAdSpend / totalUsers) : 0;
    const ltv = avgOrderValue * 1.5; // base + avg upsell
    const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(1) : 'N/A';
    const paybackMonths = cac > 0 && avgOrderValue > 0 ? (cac / (avgOrderValue / 12)).toFixed(1) : 'N/A';

    res.json({
      success: true,
      avgOrderValue,
      estimatedCAC: cac,
      estimatedLTV: Math.round(ltv),
      ltvCacRatio,
      paybackMonths,
      commissionPaid: Math.round(commissionPaid),
      totalRevenue,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/users — user growth
router.get('/users', async (req, res) => {
  try {
    const { period = '30d', from: fromQ, to: toQ } = req.query as any;
    let from: Date, to: Date = new Date();
    if (period === 'today') {
      from = new Date(); from.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && fromQ) {
      from = new Date(fromQ); if (toQ) to = new Date(toQ);
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
      from = new Date(); from.setDate(from.getDate() - days);
    }

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const byTier = await User.aggregate([
      { $group: { _id: '$packageTier', count: { $sum: 1 } } }
    ]);

    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, growth, byTier, byRole });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/funnel — full funnel breakdown
router.get('/funnel', async (_req, res) => {
  try {
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const lastMonth = new Date(thisMonth); lastMonth.setMonth(lastMonth.getMonth() - 1);
    const last3 = new Date(thisMonth); last3.setMonth(last3.getMonth() - 3);

    const STAGES = ['new', 'contacted', 'interested', 'demo_done', 'negotiating', 'token_collected', 'paid', 'lost'];

    const [
      stageCounts,
      scoreCounts,
      stageCountsThisMonth,
      purchasesByTier,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      totalStudents,
      studentsThisMonth,
      totalPurchases,
      purchasesThisMonth,
      lostReasons,
      monthlyLeads,
    ] = await Promise.all([
      Lead.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: '$aiScoreLabel', count: { $sum: 1 } } }]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]),
      PackagePurchase.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: '$packageTier', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { revenue: -1 } }
      ]),
      PackagePurchase.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: lastMonth, $lt: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: thisMonth } }),
      PackagePurchase.countDocuments({ status: 'paid' }),
      PackagePurchase.countDocuments({ status: 'paid', createdAt: { $gte: thisMonth } }),
      Lead.aggregate([
        { $match: { stage: 'lost', lostReason: { $exists: true, $ne: '' } } },
        { $group: { _id: '$lostReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: last3 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ['$stage', 'paid'] }, 1, 0] } } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    // Build stage map
    const stageMap: Record<string, number> = {};
    const stageMapMonth: Record<string, number> = {};
    for (const s of stageCounts) stageMap[s._id] = s.count;
    for (const s of stageCountsThisMonth) stageMapMonth[s._id] = s.count;

    const totalLeads = Object.values(stageMap).reduce((a, b) => a + b, 0);
    const stagesData = STAGES.map(stage => ({
      stage,
      count: stageMap[stage] || 0,
      thisMonth: stageMapMonth[stage] || 0,
    }));

    // Score breakdown
    const scoreMap: Record<string, number> = {};
    for (const s of scoreCounts) scoreMap[s._id] = s.count;

    res.json({
      success: true,
      totalLeads,
      stagesData,
      scoreBreakdown: {
        hot: scoreMap['hot'] || 0,
        warm: scoreMap['warm'] || 0,
        cold: scoreMap['cold'] || 0,
      },
      purchasesByTier,
      revenue: {
        total: totalRevenue[0]?.total || 0,
        thisMonth: revenueThisMonth[0]?.total || 0,
        lastMonth: revenueLastMonth[0]?.total || 0,
      },
      users: { total: totalStudents, thisMonth: studentsThisMonth },
      purchases: { total: totalPurchases, thisMonth: purchasesThisMonth },
      lostReasons,
      monthlyLeads,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
