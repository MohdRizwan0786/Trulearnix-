import mongoose from 'mongoose';

const seedPackages = async () => {
  const Package = (await import('../models/Package')).default;
  const count = await Package.countDocuments();
  if (count > 0) return;

  await Package.insertMany([
    {
      name: 'Starter', tier: 'starter', price: 4999, commissionRate: 10,
      description: 'Perfect to start your partner journey with basic tools and access.',
      features: ['5 Courses Access', 'Community Access', '10% L1 Commission', 'Basic Support', 'Partner Dashboard'],
      coursesAccess: 'limited', liveClassAccess: false, aiCoachAccess: false,
      jobEngineAccess: false, personalBrandAccess: false, mentorSupport: false,
      prioritySupport: false, emiAvailable: false, displayOrder: 1,
      badge: 'Starter', badgeColor: '#6b7280',
    },
    {
      name: 'Pro', tier: 'pro', price: 9999, commissionRate: 15,
      description: 'Unlock live classes, AI Coach and higher commissions.',
      features: ['All Courses Access', 'Live Classes', 'AI Coach', '15% L1 Commission', 'Community Access', 'Job Engine', 'Priority Email Support'],
      coursesAccess: 'full', liveClassAccess: true, aiCoachAccess: true,
      jobEngineAccess: true, personalBrandAccess: false, mentorSupport: false,
      prioritySupport: false, emiAvailable: true, emiMonths: 3, emiMonthlyAmount: 3333,
      displayOrder: 2, badge: 'Pro', badgeColor: '#3b82f6',
    },
    {
      name: 'Elite', tier: 'elite', price: 19999, commissionRate: 22,
      description: 'Full platform access with personal brand builder and mentor support.',
      features: ['All Courses Access', 'Live Classes', 'AI Coach', '22% L1 Commission', 'Personal Brand Builder', 'Mentor Support', 'Job Engine', 'Priority Support'],
      coursesAccess: 'full', liveClassAccess: true, aiCoachAccess: true,
      jobEngineAccess: true, personalBrandAccess: true, mentorSupport: true,
      prioritySupport: false, emiAvailable: true, emiMonths: 6, emiMonthlyAmount: 3333,
      displayOrder: 3, badge: 'Elite', badgeColor: '#8b5cf6',
    },
    {
      name: 'Supreme', tier: 'supreme', price: 29999, commissionRate: 30,
      description: 'Maximum earnings, all features, VIP support — the ultimate package.',
      features: ['Everything in Elite', '30% L1 Commission', 'VIP Support', '1:1 Mentor Sessions', 'Early Feature Access', 'Revenue Share Bonus'],
      coursesAccess: 'full', liveClassAccess: true, aiCoachAccess: true,
      jobEngineAccess: true, personalBrandAccess: true, mentorSupport: true,
      prioritySupport: true, emiAvailable: true, emiMonths: 12, emiMonthlyAmount: 2500,
      displayOrder: 4, badge: 'Supreme', badgeColor: '#f59e0b',
    },
  ]);
  console.log('✅ Packages seeded');
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected — Mongoose will auto-reconnect'));

    await seedPackages();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
