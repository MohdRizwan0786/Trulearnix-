import { Router } from 'express';
import { getCourses, getCourseBySlug, createCourse, updateCourse, submitCourseForReview, getMentorCourses, getEnrolledCourseContent, markLessonComplete, addReview } from '../controllers/courseController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getCourses);
router.get('/my-courses', protect, authorize('mentor'), getMentorCourses);
router.get('/:slug', getCourseBySlug);
router.get('/:id/content', protect, authorize('student'), getEnrolledCourseContent);
router.post('/', protect, authorize('mentor'), createCourse);
router.put('/:id', protect, authorize('mentor'), updateCourse);
router.patch('/:id/submit', protect, authorize('mentor'), submitCourseForReview);
router.post('/:id/progress', protect, authorize('student'), markLessonComplete);
router.post('/:id/review', protect, authorize('student'), addReview);

export default router;
