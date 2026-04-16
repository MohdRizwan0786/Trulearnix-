import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'commission' | 'class' | 'course' | 'system' | 'general' | 'promotion' | 'alert' | 'reminder' | 'announcement';
  channel: 'inapp' | 'email' | 'sms' | 'whatsapp' | 'push';
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error', 'commission', 'class', 'course', 'system', 'general', 'promotion', 'alert', 'reminder', 'announcement'], default: 'info' },
  channel: { type: String, enum: ['inapp', 'email', 'sms', 'whatsapp', 'push'], default: 'inapp' },
  read: { type: Boolean, default: false },
  actionUrl: String,
  data: Schema.Types.Mixed,
}, { timestamps: true });

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
