import { Router } from 'express';
import { protect as authenticate } from '../middleware/auth';
import Meeting from '../models/Meeting';
import User from '../models/User';

const router = Router();

// GET all meetings — all authenticated users see all company meetings
router.get('/', authenticate, async (req, res) => {
  try {
    const meetings = await Meeting.find({})
      .populate('createdBy', 'name role avatar')
      .populate('invitees', 'name role avatar')
      .sort({ scheduledAt: 1 });
    res.json({ success: true, data: meetings, meetings });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST create meeting (admin/manager only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'manager'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins can create meetings' });
    }
    const meeting = await Meeting.create({ ...req.body, createdBy: user._id });
    await meeting.populate('createdBy', 'name role avatar');
    await meeting.populate('invitees', 'name role avatar');
    res.status(201).json({ success: true, data: meeting });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// PATCH update meeting
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'manager'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins can update meetings' });
    }
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'name role avatar')
      .populate('invitees', 'name role avatar');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, data: meeting });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH start meeting
router.patch('/:id/start', authenticate, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { status: 'live' }, { new: true })
      .populate('createdBy', 'name role')
      .populate('invitees', 'name role');
    res.json({ success: true, data: meeting });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH end meeting
router.patch('/:id/end', authenticate, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { status: 'ended' }, { new: true });
    res.json({ success: true, data: meeting });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE meeting
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'manager'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins can delete meetings' });
    }
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET LiveKit token for meeting room
router.get('/:id/livekit-token', authenticate, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    const livekitUrl = process.env.LIVEKIT_URL || '';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit not configured' });
    }

    const user = (req as any).user;
    const { AccessToken } = require('livekit-server-sdk');
    const roomName = `meeting-${meeting.roomId}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user._id.toString(),
      name: user.name,
      ttl: 7200,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,        // everyone can publish in a meeting
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    const isHost = meeting.createdBy?.toString() === user._id.toString();
    res.json({
      success: true,
      token,
      livekitUrl,
      roomName,
      meetingTitle: meeting.title,
      duration: meeting.duration,
      userName: user.name,
      isHost,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const [total, upcoming, live, thisMonth, ended] = await Promise.all([
      Meeting.countDocuments({}),
      Meeting.countDocuments({ scheduledAt: { $gte: now }, status: 'scheduled' }),
      Meeting.countDocuments({ status: 'live' }),
      Meeting.countDocuments({ scheduledAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Meeting.countDocuments({ status: 'ended' }),
    ]);
    res.json({ success: true, data: { total, upcoming, live, thisMonth, ended } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
