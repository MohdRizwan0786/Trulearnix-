import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import PackagePurchase from '../models/PackagePurchase';
import Payment from '../models/Payment';
import Commission from '../models/Commission';
import Withdrawal from '../models/Withdrawal';
import Expense from '../models/Expense';
import User from '../models/User';

const router = Router();
router.use(protect, authorize('superadmin', 'admin'));

// ── Helper: date range from period ────────────────────────────────────────────
function getDateRange(period: string) {
  const now = new Date();
  const start = new Date();
  if (period === '7d') start.setDate(now.getDate() - 7);
  else if (period === '30d') start.setDate(now.getDate() - 30);
  else if (period === '90d') start.setDate(now.getDate() - 90);
  else if (period === '1y') start.setFullYear(now.getFullYear() - 1);
  else if (period === 'mtd') start.setDate(1); // month-to-date
  else if (period === 'ytd') { start.setMonth(0); start.setDate(1); } // year-to-date
  else start.setFullYear(2000); // all time
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

// ── GET /api/finance/overview ─────────────────────────────────────────────────
router.get('/overview', async (req: any, res) => {
  try {
    const { period = 'mtd' } = req.query;
    const { start, end } = getDateRange(period as string);
    const prevStart = new Date(start);
    const prevEnd = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);

    const dateFilter = { createdAt: { $gte: start, $lte: end } };
    const prevFilter = { createdAt: { $gte: prevStart, $lte: prevEnd } };

    // Revenue from package purchases
    const [
      revenueAgg, prevRevenueAgg,
      oldRevenueAgg, oldPrevRevenueAgg,
      gstAgg, tdsAgg,
      commissionAgg, pendingCommAgg,
      withdrawalAgg, pendingWithdAgg,
      expenseAgg, prevExpenseAgg,
      activeAffiliates, totalUsers,
      tierBreakdown,
    ] = await Promise.all([
      PackagePurchase.aggregate([{ $match: { status: 'paid', ...dateFilter } }, { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, netAmount: { $sum: '$amount' }, gst: { $sum: '$gstAmount' }, count: { $sum: 1 } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', ...prevFilter } }, { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, netAmount: { $sum: '$amount' } } }]),
      // Old Payment records (no GST tracked separately)
      Payment.aggregate([{ $match: { status: 'paid', ...dateFilter } }, { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'paid', ...prevFilter } }, { $group: { _id: null, totalAmount: { $sum: '$amount' } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', ...dateFilter } }, { $group: { _id: null, gst: { $sum: '$gstAmount' } } }]),
      // TDS = 2% on paid commissions
      Commission.aggregate([{ $match: { status: 'paid', ...dateFilter } }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
      Commission.aggregate([{ $match: { status: { $in: ['paid', 'approved'] }, ...dateFilter } }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
      Commission.aggregate([{ $match: { status: 'pending', ...dateFilter } }, { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }]),
      Withdrawal.aggregate([{ $match: { status: 'completed', ...dateFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Withdrawal.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$amount' }, gstPaid: { $sum: '$gstPaid' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: prevStart, $lte: prevEnd } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.countDocuments({ isAffiliate: true }),
      User.countDocuments({ isActive: true }),
      PackagePurchase.aggregate([{ $match: { status: 'paid', ...dateFilter } }, { $group: { _id: '$packageTier', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    ]);

    const grossRevenue = (revenueAgg[0]?.totalAmount || 0) + (oldRevenueAgg[0]?.totalAmount || 0);
    const netRevenue = (revenueAgg[0]?.netAmount || 0) + (oldRevenueAgg[0]?.totalAmount || 0);
    const prevRevenue = (prevRevenueAgg[0]?.totalAmount || 0) + (oldPrevRevenueAgg[0]?.totalAmount || 0);
    const gstCollected = gstAgg[0]?.gst || 0;
    const paidCommissions = tdsAgg[0]?.total || 0;
    const tdsDeducted = paidCommissions * 0.02;
    const totalCommissions = commissionAgg[0]?.total || 0;
    const pendingComm = pendingCommAgg[0]?.total || 0;
    const pendingCommCount = pendingCommAgg[0]?.count || 0;
    const withdrawalsPaid = withdrawalAgg[0]?.total || 0;
    const pendingWithd = pendingWithdAgg[0]?.total || 0;
    const pendingWithdCount = pendingWithdAgg[0]?.count || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const gstPaidOnExpenses = expenseAgg[0]?.gstPaid || 0;
    const prevExpenses = prevExpenseAgg[0]?.total || 0;

    const grossProfit = netRevenue - totalCommissions - withdrawalsPaid;
    const netProfit = grossProfit - totalExpenses;
    const netGstPayable = gstCollected - gstPaidOnExpenses;
    const revenueGrowth = prevRevenue > 0 ? ((grossRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expenseGrowth = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    res.json({
      success: true,
      period,
      summary: {
        grossRevenue, netRevenue, prevRevenue, revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        salesCount: (revenueAgg[0]?.count || 0) + (oldRevenueAgg[0]?.count || 0),
        gstCollected, gstPaidOnExpenses, netGstPayable,
        totalCommissions, paidCommissions, pendingComm, pendingCommCount,
        tdsDeducted,
        withdrawalsPaid, pendingWithd, pendingWithdCount,
        totalExpenses, prevExpenses, expenseGrowth: Math.round(expenseGrowth * 10) / 10,
        grossProfit, netProfit,
        activeAffiliates, totalUsers,
      },
      tierBreakdown,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/finance/pnl ──────────────────────────────────────────────────────
router.get('/pnl', async (req: any, res) => {
  try {
    const { year } = req.query;
    const y = parseInt(year as string) || new Date().getFullYear();
    const startOfYear = new Date(y, 0, 1);
    const endOfYear = new Date(y, 11, 31, 23, 59, 59);

    const [revenueByMonth, oldRevenueByMonth, commByMonth, withdrawByMonth, expenseByMonth] = await Promise.all([
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, grossRevenue: { $sum: '$totalAmount' }, netRevenue: { $sum: '$amount' }, gstCollected: { $sum: '$gstAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, grossRevenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Commission.aggregate([
        { $match: { status: { $in: ['paid', 'approved'] }, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$commissionAmount' } } },
        { $sort: { _id: 1 } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' }, gstPaid: { $sum: '$gstPaid' } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pnl = months.map((month, i) => {
      const m = i + 1;
      const rev = revenueByMonth.find((r: any) => r._id === m) || { grossRevenue: 0, netRevenue: 0, gstCollected: 0, count: 0 };
      const oldRev = oldRevenueByMonth.find((r: any) => r._id === m) || { grossRevenue: 0, count: 0 };
      rev.grossRevenue += oldRev.grossRevenue;
      rev.netRevenue += oldRev.grossRevenue; // old payments: no GST, full amount = net
      rev.count += oldRev.count;
      const comm = commByMonth.find((c: any) => c._id === m)?.total || 0;
      const withd = withdrawByMonth.find((w: any) => w._id === m)?.total || 0;
      const exp = expenseByMonth.find((e: any) => e._id === m) || { total: 0, gstPaid: 0 };
      const tds = comm * 0.02;
      const grossProfit = rev.netRevenue - comm - withd;
      const netProfit = grossProfit - exp.total;
      return {
        month, m,
        grossRevenue: rev.grossRevenue, netRevenue: rev.netRevenue,
        gstCollected: rev.gstCollected, gstPaid: exp.gstPaid,
        netGst: rev.gstCollected - exp.gstPaid,
        commissions: comm, withdrawals: withd, tds,
        expenses: exp.total,
        grossProfit, netProfit,
        salesCount: rev.count,
      };
    });

    const totals = pnl.reduce((acc, row) => ({
      grossRevenue: acc.grossRevenue + row.grossRevenue,
      netRevenue: acc.netRevenue + row.netRevenue,
      gstCollected: acc.gstCollected + row.gstCollected,
      gstPaid: acc.gstPaid + row.gstPaid,
      netGst: acc.netGst + row.netGst,
      commissions: acc.commissions + row.commissions,
      withdrawals: acc.withdrawals + row.withdrawals,
      tds: acc.tds + row.tds,
      expenses: acc.expenses + row.expenses,
      grossProfit: acc.grossProfit + row.grossProfit,
      netProfit: acc.netProfit + row.netProfit,
      salesCount: acc.salesCount + row.salesCount,
    }), { grossRevenue:0, netRevenue:0, gstCollected:0, gstPaid:0, netGst:0, commissions:0, withdrawals:0, tds:0, expenses:0, grossProfit:0, netProfit:0, salesCount:0 });

    res.json({ success: true, year: y, pnl, totals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/finance/tds ─────────────────────────────────────────────────────
router.get('/tds', async (req: any, res) => {
  try {
    const { year } = req.query;
    const y = parseInt(year as string) || new Date().getFullYear();
    const startOfYear = new Date(y, 0, 1);
    const endOfYear = new Date(y, 11, 31, 23, 59, 59);

    // Group commissions by earner for the year
    const tdsData = await Commission.aggregate([
      { $match: { status: { $in: ['paid', 'approved'] }, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: '$earner', totalCommission: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, totalCommission: 1, count: 1, tdsAmount: { $multiply: ['$totalCommission', 0.02] }, netPayable: { $multiply: ['$totalCommission', 0.98] }, 'user.name': 1, 'user.email': 1, 'user.phone': 1, 'user.packageTier': 1 } },
      { $sort: { totalCommission: -1 } }
    ]);

    const totalCommission = tdsData.reduce((s: number, r: any) => s + r.totalCommission, 0);
    const totalTds = totalCommission * 0.02;

    res.json({ success: true, year: y, tdsData, summary: { totalCommission, totalTds, netPayable: totalCommission - totalTds, affiliateCount: tdsData.length } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/finance/gst ─────────────────────────────────────────────────────
router.get('/gst', async (req: any, res) => {
  try {
    const { year } = req.query;
    const y = parseInt(year as string) || new Date().getFullYear();
    const startOfYear = new Date(y, 0, 1);
    const endOfYear = new Date(y, 11, 31, 23, 59, 59);

    const [gstByMonth, expenseGstByMonth, tierGst] = await Promise.all([
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, gstCollected: { $sum: '$gstAmount' }, netSales: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$date' }, gstPaid: { $sum: '$gstPaid' } } },
        { $sort: { _id: 1 } }
      ]),
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: '$packageTier', gstCollected: { $sum: '$gstAmount' }, netSales: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { gstCollected: -1 } }
      ]),
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const gstReport = months.map((month, i) => {
      const m = i + 1;
      const rev = gstByMonth.find((r: any) => r._id === m) || { gstCollected: 0, netSales: 0, count: 0 };
      const exp = expenseGstByMonth.find((e: any) => e._id === m)?.gstPaid || 0;
      return { month, gstCollected: rev.gstCollected, inputCredit: exp, netGstPayable: rev.gstCollected - exp, netSales: rev.netSales, count: rev.count };
    });

    const totals = gstReport.reduce((acc, row) => ({
      gstCollected: acc.gstCollected + row.gstCollected,
      inputCredit: acc.inputCredit + row.inputCredit,
      netGstPayable: acc.netGstPayable + row.netGstPayable,
      netSales: acc.netSales + row.netSales,
    }), { gstCollected: 0, inputCredit: 0, netGstPayable: 0, netSales: 0 });

    res.json({ success: true, year: y, gstReport, totals, tierGst });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/finance/expenses ──────────────────────────────────────────────────
router.get('/expenses', async (req: any, res) => {
  try {
    const { category, page = 1, limit = 20, month, year } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (month && year) {
      filter.date = { $gte: new Date(Number(year), Number(month) - 1, 1), $lt: new Date(Number(year), Number(month), 1) };
    } else if (year) {
      filter.date = { $gte: new Date(Number(year), 0, 1), $lt: new Date(Number(year) + 1, 0, 1) };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total, byCategory] = await Promise.all([
      Expense.find(filter).sort('-date').skip(skip).limit(Number(limit)).populate('addedBy', 'name'),
      Expense.countDocuments(filter),
      Expense.aggregate([{ $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    ]);
    res.json({ success: true, expenses, total, pages: Math.ceil(total / Number(limit)), byCategory });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/finance/expenses ─────────────────────────────────────────────────
router.post('/expenses', async (req: any, res) => {
  try {
    const { title, category, amount, gstPaid, vendor, invoiceNumber, date, notes } = req.body;
    if (!title || !category || !amount) return res.status(400).json({ success: false, message: 'title, category and amount are required' });
    const expense = await Expense.create({ title, category, amount, gstPaid: gstPaid || 0, vendor, invoiceNumber, date: date ? new Date(date) : new Date(), notes, addedBy: req.user._id });
    res.status(201).json({ success: true, expense });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── DELETE /api/finance/expenses/:id ─────────────────────────────────────────
router.delete('/expenses/:id', async (req: any, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/finance/revenue-chart ────────────────────────────────────────────
router.get('/revenue-chart', async (req: any, res) => {
  try {
    const { period = '30d' } = req.query;
    const { start, end } = getDateRange(period as string);

    const [ppByDay, oldPayByDay, commByDay, expenseByDay] = await Promise.all([
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, net: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Commission.aggregate([
        { $match: { status: { $in: ['paid', 'approved'] }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$commissionAmount' } } },
        { $sort: { _id: 1 } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    // Merge PP + old Payment daily revenue
    const allDates = Array.from(new Set([...ppByDay.map((d: any) => d._id), ...oldPayByDay.map((d: any) => d._id)])).sort();
    const revenueByDay = allDates.map(date => {
      const pp = ppByDay.find((d: any) => d._id === date) || { revenue: 0, net: 0, count: 0 };
      const op = oldPayByDay.find((d: any) => d._id === date) || { revenue: 0, count: 0 };
      return { _id: date, revenue: pp.revenue + op.revenue, net: pp.net + op.revenue, count: pp.count + op.count };
    });

    res.json({ success: true, revenueByDay, commByDay, expenseByDay });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
