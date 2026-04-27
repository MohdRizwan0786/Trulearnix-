import { Request, Response } from 'express';
import User from '../models/User';
import Package from '../models/Package';
import { generateAccessToken, generateRefreshToken, generateOTP } from '../utils/generateToken';
import redisClient from '../config/redis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOTPTemplate, sendPasswordResetOTPTemplate, sendReferralWelcomeTemplate, sendSponsorJoinTemplate } from '../services/whatsappMetaService';
import { sendReferralWelcomeEmail, sendSponsorJoinAlert, sendPasswordResetEmail, sendOTPEmail } from '../services/emailService';

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

    // Send OTP via WhatsApp (AUTH template) and Email
    try { await sendOTPTemplate(phone, otp); } catch {}
    try { await sendOTPEmail(email.toLowerCase().trim(), otp, name); } catch {}

    const response: any = {
      success: true,
      message: 'OTP sent to your WhatsApp and email. Please verify to continue.',
      tempId,
    };
    if (process.env.NODE_ENV !== 'production') response._devOtp = otp;
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
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

      // If joined via referral — notify user + sponsor (fire and forget)
      if (referredBy) {
        (async () => {
          try {
            const sponsor = await User.findById(referredBy).select('name email phone');
            if (!sponsor) return;

            const loginUrl = `${process.env.WEB_URL}/login`;
            const dashUrl = `${process.env.WEB_URL}/partner/dashboard`;

            await Promise.all([
              sendReferralWelcomeEmail(reg.email, reg.name, reg.email, reg.autoPassword, sponsor.name),
              sendReferralWelcomeTemplate(reg.phone, reg.name, sponsor.name || '', reg.email, reg.autoPassword, loginUrl),
              sendSponsorJoinAlert(sponsor.email, sponsor.name, reg.name, reg.email),
              sponsor.phone ? sendSponsorJoinTemplate(sponsor.phone, sponsor.name || '', reg.name, reg.email, dashUrl) : Promise.resolve(),
            ]);
          } catch (e: any) {
            console.error('[referral-notify]', e.message);
          }
        })();
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      await User.findByIdAndUpdate(user._id, { refreshToken });

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
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.json({
      success: true,
      message: 'Verified successfully',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wallet: user.wallet, isAffiliate: user.isAffiliate, packageTier: user.packageTier, commissionRate: user.commissionRate, affiliateCode: user.affiliateCode },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
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
      try { await sendOTPTemplate(reg.phone, otp); } catch {}
      try { await sendOTPEmail(reg.email, otp, reg.name); } catch {}
      const r: any = { success: true, message: 'OTP resent to WhatsApp and email' };
      if (process.env.NODE_ENV !== 'production') r._devOtp = otp;
      return res.json(r);
    }

    // Existing user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    try { await sendOTPTemplate(user.phone, otp); } catch {}
    try { await sendOTPEmail(user.email, otp, user.name); } catch {}

    const r2: any = { success: true, message: 'OTP resent' };
    if (process.env.NODE_ENV !== 'production') r2._devOtp = otp;
    res.json(r2);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
  }
};

// ── POST /auth/login ───────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // Imported users (from old website) ka password null hota hai — auto-send reset OTP
    if (!user.password) {
      const otp = generateOTP();
      try { await redisClient.setEx(`reset:${user._id}`, 600, otp); } catch {}
      const [waOk, emailOk] = await Promise.all([
        sendPasswordResetOTPTemplate(user.phone, otp).catch(() => false),
        sendPasswordResetEmail(user.email, otp, user.name).then(() => true).catch((e) => { console.error('[login-reset-email]', e.message); return false; }),
      ]);
      if (!waOk && !emailOk) {
        return res.status(503).json({ success: false, message: 'Password setup OTP bhej nahi paaye. Kripya thodi der baad try karein ya support se contact karein.' });
      }
      return res.status(200).json({
        success: true,
        needsPasswordSetup: true,
        userId: user._id,
        message: 'Aapka account purani website se migrate hua hai. Password setup ke liye OTP aapke email' + (waOk ? ' aur WhatsApp' : '') + ' par bhej diya hai.',
      });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) return res.status(401).json({ success: false, message: 'Please verify your account first' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account suspended. Contact support.' });

    const validTiers = ['free', ...(await Package.distinct('tier', { isActive: true }))];
    const packageTier = validTiers.includes(user.packageTier) ? user.packageTier : 'free';
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      packageTier,
      refreshToken,
      $inc: { loginCount: 1 },
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wallet: user.wallet, isAffiliate: user.isAffiliate, packageTier, commissionRate: user.commissionRate, affiliateCode: user.affiliateCode, department: (user as any).department, permissions: (user as any).permissions || [] }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
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
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'Is email se koi account nahi mila' });

    const otp = generateOTP();
    try {
      await redisClient.setEx(`reset:${user._id}`, 600, otp);
    } catch (e: any) {
      console.error('[forgot-password] redis failure:', e.message);
      return res.status(503).json({ success: false, message: 'Service temporarily unavailable. Kripya thodi der baad try karein.' });
    }

    const [waOk, emailOk] = await Promise.all([
      sendPasswordResetOTPTemplate(user.phone, otp).catch((e: any) => { console.error('[forgot-password-wa]', e?.message); return false; }),
      sendPasswordResetEmail(user.email, otp, user.name).then(() => true).catch((e: any) => { console.error('[forgot-password-email]', e?.message); return false; }),
    ]);

    if (!waOk && !emailOk) {
      // Clean up OTP since we could not deliver it
      try { await redisClient.del(`reset:${user._id}`); } catch {}
      return res.status(502).json({
        success: false,
        message: 'OTP aapke email/WhatsApp pe nahi bhej paaye. Kripya support se contact karein ya thodi der baad try karein.',
      });
    }

    const channels = [emailOk ? 'email' : null, waOk ? 'WhatsApp' : null].filter(Boolean).join(' aur ');
    const r3: any = {
      success: true,
      message: `Password reset OTP aapke ${channels} par bhej diya hai (10 min valid).`,
      userId: user._id,
      deliveredVia: { email: emailOk, whatsapp: waOk },
    };
    if (process.env.NODE_ENV !== 'production') r3._devOtp = otp;
    res.json(r3);
  } catch (error: any) {
    console.error('[forgot-password]', error);
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
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

    const validTiers = ['free', ...(await Package.distinct('tier', { isActive: true }))];
    if (!validTiers.includes(user.packageTier)) user.packageTier = 'free' as any;

    user.password = newPassword;
    user.isVerified = true;
    await user.save();
    await redisClient.del(`reset:${userId}`);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
  }
};

// ── POST /auth/logout ──────────────────────────────────────────────────────────
export const logout = async (req: any, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
  }
};
