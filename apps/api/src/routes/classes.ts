import { Router } from 'express';
import { createClass, getUpcomingClasses, joinClass, startClass, endClass, cancelClass } from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/upcoming', protect, getUpcomingClasses);
router.post('/', protect, authorize('mentor'), createClass);
router.get('/:id/join', protect, joinClass);
router.patch('/:id/start', protect, authorize('mentor'), startClass);
router.patch('/:id/end', protect, authorize('mentor'), endClass);
router.delete('/:id', protect, authorize('mentor'), cancelClass);

export default router;
