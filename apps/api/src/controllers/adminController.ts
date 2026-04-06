import { Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Payment from '../models/Payment';
import SupportTicket from '../models/SupportTicket';
import Certificate from '../models/Certificate';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalStudents, totalMentors, totalCourses, totalEnrollments, recentPayments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      Course.countDocuments({ status: 'published' }),
      Enrollment.countDocuments(),
      Payment.find({ status: 'paid' }).sort('-createdAt').limit(10).populate('user', 'name email').populate('course', 'title')
    ]);

    const revenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalStudents, totalMentors, totalCourses, totalEnrollments, totalRevenue: revenue[0]?.total || 0 },
      monthlyRevenue,
      recentPayments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query: any = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken -otp').skip(skip).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingCourses = async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ status: 'pending' }).populate('mentor', 'name email avatar').sort('-createdAt');
    res.json({ success: true, courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { status: 'published', $unset: { rejectionReason: 1 } }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course approved and published', course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course rejected', course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;
    const tickets = await SupportTicket.find(query).populate('user', 'name email').sort('-createdAt');
    res.json({ success: true, tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { status, message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.status = status;
    if (message) {
      ticket.messages.push({ sender: req.user._id, senderRole: 'admin', message, createdAt: new Date() });
    }
    if (status === 'resolved') ticket.resolvedAt = new Date();
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
