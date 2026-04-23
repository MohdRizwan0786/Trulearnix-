import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'mentor' | 'student' | 'salesperson';
export type EmployeeDepartment = 'hr' | 'sales' | 'marketing' | 'content' | 'finance' | 'operations' | 'support' | 'tech' | 'general';
export type PackageTier = 'free' | 'starter' | 'pro' | 'proedge' | 'elite' | 'supreme';

export const COMMISSION_RATES: Record<PackageTier, number> = {
  free: 0,
  starter: 10,
  pro: 15,
  proedge: 18,
  elite: 22,
  supreme: 30,
};

export const PACKAGE_PRICES: Record<PackageTier, number> = {
  free: 0,
  starter: 4999,
  pro: 9999,
  proedge: 14999,
  elite: 19999,
  supreme: 29999,
};

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
  packageTier: PackageTier;
  isAffiliate: boolean;
  commissionRate: number;
  packagePurchasedAt?: Date;
  packageExpiresAt?: Date;
  affiliateCode: string;
  referredBy?: mongoose.Types.ObjectId;
  upline1?: mongoose.Types.ObjectId;
  upline2?: mongoose.Types.ObjectId;
  upline3?: mongoose.Types.ObjectId;
  wallet: number;
  totalEarnings: number;
  totalWithdrawn: number;
  bio?: string;
  expertise?: string[];
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
  xpPoints: number;
  level: number;
  badges: string[];
  streak: number;
  lastActivityAt?: Date;
  notifications: { type: string; message: string; read: boolean; createdAt: Date }[];
  pushToken?: string;
  lastLogin?: Date;
  loginCount: number;
  packageSuspended: boolean;
  promoDiscountPercent: number;
  favoriteCourses: mongoose.Types.ObjectId[];
  kyc?: {
    pan?: string; panName?: string; panVerified?: boolean;
    aadhar?: string; aadharName?: string; aadharVerified?: boolean;
    bankAccount?: string; bankIfsc?: string; bankName?: string; bankHolderName?: string;
    status: 'pending' | 'submitted' | 'verified' | 'rejected';
    rejectionReason?: string;
    submittedAt?: Date; verifiedAt?: Date;
  };
  department?: EmployeeDepartment;
  employeeId?: string;
  joiningDate?: Date;
  permissions?: string[];
  managerName?: string;
  managerPhone?: string;
  managerId?: mongoose.Types.ObjectId;
  industrialEarning: number;
  industrialEarningSource?: string;
  isIndustrialPartner: boolean;
  sponsorCode?: string;
  age?: number;
  country?: string;
  state?: string;
  mentorStatus?: 'pending' | 'approved' | 'rejected';
  mentorApplication?: {
    experience?: string;
    expertise?: string[];
    bio?: string;
    linkedin?: string;
    portfolio?: string;
    appliedAt?: Date;
    reviewedAt?: Date;
    rejectionReason?: string;
  };
  assignedCourses?: { courseId: mongoose.Types.ObjectId; maxStudents?: number; assignedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'department_head', 'team_lead', 'employee', 'mentor', 'student', 'salesperson'], default: 'student' },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  refreshToken: { type: String, select: false },
  // No enum — valid tier values come from Package collection (admin-managed).
  // Keeps 'free' as default for users with no paid package.
  packageTier: { type: String, default: 'free' },
  isAffiliate: { type: Boolean, default: false },
  commissionRate: { type: Number, default: 0 },
  packagePurchasedAt: Date,
  packageExpiresAt: Date,
  affiliateCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  upline1: { type: Schema.Types.ObjectId, ref: 'User' },
  upline2: { type: Schema.Types.ObjectId, ref: 'User' },
  upline3: { type: Schema.Types.ObjectId, ref: 'User' },
  wallet: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  bio: String,
  expertise: [String],
  socialLinks: { linkedin: String, twitter: String, website: String },
  xpPoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [String],
  streak: { type: Number, default: 0 },
  lastActivityAt: Date,
  notifications: [{
    type: { type: String },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  pushToken: String,
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  packageSuspended: { type: Boolean, default: false },
  promoDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
  favoriteCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  kyc: {
    pan: String, panName: String, panVerified: { type: Boolean, default: false }, panPhoto: String,
    aadhar: String, aadharName: String, aadharVerified: { type: Boolean, default: false }, aadharPhoto: String,
    bankAccount: String, bankIfsc: String, bankName: String, bankHolderName: String,
    status: { type: String, enum: ['pending','submitted','verified','rejected'], default: 'pending' },
    rejectionReason: String, submittedAt: Date, verifiedAt: Date, reviewedBy: String,
  },
  department: { type: String, enum: ['hr', 'sales', 'marketing', 'content', 'finance', 'operations', 'support', 'tech', 'general'] },
  employeeId: { type: String, sparse: true },
  joiningDate: Date,
  permissions: [{ type: String }],
  managerName: String,
  managerPhone: String,
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  industrialEarning: { type: Number, default: 0 },
  industrialEarningSource: { type: String, default: '' },
  isIndustrialPartner: { type: Boolean, default: false },
  sponsorCode: String,
  age: { type: Number },
  country: { type: String, default: 'India' },
  state: { type: String },
  mentorStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
  mentorApplication: {
    experience: String,
    expertise: [String],
    bio: String,
    linkedin: String,
    portfolio: String,
    appliedAt: Date,
    reviewedAt: Date,
    rejectionReason: String,
  },
  assignedCourses: [{
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    maxStudents: Number,
    assignedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

UserSchema.index({ affiliateCode: 1 });
UserSchema.index({ referredBy: 1 });
UserSchema.index({ packageTier: 1, isAffiliate: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ upline1: 1 });
UserSchema.index({ upline2: 1 });
UserSchema.index({ upline3: 1 });
UserSchema.index({ isAffiliate: 1, totalEarnings: -1 });
UserSchema.index({ mentorStatus: 1, role: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  (this as any).password = await bcrypt.hash((this as any).password, 12);
  next();
});

UserSchema.pre('save', function (next) {
  if (!(this as any).affiliateCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TL';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    (this as any).affiliateCode = code;
  }
  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const UPLOADS_BASE = `${process.env.API_URL || 'https://api.trulearnix.com'}/uploads`;
function normalizeAvatar(avatar: string | undefined): string {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${UPLOADS_BASE}/${avatar}`;
}

UserSchema.set('toJSON', {
  transform(_doc, ret) {
    if (ret.avatar !== undefined) ret.avatar = normalizeAvatar(ret.avatar);
    return ret;
  },
});

UserSchema.set('toObject', {
  transform(_doc, ret) {
    if (ret.avatar !== undefined) ret.avatar = normalizeAvatar(ret.avatar);
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
