import { Router } from 'express';
import { protect as authenticate, authorize } from '../middleware/auth';
import Reminder from '../models/Reminder';

const router = Router();

// Get all reminders
router.get('/', authenticate, authorize('admin', 'superadmin', 'manager', 'employee', 'department_head', 'team_lead'), async (req, res) => {
  try {
    const reminders = await Reminder.find().populate('createdBy', 'name').sort({ scheduledAt: 1 });
    res.json({ success: true, data: reminders });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create reminder
router.post('/', authenticate, authorize('admin', 'superadmin', 'manager', 'employee', 'department_head', 'team_lead'), async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, createdBy: (req as any).user._id });
    res.status(201).json({ success: true, data: reminder });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Update reminder
router.patch('/:id', authenticate, authorize('admin', 'superadmin', 'manager', 'employee', 'department_head', 'team_lead'), async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, data: reminder });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
