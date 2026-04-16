import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawal extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  method: 'bank' | 'upi' | 'razorpay_payout';
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  razorpayPayoutId?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectionReason?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  tdsRate: number;
  tdsAmount: number;
  gatewayFee: number;
  gatewayFeeGst: number;
  netAmount: number;
  // HR approval fields
  hrStatus: 'pending' | 'approved' | 'rejected';
  hrApprovedBy?: mongoose.Types.ObjectId;
  hrApprovedAt?: Date;
  hrRejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 500 },
  method: { type: String, enum: ['bank', 'upi', 'razorpay_payout'], default: 'upi' },
  accountName: String,
  accountNumber: String,
  ifscCode: String,
  upiId: String,
  razorpayPayoutId: String,
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  rejectionReason: String,
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date,
  tdsRate: { type: Number, default: 0 },
  tdsAmount: { type: Number, default: 0 },
  gatewayFee: { type: Number, default: 0 },
  gatewayFeeGst: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  hrStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  hrApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  hrApprovedAt: Date,
  hrRejectionReason: String,
}, { timestamps: true });

WithdrawalSchema.index({ user: 1, status: 1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);
