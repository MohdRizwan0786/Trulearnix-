import { Response } from 'express';
import LiveClass from '../models/LiveClass';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, courseId, batchId, lessonId, scheduledAt, duration } = req.body;

    const livekitRoomName = 'tl-' + uuidv4().replace(/-/g, '').substring(0, 16);

    const liveClass = await LiveClass.create({
      title, description,
      course: courseId || undefined,
      batch: batchId || undefined,
      lessonId: lessonId || undefined,
      mentor: req.user._id,
      scheduledAt: new Date(scheduledAt),
      duration,
      platform: 'livekit',
      livekitRoomName,
    });

    res.status(201).json({ success: true, liveClass });
    // Notify enrolled students about new class
    setImmediate(async () => {
      try {
        if (!liveClass.course) return;
        const Enrollment = (await import('../models/Enrollment')).default;
        const { sendPushToUsers } = await import('../services/pushService');
        const enrollments = await Enrollment.find({ course: liveClass.course }).select('student').lean();
        const studentIds = enrollments.map((e: any) => e.student);
        if (studentIds.length) {
          const dateStr = new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
          await sendPushToUsers(studentIds, {
            title: '📅 New Class Scheduled',
            body:  `${title} — ${dateStr}`,
            url:   '/student/classes',
            tag:   `class-scheduled-${liveClass._id}`,
            sound: true,
          });
        }
      } catch {}
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingClasses = async (req: AuthRequest, res: Response) => {
  try {
    let classes;

    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student: req.user._id }).select('course');
      const courseIds = enrollments.map(e => e.course);
      classes = await LiveClass.find({
        course: { $in: courseIds },
        status: { $in: ['scheduled', 'live'] },
        scheduledAt: { $gte: new Date() }
      }).populate('course', 'title').populate('mentor', 'name avatar').sort('scheduledAt');
    } else {
      classes = await LiveClass.find({
        mentor: req.user._id,
        status: { $in: ['scheduled', 'live'] }
      }).populate('course', 'title').sort('scheduledAt');
    }

    res.json({ success: true, classes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const joinClass = async (req: AuthRequest, res: Response) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found' });

    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({ student: req.user._id, course: liveClass.course });
      if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled in this course' });

      const alreadyJoined = liveClass.attendees.find(a => a.user.toString() === req.user._id.toString());
      if (!alreadyJoined) {
        liveClass.attendees.push({ user: req.user._id, joinedAt: new Date() });
        await liveClass.save();
      }
    }

    res.json({ success: true, platform: 'livekit' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startClass = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = ['superadmin', 'admin', 'manager'].includes(req.user.role);
    const filter: any = { _id: req.params.id };
    if (!isAdmin) filter.mentor = req.user._id;
    const liveClass = await LiveClass.findOneAndUpdate(filter, { status: 'live', startedAt: new Date() }, { new: true });
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, liveClass });
    // Notify enrolled students in background
    setImmediate(async () => {
      try {
        const Enrollment = (await import('../models/Enrollment')).default;
        const { sendPushToUsers } = await import('../services/pushService');
        const enrollments = await Enrollment.find({ course: liveClass.course }).select('student').lean();
        const studentIds = enrollments.map((e: any) => e.student);
        if (studentIds.length) {
          await sendPushToUsers(studentIds, {
            title: '🔴 Class is Live Now!',
            body:  `${liveClass.title} has started. Join now!`,
            url:   `/student/classes`,
            tag:   `class-live-${liveClass._id}`,
            sound: true,
          });
        }
      } catch {}
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endClass = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = ['superadmin', 'admin', 'manager'].includes(req.user.role);
    const filter: any = { _id: req.params.id };
    if (!isAdmin) filter.mentor = req.user._id;
    const liveClass = await LiveClass.findOneAndUpdate(filter, { status: 'ended', endedAt: new Date() }, { new: true });
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, liveClass });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelClass = async (req: AuthRequest, res: Response) => {
  try {
    const liveClass = await LiveClass.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found' });
    liveClass.status = 'cancelled';
    await liveClass.save();
    res.json({ success: true, message: 'Class cancelled' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicLiveClasses = async (_req: any, res: Response) => {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const classes = await LiveClass.find({
      status: { $in: ['live', 'scheduled'] },
      $or: [
        { status: 'live' },
        { scheduledAt: { $gte: now, $lte: cutoff } }
      ]
    })
      .populate('mentor', 'name avatar')
      .populate('course', 'title category')
      .sort({ status: -1, scheduledAt: 1 })
      .limit(8);
    res.json({ success: true, classes });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};
