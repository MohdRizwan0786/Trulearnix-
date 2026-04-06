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

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io
export const io = new Server(server, {
  cors: { origin: [process.env.WEB_URL!, process.env.ADMIN_URL!], credentials: true }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: [process.env.WEB_URL!, process.env.ADMIN_URL!], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Routes
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

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'TruLearnix API' }));

// 404 handler
app.use((_, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await connectRedis();
  initSocketHandlers(io);
  server.listen(PORT, () => console.log(`TruLearnix API running on port ${PORT}`));
};

start();
