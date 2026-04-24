import dotenv from 'dotenv';
dotenv.config();

process.on('unhandledRejection', (reason: any) => {
  console.error('[UnhandledRejection]', reason?.message || reason);
});
process.on('uncaughtException', (err: Error) => {
  console.error('[UncaughtException]', err.message, err.stack);
});

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { initSocketHandlers } from './services/socketService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import classRoutes from './routes/classes';
import webinarRoutes from './routes/webinars';
import quizRoutes from './routes/quizzes';
import paymentRoutes from './routes/payments';
import walletRoutes from './routes/wallet';
import affiliateRoutes from './routes/affiliate';
import certificateRoutes from './routes/certificates';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import assignmentRoutes from './routes/assignments';
import uploadRoutes from './routes/upload';
import packageRoutes from './routes/packages';
import crmRoutes from './routes/crm';
import blogRoutes from './routes/blog';
import analyticsRoutes from './routes/analytics';
import communityRoutes from './routes/community';
import couponRoutes from './routes/coupons';
import taskRoutes from './routes/tasks';
import meetingRoutes from './routes/meetings';
import materialRoutes from './routes/materials';
import goalRoutes from './routes/goals';
import reminderRoutes from './routes/reminders';
import projectRoutes from './routes/projects';
import freelanceRoutes from './routes/freelance';
import trulanceRoutes from './routes/trulance';
import popupRoutes from './routes/popups';
import siteContentRoutes from './routes/siteContent';
import checkoutRoutes from './routes/checkout';
import phonepeRoutes from './routes/phonepe';
import partnerRoutes from './routes/partner';
import mentorRouter from './routes/mentor';
import financeRouter from './routes/finance';
import marketingRouter from './routes/marketing';
import novaRouter, { bootstrapNovaCrons } from './routes/nova';
import managerRouter from './routes/manager';
import salesRouter from './routes/sales';
import jobsRouter from './routes/jobs';
import announcementsRouter from './routes/announcements';
import securityMonitor, { loadBlockedIpCache } from './middleware/securityMonitor';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.WEB_URL || 'https://trulearnix.com',
  'https://www.trulearnix.com',
  process.env.ADMIN_URL || 'https://admin.trulearnix.com',
  'https://www.admin.trulearnix.com',
  'https://trulancer.trulearnix.com',
  'https://www.trulancer.trulearnix.com',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
];

export const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(securityMonitor);

// Razorpay webhook — raw body needed BEFORE json parser
app.post('/api/webhooks/razorpay-payout', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const { verifyWebhookSignature } = await import('./services/razorpayPayout');
    const rawBody = req.body.toString();

    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);
    const payload = event?.payload?.payout?.entity;
    if (!payload) return res.json({ success: true });

    const payoutId: string = payload.id;
    const status: string = payload.status; // processed | failed | reversed
    const utr: string = payload.utr || '';

    const Withdrawal = (await import('./models/Withdrawal')).default;
    const User = (await import('./models/User')).default;

    const withdrawal = await Withdrawal.findOne({ razorpayPayoutId: payoutId });
    if (!withdrawal) return res.json({ success: true }); // not our withdrawal

    if (status === 'processed') {
      withdrawal.status = 'completed';
      if (utr) withdrawal.razorpayPayoutId = `${payoutId} | UTR: ${utr}`;
      await withdrawal.save();
    } else if (status === 'failed' || status === 'reversed') {
      withdrawal.status = 'rejected';
      withdrawal.hrStatus = 'rejected';
      withdrawal.rejectionReason = `Auto payout ${status}. Ref: ${payoutId}`;
      await withdrawal.save();
      // Refund wallet
      await User.findByIdAndUpdate(withdrawal.user, { $inc: { wallet: withdrawal.amount, totalWithdrawn: -withdrawal.amount } });
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error('[Webhook Error]', e.message);
    res.status(500).json({ success: false });
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Sanitize NoSQL injection from req.body, req.params, req.query
app.use(mongoSanitize({ replaceWith: '_' }));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Serve uploaded files as static assets
app.use('/uploads', express.static(process.env.UPLOAD_DIR || '/var/www/trulearnix/uploads'));

// General rate limit — 1000 req/15min per IP (high enough for normal usage)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit authenticated users (admin/logged-in)
    const token = req.headers.authorization?.split(' ')[1] || (req as any).cookies?.adminToken;
    return !!token;
  },
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Upload route gets its own limit (file uploads)
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/upload', uploadLimiter);

