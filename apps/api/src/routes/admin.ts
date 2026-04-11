import { Router } from 'express';
import { getDashboardStats, getAllUsers, toggleUserStatus, getPendingCourses, approveCourse, rejectCourse, getTickets, updateTicket } from '../controllers/adminController';
import User from '../models/User';
import Course from '../models/Course';
import Package from '../models/Package';
import PackagePurchase from '../models/PackagePurchase';
import Commission from '../models/Commission';
import Withdrawal from '../models/Withdrawal';
import LiveClass from '../models/LiveClass';
import Batch from '../models/Batch';
import Enrollment from '../models/Enrollment';
import PlatformSettings from '../models/PlatformSettings';
import { getOrCreateActiveBatch, createPendingBatch } from '../services/batchService';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect, authorize('superadmin', 'admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
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
    const { tdsRate, gstRate, minWithdrawalAmount } = req.body;
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({ tdsRate, gstRate, minWithdrawalAmount });
    } else {
      if (tdsRate !== undefined) settings.tdsRate = tdsRate;
      if (gstRate !== undefined) settings.gstRate = gstRate;
      if (minWithdrawalAmount !== undefined) settings.minWithdrawalAmount = minWithdrawalAmount;
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Package purchases
router.get('/purchases', async (req, res) => {
  try {
    const { status, tier, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (tier) filter.packageTier = tier;
    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = await Promise.all([
      PackagePurchase.find(filter).populate('user', 'name email phone').sort('-createdAt').skip(skip).limit(Number(limit)),
      PackagePurchase.countDocuments(filter),
    ]);
    res.json({ success: true, purchases, total });
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
    const withdrawals = await Withdrawal.find(req.query.status ? { status: req.query.status } : {}).populate('user', 'name email phone').sort('-createdAt');
    res.json({ success: true, withdrawals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.patch('/withdrawals/:id', async (req: any, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, { status, rejectionReason, processedBy: req.user._id, processedAt: new Date() }, { new: true });
    if (status === 'rejected' && withdrawal) await User.findByIdAndUpdate(withdrawal.user, { $inc: { wallet: withdrawal.amount, totalWithdrawn: -withdrawal.amount } });
    res.json({ success: true, withdrawal });
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
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 12);
    const mentor = await User.create({
      name, email, password: hashed, phone: phone || '',
      role: 'mentor',
      mentorStatus: 'approved',
      isVerified: true,
      isActive: true,
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
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter: any = { role: 'mentor' };
    if (status !== 'all') filter.mentorStatus = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [mentors, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken -otp').sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, mentors, total, pages: Math.ceil(total / Number(limit)) });
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
  hr:         ['dashboard','users','learners','employees'],
  sales:      ['dashboard','crm','analytics','packages','marketing','learners'],
  marketing:  ['dashboard','marketing','blog','content','analytics','notifications','popups','ads-tracking','funnel'],
  content:    ['dashboard','blog','courses','materials','content','live-classes'],
  finance:    ['dashboard','finance','analytics','packages'],
  operations: ['dashboard','kanban','calendar','reminders','goals','funnel','analytics'],
  support:    ['dashboard','support','users','notifications'],
  tech:       ALL_PERMISSIONS,
  general:    ['dashboard'],
};

// ── Employees ──────────────────────────────────────────────────────────────────
router.get('/employees', async (req, res) => {
  try {
    const { department, search, page = 1, limit = 20 } = req.query as any;
    const filter: any = { role: { $in: ['superadmin', 'admin', 'manager'] } };
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
    const count = await User.countDocuments({ role: { $in: ['superadmin', 'admin', 'manager'] } });
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
    const { type = 'all', search, page = 1, limit = 20 } = req.query as any;
    const filter: any = { role: 'student' };
    if (type === 'purchased') filter.packageTier = { $in: ['starter', 'pro', 'elite', 'supreme'] };
    if (type === 'free') filter.packageTier = { $in: ['free', null] };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [learners, total, purchasedCount, freeCount] = await Promise.all([
      User.find(filter).select('name email phone avatar packageTier isActive createdAt packagePurchasedAt affiliateCode xpPoints level').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
      User.countDocuments({ role: 'student', packageTier: { $in: ['starter', 'pro', 'elite', 'supreme'] } }),
      User.countDocuments({ role: 'student', $or: [{ packageTier: 'free' }, { packageTier: { $exists: false } }] }),
    ]);
    res.json({ success: true, learners, total, pages: Math.ceil(total / parseInt(limit)), stats: { purchasedCount, freeCount } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Reports ────────────────────────────────────────────────────────────────────

// GET /admin/reports/commission?from=&to=
router.get('/reports/commission', async (req, res) => {
  try {
    const { from, to } = req.query as any;
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
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
    const summary = rows.reduce((acc: any, r: any) => ({
      totalCommission: acc.totalCommission + r.commissionAmount,
      totalTds: acc.totalTds + r.tds,
      totalNet: acc.totalNet + r.net,
      count: acc.count + 1,
    }), { totalCommission: 0, totalTds: 0, totalNet: 0, count: 0 });
    res.json({ success: true, rows, summary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/reports/sales?from=&to=
router.get('/reports/sales', async (req, res) => {
  try {
    const { from, to } = req.query as any;
    const dateFilter: any = { status: 'paid' };
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
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

// GET /admin/reports/team
router.get('/reports/team', async (req, res) => {
  try {
    const [employees, byDept] = await Promise.all([
      User.find({ role: { $in: ['admin', 'manager', 'employee'] } })
        .select('name email phone role department employeeId joiningDate permissions isActive createdAt')
        .sort('department name').lean(),
      User.aggregate([
        { $match: { role: { $in: ['admin', 'manager', 'employee'] } } },
        { $group: { _id: '$department', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
        { $sort: { count: -1 } }
      ])
    ]);
    res.json({ success: true, employees, byDept, total: employees.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /admin/reports/learners?from=&to=
router.get('/reports/learners', async (req, res) => {
  try {
    const { from, to } = req.query as any;
    const dateFilter: any = { role: 'student' };
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
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
    const { title, message, type, roles } = req.body;
    const Notification = (await import('../models/Notification')).default;
    const users = await User.find(roles?.length ? { role: { $in: roles } } : {}).select('_id');
    const notifications = users.map((u: any) => ({ user: u._id, title, message, type: type || 'info', channel: 'inapp' }));
    await Notification.insertMany(notifications);
    res.json({ success: true, sent: notifications.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
