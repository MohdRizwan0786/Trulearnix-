import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IMeeting extends Document {
  title: string;
  description: string;
  roomId: string;
  scheduledAt: Date;
  duration: number;
  createdBy: mongoose.Types.ObjectId;
  invitees: mongoose.Types.ObjectId[];
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  type: 'team' | 'client' | 'training' | 'review' | 'standup';
}

const MeetingSchema = new Schema<IMeeting>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  roomId: { type: String, default: () => uuidv4().replace(/-/g, '').substring(0, 16) },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invitees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  type: { type: String, enum: ['team', 'client', 'training', 'review', 'standup'], default: 'team' },
}, { timestamps: true });

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
