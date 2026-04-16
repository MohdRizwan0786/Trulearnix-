import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';
export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid';
export type UserType = 'employee' | 'mentor';

export interface IAttendance extends Document {
  user: mongoose.Types.ObjectId;
  userType: UserType;
  date: Date;
  month: number;
  year: number;
  status: AttendanceStatus;
  leaveType?: LeaveType;
  note?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userType:  { type: String, enum: ['employee', 'mentor'], required: true },
  date:      { type: Date, required: true },
  month:     { type: Number, required: true, min: 1, max: 12 },
  year:      { type: Number, required: true },
  status:    { type: String, enum: ['present', 'absent', 'half-day', 'leave'], required: true },
  leaveType: { type: String, enum: ['casual', 'sick', 'earned', 'unpaid'] },
  note:      String,
  markedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ month: 1, year: 1 });
AttendanceSchema.index({ user: 1, month: 1, year: 1 });
AttendanceSchema.index({ userType: 1, month: 1, year: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
