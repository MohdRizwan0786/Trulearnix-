import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  maxUses: number;
  usedCount: number;
  minOrderValue: number;
  expiresAt: Date;
  applicableTiers: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  // No enum — valid tiers come from Package collection (admin-managed).
  applicableTiers: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
