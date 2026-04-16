import { Router } from 'express';
import { register, login, verifyOTP, resendOTP, refreshToken, forgotPassword, resetPassword, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';
import User from '../models/User';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/resend-otp-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+phone');
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Account already verified. Please login.' });
    const { generateOTP } = await import('../utils/generateToken');
    const { sendWhatsAppText } = await import('../services/whatsappMetaService');
    const otp = generateOTP();
    await (await import('../config/redis')).default.setEx(`otp:${user._id}`, 600, otp);
    const waMsg = `🔐 Your TruLearnix OTP is: *${otp}*\n\nValid for 10 minutes.`;
    try { await sendWhatsAppText((user as any).phone, waMsg); } catch {}
    res.json({ success: true, userId: user._id, _devOtp: otp });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);

// Get current user info (for refreshing admin panel permissions)
router.get('/me', protect, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, permissions: user.permissions || [],
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Mentor application (no OTP needed, admin reviews)
router.post('/mentor-apply', async (req, res) => {
  try {
    const { name, email, phone, password, experience, expertise, bio, linkedin, portfolio } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name, email, phone, password,
      role: 'mentor',
      isVerified: false,
      isActive: false,
      mentorStatus: 'pending',
      mentorApplication: { experience, expertise: expertise || [], bio, linkedin, portfolio, appliedAt: new Date() },
    });

    res.status(201).json({ success: true, message: 'Application submitted! Admin will review and activate your account.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
