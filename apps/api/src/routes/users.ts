import { Router } from 'express';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import { protect } from '../middleware/auth';
import { uploadToS3 } from '../services/s3Service';
import { getOrCreateActiveBatch, onStudentEnrolled } from '../services/batchService';

const router = Router();

router.get('/me', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/me', protect, async (req: any, res) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'expertise', 'socialLinks'];
    const update: any = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/avatar', protect, uploadToS3.single('avatar'), async (req: any, res) => {
  try {
    const fileUrl = (req.file as any)?.location;
    if (!fileUrl) return res.status(400).json({ success: false, message: 'No file uploaded' });
    await User.findByIdAndUpdate(req.user._id, { avatar: fileUrl });
    res.json({ success: true, avatar: fileUrl });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/enrolled-courses', protect, async (req: any, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title thumbnail slug category level').sort('-createdAt');
    res.json({ success: true, enrollments });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/notifications', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user?.notifications || [] });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/notifications/read', protect, async (req: any, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].read': true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/users/ai-coach — AI coach chat (GPT-4o or placeholder)
router.post('/ai-coach', protect, async (req: any, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    // If OpenAI key is set, use GPT-4o; otherwise return a placeholder response
    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemPrompt = `You are TureLearnix AI Coach — an expert mentor for digital marketing, skill-based earning, and online business.
The user is a ${req.user.packageTier || 'free'} tier member on the TureLearnix platform.
Be concise, practical, and motivating. Answer in the language the user writes in (Hindi or English).
Context: ${context || 'General guidance'}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
      });
      const reply = completion.choices[0]?.message?.content || 'I could not generate a response.';
      return res.json({ success: true, reply, model: 'gpt-4o-mini' });
    }

    // Placeholder responses when OpenAI not configured
    const placeholders: Record<string, string> = {
      default: 'Great question! Focus on building genuine value for your audience. Consistency and authenticity are the keys to long-term success in skill-based earning.',
      commission: 'Your commission rate increases with your package tier. Upgrade to Elite or Supreme to unlock 22-30% on Level 1 partners!',
      course: 'Start with the fundamentals course, then move to the advanced digital marketing modules. Each completed lesson unlocks more content.',
      withdraw: 'Withdrawals are processed within 24-48 hours. Minimum withdrawal amount is ₹500.',
    };

    const lower = message.toLowerCase();
    const reply = lower.includes('commission') ? placeholders.commission
      : lower.includes('course') ? placeholders.course
      : lower.includes('withdraw') ? placeholders.withdraw
      : placeholders.default;

    res.json({ success: true, reply, model: 'placeholder' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/users/available-courses — courses available to enroll via package
router.get('/available-courses', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('packageTier');
    if (!user || user.packageTier === 'free') {
      return res.json({ success: true, courses: [], packageTier: 'free' });
    }
    const Course = (await import('../models/Course')).default;
    const enrolledCourses = await Enrollment.find({ student: req.user._id }).select('course');
    const enrolledIds = enrolledCourses.map(e => e.course.toString());
    const courses = await Course.find({ status: 'published' })
      .select('title thumbnail category level price lessonsCount enrolledCount mentor slug')
      .populate('mentor', 'name avatar');
    const available = courses.filter(c => !enrolledIds.includes(c._id.toString()));
    res.json({ success: true, courses: available, packageTier: user.packageTier });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/users/enroll-free/:courseId — free enroll via package
router.post('/enroll-free/:courseId', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('packageTier');
    if (!user || user.packageTier === 'free') {
      return res.status(403).json({ success: false, message: 'Upgrade your plan to access this course' });
    }
    const Course = (await import('../models/Course')).default;
    const course = await Course.findOne({ _id: req.params.courseId, status: 'published' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const existing = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
    if (existing) return res.status(400).json({ success: false, message: 'Already enrolled' });
    const activeBatch = await getOrCreateActiveBatch(req.params.courseId);
    await Enrollment.create({
      student: req.user._id, course: req.params.courseId, amount: 0,
      paymentId: `pkg_${user.packageTier}`,
      ...(activeBatch ? { batch: activeBatch._id } : {}),
    });
    if (activeBatch) await onStudentEnrolled(activeBatch._id.toString());
    await Course.findByIdAndUpdate(req.params.courseId, { $inc: { enrolledCount: 1 } });
    res.json({ success: true, message: 'Enrolled successfully!' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/users/favorites — get favorite courses
router.get('/favorites', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('favoriteCourses')
      .populate('favoriteCourses', 'title thumbnail category level price slug enrolledCount rating mentor');
    res.json({ success: true, favorites: user?.favoriteCourses || [] });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/users/favorites/:courseId — toggle favorite
router.post('/favorites/:courseId', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('favoriteCourses');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const idx = user.favoriteCourses.findIndex(id => id.toString() === req.params.courseId);
    if (idx > -1) {
      user.favoriteCourses.splice(idx, 1);
    } else {
      user.favoriteCourses.push(new (require('mongoose').Types.ObjectId)(req.params.courseId));
    }
    await user.save();
    res.json({ success: true, isFavorite: idx === -1, count: user.favoriteCourses.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/users/announcements — active announcements for learners
router.get('/announcements', protect, async (_req, res) => {
  try {
    const Popup = (await import('../models/Popup')).default;
    const now = new Date();
    const announcements = await Popup.find({
      type: 'announcement',
      isActive: true,
      $and: [
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] },
      ],
    }).sort({ priority: -1, createdAt: -1 }).limit(20);
    res.json({ success: true, announcements });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/users/leaderboard — XP leaderboard
router.get('/leaderboard', protect, async (_req, res) => {
  try {
    const users = await User.find({ isActive: true, xpPoints: { $gt: 0 } })
      .select('name avatar xpPoints level badges packageTier')
      .sort('-xpPoints').limit(20);
    res.json({ success: true, leaderboard: users });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
