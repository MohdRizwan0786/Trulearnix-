import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'video' | 'document' | 'quiz' | 'live';
  videoUrl?: string;
  videoKey?: string;
  duration?: number;
  order: number;
  isPreview: boolean;
  quizId?: mongoose.Types.ObjectId;
}

export interface IModule {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  lessons: ILesson[];
}

export interface IBatchSettings {
  enabled: boolean;
  minStrength: number;
  maxStrength: number;
  closingDays: number;
  durationDays: number; // total course duration in days (0 = no limit)
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  previewVideo?: string;
  mentor: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  price: number;
  discountPrice?: number;
  modules: IModule[];
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration?: string;
  requirements: string[];
  outcomes: string[];
  highlights: string[];
  faqs: { question: string; answer: string }[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  rejectionReason?: string;
  enrolledCount: number;
  rating: number;
  ratingCount: number;
  reviews: { user: mongoose.Types.ObjectId; rating: number; comment: string; createdAt: Date }[];
  certificate: boolean;
  passingScore: number;
  batchSettings: IBatchSettings;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['video', 'document', 'quiz', 'live'], required: true },
  videoUrl: String,
  videoKey: String,
  duration: Number,
  order: { type: Number, required: true },
  isPreview: { type: Boolean, default: false },
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' }
});

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, required: true },
  lessons: [LessonSchema]
});

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true, maxlength: 200 },
  thumbnail: { type: String, required: true },
  previewVideo: String,
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  tags: [String],
  price: { type: Number, required: true, min: 0 },
  discountPrice: Number,
  modules: [ModuleSchema],
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  language: { type: String, default: 'Hindi' },
  duration: String,
  requirements: [String],
  outcomes: [String],
  highlights: [String],
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
  }],
  status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'draft' },
  rejectionReason: String,
  enrolledCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  reviews: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  certificate: { type: Boolean, default: true },
  passingScore: { type: Number, default: 70 },
  batchSettings: {
    enabled: { type: Boolean, default: false },
    minStrength: { type: Number, default: 5 },
    maxStrength: { type: Number, default: 50 },
    closingDays: { type: Number, default: 30 },
    durationDays: { type: Number, default: 0 },
  },
}, { timestamps: true });

CourseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  next();
});

export default mongoose.model<ICourse>('Course', CourseSchema);
