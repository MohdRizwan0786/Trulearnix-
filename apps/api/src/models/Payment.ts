import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  affiliateCode?: string;
  affiliateUser?: mongoose.Types.ObjectId;
  affiliateCommission?: number;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
  affiliateCode: String,
  affiliateUser: { type: Schema.Types.ObjectId, ref: 'User' },
  affiliateCommission: Number
}, { timestamps: true });

PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ affiliateUser: 1 });
PaymentSchema.index({ course: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
