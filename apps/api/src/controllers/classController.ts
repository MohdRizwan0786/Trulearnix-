import { Response } from 'express';
import LiveClass from '../models/LiveClass';
import Enrollment from '../models/Enrollment';
import { createZoomMeeting, deleteZoomMeeting } from '../services/zoomService';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, courseId, scheduledAt, duration, platform } = req.body;

    let zoomData = {};
    let roomId;

    if (platform === 'zoom') {
      const zoom = await createZoomMeeting(title, new Date(scheduledAt), duration || 60);
      zoomData = { zoomMeetingId: zoom.meetingId, zoomJoinUrl: zoom.joinUrl, zoomStartUrl: zoom.startUrl, zoomPassword: zoom.password };
    } else {
      roomId = uuidv4();
    }

    const liveClass = await LiveClass.create({
      title, description,
      course: courseId,
      mentor: req.user._id,
      scheduledAt: new Date(scheduledAt),
      duration,
      platform: platform || 'zoom',
      roomId,
      ...zoomData
    });

    res.status(201).json({ success: true, liveClass });
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

    const response: any = { success: true, platform: liveClass.platform };

    if (liveClass.platform === 'zoom') {
      response.joinUrl = req.user.role === 'mentor' ? liveClass.zoomStartUrl : liveClass.zoomJoinUrl;
      response.password = liveClass.zoomPassword;
    } else {
      response.roomId = liveClass.roomId;
    }

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startClass = async (req: AuthRequest, res: Response) => {
  try {
    const liveClass = await LiveClass.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user._id },
      { status: 'live' },
      { new: true }
    );
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, liveClass });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endClass = async (req: AuthRequest, res: Response) => {
  try {
    const liveClass = await LiveClass.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user._id },
      { status: 'ended' },
      { new: true }
    );
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

    if (liveClass.zoomMeetingId) {
      await deleteZoomMeeting(liveClass.zoomMeetingId).catch(() => {});
    }

    liveClass.status = 'cancelled';
    await liveClass.save();
    res.json({ success: true, message: 'Class cancelled' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
