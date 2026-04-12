import { Router } from 'express';
import { createClass, getUpcomingClasses, joinClass, startClass, endClass, cancelClass, getPublicLiveClasses } from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';
import LiveClass from '../models/LiveClass';
import Enrollment from '../models/Enrollment';
import { generateZoomSignature } from '../services/zoomSdkService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const recordingsDir = '/var/www/trulearnix/uploads/recordings';
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

const recordingUpload = multer({
  storage: multer.diskStorage({
    destination: recordingsDir,
    filename: (_req: any, file: any, cb: any) => {
      const ext = path.extname(file.originalname) || '.webm';
      cb(null, `rec-${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  },
});

const router = Router();

// ── In-memory room control state ─────────────────────────────────────────────
const roomControls = new Map<string, { mutedAll: boolean; camOffAll: boolean; adminInRoom: boolean; adminName: string }>();

// ── In-memory poll state ──────────────────────────────────────────────────────
interface PollOption { text: string; votes: number }
interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  active: boolean;
}
const classPolls = new Map<string, { poll: Poll | null; votes: Map<string, number> }>();

router.get('/public', getPublicLiveClasses);
router.get('/upcoming', protect, getUpcomingClasses);

router.get('/my', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const classes = await LiveClass.find({ mentor: req.user._id })
      .populate('course', 'title').sort('-scheduledAt');
    res.json({ success: true, classes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/all', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const classes = await LiveClass.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('course', 'title category').sort('-scheduledAt').limit(Number(limit));
    res.json({ success: true, classes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const classes = await LiveClass.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('course', 'title category').sort('-scheduledAt').limit(Number(limit));
    res.json({ success: true, classes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), createClass);

// ── Student/Mentor: past recorded classes ─────────────────────────────────────
router.get('/my-recordings', protect, async (req: any, res) => {
  try {
    let classes;
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student: req.user._id }).select('course');
      const courseIds = enrollments.map((e: any) => e.course);
      classes = await LiveClass.find({
        course: { $in: courseIds },
        status: 'ended',
        recordingUrl: { $exists: true, $ne: null },
      }).populate('course', 'title').populate('mentor', 'name avatar').sort('-endedAt').limit(50);
    } else {
      classes = await LiveClass.find({
        mentor: req.user._id,
        status: 'ended',
        recordingUrl: { $exists: true, $ne: null },
      }).populate('course', 'title').sort('-endedAt').limit(50);
    }
    res.json({ success: true, classes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get class detail
router.get('/:id/detail', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id)
      .populate('mentor', 'name avatar email')
      .populate('course', 'title thumbnail');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, liveClass: cls });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Agora Token ────────────────────────────────────────────────────────────────
router.get('/:id/agora-token', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const appId = process.env.AGORA_APP_ID || '';
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
    const channelName = (cls as any).agoraChannelName || cls._id.toString();
    const isMentor = cls.mentor.toString() === req.user._id.toString()
      || ['superadmin', 'admin', 'manager'].includes(req.user.role);

    let token: string | null = null;
    if (appCertificate) {
      const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
      const uid = 0;
      const role = isMentor ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expireTime = Math.floor(Date.now() / 1000) + 3600;
      token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, expireTime);
    }

    res.json({
      success: true,
      appId,
      token,
      channelName,
      uid: 0,
      role: isMentor ? 'host' : 'audience',
      userName: req.user.name,
      classTitle: cls.title,
      duration: cls.duration,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Zoom SDK Signature ─────────────────────────────────────────────────────────
router.get('/:id/zoom-signature', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if (!cls.zoomMeetingId) return res.status(400).json({ success: false, message: 'No Zoom meeting linked' });

    const isMentor = cls.mentor.toString() === req.user._id.toString()
      || ['superadmin', 'admin', 'manager'].includes(req.user.role);
    const role = isMentor ? 1 : 0;

    const signature = generateZoomSignature(cls.zoomMeetingId, role);
    res.json({
      success: true,
      signature,
      sdkKey: process.env.ZOOM_SDK_KEY || process.env.ZOOM_API_KEY || '',
      meetingNumber: cls.zoomMeetingId,
      password: cls.zoomPassword || '',
      role,
      userName: req.user.name,
      userEmail: req.user.email,
      duration: cls.duration,
      title: cls.title,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Attendance: Heartbeat (called every 30s from frontend) ────────────────────
router.post('/:id/attendance/ping', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const userId = req.user._id.toString();
    let record = (cls.attendanceRecords as any[]).find((r: any) => r.user.toString() === userId);

    if (!record) {
      (cls.attendanceRecords as any[]).push({
        user: req.user._id, totalWatchSeconds: 30, isPresent: false, lastPing: new Date()
      });
      record = (cls.attendanceRecords as any[]).at(-1);
    } else {
      record.totalWatchSeconds = (record.totalWatchSeconds || 0) + 30;
      record.lastPing = new Date();
    }

    const thresholdSecs = cls.duration * 60 * 0.75;
    const wasPresent = record.isPresent;
    record.isPresent = record.totalWatchSeconds >= thresholdSecs;

    await cls.save();
    res.json({
      success: true,
      isPresent: record.isPresent,
      justMarked: !wasPresent && record.isPresent,
      totalWatchSeconds: record.totalWatchSeconds,
      thresholdSeconds: thresholdSecs,
      percent: Math.min(100, Math.round((record.totalWatchSeconds / (cls.duration * 60)) * 100)),
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Attendance: My status ─────────────────────────────────────────────────────
router.get('/:id/attendance/me', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const userId = req.user._id.toString();
    const record = (cls.attendanceRecords as any[]).find((r: any) => r.user.toString() === userId);
    const thresholdSecs = cls.duration * 60 * 0.75;
    res.json({
      success: true,
      isPresent: record?.isPresent || false,
      totalWatchSeconds: record?.totalWatchSeconds || 0,
      thresholdSeconds: thresholdSecs,
      percent: record ? Math.min(100, Math.round((record.totalWatchSeconds / (cls.duration * 60)) * 100)) : 0,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Attendance: All (mentor/admin view) ───────────────────────────────────────
router.get('/:id/attendance', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id)
      .populate('attendanceRecords.user', 'name email avatar');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, attendanceRecords: cls.attendanceRecords, duration: cls.duration });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Poll endpoints ────────────────────────────────────────────────────────────
// Mentor creates/replaces poll
router.post('/:id/poll', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), (req: any, res) => {
  const { question, options } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ success: false, message: 'question and at least 2 options required' });
  }
  const poll: Poll = {
    id: Date.now().toString(),
    question: String(question).trim(),
    options: options.map((o: string) => ({ text: String(o).trim(), votes: 0 })),
    createdAt: Date.now(),
    active: true,
  };
  classPolls.set(req.params.id, { poll, votes: new Map() });
  res.json({ success: true, poll });
});

// Get active poll + results
router.get('/:id/poll', protect, (req: any, res) => {
  const data = classPolls.get(req.params.id);
  if (!data?.poll) return res.json({ success: true, poll: null });
  const total = data.poll.options.reduce((s, o) => s + o.votes, 0);
  const hasVoted = data.votes.has(String(req.user._id));
  const myVote = hasVoted ? data.votes.get(String(req.user._id)) : null;
  res.json({ success: true, poll: data.poll, total, hasVoted, myVote });
});

// Student votes
router.post('/:id/poll/vote', protect, (req: any, res) => {
  const { optionIndex } = req.body;
  const data = classPolls.get(req.params.id);
  if (!data?.poll?.active) return res.status(400).json({ success: false, message: 'No active poll' });
  const uid = String(req.user._id);
  if (data.votes.has(uid)) return res.status(400).json({ success: false, message: 'Already voted' });
  if (optionIndex < 0 || optionIndex >= data.poll.options.length) {
    return res.status(400).json({ success: false, message: 'Invalid option' });
  }
  data.poll.options[optionIndex].votes += 1;
  data.votes.set(uid, optionIndex);
  const total = data.poll.options.reduce((s, o) => s + o.votes, 0);
  res.json({ success: true, poll: data.poll, total, hasVoted: true, myVote: optionIndex });
});

// Mentor ends poll
router.delete('/:id/poll', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), (req: any, res) => {
  const data = classPolls.get(req.params.id);
  if (data?.poll) data.poll.active = false;
  res.json({ success: true });
});

// ── Room control (mentor → student signaling) ─────────────────────────────────
// Mentor sets mute/cam state; admin sets adminInRoom
router.post('/:id/room-control', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), (req: any, res) => {
  const { mutedAll, camOffAll, adminInRoom, adminName } = req.body;
  const id = req.params.id;
  const current = roomControls.get(id) || { mutedAll: false, camOffAll: false, adminInRoom: false, adminName: '' };
  roomControls.set(id, {
    mutedAll: mutedAll !== undefined ? !!mutedAll : current.mutedAll,
    camOffAll: camOffAll !== undefined ? !!camOffAll : current.camOffAll,
    adminInRoom: adminInRoom !== undefined ? !!adminInRoom : current.adminInRoom,
    adminName: adminName !== undefined ? String(adminName) : current.adminName,
  });
  res.json({ success: true, ...roomControls.get(id) });
});

// Student polls for their control state
router.get('/:id/room-control', protect, (req: any, res) => {
  const state = roomControls.get(req.params.id) || { mutedAll: false, camOffAll: false };
  res.json({ success: true, ...state });
});

router.get('/:id/join', protect, joinClass);
router.patch('/:id/start', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), startClass);
router.patch('/:id/end', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), endClass);
router.delete('/:id', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), cancelClass);

// ── AI Class Summary ──────────────────────────────────────────────────────────
router.post('/:id/summary', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id)
      .populate('mentor', 'name')
      .populate('course', 'title');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const presentCount = cls.attendanceRecords.filter((r: any) => r.isPresent).length;
    const totalJoined  = cls.attendanceRecords.length;
    const mentorName   = (cls.mentor as any)?.name || 'Instructor';
    const courseName   = (cls.course as any)?.title || '';
    const durationMin  = cls.duration;

    let summary = '';

    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `You are an educational assistant. Generate a concise 3-4 sentence class summary in English for students.
Class Title: ${cls.title}
${cls.description ? `Description: ${cls.description}` : ''}
${courseName ? `Course: ${courseName}` : ''}
Instructor: ${mentorName}
Duration: ${durationMin} minutes
Attendance: ${presentCount} out of ${totalJoined} students marked present.
Write the summary as if addressing the students. Include likely topics covered, key takeaways, and a note about attendance.`,
        }],
        max_tokens: 200,
      });
      summary = completion.choices[0]?.message?.content?.trim() || '';
    }

    if (!summary) {
      summary = `Today's class "${cls.title}" was conducted by ${mentorName} for ${durationMin} minutes.${courseName ? ` This session was part of the "${courseName}" course.` : ''} The class covered the scheduled topic in detail. ${presentCount} out of ${totalJoined} students were marked present. Keep up the great work and review today's material!`;
    }

    cls.summary = summary;
    await cls.save();
    res.json({ success: true, summary });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Mentor saves notes for a class ───────────────────────────────────────────
router.patch('/:id/notes', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { notes } = req.body;
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    cls.mentorNotes = notes || '';
    await cls.save();
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Quizzes linked to class's course ─────────────────────────────────────────
router.get('/:id/quizzes', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id).select('course');
    if (!cls || !cls.course) return res.json({ success: true, quizzes: [] });
    const Quiz = require('../models/Quiz').default;
    const quizzes = await Quiz.find({ course: cls.course }).select('title description questions').lean();
    res.json({ success: true, quizzes });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Recording Upload (called by mentor browser when class ends) ───────────────
router.post('/:id/recording', protect, authorize('mentor', 'superadmin', 'admin', 'manager'),
  recordingUpload.single('recording'),
  async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No recording file uploaded' });

      const cls = await LiveClass.findById(req.params.id);
      if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

      const recordingUrl = `/uploads/recordings/${req.file.filename}`;
      cls.recordingUrl = recordingUrl;
      cls.recordingSize = req.file.size;
      cls.recordingFileName = req.file.filename;
      await cls.save();

      res.json({ success: true, recordingUrl, fileName: req.file.filename, size: req.file.size });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }
);

// ── Recordings List (admin) — filter by batch, course, date ──────────────────
router.get('/admin/recordings', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { batch, course, from, to, limit = 100 } = req.query;
    const filter: any = { recordingUrl: { $exists: true, $ne: null } };
    if (batch) filter.batch = batch;
    if (course) filter.course = course;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from as string);
      if (to) filter.scheduledAt.$lte = new Date(to as string);
    }

    const recordings = await LiveClass.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('course', 'title')
      .populate('batch', 'batchNumber label')
      .sort('-endedAt')
      .limit(Number(limit));

    res.json({ success: true, recordings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
