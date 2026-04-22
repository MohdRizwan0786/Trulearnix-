import { Router } from 'express';
import { protect as authenticate, authorize } from '../middleware/auth';
import Goal from '../models/Goal';

const router = Router();

// Get goals
router.get('/', authenticate, async (req, res) => {
  try {
    const { quarter, year, type } = req.query as any;
    const filter: any = {};
    if (quarter) filter.quarter = quarter;
    if (year) filter.year = parseInt(year);
    if (type) filter.type = type;
    const goals = await Goal.find(filter).populate('owner', 'name avatar').sort({ createdAt: -1 });
    res.json({ success: true, data: goals });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create goal
router.post('/', authenticate, authorize('admin', 'superadmin', 'manager', 'employee', 'department_head', 'team_lead'), async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, owner: (req as any).user._id });
    res.status(201).json({ success: true, data: goal });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Update goal / key results
router.patch('/:id', authenticate, authorize('admin', 'superadmin', 'manager', 'employee', 'department_head', 'team_lead'), async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: goal });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update key result progress
router.patch('/:id/kr/:krIndex', authenticate, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    const idx = parseInt(req.params.krIndex);
    if (goal.keyResults[idx]) {
      goal.keyResults[idx].current = req.body.current;
      // Recalculate overall progress
      const total = goal.keyResults.reduce((acc, kr) => acc + Math.min(100, (kr.current / kr.target) * 100), 0);
      goal.progress = Math.round(total / goal.keyResults.length);
    }
    await goal.save();
    res.json({ success: true, data: goal });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete goal
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Goal deleted' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
