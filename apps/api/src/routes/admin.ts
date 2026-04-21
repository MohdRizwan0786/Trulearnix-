import { Router } from 'express';
import { getDashboardStats, getAllUsers, toggleUserStatus, getPendingCourses, approveCourse, rejectCourse, getTickets, updateTicket } from '../controllers/adminController';
import { normalizeAvatars } from '../utils/normalizeAvatar';
import Attendance from '../models/Attendance';
import Holiday from '../models/Holiday';
import User from '../models/User';
import Course from '../models/Course';
import Package from '../models/Package';
import PackagePurchase from '../models/PackagePurchase';
import Payment from '../models/Payment';
import Commission from '../models/Commission';
import Withdrawal from '../models/Withdrawal';
import LiveClass from '../models/LiveClass';
import Batch from '../models/Batch';
import Enrollment from '../models/Enrollment';
import PlatformSettings from '../models/PlatformSettings';
import { getOrCreateActiveBatch, createPendingBatch } from '../services/batchService';
import { protect, authorize } from '../middleware/auth';
import { initiateWithdrawalPayout, isPayoutConfigured } from '../services/razorpayPayout';
import { activateOrder } from '../services/orderActivation';

const router = Router();
router.use(protect, authorize('superadmin', 'admin', 'manager', 'mentor', 'salesperson'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.post('/users/create', async (req: any, res) => {
  try {
    const { name, email, phone, password, type, packageId, amountReceived, grantPartnerAccess, note, paymentType: manualPaymentType, tokenAmount: manualTokenAmount, fullPackagePrice: manualFullPkgPrice } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    let packageTier = grantPartnerAccess ? 'starter' : 'free';
    let packageDoc: any = null;

    if (type === 'paid') {
      if (!packageId || !amountReceived) return res.status(400).json({ success: false, message: 'Package and amount required for paid user' });
      packageDoc = await Package.findById(packageId);
      if (!packageDoc) return res.status(404).json({ success: false, message: 'Package not found' });
      packageTier = packageDoc.tier;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      password,
      role: 'student',
      isVerified: true,
      isActive: true,
      packageTier,
      isAffiliate: grantPartnerAccess ? true : false,
    });

    let purchase = null;
    if (type === 'paid' && packageDoc) {
      const resolvedPType = manualPaymentType || 'full';
      const isTokenPurchase = resolvedPType.startsWith('token');
      purchase = await PackagePurchase.create({
        user: user._id,
        package: packageDoc._id,
        packageTier: packageDoc.tier,
        amount: Number(amountReceived),
        gstAmount: 0,
        totalAmount: Number(amountReceived),
        paymentMethod: 'manual',
        status: 'paid',
        invoiceNumber: `MAN-${Date.now()}`,
        paymentType: resolvedPType,
        tokenAmount: isTokenPurchase ? Number(manualTokenAmount || amountReceived) : undefined,
        fullPackagePrice: isTokenPurchase ? Number(manualFullPkgPrice || 0) : undefined,
      });
    }

    res.status(201).json({ success: true, message: 'User created successfully', user, purchase });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/users', getAllUsers);
// GET /admin/users/:id/referrals — who did this partner/salesperson refer
router.get('/users/:id/referrals', async (req, res) => {
  try {
    const { page = 1, limit = 30, search } = req.query as any;
    const referrer = await User.findById(req.params.id).select('name email affiliateCode isAffiliate role totalEarnings wallet packageTier');
    if (!referrer) return res.status(404).json({ success: false, message: 'User not found' });

    const filter: any = { referredBy: referrer._id };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [referrals, total] = await Promise.all([
      User.find(filter)
        .select('name email phone packageTier isAffiliate affiliateCode totalEarnings wallet createdAt packagePurchasedAt referredBy')
        .sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    // For each referral, also count their own downline (sub-referrals)
    const ids = referrals.map((r: any) => r._id);
    const downlineAgg = await User.aggregate([
      { $match: { referredBy: { $in: ids } } },
      { $group: { _id: '$referredBy', count: { $sum: 1 } } },
    ]);
    const downlineMap: Record<string, number> = {};
    downlineAgg.forEach((d: any) => { downlineMap[d._id.toString()] = d.count; });

    const enriched = referrals.map((r: any) => ({
      ...r.toObject(),
      downlineCount: downlineMap[r._id.toString()] || 0,
    }));

    res.json({ success: true, referrer, referrals: enriched, total, pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken -otp');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.patch('/users/:id/toggle', toggleUserStatus);
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.patch('/users/:id/package', async (req: any, res) => {
  try {
    const { packageTier } = req.body;
    const rates: Record<string, number> = { free: 0, starter: 10, pro: 15, elite: 22, supreme: 30 };
    const updates: any = { packageTier, commissionRate: rates[packageTier] || 0, isAffiliate: packageTier !== 'free', packagePurchasedAt: new Date() };
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── SET INDUSTRIAL EARNING ────────────────────────────────────────────────────
router.patch('/users/:id/industrial-earning', async (req: any, res) => {
  try {
    const { industrialEarning, industrialEarningSource, grantPartnerAccess, packageTier } = req.body;
    if (industrialEarning === undefined || industrialEarning < 0) {
      return res.status(400).json({ success: false, message: 'industrialEarning must be >= 0' });
    }
    const updates: any = {
      industrialEarning: Number(industrialEarning),
      industrialEarningSource: industrialEarningSource || '',
      isIndustrialPartner: Number(industrialEarning) > 0,
    };
    // Optionally also grant partner (affiliate) access
    if (grantPartnerAccess) {
      const tier = packageTier || 'starter';
      const rates: Record<string, number> = { free: 0, starter: 10, pro: 15, elite: 22, supreme: 30 };
      updates.isAffiliate = true;
      updates.packageTier = tier;
      updates.commissionRate = rates[tier] || 10;
      updates.packagePurchasedAt = new Date();
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Partners — list all partners & manage promo discount
router.get('/partners', async (req, res) => {
  try {
    const { search, page = 1, limit = 30, managerId } = req.query;
    const filter: any = {
      isAffiliate: true,
      role: { $nin: ['admin', 'superadmin', 'manager', 'mentor'] },
    };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { affiliateCode: { $regex: search, $options: 'i' } },
    ];
    if (managerId === 'unassigned') filter.managerId = { $in: [null, undefined] };
    else if (managerId) filter.managerId = managerId;
    const skip = (Number(page) - 1) * Number(limit);
    const [partners, total] = await Promise.all([
      User.find(filter)
        .select('name email phone affiliateCode packageTier commissionRate promoDiscountPercent wallet totalEarnings isActive createdAt managerId referredBy upline1 packagePurchasedAt')
        .populate('managerId', 'name email phone')
        .populate('referredBy', 'name affiliateCode packageTier')
        .sort('-totalEarnings').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    // Enrich with referral count + commission count
    const ids = partners.map((p: any) => p._id);
    const Commission = (await import('../models/Commission')).default;
    const [refAgg, commAgg] = await Promise.all([
      User.aggregate([{ $match: { referredBy: { $in: ids } } }, { $group: { _id: '$referredBy', referralCount: { $sum: 1 } } }]),
      Commission.aggregate([{ $match: { earner: { $in: ids } } }, { $group: { _id: '$earner', commCount: { $sum: 1 } } }]),
    ]);
    const perfMap: any = {};
    refAgg.forEach((r: any) => { perfMap[r._id] = { referralCount: r.referralCount }; });
    commAgg.forEach((r: any) => { if (!perfMap[r._id]) perfMap[r._id] = {}; perfMap[r._id].commCount = r.commCount; });
    const enriched = partners.map((p: any) => ({ ...p.toObject(), _perf: perfMap[p._id.toString()] || {} }));
    res.json({ success: true, partners: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// List all managers (for assignment dropdown)
router.get('/managers', async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager', isActive: true })
      .select('name email phone avatar')
      .sort('name');
    // Enrich with assigned partner count
    const enriched = await Promise.all(managers.map(async m => {
      const assignedCount = await User.countDocuments({ managerId: m._id });
      return { ...m.toObject(), assignedCount };
    }));
    res.json({ success: true, managers: enriched });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Manager performance stats
router.get('/managers/:id/performance', async (req, res) => {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;
    const mongoose = await import('mongoose');
    const managerId = req.params.id;
    const [assignedPartners, partnerDocs] = await Promise.all([
      User.countDocuments({ managerId }),
      User.find({ managerId }, '_id'),
    ]);
    const pIds = partnerDocs.map((p: any) => p._id);

    const [purchases, earnedComm, pendingComm, activePartners] = await Promise.all([
      PackagePurchase.find({ partnerUser: { $in: pIds } })
        .select('totalAmount paidAmount purchaseType partnerUser createdAt')
        .populate('partnerUser', 'name affiliateCode')
        .sort('-createdAt').limit(20),
      EmiInstallment.aggregate([
        { $match: { managerUser: new mongoose.Types.ObjectId(managerId), managerCommissionPaid: true } },
        { $group: { _id: null, total: { $sum: '$managerCommissionAmount' } } },
      ]),
      EmiInstallment.aggregate([
        { $match: { managerUser: new mongoose.Types.ObjectId(managerId), managerCommissionPaid: false } },
        { $group: { _id: null, total: { $sum: '$managerCommissionAmount' } } },
      ]),
      User.countDocuments({ managerId, isActive: true }),
    ]);

    const totalSales = purchases.reduce((s: number, p: any) => s + (p.paidAmount || p.totalAmount || 0), 0);
    const totalOrders = await PackagePurchase.countDocuments({ partnerUser: { $in: pIds } });

    res.json({
      success: true,
      assignedPartners,
      activePartners,
      totalOrders,
      totalSales,
      earnedCommission: earnedComm[0]?.total || 0,
      pendingCommission: pendingComm[0]?.total || 0,
      recentOrders: purchases.slice(0, 10),
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Assign/unassign manager to partner
router.patch('/partners/:id/assign-manager', async (req, res) => {
  try {
    const { managerId } = req.body;
    const update: any = managerId ? { managerId } : { managerId: null };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email affiliateCode managerId')
      .populate('managerId', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'Partner not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/partners/:id/promo-discount', async (req, res) => {
  try {
    const { promoDiscountPercent } = req.body;
    if (typeof promoDiscountPercent !== 'number' || promoDiscountPercent < 0 || promoDiscountPercent > 100) {
      return res.status(400).json({ success: false, message: 'Discount must be 0–100' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { promoDiscountPercent },
      { new: true }
    ).select('name email affiliateCode promoDiscountPercent');
    if (!user) return res.status(404).json({ success: false, message: 'Partner not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Courses — admin full view (ALL statuses)
router.get('/courses/all', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter).populate('mentor', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)),
      Course.countDocuments(filter),
    ]);
    res.json({ success: true, courses, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.get('/courses/pending', getPendingCourses);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/reject', rejectCourse);

// Admin: get single course
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('mentor', 'name email avatar');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin: create course directly (auto-published)
router.post('/courses/create', async (req: any, res) => {
  try {
    const { title, description, shortDescription, thumbnail, previewVideo, mentor,
      category, tags, price, discountPrice, level, language, duration,
      requirements, outcomes, highlights, faqs, modules, certificate, passingScore,
      status, batchSettings } = req.body;

    if (!title || !description || !shortDescription || !thumbnail || !mentor || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const course = await Course.create({
      title, slug, description, shortDescription, thumbnail, previewVideo,
      mentor, category, tags: tags || [], price, discountPrice,
      level: level || 'beginner', language: language || 'Hindi', duration,
      requirements: requirements || [], outcomes: outcomes || [],
      highlights: highlights || [], faqs: faqs || [],
      modules: modules || [], certificate: certificate !== false,
      passingScore: passingScore || 70,
      status: status || 'published',
      batchSettings: batchSettings || { enabled: false, minStrength: 5, maxStrength: 50, closingDays: 30 },
    });

    // Auto-create first batch if batches are enabled
    if (batchSettings?.enabled) {
      await getOrCreateActiveBatch(course._id.toString());
    }

    res.status(201).json({ success: true, course });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin: update course
router.put('/courses/:id', async (req: any, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: false });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // If batch settings just got enabled, create first batch
    if (req.body.batchSettings?.enabled) {
      const existingBatch = await Batch.findOne({ course: course._id, status: 'active' });
      if (!existingBatch) await getOrCreateActiveBatch(course._id.toString());
    }

    res.json({ success: true, course });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Batch Management ──────────────────────────────────────────────────────────

// List all batches for a course
router.get('/batches', async (req, res) => {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId required' });
    const batches = await Batch.find({ course: courseId }).sort('-batchNumber');
    res.json({ success: true, batches });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get students in a batch
router.get('/batches/:id/students', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    const enrollments = await Enrollment.find({ batch: batch._id })
      .populate('student', 'name email avatar phone createdAt')
      .sort('-createdAt');
    res.json({ success: true, enrollments, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get batch performance / leaderboard
router.get('/batches/:id/performance', async (req, res) => {
  try {
    const Assignment = require('../models/Assignment').default;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const [enrollments, sessions, assignments] = await Promise.all([
      Enrollment.find({ batch: batch._id }).populate('student', 'name email avatar').lean(),
      LiveClass.find({ course: batch.course, status: 'ended' }).select('attendanceRecords').lean(),
      Assignment.find({ course: batch.course, isPublished: true }).select('submissions maxScore').lean(),
    ]);
    normalizeAvatars(enrollments as any[]);

    const totalSessions = sessions.length;
    const totalAssignments = assignments.length;

    const performance = (enrollments as any[]).map((enr: any) => {
      const sid = enr.student?._id?.toString();
      const sessionsAttended = (sessions as any[]).filter((s: any) =>
        (s.attendanceRecords || []).some((r: any) => r.user?.toString() === sid && r.isPresent)
      ).length;
      const mySubmissions = (assignments as any[]).map((a: any) => {
        const sub = (a.submissions || []).find((s: any) => s.student?.toString() === sid);
        return sub ? { score: sub.score || 0, maxScore: a.maxScore || 100 } : null;
      }).filter(Boolean);
      const avgAssignmentScore = mySubmissions.length > 0
        ? Math.round(mySubmissions.reduce((s: number, x: any) => s + (x.score / x.maxScore * 100), 0) / mySubmissions.length)
        : 0;
      const attendancePct = totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0;
      const compositeScore = Math.round((enr.progressPercent || 0) * 0.4 + attendancePct * 0.3 + avgAssignmentScore * 0.3);
      return {
        student: enr.student,
        progressPercent: enr.progressPercent || 0,
        completedLessons: (enr.progress || []).length,
        sessionsAttended,
        totalSessions,
        attendancePct,
        assignmentsSubmitted: mySubmissions.length,
        totalAssignments,
        avgAssignmentScore,
        compositeScore,
      };
    });

    performance.sort((a: any, b: any) => b.compositeScore - a.compositeScore);
    res.json({ success: true, performance, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Create a batch manually (starts as pending)
router.post('/batches', async (req, res) => {
  try {
    const { courseId, minStrength, maxStrength, closingDays, totalDays, label } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId required' });

    const lastBatch = await Batch.findOne({ course: courseId }).sort('-batchNumber');
    const batchNumber = (lastBatch?.batchNumber || 0) + 1;

    const batch = await Batch.create({
      course: courseId, batchNumber,
      label: label || `Batch ${batchNumber}`,
      minStrength: minStrength || 5, maxStrength: maxStrength || 50,
      closingDays: closingDays || 30,
      totalDays: totalDays || 0,
      status: 'pending',
      enrolledCount: 0,
      daysCompleted: 0,
    });

    res.status(201).json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Start a pending batch manually
router.patch('/batches/:id/start', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending batches can be started' });

    const startDate = new Date();
    const closingDate = new Date(startDate.getTime() + batch.closingDays * 24 * 60 * 60 * 1000);
    batch.status = 'active';
    batch.startDate = startDate;
    batch.closingDate = closingDate;
    await batch.save();

    res.json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mark a day complete in the batch
router.patch('/batches/:id/mark-day', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.status !== 'active') return res.status(400).json({ success: false, message: 'Batch is not active' });

    batch.daysCompleted = (batch.daysCompleted || 0) + 1;

    // Auto-close when all days are done
    if (batch.totalDays > 0 && batch.daysCompleted >= batch.totalDays) {
      batch.status = 'closed';
      await batch.save();

      // Auto-create next pending batch
      const newBatch = await createPendingBatch(batch.course.toString());
      return res.json({ success: true, batch, autoCreated: newBatch, message: `Batch completed! Batch ${newBatch.batchNumber} created (pending).` });
    }

    await batch.save();
    res.json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Close a batch manually
router.patch('/batches/:id/close', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Reopen a batch (set back to active)
router.patch('/batches/:id/reopen', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id,
      { status: 'active', closingDate: new Date(Date.now() + batch_days(req)) },
      { new: true }
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
function batch_days(req: any) { return (req.body.closingDays || 30) * 24 * 60 * 60 * 1000; }

// Transfer student to another batch
router.post('/batches/transfer', async (req, res) => {
  try {
    const { studentId, fromBatchId, toBatchId, courseId } = req.body;
    if (!studentId || !toBatchId || !courseId) {
      return res.status(400).json({ success: false, message: 'studentId, toBatchId, courseId required' });
    }

    const toBatch = await Batch.findById(toBatchId);
    if (!toBatch) return res.status(404).json({ success: false, message: 'Target batch not found' });
    if (toBatch.status === 'closed') return res.status(400).json({ success: false, message: 'Cannot transfer to a closed batch' });
    if (toBatch.enrolledCount >= toBatch.maxStrength) return res.status(400).json({ success: false, message: 'Target batch is full' });

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    // Decrement old batch count
    if (fromBatchId) {
      await Batch.findByIdAndUpdate(fromBatchId, { $inc: { enrolledCount: -1 } });
      // Re-activate if it was marked full
      await Batch.updateOne({ _id: fromBatchId, status: 'full' }, { status: 'active' });
    }

    // Assign new batch
    enrollment.batch = toBatch._id as any;
    await enrollment.save();
    toBatch.enrolledCount += 1;
    if (toBatch.enrolledCount >= toBatch.maxStrength) toBatch.status = 'full';
    await toBatch.save();

    res.json({ success: true, message: 'Student transferred successfully' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Packages management
router.get('/packages', async (_req, res) => {
  try { res.json({ success: true, packages: await Package.find().sort('displayOrder') }); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/packages', async (req, res) => {
  try { res.status(201).json({ success: true, package: await Package.create(req.body) }); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/packages/:id', async (req, res) => {
  try { res.json({ success: true, package: await Package.findByIdAndUpdate(req.params.id, req.body, { new: true }) }); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/packages/:id', async (req, res) => {
  try { await Package.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
// Upsert single earner-tier entry in a package's partnerEarnings
router.patch('/packages/:id/earner', async (req, res) => {
  try {
    const { earnerTierId, earnerTierName, type, value } = req.body;
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Not found' });
    const earnings: any[] = (pkg as any).partnerEarnings || [];
    const idx = earnings.findIndex((r: any) => r.earnerTier?.toString() === earnerTierId?.toString());
    const entry = { earnerTier: earnerTierId, earnerName: earnerTierName, type, value };
    if (idx >= 0) earnings[idx] = entry; else earnings.push(entry);
    await Package.findByIdAndUpdate(req.params.id, { partnerEarnings: earnings });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Platform Settings
router.get('/platform-settings', async (_req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});
    res.json({ success: true, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/platform-settings', async (req, res) => {
  try {
    const { tdsRate, gstRate, gstNumber, minWithdrawalAmount, webinarLink, webinarTitle, webinarDate, presentationVideoLink, maintenanceMode, trulanceMaintenance, maintenanceMessage, earlyAccessEnabled } = req.body;
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({ tdsRate, gstRate, gstNumber, minWithdrawalAmount, webinarLink, webinarTitle, webinarDate, presentationVideoLink, maintenanceMode, trulanceMaintenance, maintenanceMessage, earlyAccessEnabled });
    } else {
      if (tdsRate !== undefined) settings.tdsRate = tdsRate;
      if (gstRate !== undefined) settings.gstRate = gstRate;
      if (gstNumber !== undefined) settings.gstNumber = gstNumber;
      if (minWithdrawalAmount !== undefined) settings.minWithdrawalAmount = minWithdrawalAmount;
      if (webinarLink !== undefined) settings.webinarLink = webinarLink;
      if (webinarTitle !== undefined) settings.webinarTitle = webinarTitle;
      if (webinarDate !== undefined) settings.webinarDate = webinarDate;
      if (presentationVideoLink !== undefined) settings.presentationVideoLink = presentationVideoLink;
      if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
      if (trulanceMaintenance !== undefined) settings.trulanceMaintenance = trulanceMaintenance;
      if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
      if (earlyAccessEnabled !== undefined) settings.earlyAccessEnabled = earlyAccessEnabled;
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Generate early access token
router.post('/platform-settings/early-access-token', async (req, res) => {
  try {
    const { label } = req.body;
    const token = 'ea_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});
    settings.earlyAccessTokens.push({ token, label: label || '', createdAt: new Date() });
    await settings.save();
    res.json({ success: true, token, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete early access token
router.delete('/platform-settings/early-access-token/:token', async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne();
    if (!settings) return res.json({ success: true });
    settings.earlyAccessTokens = settings.earlyAccessTokens.filter((t: any) => t.token !== req.params.token);
    await settings.save();
    res.json({ success: true, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Package purchases (includes old Payment records)
router.get('/purchases', async (req, res) => {
  try {
    const { status, tier, page = 1, limit = 20, from, to, paymentMethod, search } = req.query;
    const ppFilter: any = {};
    if (status) ppFilter.status = status;
    if (tier) ppFilter.packageTier = tier;
    if (paymentMethod) ppFilter.paymentMethod = paymentMethod;
    if (from || to) {
      ppFilter.createdAt = {};
      if (from) ppFilter.createdAt.$gte = new Date(from as string);
      if (to) { const d = new Date(to as string); d.setHours(23,59,59,999); ppFilter.createdAt.$lte = d; }
    }

    const payFilter: any = {};
    if (status) payFilter.status = status;
    if (from || to) {
      payFilter.createdAt = {};
      if (from) payFilter.createdAt.$gte = new Date(from as string);
      if (to) { const d = new Date(to as string); d.setHours(23,59,59,999); payFilter.createdAt.$lte = d; }
    }

    const [ppData, payData] = await Promise.all([
      PackagePurchase.find(ppFilter).populate('user', 'name email phone').sort('-createdAt').lean(),
      tier || paymentMethod
        ? Promise.resolve([])
        : Payment.find(payFilter).populate('user', 'name email phone').populate('course', 'title').sort('-createdAt').lean(),
    ]);

    // Merge both, tag with _type, sort by date
    let merged: any[] = [
      ...ppData.map((p: any) => ({ ...p, _type: 'package' })),
      ...payData.map((p: any) => ({
        ...p,
        _type: 'payment',
        packageTier: 'course',
        totalAmount: p.amount,
        gstAmount: 0,
        paymentMethod: p._migratedGateway || 'razorpay',
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search) {
      const q = (search as string).toLowerCase();
      merged = merged.filter((p: any) =>
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.user?.phone?.includes(q) ||
        p.invoiceNumber?.toLowerCase().includes(q)
      );
    }

    const total = merged.length;
    const lim = Number(limit);
    const skip = (Number(page) - 1) * lim;
    const purchases = lim >= 9999 ? merged : merged.slice(skip, skip + lim);
    res.json({ success: true, purchases, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Invoice data for a specific PackagePurchase
router.get('/purchases/:id/invoice', async (req, res) => {
  try {
    const purchase = await PackagePurchase.findById(req.params.id)
      .populate('user', 'name email phone state country')
      .populate('package', 'name tier description');
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    const settings = await PlatformSettings.findOne();
    res.json({ success: true, purchase, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Invoice data for old Payment records
router.get('/payments/:id/invoice', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone state country')
      .populate('course', 'title description thumbnail');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    const settings = await PlatformSettings.findOne();
    res.json({ success: true, payment, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Commissions
router.get('/commissions', async (req, res) => {
  try {
    const { level, status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (level) filter.level = Number(level);
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [commissions, total] = await Promise.all([
      Commission.find(filter).populate('earner', 'name email').populate('buyer', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)),
      Commission.countDocuments(filter),
    ]);
    res.json({ success: true, commissions, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.hrStatus) filter.hrStatus = req.query.hrStatus;
    else if (req.query.status) filter.status = req.query.status;
    const withdrawals = await Withdrawal.find(filter)
      .populate('user', 'name email phone kyc wallet packageTier')
      .populate('hrApprovedBy', 'name email')
      .sort('-createdAt');
    res.json({ success: true, withdrawals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// HR Approve withdrawal — auto-triggers Razorpay Payout
router.patch('/withdrawals/:id/hr-approve', async (req: any, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user', 'name email phone kyc');
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.hrStatus !== 'pending') return res.status(400).json({ success: false, message: 'Already processed by HR' });

    withdrawal.hrStatus = 'approved';
    withdrawal.hrApprovedBy = req.user._id;
    withdrawal.hrApprovedAt = new Date();
    withdrawal.status = 'processing';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Auto-trigger Razorpay Payout if configured
    let payoutMsg = 'Withdrawal approved. Please process payment manually.';
    let autoPayoutTriggered = false;

    if (isPayoutConfigured()) {
      try {
        const partner = withdrawal.user as any;
        const kyc = partner?.kyc || {};
        const { payoutId, status } = await initiateWithdrawalPayout({
          withdrawalId: withdrawal._id.toString(),
          netAmount: withdrawal.netAmount || withdrawal.amount,
          partnerName: partner?.name || 'Partner',
          partnerEmail: partner?.email || '',
          partnerPhone: partner?.phone,
          bankAccountNumber: withdrawal.accountNumber || kyc.bankAccount || '',
          bankIfsc: withdrawal.ifscCode || kyc.bankIfsc || '',
          bankHolderName: withdrawal.accountName || kyc.bankHolderName || partner?.name || '',
        });

        withdrawal.razorpayPayoutId = payoutId;
        // If payout is already processed instantly
        if (status === 'processed') {
          withdrawal.status = 'completed';
          payoutMsg = `Payment transferred automatically! Payout ID: ${payoutId}`;
        } else {
          payoutMsg = `Auto payout initiated! Payout ID: ${payoutId}. Status will update via webhook.`;
        }
        await withdrawal.save();
        autoPayoutTriggered = true;
      } catch (payoutErr: any) {
        // Don't fail the approval if payout fails — log and continue
        console.error('[Payout Error]', payoutErr?.response?.data || payoutErr.message);
        payoutMsg = 'Withdrawal approved. Auto payout failed — please transfer manually. Error: ' + (payoutErr?.response?.data?.description || payoutErr.message);
      }
    }

    res.json({ success: true, message: payoutMsg, autoPayoutTriggered, withdrawal });

    // Push notify + email/WhatsApp in background
    setImmediate(async () => {
      try {
        const { notify } = await import('../services/pushService');
        const { sendWithdrawalSuccessEmail } = await import('../services/emailService');
        const { sendWhatsAppText } = await import('../services/whatsappMetaService');
        const w = withdrawal as any;
        const partner = w.user as any;
        const amt = w.netAmount || w.amount;

        // Push notification
        await notify(partner?._id || w.user, '✅ Withdrawal Approved!', `₹${amt} withdrawal has been approved and is being processed.`, { type: 'success', url: '/partner/withdraw', tag: 'withdrawal' }).catch(() => {});

        // If Razorpay auto-payout completed instantly → send success email+WA
        if (autoPayoutTriggered && w.status === 'completed') {
          const txId = w.razorpayPayoutId || 'AUTO';
          const completedAt = new Date();
          const dateStr = completedAt.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

          if (partner?.email) {
            await sendWithdrawalSuccessEmail(partner.email, {
              name: partner.name, amount: w.amount, tdsAmount: w.tdsAmount,
              gatewayFee: w.gatewayFee, netAmount: w.netAmount, transactionId: txId,
              bankAccount: w.accountNumber || partner?.kyc?.bankAccount,
              bankName: partner?.kyc?.bankName,
              accountName: w.accountName || partner?.kyc?.bankHolderName,
              completedAt,
            }).catch(() => {});
          }

          if (partner?.phone) {
            const msg = `*TruLearnix — Withdrawal Successful* ✅\n\nHi ${partner.name},\n\n` +
              `Your withdrawal of *₹${w.amount.toLocaleString('en-IN')}* has been processed!\n\n` +
              `💰 *Net Credited:* ₹${w.netAmount.toLocaleString('en-IN')}\n` +
              `🔖 *Transaction ID:* ${txId}\n` +
              `📅 *Date & Time:* ${dateStr}\n` +
              `📊 TDS (2%): ₹${w.tdsAmount.toLocaleString('en-IN')} | Gateway: ₹${w.gatewayFee.toFixed(2)}\n\n` +
              `Amount credited to your registered bank account.\n\nFor queries: support@trulearnix.com`;
            await sendWhatsAppText(partner.phone, msg).catch(() => {});
          }
        }
      } catch {}
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// HR Reject withdrawal
router.patch('/withdrawals/:id/hr-reject', async (req: any, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.hrStatus !== 'pending') return res.status(400).json({ success: false, message: 'Already processed by HR' });

    withdrawal.hrStatus = 'rejected';
    withdrawal.hrRejectionReason = reason;
    withdrawal.hrApprovedBy = req.user._id;
    withdrawal.hrApprovedAt = new Date();
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Refund wallet
    await User.findByIdAndUpdate(withdrawal.user, { $inc: { wallet: withdrawal.amount, totalWithdrawn: -withdrawal.amount } });

    res.json({ success: true, message: 'Withdrawal rejected and amount refunded to partner wallet.', withdrawal });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mark withdrawal as completed (after payment done)
router.patch('/withdrawals/:id/complete', async (req: any, res) => {
  try {
    const { transactionRef } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user', 'name email phone kyc');
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.hrStatus !== 'approved') return res.status(400).json({ success: false, message: 'HR approval required first' });

    const completedAt = new Date();
    withdrawal.status = 'completed';
    if (transactionRef) withdrawal.razorpayPayoutId = transactionRef;
    withdrawal.processedAt = completedAt;
    await withdrawal.save();

    res.json({ success: true, message: 'Withdrawal marked as completed.', withdrawal });

    // Send email + WhatsApp to partner
    setImmediate(async () => {
      try {
        const { sendWithdrawalSuccessEmail } = await import('../services/emailService');
        const { sendWhatsAppText } = await import('../services/whatsappMetaService');
        const partner = withdrawal.user as any;
        const txId = transactionRef || withdrawal.razorpayPayoutId || 'N/A';
        const dateStr = completedAt.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        if (partner?.email) {
          await sendWithdrawalSuccessEmail(partner.email, {
            name: partner.name,
            amount: withdrawal.amount,
            tdsAmount: withdrawal.tdsAmount,
            gatewayFee: withdrawal.gatewayFee,
            netAmount: withdrawal.netAmount,
            transactionId: txId,
            bankAccount: withdrawal.accountNumber || partner?.kyc?.bankAccount,
            bankName: partner?.kyc?.bankName,
            accountName: withdrawal.accountName || partner?.kyc?.bankHolderName,
            completedAt,
          }).catch(() => {});
        }

        if (partner?.phone) {
          const msg = `*TruLearnix — Withdrawal Successful* ✅\n\nHi ${partner.name},\n\n` +
            `Your withdrawal of *₹${withdrawal.amount.toLocaleString('en-IN')}* has been processed!\n\n` +
            `💰 *Net Credited:* ₹${withdrawal.netAmount.toLocaleString('en-IN')}\n` +
            `🔖 *Transaction ID:* ${txId}\n` +
            `📅 *Date & Time:* ${dateStr}\n` +
            `📊 TDS (2%): ₹${withdrawal.tdsAmount.toLocaleString('en-IN')} | Gateway: ₹${withdrawal.gatewayFee.toFixed(2)}\n\n` +
            `Amount credited to your registered bank account.\n\nFor queries: support@trulearnix.com`;
          await sendWhatsAppText(partner.phone, msg).catch(() => {});
        }
      } catch {}
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Support tickets
router.get('/tickets', getTickets);
router.patch('/tickets/:id', updateTicket);

// TruLance — Projects
router.get('/trulance/projects', async (req, res) => {
  try {
    const FreelanceJob = (await import('../models/FreelanceJob')).default;
    const { status, category, search, page = 1, limit = 20 } = req.query as any;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      FreelanceJob.find(filter).populate('postedBy', 'name email avatar').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      FreelanceJob.countDocuments(filter),
    ]);
    res.json({ success: true, data: projects, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/trulance/projects/:id', async (req, res) => {
  try {
    const FreelanceJob = (await import('../models/FreelanceJob')).default;
    const project = await FreelanceJob.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/trulance/projects/:id', async (req, res) => {
  try {
    const FreelanceJob = (await import('../models/FreelanceJob')).default;
    await FreelanceJob.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// TruLance — Freelancers (students)
router.get('/trulance/freelancers', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query as any;
    const filter: any = { role: 'student' };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('name email avatar expertise xpPoints level packageTier isActive createdAt').sort({ xpPoints: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Mentor Management ──────────────────────────────────────────────────────────
router.post('/mentors', async (req: any, res) => {
  try {
    const { name, email, password, phone, expertise, bio } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    const mentor = await User.create({
      name, email, password, phone: phone || '',
      role: 'mentor',
      mentorStatus: 'approved',
      isVerified: true,
      isActive: true,
      permissions: ['dashboard', 'kanban', 'reminders', 'calendar', 'materials', 'courses', 'live-classes'],
      mentorApplication: {
        bio: bio || '',
        expertise: expertise ? expertise.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        appliedAt: new Date(),
        reviewedAt: new Date(),
      },
    });
    const { password: _, ...safe } = mentor.toObject();
    res.json({ success: true, mentor: safe, message: 'Mentor created successfully' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/mentors', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20, search } = req.query;
    const filter: any = { role: 'mentor' };
    if (status !== 'all') filter.mentorStatus = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [mentors, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken -otp').sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    // Enrich with course performance
    const ids = mentors.map((m: any) => m._id);
    const courseAgg = await Course.aggregate([
      { $match: { mentor: { $in: ids } } },
      { $group: { _id: '$mentor', courseCount: { $sum: 1 }, totalStudents: { $sum: '$enrolledCount' }, avgRating: { $avg: '$rating' }, publishedCourses: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } } } }
    ]);
    const perfMap: any = {};
    courseAgg.forEach((r: any) => { perfMap[r._id] = { courseCount: r.courseCount, totalStudents: r.totalStudents, avgRating: parseFloat((r.avgRating || 0).toFixed(1)), publishedCourses: r.publishedCourses }; });
    const enriched = mentors.map((m: any) => ({ ...m.toObject(), _perf: perfMap[m._id.toString()] || {} }));
    res.json({ success: true, mentors: enriched, total, pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/mentors/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { mentorStatus: 'approved', isVerified: true, isActive: true, 'mentorApplication.reviewedAt': new Date() },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/mentors/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id,
      { mentorStatus: 'rejected', isActive: false, 'mentorApplication.reviewedAt': new Date(), 'mentorApplication.rejectionReason': reason || '' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/mentors/:id/assign-course', async (req, res) => {
  try {
    const { courseId, maxStudents } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required' });
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });
    const alreadyAssigned = mentor.assignedCourses?.some((c: any) => c.courseId.toString() === courseId);
    if (alreadyAssigned) return res.status(400).json({ success: false, message: 'Course already assigned to this mentor' });
    mentor.assignedCourses = [...(mentor.assignedCourses || []), { courseId, maxStudents: maxStudents || null, assignedAt: new Date() }] as any;
    await mentor.save();
    const updated = await User.findById(mentor._id).select('-password').populate('assignedCourses.courseId', 'title thumbnail');
    res.json({ success: true, mentor: updated });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/mentors/:id/assign-course/:courseId', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { assignedCourses: { courseId: req.params.courseId } }
    });
    res.json({ success: true, message: 'Course unassigned' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Reset any user's password (admin use)
router.patch('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = password; // pre-save hook will hash it
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/mentors/:id/give-package', async (req: any, res) => {
  try {
    const { packageTier } = req.body;
    const rates: Record<string, number> = { free: 0, starter: 10, pro: 15, elite: 22, supreme: 30 };
    const updates: any = { packageTier, commissionRate: rates[packageTier] || 0, isAffiliate: packageTier !== 'free', packagePurchasedAt: new Date() };
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Employee Permission Defaults ───────────────────────────────────────────────
const ALL_PERMISSIONS = ['dashboard','analytics','users','learners','employees','packages','finance','reports','marketing','crm','mentors','courses','live-classes','blog','support','coupons','notifications','popups','content','kanban','calendar','reminders','goals','funnel','ads-tracking','materials','achievements','security','trulance'];

const DEFAULT_DEPT_PERMISSIONS: Record<string, string[]> = {
  hr:         ['dashboard','users','learners','employees','kanban','reminders','calendar'],
  sales:      ['dashboard','crm','analytics','packages','marketing','learners','kanban','reminders','calendar'],
  marketing:  ['dashboard','marketing','blog','content','analytics','notifications','popups','ads-tracking','funnel','kanban','reminders','calendar'],
  content:    ['dashboard','blog','courses','materials','content','live-classes','kanban','reminders','calendar'],
  finance:    ['dashboard','finance','analytics','packages','kanban','reminders','calendar'],
  operations: ['dashboard','kanban','calendar','reminders','goals','funnel','analytics'],
  support:    ['dashboard','support','users','notifications','kanban','reminders','calendar'],
  tech:       ALL_PERMISSIONS,
  general:    ['dashboard','kanban','reminders','calendar'],
};

// ── Employees ──────────────────────────────────────────────────────────────────
router.get('/employees', async (req, res) => {
  try {
    const { department, search, page = 1, limit = 20 } = req.query as any;
    const filter: any = { role: { $in: ['superadmin', 'admin', 'manager', 'department_head', 'team_lead', 'employee'] } };
    if (department) filter.department = department;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [employees, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken -otp').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, employees, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/employees', async (req: any, res) => {
  try {
    const { name, email, phone, role = 'manager', department = 'general', password, joiningDate, permissions } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const count = await User.countDocuments({ role: { $in: ['superadmin', 'admin', 'manager', 'department_head', 'team_lead', 'employee'] } });
    const empId = `EMP${String(count + 1).padStart(4, '0')}`;
    // superadmin/admin get all permissions, otherwise use provided or department defaults
    const resolvedPerms = ['superadmin', 'admin'].includes(role)
      ? ALL_PERMISSIONS
      : (permissions && permissions.length ? permissions : DEFAULT_DEPT_PERMISSIONS[department] || ['dashboard']);
    const employee = await User.create({
      name, email: email.toLowerCase(), phone, role, department, password,
      employeeId: empId, joiningDate: joiningDate || new Date(),
      isVerified: true, isActive: true, permissions: resolvedPerms,
    });
    const safe = employee.toObject() as any;
    delete safe.password;
    res.status(201).json({ success: true, employee: safe });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Employee Performance ──────────────────────────────────────────────────────
router.get('/employees/:id/performance', async (req, res) => {
  try {
    const Attendance = (await import('../models/Attendance')).default;
    const Task       = (await import('../models/Task')).default;
    const Goal       = (await import('../models/Goal')).default;

    const emp = await User.findById(req.params.id).select('-password');
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Current month attendance
    const attendance = await Attendance.find({ user: emp._id, month, year });
    const attStats = { present: 0, absent: 0, halfDay: 0, leave: 0, total: attendance.length };
    for (const a of attendance) {
      if (a.status === 'present')   attStats.present++;
      else if (a.status === 'absent')   attStats.absent++;
      else if (a.status === 'half-day') attStats.halfDay++;
      else if (a.status === 'leave')    attStats.leave++;
    }
    const attPct = attStats.total > 0 ? Math.round(((attStats.present + attStats.halfDay * 0.5) / attStats.total) * 100) : 0;

    // Last 3 months attendance trend
    const trend = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const recs = await Attendance.find({ user: emp._id, month: m, year: y });
      const p = recs.filter(r => r.status === 'present').length;
      const h = recs.filter(r => r.status === 'half-day').length;
      const total = recs.length;
      trend.push({ month: m, year: y, present: p, halfDay: h, absent: recs.filter(r => r.status === 'absent').length, total, pct: total > 0 ? Math.round(((p + h * 0.5) / total) * 100) : 0 });
    }

    // Tasks
    const tasks = await Task.find({ assignedTo: emp._id }).sort({ createdAt: -1 });
    const taskStats = { todo: 0, inProgress: 0, review: 0, done: 0, total: tasks.length };
    for (const t of tasks) {
      if (t.status === 'todo')        taskStats.todo++;
      else if (t.status === 'in-progress') taskStats.inProgress++;
      else if (t.status === 'review')      taskStats.review++;
      else if (t.status === 'done')        taskStats.done++;
    }
    const completionPct = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;
    const recentTasks = tasks.slice(0, 8);

    // Goals
    const goals = await Goal.find({ owner: emp._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      employee: emp,
      attendance: { ...attStats, pct: attPct, month, year },
      attendanceTrend: trend,
      tasks: { ...taskStats, completionPct, recent: recentTasks },
      goals,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/employees/:id/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ success: false, message: 'permissions must be an array' });
    const emp = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true }).select('-password');
    res.json({ success: true, employee: emp });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/employees/:id', async (req, res) => {
  try {
    const { role, department, isActive, name, phone, permissions } = req.body;
    const updates: any = {};
    if (role) updates.role = role;
    if (department) updates.department = department;
    if (isActive !== undefined) updates.isActive = isActive;
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (permissions !== undefined) updates.permissions = permissions;
    const emp = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ success: true, employee: emp });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/employees/:id', async (req: any, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Learners (purchased vs free) ───────────────────────────────────────────────
router.get('/learners', async (req, res) => {
  try {
    const { type = 'all', tier, search, page = 1, limit = 20 } = req.query as any;
    const filter: any = { role: 'student' };
    // Dynamically resolve paid tiers from Package collection
    const allPackages = await Package.find({ isActive: true }).select('tier name price').lean();
    const PAID_TIERS = [...new Set(allPackages.map((p: any) => p.tier).filter(Boolean))];
    if (tier) { filter.packageTier = tier; }
    else if (type === 'purchased') filter.packageTier = { $in: PAID_TIERS };
    else if (type === 'free') filter.packageTier = { $nin: PAID_TIERS };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const Enrollment = (await import('../models/Enrollment')).default;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const [learners, total, purchasedCount, freeCount, thisMonthCount] = await Promise.all([
      User.find(filter).select('name email phone avatar packageTier isActive createdAt packagePurchasedAt affiliateCode xpPoints level expertise bio socialLinks referredBy').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
      User.countDocuments({ role: 'student', packageTier: { $in: PAID_TIERS.length ? PAID_TIERS : ['__none__'] } }),
      User.countDocuments({ role: 'student', packageTier: { $nin: PAID_TIERS.length ? PAID_TIERS : [] } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: startOfMonth } }),
    ]);
    // Enrich with enrollment performance
    const ids = learners.map((u: any) => u._id);
    const [enrollAgg, completeAgg] = await Promise.all([
      Enrollment.aggregate([
        { $match: { student: { $in: ids } } },
        { $group: { _id: '$student', enrollCount: { $sum: 1 }, avgProgress: { $avg: '$progressPercent' } } }
      ]),
      Enrollment.aggregate([
        { $match: { student: { $in: ids }, completedAt: { $exists: true, $ne: null } } },
        { $group: { _id: '$student', completedCount: { $sum: 1 } } }
      ]),
    ]);
    const perfMap: any = {};
    enrollAgg.forEach((r: any) => { perfMap[r._id] = { enrollCount: r.enrollCount, avgProgress: Math.round(r.avgProgress || 0) }; });
    completeAgg.forEach((r: any) => { if (perfMap[r._id]) perfMap[r._id].completedCount = r.completedCount; });
    const enriched = learners.map((u: any) => ({ ...u.toObject(), _perf: perfMap[u._id.toString()] || {} }));
    res.json({ success: true, learners: enriched, total, pages: Math.ceil(total / parseInt(limit)), stats: { purchasedCount, freeCount, thisMonthCount }, packages: allPackages });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/learners/:id/brand — Full brand profile of a learner
router.get('/learners/:id/brand', async (req, res) => {
  try {
    const Certificate = (await import('../models/Certificate')).default;
    const Enrollment = (await import('../models/Enrollment')).default;
    const PackagePurchase = (await import('../models/PackagePurchase')).default;
    const [user, certs, enrollments, purchases] = await Promise.all([
      User.findById(req.params.id).select('name email avatar bio expertise socialLinks packageTier xpPoints level streak createdAt packagePurchasedAt packageExpiresAt isActive phone'),
      Certificate.find({ student: req.params.id }).populate('course', 'title thumbnail').sort('-issuedAt'),
      Enrollment.find({ student: req.params.id }).populate('course', 'title thumbnail').select('course progress completedAt progressPercent'),
      PackagePurchase.find({ user: req.params.id, status: 'paid' }).populate('package', 'name tier price').sort('-createdAt').limit(5),
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'Learner not found' });
    const completeness = {
      avatar: !!(user as any).avatar,
      linkedin: !!(user as any).socialLinks?.linkedin,
      skills: ((user as any).expertise || []).length > 0,
      portfolio: enrollments.length > 0,
      certificate: certs.length > 0,
    };
    const pct = Math.round((Object.values(completeness).filter(Boolean).length / 5) * 100);
    res.json({ success: true, user, certs, enrollments, completeness, pct, purchases });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/jobs — Platform jobs overview + internal freelance jobs with applicants
router.get('/jobs', async (req, res) => {
  try {
    const FreelanceJob = (await import('../models/FreelanceJob')).default;
    const { status, search, page = 1, limit = 20 } = req.query as any;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { skills: { $regex: search, $options: 'i' } },
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total, openCount, closedCount, inProgressCount] = await Promise.all([
      FreelanceJob.find(filter)
        .populate('postedBy', 'name avatar email packageTier')
        .populate('applicants', 'name avatar email packageTier expertise')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      FreelanceJob.countDocuments(filter),
      FreelanceJob.countDocuments({ status: 'open' }),
      FreelanceJob.countDocuments({ status: 'closed' }),
      FreelanceJob.countDocuments({ status: 'in-progress' }),
    ]);
    res.json({ success: true, jobs, total, pages: Math.ceil(total / parseInt(limit)), stats: { open: openCount, closed: closedCount, inProgress: inProgressCount } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /admin/jobs/:id/status — Update job status
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const FreelanceJob = (await import('../models/FreelanceJob')).default;
    const job = await FreelanceJob.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /admin/jobs/:id
router.delete('/jobs/:id', async (req, res) => {
  try {
    const FreelanceJob = (await import('../models/FreelanceJob')).default;
    await FreelanceJob.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Reports ────────────────────────────────────────────────────────────────────

// GET /admin/reports/commission?from=&to=&status=&search=
router.get('/reports/commission', async (req, res) => {
  try {
    const { from, to, status, search } = req.query as any;
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (status) dateFilter.status = status;
    const rows = await Commission.aggregate([
      { $match: { ...dateFilter } },
      { $lookup: { from: 'users', localField: 'earner', foreignField: '_id', as: 'earner' } },
      { $unwind: '$earner' },
      { $lookup: { from: 'packagepurchases', localField: 'purchase', foreignField: '_id', as: 'purchase' } },
      { $unwind: { path: '$purchase', preserveNullAndEmptyArrays: true } },
      { $project: {
        earnerName: '$earner.name', earnerEmail: '$earner.email', earnerPhone: '$earner.phone',
        packageTier: '$earner.packageTier', commissionAmount: 1, status: 1, createdAt: 1,
        tds: { $multiply: ['$commissionAmount', 0.02] }, net: { $multiply: ['$commissionAmount', 0.98] },
        purchaseAmount: '$purchase.totalAmount',
      }},
      { $sort: { createdAt: -1 } },
    ]);
    const filtered = search ? rows.filter((r: any) => r.earnerName?.toLowerCase().includes(search.toLowerCase()) || r.earnerEmail?.toLowerCase().includes(search.toLowerCase())) : rows;
    const summary = filtered.reduce((acc: any, r: any) => ({
      totalCommission: acc.totalCommission + r.commissionAmount,
      totalTds: acc.totalTds + r.tds,
      totalNet: acc.totalNet + r.net,
      count: acc.count + 1,
    }), { totalCommission: 0, totalTds: 0, totalNet: 0, count: 0 });
    res.json({ success: true, rows: filtered, summary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/reports/sales?from=&to=&tier=
router.get('/reports/sales', async (req, res) => {
  try {
    const { from, to, tier } = req.query as any;
    const dateFilter: any = { status: 'paid' };
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (tier) dateFilter.packageTier = tier;
    const [rows, byTier] = await Promise.all([
      PackagePurchase.find(dateFilter).populate('user', 'name email phone').sort('-createdAt').lean(),
      PackagePurchase.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$packageTier', count: { $sum: 1 }, gross: { $sum: '$totalAmount' }, net: { $sum: '$amount' }, gst: { $sum: '$gstAmount' } } },
        { $sort: { gross: -1 } }
      ])
    ]);
    const summary = rows.reduce((acc: any, r: any) => ({
      gross: acc.gross + r.totalAmount, net: acc.net + r.amount, gst: acc.gst + r.gstAmount, count: acc.count + 1
    }), { gross: 0, net: 0, gst: 0, count: 0 });
    res.json({ success: true, rows, byTier, summary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/reports/performance?from=&to=
router.get('/reports/performance', async (req, res) => {
  try {
    const { from, to } = req.query as any;
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    const [mentorStats, courseStats, classStats] = await Promise.all([
      // Mentor performance: commissions earned, classes taught
      Commission.aggregate([
        { $match: { status: { $in: ['paid', 'approved'] }, ...dateFilter } },
        { $group: { _id: '$earner', totalCommission: { $sum: '$commissionAmount' }, referrals: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', packageTier: '$user.packageTier', totalCommission: 1, referrals: 1 } },
        { $sort: { totalCommission: -1 } },
        { $limit: 50 },
      ]),
      // Course stats
      Course.aggregate([
        { $project: { title: 1, mentor: 1, enrollmentCount: { $size: { $ifNull: ['$enrolledStudents', []] } }, status: 1, price: 1 } },
        { $lookup: { from: 'users', localField: 'mentor', foreignField: '_id', as: 'mentor' } },
        { $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } },
        { $project: { title: 1, mentorName: '$mentor.name', enrollmentCount: 1, status: 1, price: 1 } },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 20 },
      ]),
      // Live class stats
      LiveClass.aggregate([
        { $match: { status: 'ended', ...dateFilter } },
        { $group: {
          _id: '$mentor',
          classesHeld: { $sum: 1 },
          totalStudents: { $sum: { $size: { $ifNull: ['$attendanceRecords', []] } } },
          avgAttendance: { $avg: { $size: { $ifNull: ['$attendanceRecords', []] } } },
        }},
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'mentor' } },
        { $unwind: '$mentor' },
        { $project: { name: '$mentor.name', email: '$mentor.email', classesHeld: 1, totalStudents: 1, avgAttendance: { $round: ['$avgAttendance', 1] } } },
        { $sort: { classesHeld: -1 } },
      ]),
    ]);
    res.json({ success: true, mentorStats, courseStats, classStats });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/reports/team?dept=&role=&status=
router.get('/reports/team', async (req, res) => {
  try {
    const { dept, role, status } = req.query as any;
    const filter: any = { role: { $in: ['admin', 'manager', 'employee', 'salesperson', 'department_head', 'team_lead'] } };
    if (dept) filter.department = dept;
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    const [employees, byDept] = await Promise.all([
      User.find(filter)
        .select('name email phone role department employeeId joiningDate permissions isActive createdAt')
        .sort('department name').lean(),
      User.aggregate([
        { $match: { role: { $in: ['admin', 'manager', 'employee', 'salesperson', 'department_head', 'team_lead'] } } },
        { $group: { _id: '$department', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
        { $sort: { count: -1 } }
      ])
    ]);
    normalizeAvatars(employees as any[]);
    res.json({ success: true, employees, byDept, total: employees.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/reports/learners?from=&to=&tier=&status=&search=
router.get('/reports/learners', async (req, res) => {
  try {
    const { from, to, tier, status, search } = req.query as any;
    const dateFilter: any = { role: 'student' };
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (tier) dateFilter.packageTier = tier;
    if (status === 'active') dateFilter.isActive = true;
    if (status === 'inactive') dateFilter.isActive = false;
    if (search) dateFilter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const [learners, byTier, byMonth] = await Promise.all([
      User.find(dateFilter).select('name email phone packageTier xp level isActive createdAt').sort('-createdAt').limit(500).lean(),
      User.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$packageTier', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 }, purchased: { $sum: { $cond: [{ $ne: ['$packageTier', 'free'] }, 1, 0] } } } },
        { $sort: { _id: 1 } }
      ]),
    ]);
    const summary = {
      total: learners.length,
      purchased: learners.filter((l: any) => l.packageTier && l.packageTier !== 'free').length,
      free: learners.filter((l: any) => !l.packageTier || l.packageTier === 'free').length,
    };
    res.json({ success: true, learners, byTier, byMonth, summary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Broadcast notification
router.post('/notify', async (req, res) => {
  try {
    const { title, message, type, roles, url } = req.body;
    const Notification = (await import('../models/Notification')).default;
    const users = await User.find(roles?.length ? { role: { $in: roles } } : {}).select('_id');
    const notifications = users.map((u: any) => ({ user: u._id, title, message, type: type || 'info', channel: 'inapp', actionUrl: url }));
    await Notification.insertMany(notifications);
    // Send push notifications to all matched users
    try {
      const { sendPushToUsers } = await import('../services/pushService');
      await sendPushToUsers(users.map((u: any) => u._id), { title, body: message, type: type || 'info', url: url || '/', tag: 'broadcast', sound: true });
    } catch {}
    res.json({ success: true, sent: notifications.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/admin/emi ─────────────────────────────────────────────────────────
router.get('/emi', async (req, res) => {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;
    const { status } = req.query;

    const filter: any = {};
    if (status && status !== 'all') filter.status = status;

    const installments = await EmiInstallment.find(filter)
      .populate('user', 'name email phone wallet packageSuspended')
      .populate('packagePurchase', 'packageTier amount totalAmount affiliateCode referredBy')
      .populate('partnerUser', 'name phone affiliateCode')
      .sort({ createdAt: -1 })
      .lean();

    // Group by packagePurchase
    const grouped: Record<string, any> = {};
    for (const inst of installments) {
      const ppId = (inst.packagePurchase as any)?._id?.toString() || inst.packagePurchase?.toString() || 'unknown';
      if (!grouped[ppId]) {
        grouped[ppId] = {
          packagePurchase: inst.packagePurchase,
          user: inst.user,
          installments: [],
        };
      }
      grouped[ppId].installments.push(inst);
    }
    const groups = Object.values(grouped);

    // Stats
    const [totalEmi, totalOverdue, totalPaid] = await Promise.all([
      EmiInstallment.countDocuments({ installmentNumber: 1 }),
      EmiInstallment.countDocuments({ status: 'overdue' }),
      EmiInstallment.countDocuments({ status: 'paid' }),
    ]);
    const collectedAgg = await EmiInstallment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalCollected = collectedAgg[0]?.total || 0;

    res.json({
      success: true,
      groups,
      installments,
      stats: {
        totalEmiPurchases: totalEmi,
        totalOverdue,
        totalPaid,
        totalCollected,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/admin/emi/:installmentId/collect-wallet ─────────────────────────
router.post('/emi/:installmentId/collect-wallet', async (req, res) => {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;
    const Transaction = (await import('../models/Transaction')).default;
    const Commission = (await import('../models/Commission')).default;

    const inst = await EmiInstallment.findById(req.params.installmentId)
      .populate('user', 'name email phone wallet packageSuspended')
      .populate('packagePurchase', 'packageTier totalAmount');
    if (!inst) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (inst.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    const userDoc = inst.user as any;
    const walletBalance = userDoc?.wallet || 0;
    if (walletBalance <= 0) return res.status(400).json({ success: false, message: `User wallet is empty (₹${walletBalance})` });

    const alreadyUsed = (inst as any).walletAmountUsed || 0;
    const stillNeeded = inst.amount - alreadyUsed;
    if (stillNeeded <= 0) {
      inst.status = 'paid'; inst.paidAt = new Date();
      await inst.save();
      return res.json({ success: true, fullyPaid: true, message: 'Already fully covered by wallet.', walletUsed: 0, remaining: 0 });
    }
    const walletToUse = Math.min(walletBalance, stillNeeded);
    const remaining = stillNeeded - walletToUse;

    // Deduct from user wallet
    const updatedUser = await User.findByIdAndUpdate(
      userDoc._id,
      { $inc: { wallet: -walletToUse } },
      { new: true }
    );
    await Transaction.create({
      user: userDoc._id, type: 'debit', category: 'emi_payment',
      amount: walletToUse,
      description: `Admin collected EMI installment ${inst.installmentNumber}/${inst.totalInstallments} from wallet`,
      referenceId: String(inst._id), status: 'completed',
      balanceAfter: updatedUser?.wallet || 0,
    });

    (inst as any).walletAmountUsed = alreadyUsed + walletToUse;

    if (remaining === 0) {
      // Fully paid from wallet
      inst.status = 'paid';
      inst.paidAt = new Date();
      await inst.save();

      // Unlock access if no more pending/overdue
      const stillDue = await EmiInstallment.findOne({
        packagePurchase: inst.packagePurchase,
        status: { $in: ['pending', 'overdue'] },
        _id: { $ne: inst._id },
      });
      if (!stillDue) await User.findByIdAndUpdate(userDoc._id, { packageSuspended: false });

      // Credit partner commission
      if ((inst as any).partnerUser && !(inst as any).partnerCommissionPaid && (inst as any).partnerCommissionAmount > 0) {
        const commAmt = (inst as any).partnerCommissionAmount;
        const updatedPartner = await User.findByIdAndUpdate(
          (inst as any).partnerUser,
          { $inc: { wallet: commAmt, totalEarnings: commAmt } },
          { new: true }
        );
        await Transaction.create({
          user: (inst as any).partnerUser, type: 'credit', category: 'affiliate_commission',
          amount: commAmt,
          description: `EMI installment ${inst.installmentNumber} commission`,
          referenceId: String(inst._id), status: 'completed',
          balanceAfter: updatedPartner?.wallet || 0,
        });
        await Commission.create({
          earner: (inst as any).partnerUser, buyer: inst.user,
          saleAmount: inst.amount, commissionAmount: commAmt,
          saleType: 'package', status: 'approved', level: 1, levelRate: 0,
          earnerCommissionRate: 0, earnerTier: (await User.findById((inst as any).partnerUser).select('packageTier'))?.packageTier || 'basic',
          buyerPackageTier: (inst.packagePurchase as any)?.packageTier || '',
          packagePurchaseId: inst.packagePurchase,
        });
        await EmiInstallment.findByIdAndUpdate(inst._id, { partnerCommissionPaid: true });
        await User.findByIdAndUpdate((inst as any).partnerUser, {
          $push: { notifications: { type: 'commission', message: `₹${commAmt} EMI commission received (Inst ${inst.installmentNumber}/${inst.totalInstallments})`, read: false, createdAt: new Date() } }
        });
      }

      // Credit manager commission
      if ((inst as any).managerUser && !(inst as any).managerCommissionPaid && (inst as any).managerCommissionAmount > 0) {
        const mgrAmt = (inst as any).managerCommissionAmount;
        await User.findByIdAndUpdate((inst as any).managerUser, { $inc: { wallet: mgrAmt, totalEarnings: mgrAmt } });
        await Transaction.create({
          user: (inst as any).managerUser, type: 'credit', category: 'affiliate_commission',
          amount: mgrAmt, description: `Manager EMI commission (Inst ${inst.installmentNumber}/${inst.totalInstallments})`,
          referenceId: String(inst._id), status: 'completed',
        });
        await EmiInstallment.findByIdAndUpdate(inst._id, { managerCommissionPaid: true });
      }

      return res.json({
        success: true, fullyPaid: true,
        message: `₹${walletToUse} collected from wallet. Installment fully paid.`,
        walletUsed: walletToUse, remaining: 0,
        newWalletBalance: updatedUser?.wallet || 0,
      });
    }

    // Partial — mark walletAmountUsed, remaining to be paid via link
    await inst.save();
    return res.json({
      success: true, fullyPaid: false,
      message: `₹${walletToUse} collected from wallet. ₹${remaining} still pending.`,
      walletUsed: walletToUse, remaining,
      newWalletBalance: updatedUser?.wallet || 0,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PATCH /api/admin/emi/:installmentId/mark-paid ─────────────────────────────
router.patch('/emi/:installmentId/mark-paid', async (req, res) => {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;
    const Transaction = (await import('../models/Transaction')).default;
    const Commission = (await import('../models/Commission')).default;

    const inst = await EmiInstallment.findById(req.params.installmentId)
      .populate('user', 'name email phone wallet packageSuspended')
      .populate('packagePurchase', 'packageTier totalAmount');
    if (!inst) return res.status(404).json({ success: false, message: 'Installment not found' });
    if (inst.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    inst.status = 'paid';
    inst.paidAt = new Date();
    await inst.save();

    // Credit partner commission if pending
    if ((inst as any).partnerUser && (inst as any).partnerCommissionAmount > 0 && !(inst as any).partnerCommissionPaid) {
      const commAmt = (inst as any).partnerCommissionAmount;
      const updatedPartner = await User.findByIdAndUpdate(
        (inst as any).partnerUser,
        { $inc: { wallet: commAmt, totalEarnings: commAmt } },
        { new: true }
      );
      await Transaction.create({
        user: (inst as any).partnerUser, type: 'credit', category: 'affiliate_commission',
        amount: commAmt, description: `EMI commission — installment ${inst.installmentNumber}/${inst.totalInstallments}`,
        referenceId: inst._id, status: 'completed',
        balanceAfter: updatedPartner?.wallet || 0,
      });
      await Commission.create({
        earner: (inst as any).partnerUser, buyer: inst.user,
        saleAmount: inst.amount, commissionAmount: commAmt,
        saleType: 'package', status: 'approved', level: 1, levelRate: 0,
        earnerCommissionRate: 0, earnerTier: (await User.findById((inst as any).partnerUser).select('packageTier'))?.packageTier || 'basic',
        buyerPackageTier: (inst.packagePurchase as any)?.packageTier || '',
        packagePurchaseId: inst.packagePurchase,
      });
      await User.findByIdAndUpdate((inst as any).partnerUser, {
        $push: { notifications: { type: 'commission', message: `₹${commAmt} EMI commission received (Inst ${inst.installmentNumber}/${inst.totalInstallments})`, read: false, createdAt: new Date() } }
      });
      (inst as any).partnerCommissionPaid = true;
      await inst.save();
    }

    // Credit manager commission
    if ((inst as any).managerUser && (inst as any).managerCommissionAmount > 0 && !(inst as any).managerCommissionPaid) {
      const mgrAmt = (inst as any).managerCommissionAmount;
      await User.findByIdAndUpdate((inst as any).managerUser, { $inc: { wallet: mgrAmt, totalEarnings: mgrAmt } });
      await Transaction.create({
        user: (inst as any).managerUser, type: 'credit', category: 'affiliate_commission',
        amount: mgrAmt, description: `Manager EMI commission — installment ${inst.installmentNumber}/${inst.totalInstallments}`,
        referenceId: inst._id, status: 'completed',
      });
      await User.findByIdAndUpdate((inst as any).managerUser, {
        $push: { notifications: { type: 'commission', message: `₹${mgrAmt} manager EMI commission (Inst ${inst.installmentNumber}/${inst.totalInstallments})`, read: false, createdAt: new Date() } }
      });
      (inst as any).managerCommissionPaid = true;
      await inst.save();
    }

    // Unlock access if no more overdue/pending installments
    const remaining = await EmiInstallment.findOne({
      packagePurchase: inst.packagePurchase,
      status: { $in: ['pending', 'overdue'] },
    });
    if (!remaining) {
      await User.findByIdAndUpdate(inst.user, { packageSuspended: false });
    }

    res.json({ success: true, message: 'Installment marked as paid', installment: inst });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PATCH /api/admin/emi/:packagePurchaseId/toggle-access ──────────────────────
router.patch('/emi/:packagePurchaseId/toggle-access', async (req, res) => {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;
    const { lock } = req.body; // true = lock, false = unlock
    const inst = await EmiInstallment.findOne({ packagePurchase: req.params.packagePurchaseId });
    if (!inst) return res.status(404).json({ success: false, message: 'No installments found' });
    const updated = await User.findByIdAndUpdate(
      inst.user,
      { packageSuspended: !!lock },
      { new: true }
    ).select('name packageSuspended');
    res.json({ success: true, message: lock ? 'Access locked' : 'Access unlocked', user: updated });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Salesperson Management ──────────────────────────────────────────────────
router.post('/salespersons', async (req: any, res) => {
  try {
    const { name, email, phone, password, department = 'sales', managerId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const count = await User.countDocuments({ role: 'salesperson' });
    const affiliateCode = 'SALES' + String(count + 1).padStart(4, '0');
    const salesperson = await User.create({
      name, email: email.toLowerCase(), phone, password, role: 'salesperson',
      department, affiliateCode, isVerified: true, isActive: true, isAffiliate: true,
      permissions: ['dashboard', 'crm', 'kanban', 'reminders', 'calendar', 'analytics', 'learners'],
      ...(managerId ? { managerId } : {}),
    });
    const safe = salesperson.toObject() as any;
    delete safe.password;
    res.status(201).json({ success: true, salesperson: safe });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/partner-managers', async (req: any, res) => {
  try {
    const { name, email, phone, password, department = 'partner' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const count = await User.countDocuments({ role: 'manager' });
    const empId = `MGR${String(count + 1).padStart(4, '0')}`;
    const manager = await User.create({
      name, email: email.toLowerCase(), phone, password, role: 'manager',
      department, employeeId: empId, isVerified: true, isActive: true,
      permissions: ['dashboard', 'partners', 'crm', 'analytics', 'kanban', 'reminders', 'calendar'],
    });
    const safe = manager.toObject() as any;
    delete safe.password;
    res.status(201).json({ success: true, manager: safe });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/salespersons', async (req, res) => {
  try {
    const { search, page = 1, limit = 30 } = req.query as any;
    const filter: any = { role: 'salesperson' };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const salespersons = await User.find(filter)
      .select('name email phone affiliateCode totalEarnings wallet isActive createdAt department')
      .sort('-createdAt').skip(skip).limit(Number(limit));

    const enriched = await Promise.all(salespersons.map(async s => {
      const [totalOrders, paidOrders] = await Promise.all([
        SalesOrder.countDocuments({ salesperson: s._id }),
        SalesOrder.countDocuments({ salesperson: s._id, status: 'paid' }),
      ]);
      return { ...s.toObject(), totalOrders, paidOrders };
    }));

    const total = await User.countDocuments(filter);
    res.json({ success: true, salespersons: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/leads/assign', async (req, res) => {
  try {
    const Lead = (await import('../models/Lead')).default;
    const { leadIds, salespersonId } = req.body;
    if (!leadIds?.length || !salespersonId) {
      return res.status(400).json({ success: false, message: 'leadIds and salespersonId are required' });
    }
    await Lead.updateMany({ _id: { $in: leadIds } }, { assignedTo: salespersonId });
    res.json({ success: true, message: `${leadIds.length} lead(s) assigned` });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/sales-orders', async (req, res) => {
  try {
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const { status, salesperson, page = 1, limit = 20 } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    if (salesperson) filter.salesperson = salesperson;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      SalesOrder.find(filter)
        .populate('salesperson', 'name email phone')
        .populate('package', 'name tier price')
        .sort('-createdAt').skip(skip).limit(Number(limit)),
      SalesOrder.countDocuments(filter),
    ]);
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/sales-stats', async (_req, res) => {
  try {
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const Lead = (await import('../models/Lead')).default;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const [totalSalespersons, totalOrders, paidOrders, monthlyOrders, tokenOrders, tokenLeads] = await Promise.all([
      User.countDocuments({ role: 'salesperson' }),
      SalesOrder.countDocuments(),
      SalesOrder.countDocuments({ status: 'paid' }),
      SalesOrder.countDocuments({ status: 'paid', createdAt: { $gte: startOfMonth } }),
      SalesOrder.countDocuments({ status: 'token_paid' }),
      Lead.countDocuments({ stage: 'token_collected' }),
    ]);
    const [revenue, tokenRevenue] = await Promise.all([
      SalesOrder.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, commissions: { $sum: '$commissionAmount' } } },
      ]),
      SalesOrder.aggregate([
        { $match: { status: 'token_paid' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
    ]);
    res.json({ success: true, stats: {
      totalSalespersons, totalOrders, paidOrders, monthlyOrders,
      tokenOrders, tokenLeads,
      totalRevenue: revenue[0]?.total || 0,
      totalCommissions: revenue[0]?.commissions || 0,
      tokenRevenue: tokenRevenue[0]?.total || 0,
    }});
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Individual Salesperson Performance ───────────────────────────────────────
router.get('/salespersons/:id/performance', async (req, res) => {
  try {
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const Lead = (await import('../models/Lead')).default;
    const Commission = (await import('../models/Commission')).default;
    const mongoose = (await import('mongoose')).default;
    const { id } = req.params;
    const { stage: stageFilter, dateFilter } = req.query as any;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    // Build lead filter for assigned leads list (with optional stage/date)
    const leadFilter: any = { assignedTo: new mongoose.Types.ObjectId(id) };
    if (stageFilter) leadFilter.stage = stageFilter;
    if (dateFilter === 'today') {
      const s = new Date(); s.setHours(0,0,0,0);
      leadFilter.createdAt = { $gte: s };
    } else if (dateFilter === '7d') {
      const s = new Date(); s.setDate(s.getDate() - 7);
      leadFilter.createdAt = { $gte: s };
    } else if (dateFilter === '30d') {
      const s = new Date(); s.setDate(s.getDate() - 30);
      leadFilter.createdAt = { $gte: s };
    }

    const [
      salesperson, totalLeads, leadsByStageAgg, assignedLeads, orders, monthOrders, commissions
    ] = await Promise.all([
      User.findById(id).select('name email phone affiliateCode totalEarnings wallet isActive department'),
      Lead.countDocuments({ assignedTo: id }),
      Lead.aggregate([
        { $match: { assignedTo: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      Lead.find(leadFilter).sort('-updatedAt').limit(50).lean(),
      SalesOrder.find({ salesperson: id })
        .populate('package', 'name tier')
        .sort('-createdAt').limit(20),
      SalesOrder.countDocuments({ salesperson: id, status: 'paid', createdAt: { $gte: startOfMonth } }),
      Commission.aggregate([
        { $match: { earner: new mongoose.Types.ObjectId(id), status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' }, month: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$commissionAmount', 0] } } } },
      ]),
    ]);

    const stageMap: Record<string, number> = {};
    for (const s of leadsByStageAgg) stageMap[s._id] = s.count;

    res.json({ success: true, salesperson, totalLeads, leadsByStage: stageMap, assignedLeads, orders, monthOrders, totalCommissions: commissions[0]?.total || 0, monthCommissions: commissions[0]?.month || 0 });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Partner Training CRUD ─────────────────────────────────────────────────────
router.get('/partner-training', protect, async (_req, res) => {
  try {
    const PartnerTraining = (await import('../models/PartnerTraining')).default;
    const modules = await PartnerTraining.find().sort('order day').lean();
    res.json({ success: true, modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/partner-training', protect, async (req: any, res) => {
  try {
    const PartnerTraining = (await import('../models/PartnerTraining')).default;
    const mod = await PartnerTraining.create(req.body);
    res.json({ success: true, module: mod });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/partner-training/:id', protect, async (req: any, res) => {
  try {
    const PartnerTraining = (await import('../models/PartnerTraining')).default;
    const mod = await PartnerTraining.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, module: mod });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/partner-training/:id', protect, async (req: any, res) => {
  try {
    const PartnerTraining = (await import('../models/PartnerTraining')).default;
    await PartnerTraining.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Partner KYC Management (HR) ───────────────────────────────────────────────
router.get('/kyc', protect, async (req: any, res) => {
  try {
    const { status, page = '1', search = '' } = req.query;
    const pg = parseInt(page as string) || 1;
    const filter: any = { isAffiliate: true };
    if (status && status !== 'all') filter['kyc.status'] = status;
    else filter['kyc.status'] = { $in: ['submitted', 'verified', 'rejected'] };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email phone avatar kyc packageTier affiliateCode createdAt')
        .sort('-kyc.submittedAt').skip((pg - 1) * 20).limit(20).lean(),
      User.countDocuments(filter),
    ]);
    normalizeAvatars(users as any[]);
    const counts = await User.aggregate([
      { $match: { isAffiliate: true, 'kyc.status': { $in: ['submitted', 'verified', 'rejected', 'pending'] } } },
      { $group: { _id: '$kyc.status', count: { $sum: 1 } } },
    ]);
    const statusCounts: Record<string, number> = {};
    for (const c of counts) statusCounts[c._id] = c.count;
    res.json({ success: true, users, total, pages: Math.ceil(total / 20), statusCounts });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/kyc/:userId', protect, async (req: any, res) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action' });
    const update: any = {
      'kyc.status': action === 'approve' ? 'verified' : 'rejected',
      'kyc.reviewedBy': req.user?.name || 'Admin',
    };
    if (action === 'approve') {
      update['kyc.verifiedAt'] = new Date();
      update['kyc.panVerified'] = true;
      update['kyc.aadharVerified'] = true;
      update['kyc.rejectionReason'] = undefined;
    } else {
      update['kyc.rejectionReason'] = rejectionReason || 'Documents unclear or invalid';
    }
    const user = await User.findByIdAndUpdate(req.params.userId, update, { new: true }).select('name email kyc');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Qualifications (admin CRUD) ───────────────────────────────────────────────
router.get('/qualifications', protect, async (_req, res) => {
  try {
    const Qualification = (await import('../models/Qualification')).default as any;
    const items = await Qualification.find().sort({ order: 1 });
    res.json({ success: true, qualifications: items });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/qualifications', protect, async (req: any, res) => {
  try {
    const Qualification = (await import('../models/Qualification')).default as any;
    const item = await Qualification.create(req.body);
    res.json({ success: true, qualification: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/qualifications/:id', protect, async (req: any, res) => {
  try {
    const Qualification = (await import('../models/Qualification')).default as any;
    const item = await Qualification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, qualification: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/qualifications/:id', protect, async (req: any, res) => {
  try {
    const Qualification = (await import('../models/Qualification')).default as any;
    await Qualification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Achievements (admin CRUD) ─────────────────────────────────────────────────
router.get('/achievements', protect, async (_req, res) => {
  try {
    const Achievement = (await import('../models/Achievement')).default as any;
    const items = await Achievement.find().sort({ order: 1 });
    res.json({ success: true, achievements: items });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/achievements', protect, async (req: any, res) => {
  try {
    const Achievement = (await import('../models/Achievement')).default as any;
    const item = await Achievement.create(req.body);
    res.json({ success: true, achievement: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/achievements/:id', protect, async (req: any, res) => {
  try {
    const Achievement = (await import('../models/Achievement')).default as any;
    const item = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, achievement: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/achievements/:id', protect, async (req: any, res) => {
  try {
    const Achievement = (await import('../models/Achievement')).default as any;
    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Report Cards (Founder approval) ─────────────────────────────────────────
router.get('/report-cards', async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;
    else query.status = 'pending_founder';
    const reportCards = await ReportCard.find(query)
      .populate('student', 'name email avatar')
      .populate('course', 'title')
      .sort('-requestedAt');
    res.json({ success: true, reportCards });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/report-cards/:id/approve', async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const rc = await ReportCard.findById(req.params.id);
    if (!rc) return res.status(404).json({ success: false, message: 'Not found' });
    rc.status = 'approved';
    rc.founderApprovedAt = new Date();
    rc.founderApprovedBy = req.user._id;
    await rc.save();
    res.json({ success: true, reportCard: rc });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/report-cards/:id/reject', async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const rc = await ReportCard.findById(req.params.id);
    if (!rc) return res.status(404).json({ success: false, message: 'Not found' });
    rc.status = 'rejected';
    rc.rejectedBy = req.user._id;
    rc.rejectionReason = req.body.reason || 'Rejected by founder';
    await rc.save();
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Mentor Salary Management ────────────────────────────────────────────────────
// GET /admin/mentor-salaries — list all salaries
router.get('/mentor-salaries', async (req: any, res) => {
  try {
    const MentorSalary = (await import('../models/MentorSalary')).default;
    const { mentorId, status, year } = req.query;
    const filter: any = {};
    if (mentorId) filter.mentor = mentorId;
    if (status) filter.status = status;
    if (year) filter.year = Number(year);
    const salaries = await MentorSalary.find(filter)
      .populate('mentor', 'name email phone avatar kyc')
      .populate('approvedBy', 'name')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, salaries });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/mentor-salaries — create salary record
router.post('/mentor-salaries', async (req: any, res) => {
  try {
    const MentorSalary = (await import('../models/MentorSalary')).default;
    const { mentorId, month, year, amount, tdsRate = 10, remarks,
      workingDays, presentDays, absentDays, halfDays, leaveDays, unpaidLeaveDays,
      holidayDays, payableDays, perDayAmount, earnedAmount } = req.body;
    if (!mentorId || !month || !year || !amount) {
      return res.status(400).json({ success: false, message: 'mentorId, month, year, amount required' });
    }
    // Use attendance-based earned amount if provided, else full amount
    const baseAmount = earnedAmount || amount;
    const tds = Math.round(baseAmount * tdsRate / 100);
    const netAmount = baseAmount - tds;

    // Pull bank details from mentor's KYC
    const mentor = await User.findById(mentorId).select('kyc name');
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    const salary = await MentorSalary.create({
      mentor: mentorId,
      month: Number(month), year: Number(year),
      amount, tdsRate: Number(tdsRate), tds, netAmount,
      workingDays: workingDays || 0, presentDays: presentDays || 0,
      absentDays: absentDays || 0, halfDays: halfDays || 0,
      leaveDays: leaveDays || 0, unpaidLeaveDays: unpaidLeaveDays || 0,
      holidayDays: holidayDays || 0, payableDays: payableDays || 0,
      perDayAmount: perDayAmount || 0, earnedAmount: earnedAmount || amount,
      remarks,
      bankAccount: (mentor as any).kyc?.bankAccount,
      bankIfsc: (mentor as any).kyc?.bankIfsc,
      bankName: (mentor as any).kyc?.bankName,
      bankHolderName: (mentor as any).kyc?.bankHolderName,
    });
    res.status(201).json({ success: true, salary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /admin/mentor-salaries/:id/approve
router.patch('/mentor-salaries/:id/approve', async (req: any, res) => {
  try {
    const MentorSalary = (await import('../models/MentorSalary')).default;
    const salary = await MentorSalary.findByIdAndUpdate(req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('mentor', 'name email');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });
    res.json({ success: true, salary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /admin/mentor-salaries/:id/mark-paid
router.patch('/mentor-salaries/:id/mark-paid', async (req: any, res) => {
  try {
    const MentorSalary = (await import('../models/MentorSalary')).default;
    const salary = await MentorSalary.findById(req.params.id)
      .populate('mentor', 'name email phone kyc');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });
    if (salary.status === 'paid') return res.status(400).json({ success: false, message: 'Already marked as paid' });

    salary.status = 'paid';
    salary.paidAt = new Date();
    await salary.save();

    res.json({ success: true, salary });

    // Send email + WhatsApp in background
    setImmediate(async () => {
      try {
        const { sendSalaryPaidEmail } = await import('../services/emailService');
        const { sendWhatsAppText } = await import('../services/whatsappMetaService');
        const mentor = salary.mentor as any;
        const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = MONTHS[salary.month] || String(salary.month);

        if (mentor?.email) {
          await sendSalaryPaidEmail(mentor.email, {
            name: mentor.name, slipNo: salary.slipNo, month: monthName, year: salary.year,
            grossAmount: salary.amount, earnedAmount: salary.earnedAmount,
            tdsRate: salary.tdsRate, tdsAmount: salary.tds, netAmount: salary.netAmount,
            workingDays: salary.workingDays, presentDays: salary.presentDays,
            absentDays: salary.absentDays, halfDays: salary.halfDays,
            leaveDays: salary.leaveDays, unpaidLeaveDays: salary.unpaidLeaveDays,
            holidayDays: salary.holidayDays, payableDays: salary.payableDays,
            perDayAmount: salary.perDayAmount,
            bankAccount: salary.bankAccount, bankName: salary.bankName,
            paidAt: salary.paidAt!, remarks: salary.remarks, role: 'mentor',
          }).catch(() => {});
        }

        if (mentor?.phone) {
          const msg = `*TruLearnix — Salary Credited* ✅\n\nHi ${mentor.name},\n\nYour salary for *${monthName} ${salary.year}* has been credited.\n\n` +
            `💰 *Net Amount:* ₹${salary.netAmount.toLocaleString('en-IN')}\n` +
            `📊 Gross: ₹${salary.amount.toLocaleString('en-IN')} | TDS (${salary.tdsRate}%): ₹${salary.tds.toLocaleString('en-IN')}\n` +
            (salary.workingDays > 0 ? `📅 Attendance: Present ${salary.presentDays} | Absent ${salary.absentDays} | Half-day ${salary.halfDays} | Holiday ${salary.holidayDays}\n` : '') +
            `🗓️ Slip: ${salary.slipNo}\n\nFor queries: hr@trulearnix.com`;
          await sendWhatsAppText(mentor.phone, msg).catch(() => {});
        }
      } catch {}
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /admin/mentor-salaries/:id
router.delete('/mentor-salaries/:id', async (_req, res) => {
  try {
    const MentorSalary = (await import('../models/MentorSalary')).default;
    await MentorSalary.findByIdAndDelete(_req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/mentors-list — for salary form dropdown
router.get('/mentors-list', async (_req, res) => {
  try {
    const mentors = await User.find({
      role: 'mentor', isActive: true,
      $or: [{ mentorStatus: 'approved' }, { mentorStatus: { $exists: false } }, { mentorStatus: null }]
    }).select('name email phone avatar').sort('name');
    res.json({ success: true, mentors });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Employee Salary Management ───────────────────────────────────────────────────

// GET /admin/employee-salaries
router.get('/employee-salaries', async (req: any, res) => {
  try {
    const EmployeeSalary = (await import('../models/EmployeeSalary')).default;
    const { employeeId, status, year, month } = req.query;
    const filter: any = {};
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;
    if (year) filter.year = Number(year);
    if (month) filter.month = Number(month);
    const salaries = await EmployeeSalary.find(filter)
      .populate('employee', 'name email phone avatar kyc department role employeeId')
      .populate('approvedBy', 'name')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, salaries });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/employee-salaries — create salary record
router.post('/employee-salaries', async (req: any, res) => {
  try {
    const EmployeeSalary = (await import('../models/EmployeeSalary')).default;
    const { employeeId, month, year, grossAmount, tdsRate = 10, remarks,
      workingDays, presentDays, absentDays, halfDays, leaveDays, unpaidLeaveDays,
      holidayDays, payableDays, perDayAmount, earnedAmount } = req.body;
    if (!employeeId || !month || !year || !grossAmount) {
      return res.status(400).json({ success: false, message: 'employeeId, month, year, grossAmount required' });
    }

    const existing = await EmployeeSalary.findOne({ employee: employeeId, month: Number(month), year: Number(year) });
    if (existing) return res.status(400).json({ success: false, message: 'Salary for this month already exists' });

    // Use attendance-based earned if provided
    const baseAmount = earnedAmount || grossAmount;
    const tds = Math.round(baseAmount * tdsRate / 100);
    const netAmount = baseAmount - tds;

    const emp = await User.findById(employeeId).select('kyc name department role');
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const salary = await EmployeeSalary.create({
      employee: employeeId,
      month: Number(month), year: Number(year),
      grossAmount, tdsRate: Number(tdsRate), tds, netAmount,
      workingDays: workingDays || 0, presentDays: presentDays || 0,
      absentDays: absentDays || 0, halfDays: halfDays || 0,
      leaveDays: leaveDays || 0, unpaidLeaveDays: unpaidLeaveDays || 0,
      holidayDays: holidayDays || 0, payableDays: payableDays || 0,
      perDayAmount: perDayAmount || 0, earnedAmount: earnedAmount || grossAmount,
      designation: (emp as any).role,
      department: (emp as any).department,
      remarks,
      bankAccount: (emp as any).kyc?.bankAccount,
      bankIfsc: (emp as any).kyc?.bankIfsc,
      bankName: (emp as any).kyc?.bankName,
      bankHolderName: (emp as any).kyc?.bankHolderName,
    });
    res.status(201).json({ success: true, salary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /admin/employee-salaries/:id/approve
router.patch('/employee-salaries/:id/approve', async (req: any, res) => {
  try {
    const EmployeeSalary = (await import('../models/EmployeeSalary')).default;
    const salary = await EmployeeSalary.findByIdAndUpdate(req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('employee', 'name email phone kyc');
    if (!salary) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, salary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /admin/employee-salaries/:id/mark-paid — mark paid + optional Razorpay payout
router.patch('/employee-salaries/:id/mark-paid', async (req: any, res) => {
  try {
    const EmployeeSalary = (await import('../models/EmployeeSalary')).default;
    const salary = await EmployeeSalary.findById(req.params.id)
      .populate('employee', 'name email phone kyc');
    if (!salary) return res.status(404).json({ success: false, message: 'Record not found' });
    if (salary.status !== 'approved') return res.status(400).json({ success: false, message: 'Salary must be approved before payment' });

    const emp = salary.employee as any;

    // Attempt Razorpay payout if configured and bank details available
    if (isPayoutConfigured() && salary.bankAccount && salary.bankIfsc && salary.bankHolderName) {
      try {
        const payout = await initiateWithdrawalPayout({
          withdrawalId: salary._id.toString(),
          netAmount: salary.netAmount,
          partnerName: emp.name,
          partnerEmail: emp.email,
          partnerPhone: emp.phone,
          bankAccountNumber: salary.bankAccount,
          bankIfsc: salary.bankIfsc,
          bankHolderName: salary.bankHolderName,
        });
        salary.razorpayPayoutId = payout.payoutId;
        salary.razorpayStatus = payout.status;
      } catch (payoutErr: any) {
        console.error('Razorpay payout failed for employee salary:', payoutErr.message);
        // Continue — mark as paid even if payout fails; admin can retry manually
      }
    }

    salary.status = 'paid';
    salary.paidAt = new Date();
    await salary.save();

    res.json({ success: true, salary });

    // Send email + WhatsApp in background
    setImmediate(async () => {
      try {
        const { sendSalaryPaidEmail } = await import('../services/emailService');
        const { sendWhatsAppText } = await import('../services/whatsappMetaService');
        const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = MONTHS[salary.month] || String(salary.month);

        if (emp?.email) {
          await sendSalaryPaidEmail(emp.email, {
            name: emp.name, slipNo: salary.slipNo, month: monthName, year: salary.year,
            grossAmount: salary.grossAmount, earnedAmount: salary.earnedAmount,
            tdsRate: salary.tdsRate, tdsAmount: salary.tds, netAmount: salary.netAmount,
            workingDays: salary.workingDays, presentDays: salary.presentDays,
            absentDays: salary.absentDays, halfDays: salary.halfDays,
            leaveDays: salary.leaveDays, unpaidLeaveDays: salary.unpaidLeaveDays,
            holidayDays: salary.holidayDays, payableDays: salary.payableDays,
            perDayAmount: salary.perDayAmount,
            bankAccount: salary.bankAccount, bankName: salary.bankName,
            paidAt: salary.paidAt!, remarks: salary.remarks, role: 'employee',
          }).catch(() => {});
        }

        if (emp?.phone) {
          const msg = `*TruLearnix — Salary Credited* ✅\n\nHi ${emp.name},\n\nYour salary for *${monthName} ${salary.year}* has been credited.\n\n` +
            `💰 *Net Amount:* ₹${salary.netAmount.toLocaleString('en-IN')}\n` +
            `📊 Gross: ₹${salary.grossAmount.toLocaleString('en-IN')} | TDS (${salary.tdsRate}%): ₹${salary.tds.toLocaleString('en-IN')}\n` +
            (salary.workingDays > 0 ? `📅 Attendance: Present ${salary.presentDays} | Absent ${salary.absentDays} | Half-day ${salary.halfDays} | Holiday ${salary.holidayDays}\n` : '') +
            `🗓️ Slip: ${salary.slipNo}\n\nFor queries: hr@trulearnix.com`;
          await sendWhatsAppText(emp.phone, msg).catch(() => {});
        }
      } catch {}
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /admin/employee-salaries/:id
router.delete('/employee-salaries/:id', async (_req, res) => {
  try {
    const EmployeeSalary = (await import('../models/EmployeeSalary')).default;
    await EmployeeSalary.findByIdAndDelete(_req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/employees-for-salary — list all employees with KYC status (for dropdown)
router.get('/employees-for-salary', async (_req, res) => {
  try {
    const employees = await User.find({
      role: { $in: ['superadmin', 'admin', 'manager', 'salesperson'] },
      isActive: true,
    }).select('name email phone avatar role department employeeId kyc').sort('name');
    res.json({ success: true, employees });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /admin/employees/:id/kyc — admin updates employee KYC (bank + PAN + Aadhaar)
router.patch('/employees/:id/kyc', async (req, res) => {
  try {
    const { pan, panName, aadhar, aadharName, bankAccount, bankIfsc, bankName, bankHolderName, status } = req.body;
    const update: any = {};
    if (pan) update['kyc.pan'] = pan;
    if (panName) update['kyc.panName'] = panName;
    if (aadhar) update['kyc.aadhar'] = aadhar;
    if (aadharName) update['kyc.aadharName'] = aadharName;
    if (bankAccount) update['kyc.bankAccount'] = bankAccount;
    if (bankIfsc) update['kyc.bankIfsc'] = bankIfsc;
    if (bankName) update['kyc.bankName'] = bankName;
    if (bankHolderName) update['kyc.bankHolderName'] = bankHolderName;
    if (status) update['kyc.status'] = status;
    if (status === 'verified') update['kyc.verifiedAt'] = new Date();
    update['kyc.submittedAt'] = new Date();
    const emp = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-password');
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee: emp });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// HOLIDAYS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/holidays?year=2025
router.get('/holidays', async (req: any, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const holidays = await Holiday.find({
      $or: [{ year }, { recurring: true }]
    }).sort({ month: 1, day: 1 }).lean();
    res.json({ success: true, holidays });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/holidays
router.post('/holidays', async (req: any, res) => {
  try {
    const { name, date, type, recurring } = req.body;
    if (!name || !date || !type) return res.status(400).json({ success: false, message: 'name, date and type required' });
    const d = new Date(date);
    const holiday = await Holiday.create({
      name: name.trim(), date: d,
      day: d.getDate(), month: d.getMonth() + 1,
      year: recurring ? undefined : d.getFullYear(),
      type, recurring: !!recurring, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, holiday });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /admin/holidays/:id
router.delete('/holidays/:id', async (_req, res) => {
  try {
    await Holiday.findByIdAndDelete(_req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

// Helper: get holiday dates for a month/year
async function getHolidayDates(month: number, year: number): Promise<Set<string>> {
  const holidays = await Holiday.find({
    month,
    $or: [{ year }, { recurring: true }],
  }).lean();
  return new Set(holidays.map(h => {
    const d = new Date(h.date);
    d.setFullYear(year);
    return `${year}-${String(month).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }));
}

// Helper: count working days (excl Sunday + holidays) in a month
async function getWorkingDays(month: number, year: number): Promise<{ workingDays: number; holidayDays: number }> {
  const holidayDates = await getHolidayDates(month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  let holidayDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() === 0) continue; // Sunday
    const key = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (holidayDates.has(key)) { holidayDays++; continue; }
    workingDays++;
  }
  return { workingDays, holidayDays };
}

// GET /admin/attendance?month=4&year=2025&userType=employee&userId=xxx
router.get('/attendance', async (req: any, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const filter: any = { month, year };
    if (req.query.userType) filter.userType = req.query.userType;
    if (req.query.userId)   filter.user = req.query.userId;

    const records = await Attendance.find(filter)
      .populate('user', 'name email employeeId department role avatar')
      .sort({ date: 1 }).lean();

    res.json({ success: true, records });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/attendance/summary?month=4&year=2025&userType=employee
router.get('/attendance/summary', async (req: any, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const userType = req.query.userType || 'employee';

    // Get all employees/mentors
    const users = await User.find(
      userType === 'employee'
        ? { role: { $in: ['admin', 'manager', 'salesperson'] }, isActive: true }
        : { role: 'mentor', isActive: true, $or: [{ mentorStatus: 'approved' }, { mentorStatus: { $exists: false } }, { mentorStatus: null }] }
    ).select('name email employeeId department role avatar').lean();
    normalizeAvatars(users as any[]);

    const { workingDays, holidayDays } = await getWorkingDays(month, year);

    // Get attendance for all users
    const records = await Attendance.find({ month, year, userType }).lean();
    const byUser: Record<string, any[]> = {};
    for (const r of records) {
      const uid = r.user.toString();
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push(r);
    }

    const summary = users.map(u => {
      const uid = u._id.toString();
      const recs = byUser[uid] || [];
      const present   = recs.filter(r => r.status === 'present').length;
      const absent    = recs.filter(r => r.status === 'absent').length;
      const halfDay   = recs.filter(r => r.status === 'half-day').length;
      const paidLeave = recs.filter(r => r.status === 'leave' && r.leaveType !== 'unpaid').length;
      const unpaid    = recs.filter(r => r.status === 'leave' && r.leaveType === 'unpaid').length;
      const payable   = present + (halfDay * 0.5) + paidLeave + holidayDays;
      return { user: u, workingDays, holidayDays, present, absent, halfDay, paidLeave, unpaid, payable };
    });

    res.json({ success: true, summary, workingDays, holidayDays, month, year });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/attendance/mark — mark single day attendance
router.post('/attendance/mark', async (req: any, res) => {
  try {
    const { userId, userType, date, status, leaveType, note } = req.body;
    if (!userId || !date || !status) return res.status(400).json({ success: false, message: 'userId, date, status required' });

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();

    const record = await Attendance.findOneAndUpdate(
      { user: userId, date: d },
      { user: userId, userType: userType || 'employee', date: d, month, year, status, leaveType, note, markedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'name email');

    res.json({ success: true, record });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/attendance/bulk-mark — mark attendance for multiple users on one date
router.post('/attendance/bulk-mark', async (req: any, res) => {
  try {
    const { entries, date } = req.body; // entries: [{userId, userType, status, leaveType}]
    if (!entries?.length || !date) return res.status(400).json({ success: false, message: 'entries and date required' });

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();

    const ops = entries.map((e: any) => ({
      updateOne: {
        filter: { user: e.userId, date: d },
        update: { $set: { user: e.userId, userType: e.userType || 'employee', date: d, month, year, status: e.status, leaveType: e.leaveType, note: e.note, markedBy: req.user._id } },
        upsert: true,
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ success: true, count: entries.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/attendance/calculate-salary?userId=x&userType=employee&month=4&year=2025&gross=50000&tdsRate=10
router.get('/attendance/calculate-salary', async (req: any, res) => {
  try {
    const { userId, userType, month: m, year: y, gross, tdsRate } = req.query;
    const month = Number(m);
    const year  = Number(y);
    const grossAmount = Number(gross);
    const tds_rate = Number(tdsRate) || 0;

    const { workingDays, holidayDays } = await getWorkingDays(month, year);
    const records = await Attendance.find({ user: userId, month, year }).lean();

    const present   = records.filter(r => r.status === 'present').length;
    const absent    = records.filter(r => r.status === 'absent').length;
    const halfDay   = records.filter(r => r.status === 'half-day').length;
    const paidLeave = records.filter(r => r.status === 'leave' && r.leaveType !== 'unpaid').length;
    const unpaid    = records.filter(r => r.status === 'leave' && r.leaveType === 'unpaid').length;

    const payable   = present + (halfDay * 0.5) + paidLeave + holidayDays;
    const perDay    = workingDays > 0 ? grossAmount / workingDays : grossAmount;
    const earned    = Math.round(perDay * payable);
    const tdsAmt    = Math.round(earned * (tds_rate / 100));
    const net       = earned - tdsAmt;

    res.json({
      success: true,
      workingDays, holidayDays,
      present, absent, halfDay, paidLeave, unpaid,
      payable, perDay: Math.round(perDay), earned, tds: tdsAmt, net,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Security Dashboard ────────────────────────────────────────────────────────
router.get('/security/dashboard', async (_req, res) => {
  try {
    const SecurityLog = (await import('../models/SecurityLog')).default;
    const BlockedIp = (await import('../models/BlockedIp')).default;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayTotal, todayThreats, todayCritical, activeBlocked, recentLogs, threatBreakdown, countryBreakdown, hourlyTrend, topAttackerIps] = await Promise.all([
      SecurityLog.countDocuments({ createdAt: { $gte: today } }),
      SecurityLog.countDocuments({ createdAt: { $gte: today }, threat: { $ne: 'none' } }),
      SecurityLog.countDocuments({ createdAt: { $gte: today }, severity: { $in: ['high', 'critical'] } }),
      BlockedIp.countDocuments({ active: true }),
      SecurityLog.find({ createdAt: { $gte: last24h } }).sort({ createdAt: -1 }).limit(50).select('ip endpoint threat severity reason country city createdAt method statusCode blocked responseMs').lean(),
      SecurityLog.aggregate([{ $match: { createdAt: { $gte: last7d }, threat: { $ne: 'none' } } }, { $group: { _id: '$threat', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      SecurityLog.aggregate([{ $match: { createdAt: { $gte: last7d }, threat: { $ne: 'none' }, country: { $ne: 'Unknown' } } }, { $group: { _id: '$country', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      SecurityLog.aggregate([{ $match: { createdAt: { $gte: last24h } } }, { $group: { _id: { $hour: '$createdAt' }, total: { $sum: 1 }, threats: { $sum: { $cond: [{ $ne: ['$threat', 'none'] }, 1, 0] } } } }, { $sort: { _id: 1 } }]),
      SecurityLog.aggregate([{ $match: { createdAt: { $gte: last7d }, threat: { $ne: 'none' } } }, { $group: { _id: '$ip', count: { $sum: 1 }, threats: { $addToSet: '$threat' }, country: { $first: '$country' } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    ]);

    res.json({ success: true, summary: { todayRequests: todayTotal, todayThreats, todayCritical, activeBlocked }, recentLogs, threatBreakdown, countryBreakdown, hourlyTrend, topAttackerIps });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/security/logs', async (req, res) => {
  try {
    const SecurityLog = (await import('../models/SecurityLog')).default;
    const limit = Math.min(parseInt(req.query.limit as string || '100'), 200);
    const filter: any = {};
    if (req.query.threat && req.query.threat !== 'all') filter.threat = req.query.threat;
    if (req.query.severity && req.query.severity !== 'all') filter.severity = req.query.severity;
    if (req.query.ip) filter.ip = req.query.ip;
    const [logs, total] = await Promise.all([
      SecurityLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      SecurityLog.countDocuments(filter),
    ]);
    res.json({ success: true, logs, total });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/security/blocked', async (_req, res) => {
  try {
    const BlockedIp = (await import('../models/BlockedIp')).default;
    const ips = await BlockedIp.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, ips });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/security/block', async (req, res) => {
  try {
    const BlockedIp = (await import('../models/BlockedIp')).default;
    const { ip, reason = 'Manual block', duration } = req.body;
    if (!ip) return res.status(400).json({ success: false, message: 'IP required' });
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
    await BlockedIp.findOneAndUpdate({ ip }, { $set: { active: true, reason, threat: 'none', autoBlock: false, expiresAt } }, { upsert: true, new: true });
    res.json({ success: true, message: `${ip} blocked` });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/security/block/:ip', async (req, res) => {
  try {
    const BlockedIp = (await import('../models/BlockedIp')).default;
    await BlockedIp.updateOne({ ip: req.params.ip }, { $set: { active: false, unblockedAt: new Date() } });
    res.json({ success: true, message: `${req.params.ip} unblocked` });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Patch existing mentors / salespersons / partner-managers to have kanban access ──
router.post('/migrate-kanban-permissions', async (_req, res) => {
  try {
    const KANBAN_PERMS = ['kanban', 'reminders', 'calendar'];
    const [m, s, mgr] = await Promise.all([
      User.updateMany(
        { role: 'mentor', permissions: { $not: { $elemMatch: { $eq: 'kanban' } } } },
        { $addToSet: { permissions: { $each: KANBAN_PERMS } } }
      ),
      User.updateMany(
        { role: 'salesperson', permissions: { $not: { $elemMatch: { $eq: 'kanban' } } } },
        { $addToSet: { permissions: { $each: KANBAN_PERMS } } }
      ),
      User.updateMany(
        { role: 'manager', permissions: { $not: { $elemMatch: { $eq: 'kanban' } } } },
        { $addToSet: { permissions: { $each: KANBAN_PERMS } } }
      ),
    ]);
    res.json({ success: true, message: 'Kanban permissions patched', mentors: m.modifiedCount, salespersons: s.modifiedCount, managers: mgr.modifiedCount });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Manual Payment Approvals ──────────────────────────────────────────────────

// GET /admin/sales-orders/pending-approval — list orders awaiting admin approval
router.get('/sales-orders/pending-approval', async (req: any, res) => {
  try {
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      SalesOrder.find({ status: 'pending_approval' })
        .populate('salesperson', 'name email phone')
        .populate('package', 'name tier price')
        .populate('userId', 'name email phone')
        .sort('-updatedAt')
        .skip(skip)
        .limit(Number(limit)),
      SalesOrder.countDocuments({ status: 'pending_approval' }),
    ]);
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/sales-orders/:id/approve — approve manual payment, activate access
router.post('/sales-orders/:id/approve', async (req: any, res) => {
  try {
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const order = await SalesOrder.findById(req.params.id).populate('package');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Order is not pending approval' });
    }
    order.status = 'paid';
    await order.save();
    const freshOrder = await SalesOrder.findById(order._id).populate('package');
    await activateOrder(freshOrder, 'manual');
    res.json({ success: true, message: 'Order approved. Customer access granted.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/sales-orders/:id/reject — reject manual payment, revert status
router.post('/sales-orders/:id/reject', async (req: any, res) => {
  try {
    const SalesOrder = (await import('../models/SalesOrder')).default;
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Order is not pending approval' });
    }
    // Revert to appropriate previous state
    order.status = order.tokenPaid ? 'token_paid' : 'partial';
    await order.save();
    res.json({ success: true, message: 'Order rejected. Payment verification required.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
