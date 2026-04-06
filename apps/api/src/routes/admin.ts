import { Router } from 'express';
import { getDashboardStats, getAllUsers, toggleUserStatus, getPendingCourses, approveCourse, rejectCourse, getTickets, updateTicket } from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/courses/pending', getPendingCourses);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/reject', rejectCourse);
router.get('/tickets', getTickets);
router.patch('/tickets/:id', updateTicket);

export default router;
