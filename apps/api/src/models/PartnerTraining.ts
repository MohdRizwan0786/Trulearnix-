import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerTraining extends Document {
  title: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  type: 'video' | 'pdf' | 'resource' | 'live' | 'quiz';
  duration?: string;
  order: number;
  day?: number;
  isPublished: boolean;
  tags: string[];
  resources: { label: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPartnerTrainingProgress extends Document {
  user: mongoose.Types.ObjectId;
  module: mongoose.Types.ObjectId;
  completedAt: Date;
}

const PartnerTrainingSchema = new Schema<IPartnerTraining>({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  videoUrl:     { type: String },
  thumbnailUrl: { type: String },
  type:         { type: String, enum: ['video', 'pdf', 'resource', 'live', 'quiz'], default: 'video' },
  duration:     { type: String },
  order:        { type: Number, default: 0 },
  day:          { type: Number },
  isPublished:  { type: Boolean, default: false },
  tags:         [String],
  resources:    [{ label: String, url: String }],
}, { timestamps: true });

PartnerTrainingSchema.index({ order: 1 });
PartnerTrainingSchema.index({ isPublished: 1 });

const PartnerTrainingProgressSchema = new Schema<IPartnerTrainingProgress>({
  user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  module:      { type: Schema.Types.ObjectId, ref: 'PartnerTraining', required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

PartnerTrainingProgressSchema.index({ user: 1, module: 1 }, { unique: true });

export const PartnerTrainingProgress = mongoose.model<IPartnerTrainingProgress>('PartnerTrainingProgress', PartnerTrainingProgressSchema);
export default mongoose.model<IPartnerTraining>('PartnerTraining', PartnerTrainingSchema);
