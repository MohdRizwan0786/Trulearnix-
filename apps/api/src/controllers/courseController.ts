import { Request, Response } from 'express';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const { category, level, search, page = 1, limit = 12, sort = '-createdAt', type } = req.query;
    const query: any = { status: 'published' };

    if (type === 'package') query.isPackage = true;
    if (type === 'course') query.isPackage = { $ne: true };
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) query.$text = { $search: search as string };

    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(query).populate('mentor', 'name avatar').sort(sort as string).skip(skip).limit(Number(limit)),
      Course.countDocuments(query)
    ]);

    res.json({ success: true, courses, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, status: 'published' })
      .populate('mentor', 'name avatar bio expertise socialLinks');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.create({ ...req.body, mentor: req.user._id });
    res.status(201).json({ success: true, course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.status === 'published') course.status = 'pending';

    Object.assign(course, req.body);
    await course.save();
    res.json({ success: true, course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCourseForReview = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user._id, status: 'draft' },
      { status: 'pending' },
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or already submitted' });
    res.json({ success: true, message: 'Course submitted for review', course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMentorCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ mentor: req.user._id }).sort('-createdAt');
    res.json({ success: true, courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEnrolledCourseContent = async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id })
      .populate('batch', 'batchNumber label status');
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled in this course' });

    const LiveClass = require('../models/LiveClass').default;
    const StudyMaterial = require('../models/StudyMaterial').default;
    const Assignment = require('../models/Assignment').default;
    const Quiz = require('../models/Quiz').default;

    const [course, sessions, materials, assignments, quizzes] = await Promise.all([
      Course.findById(req.params.id).populate('mentor', 'name avatar'),
      LiveClass.find({ course: req.params.id, status: 'ended', recordingUrl: { $exists: true, $ne: null } })
        .select('title scheduledAt duration recordingUrl summary mentorNotes batch lessonId attendanceRecords')
        .populate('batch', 'batchNumber label')
        .sort('-scheduledAt')
        .lean(),
      StudyMaterial.find({ courseId: req.params.id }).sort('-createdAt').lean(),
      Assignment.find({ course: req.params.id, isPublished: true }).sort('createdAt').lean(),
      Quiz.find({ course: req.params.id, isPublished: true }).select('-questions.correctOption -questions.explanation').sort('createdAt').lean(),
    ]);

    const enrichedSessions = (sessions as any[]).map((s: any) => {
      const record = (s.attendanceRecords || []).find((r: any) => r.user.toString() === req.user._id.toString());
      const { attendanceRecords, ...rest } = s;
      return { ...rest, wasPresent: record?.isPresent || false };
    });

    const enrichedAssignments = (assignments as any[]).map((a: any) => {
      const sub = (a.submissions || []).find((s: any) => s.student.toString() === req.user._id.toString());
      const { submissions, ...rest } = a;
      return { ...rest, mySubmission: sub || null };
    });

    const completedLessons = (enrollment.progress || []).map((p: any) => p.lessonId.toString());
    const myQuizResults = (enrollment.quizResults || []);

    const enrichedQuizzes = (quizzes as any[]).map((q: any) => {
      const attempt = myQuizResults.find((r: any) => r.quizId.toString() === q._id.toString());
      return { ...q, myAttempt: attempt || null };
    });

    res.json({
      success: true,
      course,
      enrollment: { progressPercent: enrollment.progressPercent },
      batch: enrollment.batch || null,
      completedLessons,
      sessions: enrichedSessions,
      materials,
      assignments: enrichedAssignments,
      quizzes: enrichedQuizzes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markLessonComplete = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.body;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });

    const alreadyDone = enrollment.progress.find(p => p.lessonId.toString() === lessonId);
    if (!alreadyDone) {
      enrollment.progress.push({ lessonId, completedAt: new Date() });

      const course = await Course.findById(req.params.id);
      if (course) {
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        enrollment.progressPercent = Math.round((enrollment.progress.length / totalLessons) * 100);
        if (enrollment.progressPercent === 100 && !enrollment.completedAt) {
          enrollment.completedAt = new Date();
        }
      }
      await enrollment.save();
    }

    res.json({ success: true, progress: enrollment.progress, progressPercent: enrollment.progressPercent });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(403).json({ success: false, message: 'You must be enrolled to review' });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const existing = course.reviews.findIndex(r => r.user.toString() === req.user._id.toString());
    if (existing >= 0) {
      course.reviews[existing] = { user: req.user._id, rating, comment, createdAt: new Date() };
    } else {
      course.reviews.push({ user: req.user._id, rating, comment, createdAt: new Date() });
    }

    course.ratingCount = course.reviews.length;
    course.rating = course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.ratingCount;
    await course.save();

    res.json({ success: true, message: 'Review added' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
