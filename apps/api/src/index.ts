import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { initSocketHandlers } from './services/socketService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import classRoutes from './routes/classes';
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

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.WEB_URL || 'https://peptly.in',
  process.env.ADMIN_URL || 'https://admin.peptly.in',
  'https://trulance.peptly.in',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
];

export const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static('/var/www/trulearnix/uploads'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/', strictLimiter);

// Core routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
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
  server.listen(PORT, () => console.log(`TureLearnix API v2.1 running on port ${PORT}`));
};

start();
