import { Router } from 'express';
import { createClass, getUpcomingClasses, joinClass, startClass, endClass, cancelClass, getPublicLiveClasses } from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';
import LiveClass from '../models/LiveClass';
import Enrollment from '../models/Enrollment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EgressClient, EncodedFileType, RoomServiceClient } from 'livekit-server-sdk';
import Course from '../models/Course';
import Webinar from '../models/Webinar';

const recordingsDir = '/var/www/trulearnix-qa/uploads/recordings';
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

// ── LiveKit Token ──────────────────────────────────────────────────────────────
router.get('/:id/livekit-token', protect, async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    const livekitUrl = process.env.LIVEKIT_URL || '';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit not configured' });
    }

    const roomName = (cls as any).livekitRoomName || (cls as any).agoraChannelName || cls._id.toString();
    const isMentor = cls.mentor.toString() === req.user._id.toString()
      || ['superadmin', 'admin', 'manager'].includes(req.user.role);

    const { AccessToken } = require('livekit-server-sdk');
    const at = new AccessToken(apiKey, apiSecret, {
      identity: req.user._id.toString(),
      name: req.user.name,
      ttl: 7200, // 2 hours
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isMentor,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      success: true,
      token,
      livekitUrl,
      roomName,
      role: isMentor ? 'host' : 'audience',
      userName: req.user.name,
      classTitle: cls.title,
      duration: cls.duration,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});


// ── Egress helpers ────────────────────────────────────────────────────────────
const getLivekitHost = () =>
  process.env.LIVEKIT_URL!.replace('wss://', 'https://').replace('ws://', 'http://');

const getEgressClient = () => new EgressClient(
  getLivekitHost(), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!
);

const getRoomClient = () => new RoomServiceClient(
  getLivekitHost(), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!
);

// Helper: stop egress and save recording URL to class
const stopClassEgress = async (cls: any) => {
  if (!(cls as any).egressId) return null;
  try {
    const client = getEgressClient();
    await client.stopEgress((cls as any).egressId);
  } catch (e) {
    console.warn('stopEgress failed (may already be stopped):', e);
  }
  const fileName = (cls as any).recordingFileName;
  const recordingUrl = `/uploads/recordings/${fileName}`;
  cls.recordingUrl = recordingUrl;
  cls.recordingSize = undefined;
  (cls as any).egressId = null;

  // Background: upload to R2 after LiveKit finalizes the file (~30s delay)
  // NOTE: Recording is saved for admin only. Admin downloads, uploads to YouTube, then links manually.
  const classId = cls._id?.toString();
  setTimeout(async () => {
    try {
      const { uploadRecordingToR2 } = await import('../services/s3Service');
      const result = await uploadRecordingToR2(fileName);
      if (result) {
        await LiveClass.findByIdAndUpdate(classId, { recordingUrl: result.url, recordingSize: result.size });
        console.log(`[R2] Class recording uploaded: ${result.url}`);
      }
    } catch (e) {
      console.warn('[R2] Class recording upload failed:', e);
    }
  }, 30000);

  return recordingUrl;
};

