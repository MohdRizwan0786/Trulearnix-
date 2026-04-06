import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  category: 'course_sale' | 'affiliate_commission' | 'withdrawal' | 'refund' | 'bonus';
  amount: number;
  description: string;
  referenceId?: string;
  status: 'pending' | 'completed' | 'failed';
  balanceAfter: number;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  category: { type: String, enum: ['course_sale', 'affiliate_commission', 'withdrawal', 'refund', 'bonus'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  referenceId: String,
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  balanceAfter: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
