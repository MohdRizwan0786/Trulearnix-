import mongoose, { Document, Schema } from 'mongoose';

export interface IReportCard extends Document {
  reportCardId: string;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  // Performance snapshot at time of request
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  sessionsAttended: number;
  totalSessions: number;
  attendancePct: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  avgAssignmentScore: number;
  quizzesTaken: number;
  totalQuizzes: number;
  avgQuizScore: number;
  compositeScore: number;
  // Names snapshot
  studentName: string;
  courseName: string;
  batchLabel?: string;
  mentorName?: string;
  // Approval workflow
  status: 'pending_mentor' | 'pending_founder' | 'approved' | 'rejected';
  mentorApprovedAt?: Date;
  mentorApprovedBy?: mongoose.Types.ObjectId;
  founderApprovedAt?: Date;
  founderApprovedBy?: mongoose.Types.ObjectId;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  requestedAt: Date;
}

const ReportCardSchema = new Schema<IReportCard>({
  reportCardId: { type: String, unique: true, required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  progressPercent: { type: Number, default: 0 },
  completedLessons: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  sessionsAttended: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  attendancePct: { type: Number, default: 0 },
  assignmentsSubmitted: { type: Number, default: 0 },
  totalAssignments: { type: Number, default: 0 },
  avgAssignmentScore: { type: Number, default: 0 },
  quizzesTaken: { type: Number, default: 0 },
  totalQuizzes: { type: Number, default: 0 },
  avgQuizScore: { type: Number, default: 0 },
  compositeScore: { type: Number, default: 0 },
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  batchLabel: String,
  mentorName: String,
  status: { type: String, enum: ['pending_mentor', 'pending_founder', 'approved', 'rejected'], default: 'pending_mentor' },
  mentorApprovedAt: Date,
  mentorApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  founderApprovedAt: Date,
  founderApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IReportCard>('ReportCard', ReportCardSchema);
