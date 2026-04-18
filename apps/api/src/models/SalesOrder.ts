import mongoose, { Document, Schema } from 'mongoose';

export interface ISalesOrder extends Document {
  salesperson: mongoose.Types.ObjectId;
  customer: {
    name: string;
    email?: string;
    phone: string;
    state?: string;
    city?: string;
  };
  package: mongoose.Types.ObjectId;
  packageTier: string;
  packagePrice: number;
  promoCode?: string;
  paymentType: 'full' | 'emi' | 'token';
  tokenAmount?: number;
  tokenPaid: boolean;
  emiDays?: number[];   // day offsets snapshot from package at time of order
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'token_paid' | 'partial' | 'pending_approval' | 'paid' | 'cancelled';
  paymentLink?: string;
  paymentLinkExpiry?: Date;
  phonepeMerchantOrderId?: string;
  userId?: mongoose.Types.ObjectId;
  customerTempPassword?: string;
  commissionAmount: number;
  commissionPaid: boolean;
  notes?: string;
  slipGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderSchema = new Schema<ISalesOrder>({
  salesperson: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    state: String,
    city: String,
  },
  package: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  packageTier: { type: String, default: '' },
  packagePrice: { type: Number, required: true },
  promoCode: String,
  paymentType: { type: String, enum: ['full', 'emi', 'token'], default: 'full' },
  tokenAmount: Number,
  tokenPaid: { type: Boolean, default: false },
  emiDays: [Number],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'token_paid', 'partial', 'pending_approval', 'paid', 'cancelled'], default: 'pending' },
  paymentLink: String,
  paymentLinkExpiry: Date,
  phonepeMerchantOrderId: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerTempPassword: String,
  commissionAmount: { type: Number, default: 0 },
  commissionPaid: { type: Boolean, default: false },
  notes: String,
  slipGeneratedAt: Date,
}, { timestamps: true });

SalesOrderSchema.index({ salesperson: 1, status: 1 });
SalesOrderSchema.index({ salesperson: 1, createdAt: -1 });
SalesOrderSchema.index({ 'customer.phone': 1 });
SalesOrderSchema.index({ createdAt: -1 });

export default mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
