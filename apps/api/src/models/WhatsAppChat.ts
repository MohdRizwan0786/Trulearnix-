import mongoose, { Document, Schema } from 'mongoose';

export interface IWAMessage {
  direction: 'inbound' | 'outbound';
  text: string;
  type: 'text' | 'template' | 'image' | 'document';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  timestamp: Date;
  waMessageId?: string;
}

export interface IWhatsAppChat extends Document {
  contactPhone: string;
  contactName?: string;
  userId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  messages: IWAMessage[];
  lastMessageAt: Date;
  lastMessageText?: string;
  lastMessageDirection?: 'inbound' | 'outbound';
  isOpen: boolean;
  tags: string[];
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WAMessageSchema = new Schema<IWAMessage>({
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'template', 'image', 'document'], default: 'text' },
  status: { type: String, enum: ['sent', 'delivered', 'read', 'failed', 'received'], default: 'sent' },
  timestamp: { type: Date, default: Date.now },
  waMessageId: String,
}, { _id: false });

const WhatsAppChatSchema = new Schema<IWhatsAppChat>({
  contactPhone: { type: String, required: true, unique: true },
  contactName: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  messages: [WAMessageSchema],
  lastMessageAt: { type: Date, default: Date.now },
  lastMessageText: String,
  lastMessageDirection: { type: String, enum: ['inbound', 'outbound'] },
  isOpen: { type: Boolean, default: true },
  tags: [String],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

WhatsAppChatSchema.index({ lastMessageAt: -1 });
WhatsAppChatSchema.index({ userId: 1 });
WhatsAppChatSchema.index({ leadId: 1 });

export default mongoose.model<IWhatsAppChat>('WhatsAppChat', WhatsAppChatSchema);
