import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import Commission from '../models/Commission';
import Batch from '../models/Batch';
import LiveClass from '../models/LiveClass';
import Assignment from '../models/Assignment';
import Quiz from '../models/Quiz';

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

// Batch performance / leaderboard
router.get('/batches/:batchId/performance', async (req: any, res) => {
  try {
    const Assignment = require('../models/Assignment').default;
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === batch.course.toString());
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });

    const [enrollments, sessions, assignments] = await Promise.all([
      Enrollment.find({ batch: batch._id }).populate('student', 'name email avatar').lean(),
      LiveClass.find({ course: batch.course, status: 'ended' }).select('attendanceRecords').lean(),
      Assignment.find({ course: batch.course, isPublished: true }).select('submissions maxScore').lean(),
    ]);

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

// ── Full course detail with modules (for curriculum view + lesson picker) ────
router.get('/courses/:courseId/detail', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Course not assigned to you' });
    const course = await Course.findById(req.params.courseId)
      .select('title modules batchSettings status level category price language duration enrolledCount thumbnail');
    res.json({ success: true, course });
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
    const query: any = { course: req.params.courseId, mentor: req.user._id };
    if (req.query.batch) query.batch = req.query.batch;
    const assignments = await Assignment.find(query)
      .populate('submissions.student', 'name email avatar')
      .sort('-createdAt');
    res.json({ success: true, assignments });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/courses/:courseId/assignments', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    const { title, description, dueDate, maxScore, lessonId, batchId } = req.body;
    let referenceFiles: any[] = [];
    try {
      const raw = req.body.referenceFiles;
      if (Array.isArray(raw)) referenceFiles = raw;
      else if (typeof raw === 'string') referenceFiles = JSON.parse(raw);
    } catch {}
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
    const assignment = await Assignment.create({
      title, description, dueDate: dueDate || undefined,
      maxScore: maxScore || 100,
      lessonId: lessonId || undefined,
      batch: batchId || undefined,
      referenceFiles,
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

// Get quizzes for assigned course
router.get('/courses/:courseId/quizzes', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    const query: any = { course: req.params.courseId, mentor: req.user._id };
    if (req.query.batch) query.batch = req.query.batch;
    const quizzes = await Quiz.find(query).sort('-createdAt');
    res.json({ success: true, quizzes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Create quiz for assigned course
router.post('/courses/:courseId/quizzes', async (req: any, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const isAssigned = mentor?.assignedCourses?.some((c: any) => c.courseId.toString() === req.params.courseId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned' });
    const { title, duration, passingScore, lessonId, batchId, questions, isPublished } = req.body;
    if (!title || !questions?.length) return res.status(400).json({ success: false, message: 'Title and questions required' });
    const quiz = await Quiz.create({
      title, duration: duration || 30, passingScore: passingScore || 70,
      lesson: lessonId || undefined,
      batch: batchId || undefined,
      questions, course: req.params.courseId, mentor: req.user._id,
      isPublished: isPublished !== false,
    });
    res.status(201).json({ success: true, quiz });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete quiz
router.delete('/quizzes/:quizId', async (req: any, res) => {
  try {
    await Quiz.findOneAndDelete({ _id: req.params.quizId, mentor: req.user._id });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Curriculum management ─────────────────────────────────────────────────
const isAssignedTo = async (userId: string, courseId: string) => {
  const u = await User.findById(userId).select('assignedCourses');
  return u?.assignedCourses?.some((c: any) => c.courseId.toString() === courseId);
};

router.post('/courses/:courseId/modules', async (req: any, res) => {
  try {
    if (!await isAssignedTo(req.user._id, req.params.courseId)) return res.status(403).json({ success: false, message: 'Not assigned' });
    const { title, description, batchId } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Module title required' });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const order = (course.modules || []).length + 1;
    (course.modules as any[]).push({ title, description: description || '', order, batch: batchId || undefined, lessons: [] });
    await course.save();
    res.json({ success: true, modules: course.modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/courses/:courseId/modules/:moduleId', async (req: any, res) => {
  try {
    if (!await isAssignedTo(req.user._id, req.params.courseId)) return res.status(403).json({ success: false, message: 'Not assigned' });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const mod = (course.modules as any[]).find((m: any) => m._id.toString() === req.params.moduleId);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    const { title, description, batchId } = req.body;
    if (title) mod.title = title;
    if (description !== undefined) mod.description = description;
    if (batchId !== undefined) mod.batch = batchId || undefined;
    await course.save();
    res.json({ success: true, modules: course.modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/courses/:courseId/modules/:moduleId', async (req: any, res) => {
  try {
    if (!await isAssignedTo(req.user._id, req.params.courseId)) return res.status(403).json({ success: false, message: 'Not assigned' });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.modules = (course.modules as any[]).filter((m: any) => m._id.toString() !== req.params.moduleId) as any;
    await course.save();
    res.json({ success: true, modules: course.modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/courses/:courseId/modules/:moduleId/lessons', async (req: any, res) => {
  try {
    if (!await isAssignedTo(req.user._id, req.params.courseId)) return res.status(403).json({ success: false, message: 'Not assigned' });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const mod = (course.modules as any[]).find((m: any) => m._id.toString() === req.params.moduleId);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    const { title, type, videoUrl, duration, isPreview } = req.body;
    if (!title || !type) return res.status(400).json({ success: false, message: 'Title and type required' });
    const order = (mod.lessons || []).length + 1;
    mod.lessons.push({ title, type, videoUrl: videoUrl || undefined, duration: duration || 0, order, isPreview: isPreview || false });
    await course.save();
    res.json({ success: true, modules: course.modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/courses/:courseId/modules/:moduleId/lessons/:lessonId', async (req: any, res) => {
  try {
    if (!await isAssignedTo(req.user._id, req.params.courseId)) return res.status(403).json({ success: false, message: 'Not assigned' });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const mod = (course.modules as any[]).find((m: any) => m._id.toString() === req.params.moduleId);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    const lesson = (mod.lessons as any[]).find((l: any) => l._id.toString() === req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    const { title, type, videoUrl, duration, isPreview } = req.body;
    if (title) lesson.title = title;
    if (type) lesson.type = type;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (duration !== undefined) lesson.duration = duration;
    if (isPreview !== undefined) lesson.isPreview = isPreview;
    await course.save();
    res.json({ success: true, modules: course.modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/courses/:courseId/modules/:moduleId/lessons/:lessonId', async (req: any, res) => {
  try {
    if (!await isAssignedTo(req.user._id, req.params.courseId)) return res.status(403).json({ success: false, message: 'Not assigned' });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const mod = (course.modules as any[]).find((m: any) => m._id.toString() === req.params.moduleId);
    if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
    mod.lessons = (mod.lessons as any[]).filter((l: any) => l._id.toString() !== req.params.lessonId);
    await course.save();
    res.json({ success: true, modules: course.modules });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get report card requests for assigned courses
router.get('/report-cards', async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const mentor = await User.findById(req.user._id).select('assignedCourses');
    const courseIds = (mentor?.assignedCourses || []).map((c: any) => c.courseId);
    const reportCards = await ReportCard.find({ course: { $in: courseIds }, status: 'pending_mentor' })
      .populate('student', 'name email avatar')
      .populate('course', 'title')
      .sort('-requestedAt');
    res.json({ success: true, reportCards });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mentor approves report card
router.patch('/report-cards/:id/approve', async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const rc = await ReportCard.findById(req.params.id);
    if (!rc) return res.status(404).json({ success: false, message: 'Not found' });
    rc.status = 'pending_founder';
    rc.mentorApprovedAt = new Date();
    rc.mentorApprovedBy = req.user._id;
    await rc.save();
    res.json({ success: true, reportCard: rc });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mentor rejects report card
router.patch('/report-cards/:id/reject', async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const rc = await ReportCard.findById(req.params.id);
    if (!rc) return res.status(404).json({ success: false, message: 'Not found' });
    rc.status = 'rejected';
    rc.rejectedBy = req.user._id;
    rc.rejectionReason = req.body.reason || 'Rejected by mentor';
    await rc.save();
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

// ── KYC ──────────────────────────────────────────────────────────────────────

router.get('/kyc', async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('name avatar kyc');
    res.json({ success: true, kyc: (user as any)?.kyc || null, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/kyc', async (req: any, res) => {
  try {
    const { pan, panName, panPhoto, aadhar, aadharName, aadharPhoto, bankAccount, bankIfsc, bankName, bankHolderName, avatar } = req.body;
    const updates: any = {
      'kyc.pan': pan, 'kyc.panName': panName, 'kyc.panPhoto': panPhoto,
      'kyc.aadhar': aadhar, 'kyc.aadharName': aadharName, 'kyc.aadharPhoto': aadharPhoto,
      'kyc.bankAccount': bankAccount, 'kyc.bankIfsc': bankIfsc,
      'kyc.bankName': bankName, 'kyc.bankHolderName': bankHolderName,
      'kyc.status': 'submitted', 'kyc.submittedAt': new Date(),
    };
    if (avatar) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('name avatar kyc');
    res.json({ success: true, kyc: (user as any)?.kyc, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Salary Slips ─────────────────────────────────────────────────────────────

router.get('/salaries', async (req: any, res) => {
  try {
    const MentorSalary = (await import('../models/MentorSalary')).default;
    const salaries = await MentorSalary.find({ mentor: req.user._id })
      .sort({ year: -1, month: -1 })
      .limit(36);
    res.json({ success: true, salaries });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
