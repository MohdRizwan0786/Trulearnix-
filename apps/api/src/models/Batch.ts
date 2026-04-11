import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  course: mongoose.Types.ObjectId;
  batchNumber: number;
  label?: string; // e.g. "Batch 3 — Jan 2026"
  minStrength: number;
  maxStrength: number;
  closingDays: number;   // auto-close after these many days
  startDate: Date;
  closingDate: Date;     // computed: startDate + closingDays
  status: 'pending' | 'active' | 'closed' | 'full';
  enrolledCount: number;
  daysCompleted: number; // how many course days have been covered
  totalDays: number;     // course duration in days (0 = no limit)
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batchNumber: { type: Number, required: true },
  label: String,
  minStrength: { type: Number, default: 5 },
  maxStrength: { type: Number, default: 50 },
  closingDays: { type: Number, default: 30 },
  startDate: { type: Date },
  closingDate: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'closed', 'full'], default: 'pending' },
  enrolledCount: { type: Number, default: 0 },
  daysCompleted: { type: Number, default: 0 },
  totalDays: { type: Number, default: 0 },
}, { timestamps: true });

BatchSchema.index({ course: 1, status: 1 });
BatchSchema.index({ course: 1, batchNumber: 1 }, { unique: true });

export default mongoose.model<IBatch>('Batch', BatchSchema);
