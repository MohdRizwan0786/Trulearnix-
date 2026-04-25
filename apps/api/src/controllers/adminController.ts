import { Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Payment from '../models/Payment';
import PackagePurchase from '../models/PackagePurchase';
import SupportTicket from '../models/SupportTicket';
import Certificate from '../models/Certificate';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { period, from: fromQ, to: toQ } = req.query as any;
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Resolve period date range (null = all-time)
    let dateRange: { $gte: Date; $lte: Date } | null = null;
    if (period && period !== 'all') {
      let from: Date, to: Date = new Date();
      if (period === 'custom' && fromQ) {
        from = new Date(fromQ); from.setHours(0, 0, 0, 0);
        if (toQ) { to = new Date(toQ); to.setHours(23, 59, 59, 999); }
      } else if (period === 'today') {
        from = new Date(); from.setHours(0, 0, 0, 0);
      } else {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
        from = new Date(); from.setDate(from.getDate() - days); from.setHours(0, 0, 0, 0);
      }
      dateRange = { $gte: from, $lte: to };
    }

    const dateMatch = dateRange ? { createdAt: dateRange } : {};

    const [totalUsers, totalStudents, totalMentors, totalCourses, totalEnrollments,
      recentCoursePayments, recentPackagePurchases,
      paymentRev, packageRev, paymentMonthly, packageMonthly] = await Promise.all([
      User.countDocuments({ ...dateMatch }),
      User.countDocuments({ role: 'student', ...dateMatch }),
      User.countDocuments({ role: 'mentor', ...dateMatch }),
      Course.countDocuments({ status: 'published', ...dateMatch }),
      Enrollment.countDocuments({ ...dateMatch }),
      // Recent payments are always last 10 across all time (feed, not period metric)
      Payment.find({ status: 'paid' }).sort('-createdAt').limit(10).populate('user', 'name email').populate('course', 'title'),
      PackagePurchase.find({ status: 'paid' }).sort('-createdAt').limit(10).populate('user', 'name email').populate('package', 'name tier'),
      Payment.aggregate([{ $match: { status: 'paid', ...dateMatch } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', ...dateMatch } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: oneYearAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      PackagePurchase.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: oneYearAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = (paymentRev[0]?.total || 0) + (packageRev[0]?.total || 0);

    // Merge monthly revenue from both sources
    const monthlyMap: Record<string, { _id: any; revenue: number; count: number }> = {};
    [...paymentMonthly, ...packageMonthly].forEach((m: any) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!monthlyMap[key]) monthlyMap[key] = { _id: m._id, revenue: 0, count: 0 };
      monthlyMap[key].revenue += m.revenue;
      monthlyMap[key].count += m.count;
    });
    const monthlyRevenue = Object.values(monthlyMap).sort((a, b) => (a._id.year - b._id.year) || (a._id.month - b._id.month));

    // Merge course payments + package purchases into a single recent-payments feed
    const recentPayments = [
      ...recentCoursePayments.map((p: any) => ({
        _id: p._id,
        user: p.user,
        amount: p.amount,
        createdAt: p.createdAt,
        description: p.course?.title || 'Course Purchase',
        course: p.course,
      })),
      ...recentPackagePurchases.map((p: any) => ({
        _id: p._id,
        user: p.user,
        amount: p.totalAmount || p.amount,
        createdAt: p.createdAt,
        description: p.package?.name ? `${p.package.name} Package` : 'Package Purchase',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    res.json({
      success: true,
      stats: { totalUsers, totalStudents, totalMentors, totalCourses, totalEnrollments, totalRevenue },
      monthlyRevenue,
      recentPayments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 20, search, packageTier, isAffiliate } = req.query;
    const query: any = {};
    if (role) query.role = role;
    if (packageTier) query.packageTier = packageTier;
    if (isAffiliate === 'true') query.isAffiliate = true;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken -otp').skip(skip).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(query)
    ]);

    const userIds = users.map((u: any) => u._id);

    // Performance enrichment based on type
    let perfMap: Record<string, any> = {};

    if (isAffiliate === 'true') {
      // Partners: commission count + referral count
      const [commAgg, refAgg] = await Promise.all([
        Enrollment.aggregate([
          { $match: { student: { $in: userIds } } },
          { $group: { _id: '$student', enrollCount: { $sum: 1 } } }
        ]),
        User.aggregate([
          { $match: { referredBy: { $in: userIds } } },
          { $group: { _id: '$referredBy', referralCount: { $sum: 1 } } }
        ])
      ]);
      commAgg.forEach((r: any) => { perfMap[r._id] = { ...perfMap[r._id], enrollCount: r.enrollCount }; });
      refAgg.forEach((r: any) => { perfMap[r._id] = { ...perfMap[r._id], referralCount: r.referralCount }; });
    } else if (role === 'student') {
      // Learners: enrollment count + completed count
      const [enrollAgg, completeAgg] = await Promise.all([
        Enrollment.aggregate([
          { $match: { student: { $in: userIds } } },
          { $group: { _id: '$student', enrollCount: { $sum: 1 }, avgProgress: { $avg: '$progressPercent' } } }
        ]),
        Enrollment.aggregate([
          { $match: { student: { $in: userIds }, completedAt: { $exists: true, $ne: null } } },
          { $group: { _id: '$student', completedCount: { $sum: 1 } } }
        ])
      ]);
      enrollAgg.forEach((r: any) => { perfMap[r._id] = { enrollCount: r.enrollCount, avgProgress: Math.round(r.avgProgress || 0) }; });
      completeAgg.forEach((r: any) => { perfMap[r._id] = { ...perfMap[r._id], completedCount: r.completedCount }; });
    } else if (role === 'mentor') {
      // Mentors: course count + total enrolled students
      const courseAgg = await Course.aggregate([
        { $match: { mentor: { $in: userIds } } },
        { $group: { _id: '$mentor', courseCount: { $sum: 1 }, totalStudents: { $sum: '$enrolledCount' }, avgRating: { $avg: '$rating' } } }
      ]);
      courseAgg.forEach((r: any) => { perfMap[r._id] = { courseCount: r.courseCount, totalStudents: r.totalStudents, avgRating: (r.avgRating || 0).toFixed(1) }; });
    } else if (role === 'manager') {
      // Managers: assigned partner count + team earnings
      const [partnerAgg, earningsAgg] = await Promise.all([
        User.aggregate([
          { $match: { managerId: { $in: userIds } } },
          { $group: { _id: '$managerId', partnerCount: { $sum: 1 } } }
        ]),
        User.aggregate([
          { $match: { managerId: { $in: userIds } } },
          { $group: { _id: '$managerId', teamEarnings: { $sum: '$totalEarnings' } } }
        ])
      ]);
      partnerAgg.forEach((r: any) => { perfMap[r._id] = { partnerCount: r.partnerCount }; });
      earningsAgg.forEach((r: any) => { perfMap[r._id] = { ...perfMap[r._id], teamEarnings: r.teamEarnings }; });
    }

    const enriched = users.map((u: any) => ({
      ...u.toObject(),
      _perf: perfMap[u._id.toString()] || {}
    }));

    res.json({ success: true, users: enriched, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingCourses = async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ status: 'pending' }).populate('mentor', 'name email avatar').sort('-createdAt');
    res.json({ success: true, courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { status: 'published', $unset: { rejectionReason: 1 } }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course approved and published', course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course rejected', course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userType, priority, limit = 100 } = req.query as any;
    const query: any = {};
    if (status) query.status = status;
    if (userType && userType !== 'all') query.userType = userType;
    if (priority) query.priority = priority;
    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email phone avatar packageTier affiliateCode role')
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit));
    const stats = {
      open: await SupportTicket.countDocuments({ status: 'open' }),
      inProgress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
      partner: await SupportTicket.countDocuments({ userType: 'partner' }),
      learner: await SupportTicket.countDocuments({ userType: 'learner' }),
    };
    res.json({ success: true, tickets, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { status, message, reply, replyAction } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (status) ticket.status = status;
    const msg = message || reply;
    if (msg) {
      ticket.messages.push({ sender: req.user._id, senderRole: 'admin', message: msg, createdAt: new Date() });
    }
    if (status === 'resolved') ticket.resolvedAt = new Date();
    await ticket.save();
    const populated = await ticket.populate('user', 'name email phone avatar');
    res.json({ success: true, ticket: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
