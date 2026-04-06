import { Router } from 'express';
import SupportTicket from '../models/SupportTicket';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/ticket', protect, async (req: any, res) => {
  try {
    const ticket = await SupportTicket.create({
      user: req.user._id,
      ...req.body,
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

export default router;