// ── Egress: Server-side recording ─────────────────────────────────────────────
router.post('/:id/egress/start', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if ((cls as any).egressId) return res.json({ success: true, egressId: (cls as any).egressId, alreadyRunning: true });

    const roomName = (cls as any).livekitRoomName || cls._id.toString();
    const fileName = `class-${cls._id}-${Date.now()}.mp4`;
    const egressClient = getEgressClient();
    let info: any;

    try {
      // Participant egress — no Chrome needed, records host's tracks directly
      const participants = await getRoomClient().listParticipants(roomName);
      const publisher = (participants as any[]).find((p: any) => p.tracks && p.tracks.length > 0);
      if (publisher) {
        info = await egressClient.startParticipantEgress(
          roomName,
          publisher.identity,
          { file: { fileType: EncodedFileType.MP4, filepath: `/recordings/${fileName}` } as any }
        );
      } else {
        // No publisher yet — fall back to room composite (waits for someone to publish)
        info = await egressClient.startRoomCompositeEgress(roomName, {
          file: { fileType: EncodedFileType.MP4, filepath: `/recordings/${fileName}` },
        } as any);
      }
    } catch {
      info = await egressClient.startRoomCompositeEgress(roomName, {
        file: { fileType: EncodedFileType.MP4, filepath: `/recordings/${fileName}` },
      } as any);
    }

    (cls as any).egressId = info.egressId;
    (cls as any).recordingFileName = fileName;
    await cls.save();
    res.json({ success: true, egressId: info.egressId });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/:id/egress/stop', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if (!(cls as any).egressId) return res.status(400).json({ success: false, message: 'No active recording' });
    const recordingUrl = await stopClassEgress(cls);
    await cls.save();
    res.json({ success: true, recordingUrl });
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
router.get('/:id/room-control', protect, async (req: any, res) => {
  try {
    const state = roomControls.get(req.params.id) || { mutedAll: false, camOffAll: false };
    const cls = await LiveClass.findById(req.params.id).select('status');
    res.json({ success: true, ...state, classStatus: cls?.status || 'unknown' });
  } catch { res.json({ success: true, mutedAll: false, camOffAll: false, classStatus: 'unknown' }); }
});

router.get('/:id/join', protect, joinClass);
router.patch('/:id/start', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), startClass);

// End class — auto-stops any running egress recording before marking ended
router.patch('/:id/end', protect, authorize('mentor', 'superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const isAdmin = ['superadmin', 'admin', 'manager'].includes(req.user.role);
    const filter: any = { _id: req.params.id };
    if (!isAdmin) filter.mentor = req.user._id;
    const cls = await LiveClass.findOne(filter);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    // Auto-stop egress if running
    if ((cls as any).egressId) {
      await stopClassEgress(cls);
    }

    cls.status = 'ended';
    cls.endedAt = new Date();
    await cls.save();
    res.json({ success: true, liveClass: cls });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

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

    const classRecordings = await LiveClass.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('course', 'title')
      .populate('batch', 'batchNumber label')
      .sort('-endedAt')
      .limit(Number(limit));

    const webinarRecordings = await Webinar.find({ recordingUrl: { $exists: true, $ne: null } })
      .populate('createdBy', 'name email avatar')
      .sort('-endedAt')
      .limit(Number(limit));

    const webinarsMapped = webinarRecordings.map((w: any) => ({
      _id: w._id,
      title: w.title,
      recordingUrl: w.recordingUrl,
      recordingSize: w.recordingSize,
      recordingFileName: w.recordingFileName,
      duration: w.duration,
      endedAt: w.endedAt,
      scheduledAt: w.scheduledAt,
      type: w.type,
      _recordingType: 'webinar',
      mentor: w.createdBy,
      course: null,
      batch: null,
    }));

    const recordings = [
      ...classRecordings.map((c: any) => ({ ...c.toObject(), _recordingType: 'class' })),
      ...webinarsMapped,
    ].sort((a: any, b: any) => new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime());

    res.json({ success: true, recordings });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin: delete a recording from R2 + clear from DB
router.delete('/:id/recording', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    const url = cls.recordingUrl;
    if (url) {
      const isR2 = url.startsWith('http');
      if (isR2) {
        const { deleteRecordingFromR2 } = await import('../services/s3Service');
        await deleteRecordingFromR2(url);
      } else {
        const localPath = `/var/www/trulearnix-qa${url}`;
        const fs2 = await import('fs');
        if (fs2.existsSync(localPath)) fs2.unlinkSync(localPath);
        const prodPath = `/var/www/trulearnix-prod${url}`;
        if (fs2.existsSync(prodPath)) fs2.unlinkSync(prodPath);
      }
    }
    cls.recordingUrl = undefined as any;
    cls.recordingSize = undefined as any;
    cls.recordingFileName = undefined as any;
    await cls.save();
    res.json({ success: true, message: 'Recording deleted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
