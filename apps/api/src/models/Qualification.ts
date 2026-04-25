import mongoose, { Schema, Document } from 'mongoose'

export interface IQualification extends Document {
  title: string
  description: string
  icon: string
  reward: string
  rewardType: 'bonus' | 'badge' | 'certificate' | 'upgrade' | 'trophy' | 'feature'
  target: number
  metricType: 'l1Paid' | 'totalEarnings' | 'l1Count' | 'tierUpgrade'
  unit: string
  order: number
  isActive: boolean
  badgeGradient: string
  certificateEnabled: boolean
  startDate?: Date | null
  endDate?: Date | null
  createdAt: Date
}

const QualificationSchema = new Schema<IQualification>({
  title:              { type: String, required: true, trim: true },
  description:        { type: String, default: '' },
  icon:               { type: String, default: '🏆' },
  reward:             { type: String, default: '' },
  rewardType:         { type: String, enum: ['bonus','badge','certificate','upgrade','trophy','feature'], default: 'badge' },
  target:             { type: Number, required: true },
  metricType:         { type: String, enum: ['l1Paid','totalEarnings','l1Count','tierUpgrade'], default: 'l1Paid' },
  unit:               { type: String, default: 'paid referrals' },
  order:              { type: Number, default: 0 },
  isActive:           { type: Boolean, default: true },
  badgeGradient:      { type: String, default: 'from-violet-500 to-purple-600' },
  certificateEnabled: { type: Boolean, default: true },
  startDate:          { type: Date, default: null },
  endDate:            { type: Date, default: null },
}, { timestamps: true })

QualificationSchema.index({ order: 1, isActive: 1 })

export default mongoose.models.Qualification || mongoose.model<IQualification>('Qualification', QualificationSchema)
