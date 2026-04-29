import mongoose, { Schema, Document } from 'mongoose'

export interface IAchievement extends Document {
  title: string
  description: string
  badge: string
  triggerType: 'join' | 'first_earn' | 'earn_amount' | 'referrals' | 'paid_referrals' | 'tier'
  triggerValue: number
  requirement: string
  posterTheme: number
  order: number
  enabled: boolean
  startDate?: Date | null
  endDate?: Date | null
  createdAt: Date
}

const AchievementSchema = new Schema<IAchievement>({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  badge:         { type: String, default: '🏆' },
  triggerType:   { type: String, enum: ['join','first_earn','earn_amount','referrals','paid_referrals','tier'], default: 'join' },
  triggerValue:  { type: Number, default: 0 },
  requirement:   { type: String, default: '' },
  posterTheme:   { type: Number, default: 0, min: 0, max: 5 },
  order:         { type: Number, default: 0 },
  enabled:       { type: Boolean, default: true },
  startDate:     { type: Date, default: null },
  endDate:       { type: Date, default: null },
}, { timestamps: true })

AchievementSchema.index({ order: 1, enabled: 1 })

export default mongoose.models.Achievement || mongoose.model<IAchievement>('Achievement', AchievementSchema)
