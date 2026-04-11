import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerEarning {
  earnerTier: 'starter' | 'pro' | 'elite' | 'supreme';
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
  emiAvailable: boolean;
  emiMonths?: number;
  emiMonthlyAmount?: number;
  isActive: boolean;
  displayOrder: number;
  badge?: string;
  badgeColor?: string;
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
    earnerTier: { type: String, enum: ['starter', 'pro', 'elite', 'supreme'], required: true },
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
  emiAvailable: { type: Boolean, default: false },
  emiMonths: Number,
  emiMonthlyAmount: Number,
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  badge: String,
  badgeColor: String,
}, { timestamps: true });

export default mongoose.model<IPackage>('Package', PackageSchema);
