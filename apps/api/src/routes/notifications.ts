import { Router } from 'express';
import Notification from '../models/Notification';
import SupportTicket from '../models/SupportTicket';
import PushSubscription from '../models/PushSubscription';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(Number(limit)),
      Notification.countDocuments({ user: req.user._id }),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ success: true, notifications, total, unread });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/read-all', protect, async (req: any, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/:id/read', protect, async (req: any, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Push Subscription ──────────────────────────────────────────────────────

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (_req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY || '' })
})

// POST /api/notifications/push-subscribe — save push subscription
router.post('/push-subscribe', protect, async (req: any, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ success: false, message: 'Invalid subscription' })
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys, userAgent: userAgent || req.headers['user-agent'] },
      { upsert: true, new: true }
    )
    res.json({ success: true, message: 'Subscribed to push notifications' })
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }) }
})

// DELETE /api/notifications/push-subscribe — remove subscription
router.delete('/push-subscribe', protect, async (req: any, res) => {
  try {
    const { endpoint } = req.body
    if (endpoint) await PushSubscription.deleteOne({ endpoint, user: req.user._id })
    else await PushSubscription.deleteMany({ user: req.user._id })
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }) }
})

// Support tickets
router.post('/ticket', protect, async (req: any, res) => {
  try {
    const userType = req.body.userType || (req.user.isAffiliate ? 'partner' : 'learner');
    const ticket = await SupportTicket.create({
      user: req.user._id, userType, ...req.body,
      messages: [{ sender: req.user._id, senderRole: req.user.role, message: req.body.description, createdAt: new Date() }]
    });
    res.status(201).json({ success: true, ticket });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/tickets', protect, async (req: any, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, tickets });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Reply to own ticket
router.post('/tickets/:id/reply', protect, async (req: any, res) => {
  try {
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: { $nin: ['closed'] } },
      { $push: { messages: { sender: req.user._id, senderRole: req.user.role, message: req.body.message, createdAt: new Date() } } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found or closed' });
    res.json({ success: true, ticket });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
