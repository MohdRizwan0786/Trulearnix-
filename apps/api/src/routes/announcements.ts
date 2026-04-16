import { Router, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import Announcement from '../models/Announcement';
import Enrollment from '../models/Enrollment';

const router = Router();

// ── Student: get announcements targeted to me ─────────────────────────────────
router.get('/my', protect, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const Batch = (await import('../models/Batch')).default;

    // Get enrolled course IDs and batch IDs
    const enrollments = await Enrollment.find({ student: req.user._id }).select('course batch');
    const courseIds = enrollments.map(e => (e as any).course?.toString()).filter(Boolean);
    const batchIds = enrollments.map(e => (e as any).batch?.toString()).filter(Boolean);

    // Also find batch via batchService
    const batches = await Batch.find({ students: req.user._id }).select('_id');
    const allBatchIds = [...new Set([...batchIds, ...batches.map((b: any) => b._id.toString())])];

    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetType: 'all' },
        { targetType: 'course', targetCourse: { $in: courseIds } },
        { targetType: 'batch', targetBatch: { $in: allBatchIds } },
      ],
    })
      .populate('postedBy', 'name avatar role')
      .populate('targetCourse', 'title thumbnail')
      .populate('targetBatch', 'name')
      .sort({ pinned: -1, priority: -1, createdAt: -1 })
      .limit(50);

    res.json({ success: true, announcements });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin/Mentor: get all announcements ───────────────────────────────────────
router.get('/', protect, authorize('admin', 'superadmin', 'mentor'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 30, targetType } = req.query as any;
    const filter: any = {};

    // Mentor can only see their own
    if (req.user.role === 'mentor') {
      filter.postedBy = req.user._id;
    }
    if (targetType && targetType !== 'all_types') filter.targetType = targetType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('postedBy', 'name avatar role')
        .populate('targetCourse', 'title thumbnail')
        .populate('targetBatch', 'name')
        .sort({ pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Announcement.countDocuments(filter),
    ]);

    res.json({ success: true, announcements, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin/Mentor: create announcement ────────────────────────────────────────
router.post('/', protect, authorize('admin', 'superadmin', 'mentor'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, image, link, linkText, priority, targetType, targetCourse, targetBatch, pinned } = req.body;

    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });

    const announcement = await Announcement.create({
      title, content, image, link, linkText, pinned: !!pinned,
      priority: priority || 0,
      targetType: targetType || 'all',
      targetCourse: targetType === 'course' ? targetCourse : undefined,
      targetBatch: targetType === 'batch' ? targetBatch : undefined,
      postedBy: req.user._id,
      postedByRole: req.user.role,
    });

    const populated = await announcement.populate('postedBy', 'name avatar role');
    res.status(201).json({ success: true, announcement: populated });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin/Mentor: update announcement ────────────────────────────────────────
router.patch('/:id', protect, authorize('admin', 'superadmin', 'mentor'), async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user.role === 'mentor') filter.postedBy = req.user._id;

    const announcement = await Announcement.findOneAndUpdate(filter, req.body, { new: true })
      .populate('postedBy', 'name avatar role')
      .populate('targetCourse', 'title thumbnail')
      .populate('targetBatch', 'name');

    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, announcement });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin/Mentor: delete announcement ────────────────────────────────────────
router.delete('/:id', protect, authorize('admin', 'superadmin', 'mentor'), async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user.role === 'mentor') filter.postedBy = req.user._id;
    await Announcement.findOneAndDelete(filter);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
