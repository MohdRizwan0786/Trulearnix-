import { Router } from 'express';
import { createQuiz, updateQuiz, getQuizForStudent, submitQuiz, getMentorQuizzes, getStudentQuizzes } from '../controllers/quizController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/my-quizzes', protect, authorize('mentor'), getMentorQuizzes);
router.get('/student/list', protect, authorize('student'), getStudentQuizzes);
router.get('/:id', protect, getQuizForStudent);
router.post('/', protect, authorize('mentor'), createQuiz);
router.put('/:id', protect, authorize('mentor'), updateQuiz);
router.post('/:id/submit', protect, authorize('student'), submitQuiz);

export default router;
