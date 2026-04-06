import { Router } from 'express';
import { getWallet, requestWithdrawal, getTransactions } from '../controllers/walletController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getWallet);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/transactions', protect, getTransactions);

export default router;
