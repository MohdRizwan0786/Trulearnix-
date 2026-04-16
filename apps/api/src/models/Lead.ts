import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  source: 'meta_ads' | 'google_ads' | 'organic' | 'referral' | 'whatsapp' | 'website' | 'manual' | 'other';
  campaign?: string;
  adSet?: string;
  adCreative?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  assignedTo?: mongoose.Types.ObjectId;
  stage: 'new' | 'contacted' | 'interested' | 'demo_done' | 'negotiating' | 'token_collected' | 'paid' | 'lost';
  aiScore: number;
  aiScoreLabel: 'cold' | 'warm' | 'hot';
  aiScoreReason?: string;
  interestedPackage?: string;
  objectionType?: 'price' | 'time' | 'trust' | 'other';
  notes: { text: string; by: mongoose.Types.ObjectId; createdAt: Date }[];
  followUps: { scheduledAt: Date; type: string; done: boolean; outcome?: string }[];
  whatsappSent: number;
  emailSent: number;
  lastContactedAt?: Date;
  webinarInvited: boolean;
  webinarAttended: boolean;
  convertedAt?: Date;
  convertedUserId?: mongoose.Types.ObjectId;
  lostReason?: string;
  tags: string[];
  city?: string;
  state?: string;
  salesOrderId?: mongoose.Types.ObjectId;
  tokenAmount?: number;
  tokenCollected?: boolean;
  isCompanyLead?: boolean;
  salespersonCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  source: { type: String, enum: ['meta_ads', 'google_ads', 'organic', 'referral', 'whatsapp', 'website', 'manual', 'other'], default: 'website' },
  campaign: String,
  adSet: String,
  adCreative: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmContent: String,
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  stage: { type: String, enum: ['new', 'contacted', 'interested', 'demo_done', 'negotiating', 'token_collected', 'paid', 'lost'], default: 'new' },
  aiScore: { type: Number, default: 0 },
  aiScoreLabel: { type: String, enum: ['cold', 'warm', 'hot'], default: 'cold' },
  aiScoreReason: String,
  interestedPackage: String,
  objectionType: { type: String, enum: ['price', 'time', 'trust', 'other'] },
  notes: [{
    text: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  followUps: [{
    scheduledAt: Date,
    type: { type: String, enum: ['whatsapp', 'call', 'email', 'meeting'] },
    done: { type: Boolean, default: false },
    outcome: String
  }],
  whatsappSent: { type: Number, default: 0 },
  emailSent: { type: Number, default: 0 },
  lastContactedAt: Date,
  webinarInvited: { type: Boolean, default: false },
  webinarAttended: { type: Boolean, default: false },
  convertedAt: Date,
  convertedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  lostReason: String,
  tags: [String],
  city: String,
  state: String,
  salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
  tokenAmount: Number,
  tokenCollected: { type: Boolean, default: false },
  isCompanyLead: { type: Boolean, default: false },
  salespersonCode: String,
}, { timestamps: true });

LeadSchema.index({ phone: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ stage: 1, aiScore: -1 });
LeadSchema.index({ assignedTo: 1, stage: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ source: 1 });

export default mongoose.model<ILead>('Lead', LeadSchema);
