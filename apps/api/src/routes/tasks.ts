import { Router } from 'express';
import { protect as authenticate } from '../middleware/auth';
import Task from '../models/Task';
import User from '../models/User';

const router = Router();

// Get assignable team members (non-student users)
router.get('/team', authenticate, async (req, res) => {
  try {
    const members = await User.find({
      role: { $in: ['superadmin', 'admin', 'manager', 'mentor', 'salesperson'] },
      isActive: { $ne: false },
    }).select('_id name email role department avatar').sort('name');
    res.json({ success: true, data: members });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get tasks — superadmin/admin see all; everyone else sees only their own
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const filter = ['admin', 'superadmin'].includes(user.role)
      ? {}
      : { $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name avatar role')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create task
router.post('/', authenticate, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: (req as any).user._id });
    await task.populate('assignedTo', 'name avatar role');
    await task.populate('createdBy', 'name role');
    res.status(201).json({ success: true, data: task });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Update task
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name avatar role')
      .populate('createdBy', 'name role');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
