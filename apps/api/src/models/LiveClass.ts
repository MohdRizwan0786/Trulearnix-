import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveClass extends Document {
  title: string;
  description?: string;
  course?: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  mentor: mongoose.Types.ObjectId;
  scheduledAt: Date;
  duration: number;
  platform: 'zoom' | 'agora' | 'livekit';
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  zoomPassword?: string;
  agoraChannelName?: string;
  livekitRoomName?: string;
  egressId?: string;
  lessonId?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recordingUrl?: string;
  recordingSize?: number;
  recordingFileName?: string;
  summary?: string;
  mentorNotes?: string;
  attendees: { user: mongoose.Types.ObjectId; joinedAt: Date; leftAt?: Date }[];
  attendanceRecords: {
    user: mongoose.Types.ObjectId;
    totalWatchSeconds: number;
    isPresent: boolean;
    lastPing?: Date;
  }[];
  chatEnabled: boolean;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LiveClassSchema = new Schema<ILiveClass>({
  title: { type: String, required: true },
  description: String,
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  platform: { type: String, enum: ['zoom', 'agora', 'livekit'], default: 'livekit' },
  zoomMeetingId: String,
  agoraChannelName: String,
  livekitRoomName: String,
  egressId: String,
  lessonId: String,
  zoomJoinUrl: String,
  zoomStartUrl: String,
  zoomPassword: String,
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  recordingUrl: String,
  recordingSize: Number,
  recordingFileName: String,
  summary: String,
  mentorNotes: String,
  attendees: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
  }],
  attendanceRecords: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    totalWatchSeconds: { type: Number, default: 0 },
    isPresent: { type: Boolean, default: false },
    lastPing: Date,
  }],
  chatEnabled: { type: Boolean, default: true },
  startedAt: Date,
  endedAt: Date,
}, { timestamps: true });

export default mongoose.model<ILiveClass>('LiveClass', LiveClassSchema);
