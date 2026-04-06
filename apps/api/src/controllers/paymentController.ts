import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, affiliateCode } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const enrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (enrolled) return res.status(400).json({ success: false, message: 'Already enrolled' });

    const amount = (course.discountPrice || course.price) * 100; // paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: { courseId, userId: req.user._id.toString() }
    });

    let affiliateUser;
    if (affiliateCode) {
      affiliateUser = await User.findOne({ affiliateCode });
    }

    await Payment.create({
      user: req.user._id,
      course: courseId,
      amount: amount / 100,
      razorpayOrderId: order.id,
      affiliateCode,
      affiliateUser: affiliateUser?._id
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');

    if (expected !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: 'paid' },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // Enroll student
    await Enrollment.create({ student: payment.user, course: payment.course, paymentId: razorpayPaymentId, orderId: razorpayOrderId, amount: payment.amount });

    // Update course enrollment count
    await Course.findByIdAndUpdate(payment.course, { $inc: { enrolledCount: 1 } });

    // Affiliate commission
    if (payment.affiliateUser) {
      const commission = payment.amount * (Number(process.env.AFFILIATE_COMMISSION_RATE) / 100);
      await User.findByIdAndUpdate(payment.affiliateUser, { $inc: { wallet: commission } });
      await Transaction.create({
        user: payment.affiliateUser,
        type: 'credit',
        category: 'affiliate_commission',
        amount: commission,
        description: `Affiliate commission for course purchase`,
        referenceId: payment._id?.toString(),
        balanceAfter: 0 // Will be calculated properly in production
      });
    }

    // Credit mentor earnings (70% of course price)
    const course = await Course.findById(payment.course).populate('mentor');
    if (course) {
      const mentorEarning = payment.amount * 0.70;
      await User.findByIdAndUpdate(course.mentor, { $inc: { wallet: mentorEarning } });
      await Transaction.create({
        user: course.mentor,
        type: 'credit',
        category: 'course_sale',
        amount: mentorEarning,
        description: `Earnings from course: ${course.title}`,
        referenceId: payment._id?.toString(),
        balanceAfter: 0
      });
    }

    res.json({ success: true, message: 'Payment verified. Enrollment successful!' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: 'paid' })
      .populate('course', 'title thumbnail').sort('-createdAt');
    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
