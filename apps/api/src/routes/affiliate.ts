import { Router } from 'express';
import User from '../models/User';
import Payment from '../models/Payment';
import Transaction from '../models/Transaction';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/stats', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('affiliateCode wallet');
    const referrals = await User.find({ referredBy: req.user._id }).select('name createdAt').countDocuments();
    const commissions = await Transaction.aggregate([
      { $match: { user: req.user._id, category: 'affiliate_commission' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    res.json({
      success: true,
      affiliateCode: user?.affiliateCode,
      referralLink: `${process.env.WEB_URL}?ref=${user?.affiliateCode}`,
      totalReferrals: referrals,
      totalEarnings: commissions[0]?.total || 0,
      totalTransactions: commissions[0]?.count || 0,
      walletBalance: user?.wallet || 0
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/referrals', protect, async (req: any, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id }).select('name email createdAt').sort('-createdAt');
    res.json({ success: true, referrals });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
