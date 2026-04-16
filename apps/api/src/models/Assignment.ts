import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  course: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  module?: mongoose.Types.ObjectId;
  lessonId?: string;
  mentor: mongoose.Types.ObjectId;
  dueDate?: Date;
  maxScore: number;
  referenceFiles: { url: string; name: string; type: string }[];
  submissions: {
    student: mongoose.Types.ObjectId;
    fileUrl: string;
    fileName: string;
    submittedAt: Date;
    score?: number;
    feedback?: string;
    reviewedAt?: Date;
    status: 'pending' | 'reviewed';
  }[];
  isPublished: boolean;
  createdAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  module: { type: Schema.Types.ObjectId },
  lessonId: String,
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: Date,
  maxScore: { type: Number, default: 100 },
  referenceFiles: [{ url: String, name: String, type: { type: String } }],
  submissions: [{
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    fileUrl: String,
    fileName: String,
    submittedAt: { type: Date, default: Date.now },
    score: Number,
    feedback: String,
    reviewedAt: Date,
    status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' }
  }],
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
