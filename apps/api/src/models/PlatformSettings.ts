import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  tdsRate: number;
  gstRate: number;
  minWithdrawalAmount: number;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>({
  tdsRate: { type: Number, default: 2 },
  gstRate: { type: Number, default: 18 },
  minWithdrawalAmount: { type: Number, default: 500 },
}, { timestamps: true });

export default mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
