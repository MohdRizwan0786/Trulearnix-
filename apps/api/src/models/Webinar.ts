import mongoose, { Document, Schema } from 'mongoose';

export interface IWebinarParticipant {
  participantId: string; // random client-side ID for guest tracking
  name: string;
  email?: string;
  joinedAt: Date;
  leftAt?: Date;
  watchSeconds: number;
  lastPing?: Date;
}

export interface IWebinar extends Document {
  type: 'webinar' | 'workshop';
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  joinSlug: string; // unique public URL slug
  livekitRoomName: string;
  egressId?: string;
  recordingUrl?: string;
  recordingFileName?: string;
  recordingSize?: number;
  createdBy: mongoose.Types.ObjectId;
  participants: IWebinarParticipant[];
  chatEnabled: boolean;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IWebinarParticipant>({
  participantId: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  joinedAt: { type: Date, default: Date.now },
  leftAt: Date,
  watchSeconds: { type: Number, default: 0 },
  lastPing: Date,
}, { _id: false });

const WebinarSchema = new Schema<IWebinar>({
  type: { type: String, enum: ['webinar', 'workshop'], default: 'webinar' },
  title: { type: String, required: true },
  description: String,
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  joinSlug: { type: String, required: true, unique: true },
  livekitRoomName: { type: String, required: true },
  egressId: String,
  recordingUrl: String,
  recordingFileName: String,
  recordingSize: Number,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [ParticipantSchema],
  chatEnabled: { type: Boolean, default: true },
  startedAt: Date,
  endedAt: Date,
}, { timestamps: true });

export default mongoose.model<IWebinar>('Webinar', WebinarSchema);
