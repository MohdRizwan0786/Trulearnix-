import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import Webinar from '../models/Webinar';
import { v4 as uuidv4 } from 'uuid';
import { EgressClient, EncodedFileType, RoomServiceClient } from 'livekit-server-sdk';

const router = Router();

// ── Room control state (in-memory) ────────────────────────────────────────────
const roomControls = new Map<string, { mutedAll: boolean; camOffAll: boolean }>();

// ── Helpers ───────────────────────────────────────────────────────────────────
const getLivekitHost = () =>
  process.env.LIVEKIT_URL!.replace('wss://', 'https://').replace('ws://', 'http://');

const getEgressClient = () => new EgressClient(
  getLivekitHost(),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const getRoomClient = () => new RoomServiceClient(
  getLivekitHost(),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const generateSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 10; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
};

// ── PUBLIC: Get webinar info by slug ──────────────────────────────────────────
router.get('/join/:slug', async (req, res) => {
  try {
    const webinar = await Webinar.findOne({ joinSlug: req.params.slug })
      .select('title description type status scheduledAt duration chatEnabled joinSlug');
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });
    if (webinar.status === 'cancelled') return res.status(410).json({ success: false, message: 'This session has been cancelled' });
    res.json({ success: true, webinar });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC: Get LiveKit token (guest join) ────────────────────────────────────
router.post('/join/:slug/token', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const webinar = await Webinar.findOne({ joinSlug: req.params.slug });
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });
    if (webinar.status === 'cancelled') return res.status(410).json({ success: false, message: 'Session cancelled' });
    if (webinar.status === 'ended') return res.status(410).json({ success: false, message: 'Session has ended' });

    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    const livekitUrl = process.env.LIVEKIT_URL || '';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit not configured' });
    }

    const participantId = uuidv4();
    const guestIdentity = `guest-${participantId}`;

    const { AccessToken } = require('livekit-server-sdk');
    const at = new AccessToken(apiKey, apiSecret, {
      identity: guestIdentity,
      name: String(name).trim(),
      ttl: 10800, // 3 hours
    });
    at.addGrant({
      roomJoin: true,
      room: webinar.livekitRoomName,
      canPublish: false,       // guests are viewers by default
      canSubscribe: true,
      canPublishData: webinar.chatEnabled,
    });

    const token = await at.toJwt();

    // Register participant
    webinar.participants.push({
      participantId,
      name: String(name).trim(),
      email: email ? String(email).trim() : undefined,
      joinedAt: new Date(),
      watchSeconds: 0,
    });
    await webinar.save();

    res.json({
      success: true,
      token,
      livekitUrl,
      roomName: webinar.livekitRoomName,
      role: 'audience',
      participantId,
      webinarTitle: webinar.title,
      duration: webinar.duration,
      status: webinar.status,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC: Participant heartbeat ─────────────────────────────────────────────
router.post('/join/:slug/ping', async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.json({ success: true });
    await Webinar.updateOne(
      { joinSlug: req.params.slug, 'participants.participantId': participantId },
      {
        $inc: { 'participants.$.watchSeconds': 30 },
        $set: { 'participants.$.lastPing': new Date() },
      }
    );
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// ── PUBLIC: Room control state (guests poll this) ─────────────────────────────
router.get('/join/:slug/room-control', async (req, res) => {
  try {
    const webinar = await Webinar.findOne({ joinSlug: req.params.slug }).select('status _id');
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });
    const state = roomControls.get(webinar._id.toString()) || { mutedAll: false, camOffAll: false };
    res.json({ success: true, ...state, webinarStatus: webinar.status });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── AUTH: All routes below require admin/manager ──────────────────────────────

// List all webinars
router.get('/', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { status, type, limit = 100 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const webinars = await Webinar.find(filter)
      .populate('createdBy', 'name email')
      .sort('-scheduledAt')
      .limit(Number(limit));
    res.json({ success: true, webinars });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Create webinar
router.post('/', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { title, description, type, scheduledAt, duration } = req.body;
    const joinSlug = generateSlug();
    const livekitRoomName = 'wb-' + uuidv4().replace(/-/g, '').substring(0, 16);

    const webinar = await Webinar.create({
      title, description,
      type: type || 'webinar',
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      joinSlug,
      livekitRoomName,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, webinar });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Get webinar detail (admin)
router.get('/:id', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id).populate('createdBy', 'name email');
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, webinar });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Update webinar details
router.patch('/:id', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const { title, description, scheduledAt, duration } = req.body;
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });
    if (webinar.status === 'live') return res.status(400).json({ success: false, message: 'Cannot edit a live session' });
    if (title) webinar.title = title;
    if (description !== undefined) webinar.description = description;
    if (scheduledAt) webinar.scheduledAt = new Date(scheduledAt);
    if (duration) webinar.duration = duration;
    await webinar.save();
    res.json({ success: true, webinar });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin LiveKit token (host)
router.get('/:id/livekit-token', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });

    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    const livekitUrl = process.env.LIVEKIT_URL || '';

    if (!apiKey || !apiSecret) return res.status(500).json({ success: false, message: 'LiveKit not configured' });

    const { AccessToken } = require('livekit-server-sdk');
    const at = new AccessToken(apiKey, apiSecret, {
      identity: req.user._id.toString(),
      name: req.user.name,
      ttl: 10800,
    });
    at.addGrant({
      roomJoin: true,
      room: webinar.livekitRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: true,
    });

    const token = await at.toJwt();
    res.json({ success: true, token, livekitUrl, roomName: webinar.livekitRoomName, role: 'host', webinarTitle: webinar.title });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Start webinar → go live + auto-start recording
router.patch('/:id/start', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });
    if (webinar.status === 'live') return res.json({ success: true, webinar });

    webinar.status = 'live';
    webinar.startedAt = new Date();
    await webinar.save();

    res.json({ success: true, webinar });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Start recording — called by frontend AFTER host has joined the room
router.patch('/:id/recording/start', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });
    if (webinar.egressId) return res.json({ success: true, alreadyRunning: true });
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return res.status(500).json({ success: false, message: 'LiveKit not configured' });
    }

    const fileName = `webinar-${webinar._id}-${Date.now()}.mp4`;
    const egressClient = getEgressClient();
    let info: any;

    try {
      // Try participant egress first (no Chrome needed — records host tracks directly)
      const roomClient = getRoomClient();
      const participants = await roomClient.listParticipants(webinar.livekitRoomName);
      const publisher = participants.find((p: any) => p.tracks && p.tracks.length > 0);

      if (publisher) {
        info = await egressClient.startParticipantEgress(
          webinar.livekitRoomName,
          publisher.identity,
          { file: { fileType: EncodedFileType.MP4, filepath: `/recordings/${fileName}` } }
        );
      } else {
        // No one is publishing yet — fall back to room composite (waits for publisher)
        info = await egressClient.startRoomCompositeEgress(webinar.livekitRoomName, {
          file: { fileType: EncodedFileType.MP4, filepath: `/recordings/${fileName}` },
        } as any);
      }
    } catch {
      // Fall back to room composite if participant listing fails
      info = await egressClient.startRoomCompositeEgress(webinar.livekitRoomName, {
        file: { fileType: EncodedFileType.MP4, filepath: `/recordings/${fileName}` },
      } as any);
    }

    webinar.egressId = info.egressId;
    webinar.recordingFileName = fileName;
    await webinar.save();
    res.json({ success: true, egressId: info.egressId });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// End webinar → stop recording + mark ended
