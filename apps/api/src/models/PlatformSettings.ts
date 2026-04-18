import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  tdsRate: number;
  gstRate: number;
  gstNumber: string;
  minWithdrawalAmount: number;
  webinarLink?: string;
  webinarTitle?: string;
  webinarDate?: string;
  presentationVideoLink?: string;
  maintenanceMode: boolean;
  trulanceMaintenance: boolean;
  maintenanceMessage?: string;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>({
  tdsRate: { type: Number, default: 2 },
  gstRate: { type: Number, default: 18 },
  gstNumber: { type: String, default: '' },
  minWithdrawalAmount: { type: Number, default: 500 },
  webinarLink: { type: String, default: '' },
  webinarTitle: { type: String, default: '' },
  webinarDate: { type: String, default: '' },
  presentationVideoLink: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
  trulanceMaintenance: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are performing scheduled maintenance. We will be back shortly.' },
}, { timestamps: true });

export default mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
