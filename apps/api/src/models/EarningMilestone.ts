import mongoose, { Schema, Document } from 'mongoose';

export interface IEarningMilestone extends Document {
  user: mongoose.Types.ObjectId;
  milestone: 50000 | 100000;
  achievedAt: Date;
  totalEarningsAtAchievement: number;
  // snapshot for poster (so name/photo never changes after achievement)
  name: string;
  avatarUrl?: string;
  affiliateCode?: string;
}

const EarningMilestoneSchema = new Schema<IEarningMilestone>({
  user:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
  milestone:      { type: Number, enum: [50000, 100000], required: true },
  achievedAt:     { type: Date, default: Date.now },
  totalEarningsAtAchievement: { type: Number, required: true },
  name:           { type: String, required: true },
  avatarUrl:      { type: String },
  affiliateCode:  { type: String },
}, { timestamps: false });

// One milestone record per user per milestone level
EarningMilestoneSchema.index({ user: 1, milestone: 1 }, { unique: true });
EarningMilestoneSchema.index({ achievedAt: -1 });

export default mongoose.model<IEarningMilestone>('EarningMilestone', EarningMilestoneSchema);
