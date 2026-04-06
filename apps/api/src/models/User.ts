import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'mentor' | 'student';
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
  affiliateCode: string;
  referredBy?: mongoose.Types.ObjectId;
  wallet: number;
  bio?: string;
  expertise?: string[];
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
  notifications: { type: string; message: string; read: boolean; createdAt: Date }[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'mentor', 'student'], default: 'student' },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  refreshToken: { type: String, select: false },
  affiliateCode: { type: String, unique: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  wallet: { type: Number, default: 0 },
  bio: { type: String },
  expertise: [{ type: String }],
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String
  },
  notifications: [{
    type: { type: String },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  lastLogin: Date
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.pre('save', function (next) {
  if (!this.affiliateCode) {
    this.affiliateCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
