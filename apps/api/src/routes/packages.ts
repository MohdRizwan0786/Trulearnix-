import { Router } from 'express';
import { getPackages, getPackageById, createPackageOrder, verifyPackagePayment, getMyPackage, getCommissionMatrix } from '../controllers/packageController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', getPackages);
router.get('/commission-matrix', getCommissionMatrix);
router.get('/:id', getPackageById);
router.get('/my', protect, getMyPackage);
router.post('/order', protect, createPackageOrder);
router.post('/verify', protect, verifyPackagePayment);

export default router;