// Auth routes — strict limiter ONLY for sensitive unauthenticated endpoints (brute-force protection)
// /me, /refresh-token, /logout are excluded — they are called on every page load
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' },
});
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/auth/verify-otp', strictLimiter);
app.use('/api/auth/resend-otp', strictLimiter);
app.use('/api/auth/forgot-password', strictLimiter);
app.use('/api/auth/reset-password', strictLimiter);

// Core routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/upload', uploadRoutes);

// New routes
app.use('/api/packages', packageRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/freelance', freelanceRoutes);
app.use('/api/trulance', trulanceRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/phonepe', phonepeRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/mentor', mentorRouter);
app.use('/api/finance', financeRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/nova', novaRouter);
app.use('/api/manager', managerRouter);
app.use('/api/sales', salesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/announcements', announcementsRouter);

// Public maintenance status — no auth required (used by web + trulancer middleware)
app.get('/api/public/maintenance', async (_req, res) => {
  try {
    const PlatformSettings = (await import('./models/PlatformSettings')).default;
    const settings = await PlatformSettings.findOne().select('maintenanceMode trulanceMaintenance maintenanceMessage earlyAccessEnabled emiEnabled').lean();
    res.json({
      maintenanceMode: settings?.maintenanceMode ?? false,
      trulanceMaintenance: settings?.trulanceMaintenance ?? false,
      message: settings?.maintenanceMessage ?? 'We are performing scheduled maintenance. We will be back shortly.',
      earlyAccessEnabled: settings?.earlyAccessEnabled ?? false,
      emiEnabled: settings?.emiEnabled ?? false,
    });
  } catch { res.json({ maintenanceMode: false, trulanceMaintenance: false, message: '', earlyAccessEnabled: false, emiEnabled: false }); }
});

// Validate early access token — no auth required
app.get('/api/public/validate-early-access', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.json({ valid: false });
    const PlatformSettings = (await import('./models/PlatformSettings')).default;
    const settings = await PlatformSettings.findOne().select('earlyAccessEnabled earlyAccessTokens').lean();
    if (!settings?.earlyAccessEnabled) return res.json({ valid: false });
    const found = settings.earlyAccessTokens?.some((t: any) => t.token === token);
    res.json({ valid: !!found });
  } catch { res.json({ valid: false }); }
});

// Public aggregated platform stats — real counts from DB for marketing pages
app.get('/api/public/stats', async (_req, res) => {
  try {
    const User = (await import('./models/User')).default;
    const Course = (await import('./models/Course')).default;
    const Payment = (await import('./models/Payment')).default;
    const Certificate = (await import('./models/Certificate')).default;
    const Enrollment = (await import('./models/Enrollment')).default;

    const [totalStudents, totalMentors, totalCourses, totalCertificates, totalEnrollments, payoutAgg, ratingAgg] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      Course.countDocuments({ status: 'published' }),
      Certificate.countDocuments(),
      Enrollment.countDocuments(),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Course.aggregate([{ $match: { rating: { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]),
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalMentors,
        totalCourses,
        totalCertificates,
        totalEnrollments,
        totalPayout: payoutAgg[0]?.total || 0,
        avgRating: Number((ratingAgg[0]?.avg || 0).toFixed(1)),
      },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'TureLearnix API', version: '2.1' }));

app.use((_, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await connectRedis();
  initSocketHandlers(io);
  await bootstrapNovaCrons();
  await loadBlockedIpCache();
  server.listen(PORT, () => console.log(`TureLearnix API v2.1 running on port ${PORT}`));
};

start();
