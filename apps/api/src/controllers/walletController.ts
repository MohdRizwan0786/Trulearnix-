import { Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt').limit(20);
    res.json({ success: true, balance: user?.wallet || 0, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, bankDetails } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.wallet < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });
    if (amount < 100) return res.status(400).json({ success: false, message: 'Minimum withdrawal is ₹100' });

    user.wallet -= amount;
    await user.save();

    await Transaction.create({
      user: req.user._id,
      type: 'debit',
      category: 'withdrawal',
      amount,
      description: `Withdrawal request - ${bankDetails?.accountNumber || 'UPI'}`,
      status: 'pending',
      balanceAfter: user.wallet
    });

    res.json({ success: true, message: 'Withdrawal request submitted. Processing in 3-5 days.', balance: user.wallet });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const query: any = { user: req.user._id };
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({ success: true, transactions, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
