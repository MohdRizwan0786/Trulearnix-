import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: 'payment' | 'course' | 'technical' | 'certificate' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: {
    sender: mongoose.Types.ObjectId;
    senderRole: string;
    message: string;
    createdAt: Date;
  }[];
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['payment', 'course', 'technical', 'certificate', 'other'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  messages: [{
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    senderRole: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
