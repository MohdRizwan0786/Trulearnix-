import mongoose, { Document, Schema } from 'mongoose';

export interface IMentorSalary extends Document {
  mentor: mongoose.Types.ObjectId;
  month: number;
  year: number;
  amount: number;         // Monthly gross
  tdsRate: number;
  tds: number;
  netAmount: number;      // Attendance-adjusted net
  // Attendance summary
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  payableDays: number;
  perDayAmount: number;
  earnedAmount: number;
  // Other fields
  status: 'pending' | 'approved' | 'paid';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  bankHolderName?: string;
  remarks?: string;
  slipNo: string;
  createdAt: Date;
}

const MentorSalarySchema = new Schema<IMentorSalary>({
  mentor:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month:          { type: Number, required: true, min: 1, max: 12 },
  year:           { type: Number, required: true },
  amount:         { type: Number, required: true },
  tdsRate:        { type: Number, default: 10 },
  tds:            { type: Number, default: 0 },
  netAmount:      { type: Number, required: true },
  workingDays:    { type: Number, default: 0 },
  presentDays:    { type: Number, default: 0 },
  absentDays:     { type: Number, default: 0 },
  halfDays:       { type: Number, default: 0 },
  leaveDays:      { type: Number, default: 0 },
  unpaidLeaveDays:{ type: Number, default: 0 },
  holidayDays:    { type: Number, default: 0 },
  payableDays:    { type: Number, default: 0 },
  perDayAmount:   { type: Number, default: 0 },
  earnedAmount:   { type: Number, default: 0 },
  status:         { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  approvedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:     Date,
  paidAt:         Date,
  bankAccount:    String,
  bankIfsc:       String,
  bankName:       String,
  bankHolderName: String,
  remarks:        String,
  slipNo:         { type: String, unique: true },
}, { timestamps: true });

MentorSalarySchema.pre('save', async function () {
  if (!this.slipNo) {
    const count = await mongoose.model('MentorSalary').countDocuments();
    this.slipNo = `TL-SAL-${this.year}${String(this.month).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
  }
});

MentorSalarySchema.index({ mentor: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IMentorSalary>('MentorSalary', MentorSalarySchema);
