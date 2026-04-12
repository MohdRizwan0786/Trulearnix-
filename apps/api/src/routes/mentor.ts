import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import Commission from '../models/Commission';
import Batch from '../models/Batch';
import LiveClass from '../models/LiveClass';
import Assignment from '../models/Assignment';

const router = Router();
router.use(protect, authorize('mentor'));

// Dashboard stats
router.get('/dashboard', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id)
      .select('name avatar assignedCourses wallet totalEarnings packageTier isAffiliate commissionRate affiliateCode')
      .populate('assignedCourses.courseId', 'title thumbnail enrolledCount');

    const courseIds = (mentor?.assignedCourses || []).map((c: any) => c.courseId?._id).filter(Boolean);
    const [totalStudents, recentEnrollments, monthlyEarnings] = await Promise.all([
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      Enrollment.find({ course: { $in: courseIds } }).sort('-createdAt').limit(5).populate('user', 'name avatar').populate('course', 'title'),
      Commission.aggregate([
        { $match: { earner: req.user._id, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]),
    ]);

    res.json({
      success: true,
      mentor: { name: mentor?.name, avatar: mentor?.avatar, packageTier: mentor?.packageTier, isAffiliate: mentor?.isAffiliate, wallet: mentor?.wallet, totalEarnings: mentor?.totalEarnings, affiliateCode: mentor?.affiliateCode },
      assignedCourses: mentor?.assignedCourses || [],
      stats: {
        totalCourses: courseIds.length,
        totalStudents,
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
        wallet: mentor?.wallet || 0,
      },
      recentEnrollments,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get assigned courses
router.get('/courses', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id)
      .select('assignedCourses')
      .populate('assignedCourses.courseId', 'title thumbnail description enrolledCount status category level price');
    res.json({ success: true, courses: mentor?.assignedCourses || [] });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get students in a specific assigned course
router.get('/courses/:courseId/students', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Course not assigned to you' });

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('user', 'name email avatar phone packageTier createdAt lastLogin')
      .sort('-createdAt');

    res.json({ success: true, students: enrollments, total: enrollments.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Batches for an assigned course ───────────────────────────────────────────
router.get('/courses/:courseId/batches', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Course not assigned to you' });
    const batches = await Batch.find({ course: req.params.courseId }).sort('-batchNumber');
    res.json({ success: true, batches });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Start a pending batch
router.patch('/batches/:batchId/start', async (req: any, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === batch.course.toString());
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this course' });
    if (batch.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending batches can be started' });
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    batch.status = 'active';
    batch.startDate = startDate;
    if (batch.closingDays) batch.closingDate = new Date(startDate.getTime() + batch.closingDays * 86400000);
    await batch.save();
    res.json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mark a day complete
router.patch('/batches/:batchId/mark-day', async (req: any, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === batch.course.toString());
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    batch.daysCompleted = (batch.daysCompleted || 0) + 1;
    if (batch.totalDays && batch.daysCompleted >= batch.totalDays) batch.status = 'closed';
    await batch.save();
    res.json({ success: true, batch });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Class sessions (live classes) for an assigned course ─────────────────────
router.get('/courses/:courseId/sessions', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    const sessions = await LiveClass.find({ course: req.params.courseId, mentor: req.user._id })
      .select('title scheduledAt endedAt status duration recordingUrl recordingSize summary mentorNotes batch attendanceRecords')
      .populate('batch', 'batchNumber label')
      .sort('-scheduledAt');
    res.json({ success: true, sessions });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Assignments for an assigned course ────────────────────────────────────────
router.get('/courses/:courseId/assignments', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    const assignments = await Assignment.find({ course: req.params.courseId, mentor: req.user._id }).sort('-createdAt');
    res.json({ success: true, assignments });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/courses/:courseId/assignments', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    const { title, description, dueDate, maxScore } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
    const assignment = await Assignment.create({
      title, description, dueDate: dueDate || undefined,
      maxScore: maxScore || 100,
      course: req.params.courseId, mentor: req.user._id, isPublished: true,
    });
    res.status(201).json({ success: true, assignment });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/assignments/:assignmentId', async (req: any, res) => {
  try {
    await Assignment.findOneAndDelete({ _id: req.params.assignmentId, mentor: req.user._id });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Get mentor profile
router.get('/profile', async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken -otp');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/profile', async (req: any, res) => {
  try {
    const { name, phone, bio, expertise, socialLinks, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, bio, expertise, socialLinks, avatar }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
