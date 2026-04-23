import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail?: string;
  author: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledAt?: Date;
  aiGenerated: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  views: number;
  readTime: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true, maxlength: 300 },
  thumbnail: String,
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  tags: [String],
  status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
  publishedAt: Date,
  scheduledAt: Date,
  aiGenerated: { type: Boolean, default: false },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  views: { type: Number, default: 0 },
  readTime: { type: Number, default: 5 },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ featured: 1 });

export default mongoose.model<IBlog>('Blog', BlogSchema);