router.patch('/:id/end', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });

    // Stop egress recording if running
    if (webinar.egressId) {
      try {
        const client = getEgressClient();
        await client.stopEgress(webinar.egressId);
        webinar.recordingUrl = `/uploads/recordings/${webinar.recordingFileName}`;
        webinar.egressId = undefined;
      } catch (egressErr) {
        console.warn('Egress stop failed:', egressErr);
      }
    }

    // Mark all still-active participants as left
    for (const p of webinar.participants) {
      if (!p.leftAt) p.leftAt = new Date();
    }

    webinar.status = 'ended';
    webinar.endedAt = new Date();
    await webinar.save();

    res.json({ success: true, webinar });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Cancel webinar
router.delete('/:id', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });
    webinar.status = 'cancelled';
    await webinar.save();
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Room control — admin sets mute/cam state
router.post('/:id/room-control', protect, authorize('superadmin', 'admin', 'manager'), (req: any, res) => {
  const { mutedAll, camOffAll } = req.body;
  const id = req.params.id;
  const current = roomControls.get(id) || { mutedAll: false, camOffAll: false };
  roomControls.set(id, {
    mutedAll: mutedAll !== undefined ? !!mutedAll : current.mutedAll,
    camOffAll: camOffAll !== undefined ? !!camOffAll : current.camOffAll,
  });
  res.json({ success: true, ...roomControls.get(id) });
});

// Room control — poll state
router.get('/:id/room-control', protect, authorize('superadmin', 'admin', 'manager'), (req: any, res) => {
  const state = roomControls.get(req.params.id) || { mutedAll: false, camOffAll: false };
  res.json({ success: true, ...state });
});

// Session report
router.get('/:id/report', protect, authorize('superadmin', 'admin', 'manager'), async (req: any, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id).populate('createdBy', 'name email');
    if (!webinar) return res.status(404).json({ success: false, message: 'Not found' });

    const totalParticipants = webinar.participants.length;
    const avgWatchSeconds = totalParticipants
      ? Math.round(webinar.participants.reduce((s, p) => s + (p.watchSeconds || 0), 0) / totalParticipants)
      : 0;
    const durationSeconds = webinar.endedAt && webinar.startedAt
      ? Math.round((webinar.endedAt.getTime() - webinar.startedAt.getTime()) / 1000)
      : webinar.duration * 60;

    const report = {
      webinar: {
        _id: webinar._id,
        title: webinar.title,
        type: webinar.type,
        status: webinar.status,
        scheduledAt: webinar.scheduledAt,
        startedAt: webinar.startedAt,
        endedAt: webinar.endedAt,
        duration: webinar.duration,
        createdBy: webinar.createdBy,
        recordingUrl: webinar.recordingUrl,
        joinSlug: webinar.joinSlug,
      },
      stats: {
        totalParticipants,
        avgWatchSeconds,
        durationSeconds,
        completionRate: durationSeconds > 0
          ? Math.round((avgWatchSeconds / durationSeconds) * 100)
          : 0,
      },
      participants: webinar.participants.map(p => ({
        name: p.name,
        email: p.email,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        watchSeconds: p.watchSeconds,
        watchPercent: durationSeconds > 0
          ? Math.min(100, Math.round((p.watchSeconds / durationSeconds) * 100))
          : 0,
      })).sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()),
    };

    res.json({ success: true, report });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
