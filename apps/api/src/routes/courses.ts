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
    // For each session, check if this student was present
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
      .select('title description dueDate maxScore createdAt submissions')
      .sort('-createdAt');
    // Only show each student their own submission
    const userId = req.user._id.toString();
    const result = assignments.map((a: any) => {
      const mySub = a.submissions.find((s: any) => s.student?.toString() === userId);
      return {
        _id: a._id, title: a.title, description: a.description,
        dueDate: a.dueDate, maxScore: a.maxScore, createdAt: a.createdAt,
        mySubmission: mySub || null,
        submissionsCount: a.submissions.length,
      };
    });
    res.json({ success: true, assignments: result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
