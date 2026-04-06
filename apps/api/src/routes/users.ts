import { Router } from 'express';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import { protect } from '../middleware/auth';
import { uploadToS3 } from '../services/s3Service';

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

export default router;
