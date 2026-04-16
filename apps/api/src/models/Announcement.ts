import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  image?: string;
  link?: string;
  linkText?: string;
  priority: number;
  targetType: 'all' | 'course' | 'batch';
  targetCourse?: mongoose.Types.ObjectId;
  targetBatch?: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  postedByRole: 'admin' | 'superadmin' | 'mentor';
  isActive: boolean;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title:        { type: String, required: true },
  content:      { type: String, required: true },
  image:        { type: String },
  link:         { type: String },
  linkText:     { type: String, default: 'Learn More' },
  priority:     { type: Number, default: 0 },
  targetType:   { type: String, enum: ['all', 'course', 'batch'], default: 'all' },
  targetCourse: { type: Schema.Types.ObjectId, ref: 'Course' },
  targetBatch:  { type: Schema.Types.ObjectId, ref: 'Batch' },
  postedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postedByRole: { type: String, enum: ['admin', 'superadmin', 'mentor'], default: 'admin' },
  isActive:     { type: Boolean, default: true },
  pinned:       { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
