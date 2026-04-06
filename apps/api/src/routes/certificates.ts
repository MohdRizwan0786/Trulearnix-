import { Router } from 'express';
import { claimCertificate, getMyCertificates, verifyCertificate } from '../controllers/certificateController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/my', protect, getMyCertificates);
router.post('/claim/:courseId', protect, claimCertificate);
router.get('/verify/:id', verifyCertificate);

export default router;
