import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeSalary extends Document {
  employee: mongoose.Types.ObjectId;
  month: number;
  year: number;
  grossAmount: number;    // Monthly CTC / base salary
  tdsRate: number;
  tds: number;
  netAmount: number;      // Payable after TDS (attendance-adjusted)
  // Attendance summary
  workingDays: number;    // Total working days in month (excl. Sundays + holidays)
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;      // Paid leave days
  unpaidLeaveDays: number;
  holidayDays: number;    // Holidays in that month
  payableDays: number;    // Effective days for salary
  perDayAmount: number;
  earnedAmount: number;   // perDay * payableDays
  // Other fields
  designation?: string;
  department?: string;
  status: 'pending' | 'approved' | 'paid';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  bankHolderName?: string;
  razorpayPayoutId?: string;
  razorpayStatus?: string;
  remarks?: string;
  slipNo: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSalarySchema = new Schema<IEmployeeSalary>({
  employee:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month:          { type: Number, required: true, min: 1, max: 12 },
  year:           { type: Number, required: true },
  grossAmount:    { type: Number, required: true },
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
  designation:    String,
  department:     String,
  status:         { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  approvedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:     Date,
  paidAt:         Date,
  bankAccount:    String,
  bankIfsc:       String,
  bankName:       String,
  bankHolderName: String,
  razorpayPayoutId: String,
  razorpayStatus: String,
  remarks:        String,
  slipNo:         { type: String, unique: true },
}, { timestamps: true });

EmployeeSalarySchema.pre('save', async function () {
  if (!this.slipNo) {
    const count = await mongoose.model('EmployeeSalary').countDocuments();
    this.slipNo = `TL-EMP-${this.year}${String(this.month).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
  }
});

EmployeeSalarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
EmployeeSalarySchema.index({ status: 1 });
EmployeeSalarySchema.index({ year: -1, month: -1 });

export default mongoose.model<IEmployeeSalary>('EmployeeSalary', EmployeeSalarySchema);
