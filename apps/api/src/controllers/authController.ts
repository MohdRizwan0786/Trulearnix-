import { Request, Response } from 'express';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, generateOTP } from '../utils/generateToken';
import redisClient from '../config/redis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendWhatsAppText } from '../services/whatsappMetaService';

function generateAutoPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const rand = (s: string) => s[crypto.randomInt(s.length)];
  const body = Array.from({ length: 5 }, () => rand(upper + lower + digits)).join('');
  return rand(upper) + body + rand(digits) + rand(special);
}

// ── POST /auth/register ────────────────────────────────────────────────────────
// Stores form data in Redis only — NO DB entry until OTP is verified
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, age, country, state, role, referralCode, password } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email and phone are required' });
    }

    // Check if already registered in DB
    if (await User.findOne({ email: email.toLowerCase().trim() })) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const tempId = crypto.randomUUID();
    const otp = generateOTP();
    const autoPassword = (password && password.length >= 6) ? password : generateAutoPassword();

    // Store all registration data in Redis (30 min) — no DB write yet
    const regData = JSON.stringify({ name, email: email.toLowerCase().trim(), phone, age, country: country || 'India', state, role: role || 'student', referralCode: referralCode || '', autoPassword });
    await redisClient.setEx(`pending-reg:${tempId}`, 1800, regData);
    await redisClient.setEx(`otp:${tempId}`, 600, otp);

    // Send OTP via WhatsApp
    const waMsg = `🔐 Your TruLearnix OTP is: *${otp}*\n\nValid for 10 minutes. Do not share this with anyone.`;
    try { await sendWhatsAppText(phone, waMsg); } catch {}

    res.status(201).json({
      success: true,
      message: 'OTP sent to your WhatsApp. Please verify to continue.',
      tempId,
      _devOtp: otp, // remove after SMTP/WhatsApp is configured
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /auth/verify-otp ──────────────────────────────────────────────────────
// Creates user in DB only after OTP is verified
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body; // userId = tempId here for new registrations
    const storedOTP = await redisClient.get(`otp:${userId}`);

    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please try again.' });
    }

    await redisClient.del(`otp:${userId}`);

    // Check if this is a pending registration (new user) or existing user OTP (forgot password etc.)
    const pendingRaw = await redisClient.get(`pending-reg:${userId}`);

    if (pendingRaw) {
      // New registration — create user in DB now
      const reg = JSON.parse(pendingRaw);
      await redisClient.del(`pending-reg:${userId}`);

      // Final check for duplicate email
      if (await User.findOne({ email: reg.email })) {
        return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
      }

      let referredBy;
      if (reg.referralCode) {
        const referrer = await User.findOne({ affiliateCode: reg.referralCode.toUpperCase().trim() });
        if (referrer) referredBy = referrer._id;
      }

      const user = await User.create({
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        age: reg.age ? Number(reg.age) : undefined,
        country: reg.country,
        state: reg.state,
        password: reg.autoPassword,
        role: reg.role,
        referredBy,
        isVerified: true,
      });

      // Store plaintext password in Redis for 2h — sent via WhatsApp after purchase
      await redisClient.setEx(`reg-pw:${user._id}`, 7200, reg.autoPassword);

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      user.refreshToken = refreshToken;
      await user.save();

      return res.json({
        success: true,
        message: 'Account verified! Proceeding to checkout.',
        accessToken,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wallet: user.wallet, isAffiliate: user.isAffiliate, packageTier: user.packageTier, commissionRate: user.commissionRate, affiliateCode: user.affiliateCode },
      });
    }

    // Existing user OTP (for forgot password or re-verification)
    const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Verified successfully',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wallet: user.wallet, isAffiliate: user.isAffiliate, packageTier: user.packageTier, commissionRate: user.commissionRate, affiliateCode: user.affiliateCode },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /auth/resend-otp ──────────────────────────────────────────────────────
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // userId = tempId for pending registrations

    const otp = generateOTP();
    await redisClient.setEx(`otp:${userId}`, 600, otp);

    // Try to get phone from pending registration
    const pendingRaw = await redisClient.get(`pending-reg:${userId}`);
    if (pendingRaw) {
      const reg = JSON.parse(pendingRaw);
      const waMsg = `🔐 Your TruLearnix OTP is: *${otp}*\n\nValid for 10 minutes.`;
      try { await sendWhatsAppText(reg.phone, waMsg); } catch {}
      return res.json({ success: true, message: 'OTP resent to WhatsApp', _devOtp: otp });
    }

    // Existing user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const waMsg = `🔐 Your TruLearnix OTP is: *${otp}*\n\nValid for 10 minutes.`;
    try { await sendWhatsAppText(user.phone, waMsg); } catch {}

    res.json({ success: true, message: 'OTP resent', _devOtp: otp });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /auth/login ───────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) return res.status(401).json({ success: false, message: 'Please verify your account first' });
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wallet: user.wallet, isAffiliate: user.isAffiliate, packageTier: user.packageTier, commissionRate: user.commissionRate, affiliateCode: user.affiliateCode, department: (user as any).department, permissions: (user as any).permissions || [] }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /auth/refresh-token ───────────────────────────────────────────────────
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

// ── POST /auth/forgot-password ─────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with this email' });

    const otp = generateOTP();
    await redisClient.setEx(`reset:${user._id}`, 600, otp);

    const waMsg = `🔐 TruLearnix Password Reset OTP: *${otp}*\n\nValid for 10 minutes. If you didn't request this, ignore this message.`;
    try { await sendWhatsAppText(user.phone, waMsg); } catch {}

    res.json({ success: true, message: 'Password reset OTP sent to your WhatsApp', userId: user._id, _devOtp: otp });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /auth/reset-password ──────────────────────────────────────────────────
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

// ── POST /auth/logout ──────────────────────────────────────────────────────────
export const logout = async (req: any, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
