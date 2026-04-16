import mongoose, { Schema, Document } from 'mongoose'

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId
  achievementId: mongoose.Types.ObjectId
  earnedAt: Date
}

const UserAchievementSchema = new Schema<IUserAchievement>({
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
  earnedAt:      { type: Date, default: Date.now },
}, { timestamps: false })

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true })

export default mongoose.models.UserAchievement || mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema)
