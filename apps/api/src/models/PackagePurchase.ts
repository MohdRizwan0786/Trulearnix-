import mongoose, { Document, Schema } from 'mongoose';

export interface IPackagePurchase extends Document {
  user: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  packageTier: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: 'razorpay' | 'stripe' | 'manual';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  affiliateCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  isEmi: boolean;
  emiMonth?: number;
  emiTotal?: number;
  paymentType: 'full' | 'emi' | 'token_emi' | 'token_full';
  tokenAmount?: number;      // advance/token paid (for token_* types)
  fullPackagePrice?: number; // full package price (for token_* types, for reference)
  invoiceNumber?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PackagePurchaseSchema = new Schema<IPackagePurchase>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  package: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  packageTier: { type: String, default: '' },
  amount: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'manual'], default: 'razorpay' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
  affiliateCode: String,
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isEmi: { type: Boolean, default: false },
  emiMonth: Number,
  emiTotal: Number,
  paymentType: { type: String, enum: ['full', 'emi', 'token_emi', 'token_full'], default: 'full' },
  tokenAmount: Number,
  fullPackagePrice: Number,
  invoiceNumber: String,
  invoiceUrl: String,
}, { timestamps: true });

PackagePurchaseSchema.index({ user: 1, status: 1 });
PackagePurchaseSchema.index({ razorpayOrderId: 1 });
PackagePurchaseSchema.index({ createdAt: -1 });

export default mongoose.model<IPackagePurchase>('PackagePurchase', PackagePurchaseSchema);
