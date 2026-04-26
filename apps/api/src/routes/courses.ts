import { Router } from 'express';
import { getCourses, getCourseBySlug, createCourse, updateCourse, submitCourseForReview, getMentorCourses, getEnrolledCourseContent, markLessonComplete, addReview } from '../controllers/courseController';
import { protect, authorize } from '../middleware/auth';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import LiveClass from '../models/LiveClass';
import Assignment from '../models/Assignment';

const router = Router();

router.get('/', getCourses);
router.get('/my-courses', protect, authorize('mentor'), getMentorCourses);

// Mentor: get students enrolled in their courses
router.get('/my-students', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const courses = await Course.find({ mentor: req.user._id }).select('_id title');
    const courseIds = courses.map(c => c._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('student', 'name email avatar createdAt')
      .populate('course', 'title').sort('-createdAt');
    res.json({ success: true, students: enrollments });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get my report cards (student)
router.get('/my-report-cards', protect, authorize('student'), async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const reportCards = await ReportCard.find({ student: req.user._id }).sort('-requestedAt');
    res.json({ success: true, reportCards });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:slug', getCourseBySlug);
router.get('/:id/content', protect, getEnrolledCourseContent);
router.post('/', protect, authorize('mentor'), createCourse);
router.put('/:id', protect, authorize('mentor'), updateCourse);
router.patch('/:id/submit', protect, authorize('mentor'), submitCourseForReview);
router.post('/:id/progress', protect, markLessonComplete);
router.post('/:id/review', protect, authorize('student'), addReview);

// Mentor: add lesson to course
router.post('/:id/lessons', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const { title, videoUrl, content, duration, isFree } = req.body;
    const course = await Course.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    (course as any).lessons = (course as any).lessons || [];
    (course as any).lessons.push({ title, videoUrl, content, duration: duration || 0, isFree: isFree || false });
    await course.save();
    res.json({ success: true, course });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mentor: delete lesson
router.delete('/:id/lessons/:lessonId', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    (course as any).lessons = (course as any).lessons.filter((l: any) => l._id.toString() !== req.params.lessonId);
    await course.save();
    res.json({ success: true, message: 'Lesson removed' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Quizzes route for mentor
router.get('/quizzes/my', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const Quiz = (await import('../models/Quiz')).default;
    const quizzes = await Quiz.find({ createdBy: req.user._id }).populate('course', 'title').sort('-createdAt');
    res.json({ success: true, quizzes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Student: get live class sessions for enrolled course (recordings, summaries, notes)
router.get('/:id/sessions', protect, async (req: any, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });
    const sessions = await LiveClass.find({ course: req.params.id, status: 'ended' })
      .select('title scheduledAt endedAt duration recordingUrl recordingSize summary mentorNotes batch attendanceRecords')
      .populate('batch', 'batchNumber label')
      .sort('scheduledAt');
    const result = sessions.map((s: any) => {
      const att = (s.attendanceRecords || []).find((r: any) => r.user?.toString() === req.user._id.toString());
      return {
        _id: s._id, title: s.title, scheduledAt: s.scheduledAt, endedAt: s.endedAt,
        duration: s.duration, recordingUrl: s.recordingUrl, recordingSize: s.recordingSize,
        summary: s.summary, mentorNotes: s.mentorNotes, batch: s.batch,
        wasPresent: att?.isPresent || false,
      };
    });
    res.json({ success: true, sessions: result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Student: get published assignments for enrolled course
router.get('/:id/assignments', protect, async (req: any, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });
    const assignments = await Assignment.find({ course: req.params.id, isPublished: true })
      .select('title description dueDate maxScore createdAt submissions referenceFiles')
      .sort('-createdAt');
    // Only show each student their own submission
    const userId = req.user._id.toString();
    const result = assignments.map((a: any) => {
      const mySub = a.submissions.find((s: any) => s.student?.toString() === userId);
      return {
        _id: a._id, title: a.title, description: a.description,
        dueDate: a.dueDate, maxScore: a.maxScore, createdAt: a.createdAt,
        referenceFiles: a.referenceFiles || [],
        mySubmission: mySub || null,
        submissionsCount: a.submissions.length,
      };
    });
    res.json({ success: true, assignments: result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Student: my performance + batch leaderboard for an enrolled course
router.get('/:id/my-performance', protect, authorize('student'), async (req: any, res) => {
  try {
    const Quiz = require('../models/Quiz').default;
    const LiveClass = require('../models/LiveClass').default;

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id })
      .populate('course', 'title modules')
      .populate('batch', 'batchNumber label');
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });

    const course = enrollment.course as any;
    const sid = req.user._id.toString();

    const batchFilter: any = { course: req.params.id };
    if ((enrollment.batch as any)?._id) batchFilter.batch = (enrollment.batch as any)._id;

    const [sessions, assignments, quizResults] = await Promise.all([
      LiveClass.find({ course: req.params.id, status: 'ended' }).select('attendanceRecords duration').lean(),
      Assignment.find({ course: req.params.id, isPublished: true }).select('title maxScore submissions').lean(),
      Promise.resolve((enrollment as any).quizResults || []),
    ]);

    const totalLessons = (course.modules || []).reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0);
    const sessionsAttended = sessions.filter((s: any) => (s.attendanceRecords || []).some((r: any) => r.user?.toString() === sid && r.isPresent)).length;
    const attendancePct = sessions.length > 0 ? Math.round(sessionsAttended / sessions.length * 100) : 0;

    const mySubmissions = assignments.map((a: any) => {
      const sub = (a.submissions || []).find((s: any) => s.student?.toString() === sid);
      return sub ? { title: a.title, score: sub.score ?? null, maxScore: a.maxScore, status: sub.status, feedback: sub.feedback } : { title: a.title, score: null, maxScore: a.maxScore, status: 'not_submitted', feedback: null };
    });
    const reviewed = mySubmissions.filter(s => s.score !== null);
    const avgAssignmentScore = reviewed.length > 0
      ? Math.round(reviewed.reduce((s: number, x: any) => s + (x.score / x.maxScore * 100), 0) / reviewed.length) : 0;

    const quizzesTaken = quizResults.length;
    const avgQuizScore = quizzesTaken > 0
      ? Math.round(quizResults.reduce((s: number, r: any) => s + (r.score || 0), 0) / quizzesTaken) : 0;

    const progressPercent = (enrollment as any).progressPercent || 0;
    const compositeScore = Math.round(progressPercent * 0.35 + attendancePct * 0.25 + avgAssignmentScore * 0.25 + avgQuizScore * 0.15);

    // Batch leaderboard: other students in same batch/course
    const batchEnrollments = await Enrollment.find(batchFilter)
      .populate('student', 'name avatar')
      .select('student progressPercent quizResults batch')
      .lean();

    const leaderboard = await Promise.all(batchEnrollments.map(async (e: any) => {
      const esid = e.student?._id?.toString();
      const eAttended = sessions.filter((s: any) => (s.attendanceRecords || []).some((r: any) => r.user?.toString() === esid && r.isPresent)).length;
      const eAttPct = sessions.length > 0 ? Math.round(eAttended / sessions.length * 100) : 0;
      const eReviewed = assignments.map((a: any) => {
        const sub = (a.submissions || []).find((s: any) => s.student?.toString() === esid);
        return sub && sub.score != null ? sub.score / a.maxScore * 100 : null;
      }).filter((x: any) => x !== null);
      const eAssignPct = eReviewed.length > 0 ? Math.round(eReviewed.reduce((s: number, x: number) => s + x, 0) / eReviewed.length) : 0;
      const eQR = e.quizResults || [];
      const eQuizPct = eQR.length > 0 ? Math.round(eQR.reduce((s: number, r: any) => s + (r.score || 0), 0) / eQR.length) : 0;
      const eProgress = e.progressPercent || 0;
      const eComposite = Math.round(eProgress * 0.35 + eAttPct * 0.25 + eAssignPct * 0.25 + eQuizPct * 0.15);
      return { student: { _id: esid, name: e.student?.name, avatar: e.student?.avatar }, progressPercent: eProgress, attendancePct: eAttPct, avgAssignmentScore: eAssignPct, avgQuizScore: eQuizPct, compositeScore: eComposite, isMe: esid === sid };
    }));
    leaderboard.sort((a, b) => b.compositeScore - a.compositeScore);
    const myRank = leaderboard.findIndex(e => e.isMe) + 1;

    res.json({
      success: true,
      performance: { progressPercent, sessionsAttended, totalSessions: sessions.length, attendancePct, assignments: mySubmissions, avgAssignmentScore, quizzesTaken, avgQuizScore, compositeScore, totalLessons, completedLessons: ((enrollment as any).progress || []).length },
      leaderboard,
      myRank,
      batch: enrollment.batch,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Request a report card (student)
router.post('/:id/request-report-card', protect, authorize('student'), async (req: any, res) => {
  try {
    const ReportCard = require('../models/ReportCard').default;
    const Assignment = require('../models/Assignment').default;
    const Quiz = require('../models/Quiz').default;
    const LiveClass = require('../models/LiveClass').default;
    const Batch = require('../models/Batch').default;

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id })
      .populate('course', 'title modules')
      .populate('batch', 'batchNumber label');
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });
    if (!enrollment.completedAt)
      return res.status(400).json({ success: false, message: 'Your mentor has not yet marked this batch as complete.' });

    // Check if already requested
    const existing = await ReportCard.findOne({ student: req.user._id, course: req.params.id, status: { $ne: 'rejected' } });
    if (existing) return res.status(400).json({ success: false, message: 'Report card already requested', reportCard: existing });

    const course = enrollment.course as any;
    const batch = enrollment.batch as any;

    // Calculate performance
    const [sessions, assignments, quizzes, user, mentor] = await Promise.all([
      LiveClass.find({ course: req.params.id, status: 'ended' }).select('attendanceRecords').lean(),
      Assignment.find({ course: req.params.id, isPublished: true }).select('submissions maxScore').lean(),
      Quiz.find({ course: req.params.id, isPublished: true }).lean(),
      require('../models/User').default.findById(req.user._id).select('name'),
      require('../models/User').default.findOne({ assignedCourses: { $elemMatch: { courseId: req.params.id } }, role: 'mentor' }).select('name'),
    ]);

    const sid = req.user._id.toString();
    const totalLessons = (course.modules || []).reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0);
    const sessionsAttended = sessions.filter((s: any) => (s.attendanceRecords||[]).some((r: any) => r.user?.toString() === sid && r.isPresent)).length;
    const attendancePct = sessions.length > 0 ? Math.round(sessionsAttended / sessions.length * 100) : 0;

    const mySubmissions = assignments.map((a: any) => {
      const sub = (a.submissions||[]).find((s: any) => s.student?.toString() === sid);
      return sub ? { score: sub.score || 0, maxScore: a.maxScore || 100 } : null;
    }).filter(Boolean);
    const avgAssignmentScore = mySubmissions.length > 0
      ? Math.round(mySubmissions.reduce((s: number, x: any) => s + x.score / x.maxScore * 100, 0) / mySubmissions.length) : 0;

    const myQuizResults = (enrollment.quizResults || []);
    const quizzesTaken = myQuizResults.length;
    const avgQuizScore = quizzesTaken > 0
      ? Math.round(myQuizResults.reduce((s: number, r: any) => s + (r.score || 0), 0) / quizzesTaken) : 0;

    const compositeScore = Math.round(
      (enrollment.progressPercent || 0) * 0.35 +
      attendancePct * 0.25 +
      avgAssignmentScore * 0.25 +
      avgQuizScore * 0.15
    );

    const reportCardId = 'RC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase();

    const reportCard = await ReportCard.create({
      reportCardId,
      student: req.user._id,
      course: req.params.id,
      batch: enrollment.batch?._id,
      enrollment: enrollment._id,
      progressPercent: enrollment.progressPercent || 0,
      completedLessons: (enrollment.progress||[]).length,
      totalLessons,
      sessionsAttended,
      totalSessions: sessions.length,
      attendancePct,
      assignmentsSubmitted: mySubmissions.length,
      totalAssignments: assignments.length,
      avgAssignmentScore,
      quizzesTaken,
      totalQuizzes: quizzes.length,
      avgQuizScore,
      compositeScore,
      studentName: user.name,
      courseName: course.title,
      batchLabel: batch ? (batch.label || `Batch ${batch.batchNumber}`) : undefined,
      mentorName: mentor?.name,
      status: 'pending_mentor',
    });

    res.status(201).json({ success: true, reportCard });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Public: get ref price for a course
router.get('/:id/ref-price', async (req, res) => {
  try {
    const Course = (await import('../models/Course')).default;
    const course = await Course.findById(req.params.id).select('price discountPrice salesRefDiscountPercent title');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const User = (await import('../models/User')).default;
    const refUser = req.query.ref ? await User.findOne({ affiliateCode: req.query.ref }).select('name') : null;
    const discPct = (course as any).salesRefDiscountPercent || 0;
    const basePrice = (course as any).discountPrice || (course as any).price;
    const refPrice = discPct > 0 ? Math.round(basePrice * (1 - discPct / 100)) : basePrice;
    res.json({ success: true, basePrice, refPrice, discountPercent: discPct, refUserName: refUser?.name || null });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
