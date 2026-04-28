import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  paymentId?: string;
  orderId?: string;
  amount: number;
  source?: 'self' | 'compulsory' | 'admin' | 'paid';
  progress: {
    lessonId: mongoose.Types.ObjectId;
    completedAt: Date;
  }[];
  progressPercent: number;
  completedAt?: Date;
  certificateId?: string;
  certificateUrl?: string;
  quizResults: {
    quizId: mongoose.Types.ObjectId;
    score: number;
    passed: boolean;
    attemptedAt: Date;
  }[];
  createdAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  paymentId: String,
  orderId: String,
  amount: { type: Number, required: true },
  source: { type: String, enum: ['self', 'compulsory', 'admin', 'paid'], default: 'self' },
  progress: [{
    lessonId: { type: Schema.Types.ObjectId },
    completedAt: { type: Date, default: Date.now }
  }],
  progressPercent: { type: Number, default: 0 },
  completedAt: Date,
  certificateId: String,
  certificateUrl: String,
  quizResults: [{
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    passed: Boolean,
    attemptedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
