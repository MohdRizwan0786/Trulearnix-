import { Request, Response } from 'express';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, generateOTP } from '../utils/generateToken';
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService';
import redisClient from '../config/redis';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, referralCode } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    let referredBy;
    if (referralCode) {
      const referrer = await User.findOne({ affiliateCode: referralCode });
      if (referrer) referredBy = referrer._id;
    }

    const user = await User.create({ name, email, phone, password, role: role || 'student', referredBy });

    const otp = generateOTP();
    await redisClient.setEx(`otp:${user._id}`, 600, otp);
    await sendOTPEmail(email, otp, name);

    res.status(201).json({ success: true, message: 'Registration successful. Please verify your email.', userId: user._id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    const storedOTP = await redisClient.get(`otp:${userId}`);

    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await redisClient.del(`otp:${userId}`);
    await sendWelcomeEmail(user.email, user.name);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully', accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = generateOTP();
    await redisClient.setEx(`otp:${userId}`, 600, otp);
    await sendOTPEmail(user.email, otp, user.name);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) return res.status(401).json({ success: false, message: 'Please verify your email first' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account suspended. Contact support.' });

    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wallet: user.wallet }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user.id);
    res.json({ success: true, accessToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with this email' });

    const otp = generateOTP();
    await redisClient.setEx(`reset:${user._id}`, 600, otp);
    await sendOTPEmail(email, otp, user.name);

    res.json({ success: true, message: 'Password reset OTP sent', userId: user._id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const storedOTP = await redisClient.get(`reset:${userId}`);

    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save();
    await redisClient.del(`reset:${userId}`);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req: any, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
