import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveClass extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  mentor: mongoose.Types.ObjectId;
  scheduledAt: Date;
  duration: number; // minutes
  platform: 'zoom' | 'webrtc';
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  zoomPassword?: string;
  roomId?: string; // for WebRTC
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recordingUrl?: string;
  attendees: { user: mongoose.Types.ObjectId; joinedAt: Date; leftAt?: Date }[];
  chatEnabled: boolean;
  createdAt: Date;
}

const LiveClassSchema = new Schema<ILiveClass>({
  title: { type: String, required: true },
  description: String,
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  platform: { type: String, enum: ['zoom', 'webrtc'], default: 'zoom' },
  zoomMeetingId: String,
  zoomJoinUrl: String,
  zoomStartUrl: String,
  zoomPassword: String,
  roomId: String,
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  recordingUrl: String,
  attendees: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date
  }],
  chatEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ILiveClass>('LiveClass', LiveClassSchema);
