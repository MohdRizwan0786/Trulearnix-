import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyMaterial extends Document {
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'doc' | 'link' | 'image';
  url: string;
  courseId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  lessonId?: string;
  moduleId?: string;
  uploadedBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  tags: string[];
  downloadCount: number;
}

const StudyMaterialSchema = new Schema<IStudyMaterial>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['pdf', 'video', 'doc', 'link', 'image'], required: true },
  url: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
  lessonId: String,
  moduleId: String,
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: false },
  tags: [{ type: String }],
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);
