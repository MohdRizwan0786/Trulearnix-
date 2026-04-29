import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerEarning {
  earnerTier: string;
  type: 'percentage' | 'flat';
  value: number; // L1 direct referrer
  l2Type: 'percentage' | 'flat';
  l2Value: number;
  l3Type: 'percentage' | 'flat';
  l3Value: number;
}

export interface IPackage extends Document {
  name: string;
  tier: string;
  price: number;
  // Legacy flat commission fields (kept for backward compat)
  commissionRate: number;
  commissionRateType: 'percentage' | 'flat';
  commissionLevel2: number;
  commissionLevel2Type: 'percentage' | 'flat';
  commissionLevel3: number;
  commissionLevel3Type: 'percentage' | 'flat';
  // New matrix: what earner gets based on THEIR tier when selling THIS package
  partnerEarnings: IPartnerEarning[];
  salesTeamCommission: {
    type: 'percentage' | 'flat';
    value: number;
  };
  managerCommission: {
    type: 'percentage' | 'flat';
    value: number;
  };
  courseReferralCommission: {
    type: 'percentage' | 'flat';
    value: number;
  };
  description: string;
  features: string[];
  courses: mongoose.Types.ObjectId[];
  coursesAccess: 'limited' | 'full';
  liveClassAccess: boolean;
  aiCoachAccess: boolean;
  jobEngineAccess: boolean;
  communityAccess: boolean;
  personalBrandAccess: boolean;
  mentorSupport: boolean;
  prioritySupport: boolean;
  promoDiscountPercent: number;
  emiAvailable: boolean;
  emiDays?: number[];       // day offsets for each installment e.g. [0, 15, 30, 45]
  emiMonthlyAmount?: number;
  tokenAvailable: boolean;
  tokenAmount?: number;     // fixed advance/token amount (total, inclusive of GST)
  isActive: boolean;
  displayOrder: number;
  badge?: string;
  badgeColor?: string;
  // Page content (admin-editable)
  statCourses?: number;
  statMembers?: number;
  journeySteps?: { title: string; desc: string }[];
  testimonials?: { name: string; role: string; avatar: string; text: string; rating: number; earning: string }[];
  faqs?: { q: string; a: string }[];
  // Community join links (admin-editable, package-wise)
  communityLinks?: {
    telegramUrl?: string;
    telegramLabel?: string;
    whatsappUrl?: string;
    whatsappLabel?: string;
    note?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>({
  name: { type: String, required: true },
  tier: { type: String, default: '' },
  price: { type: Number, required: true },
  commissionRate: { type: Number, default: 0 },
  commissionRateType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  commissionLevel2: { type: Number, default: 0 },
  commissionLevel2Type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  commissionLevel3: { type: Number, default: 0 },
  commissionLevel3Type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  partnerEarnings: [{
    earnerTier: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, default: 0 },
    l2Type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    l2Value: { type: Number, default: 0 },
    l3Type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    l3Value: { type: Number, default: 0 },
  }],
  salesTeamCommission: {
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, default: 0 },
  },
  managerCommission: {
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, default: 0 },
  },
  courseReferralCommission: {
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, default: 0 },
  },
  description: { type: String, default: '' },
  features: [String],
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  coursesAccess: { type: String, enum: ['limited', 'full'], default: 'limited' },
  liveClassAccess: { type: Boolean, default: false },
  aiCoachAccess: { type: Boolean, default: false },
  jobEngineAccess: { type: Boolean, default: false },
  communityAccess: { type: Boolean, default: true },
  personalBrandAccess: { type: Boolean, default: false },
  mentorSupport: { type: Boolean, default: false },
  prioritySupport: { type: Boolean, default: false },
  promoDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
  emiAvailable: { type: Boolean, default: false },
  emiDays: [Number],
  emiMonthlyAmount: Number,
  tokenAvailable: { type: Boolean, default: false },
  tokenAmount: Number,
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  badge: String,
  badgeColor: String,
  statCourses: { type: Number, default: 500 },
  statMembers: { type: Number, default: 10000 },
  journeySteps: [{ title: String, desc: String }],
  testimonials: [{ name: String, role: String, avatar: String, text: String, rating: Number, earning: String }],
  faqs: [{ q: String, a: String }],
  communityLinks: {
    telegramUrl: { type: String, default: '' },
    telegramLabel: { type: String, default: '' },
    whatsappUrl: { type: String, default: '' },
    whatsappLabel: { type: String, default: '' },
    note: { type: String, default: '' },
  },
}, { timestamps: true });

export default mongoose.model<IPackage>('Package', PackageSchema);
