import mongoose, { Schema } from 'mongoose';

const BlockedIpSchema = new Schema({
  ip:          { type: String, required: true, unique: true, index: true },
  reason:      { type: String, default: 'Auto-blocked' },
  threat:      { type: String, default: 'rate_abuse' },
  autoBlock:   { type: Boolean, default: true },
  country:     { type: String, default: '' },
  hitCount:    { type: Number, default: 1 },
  expiresAt:   { type: Date, default: null },
  unblockedAt: { type: Date, default: null },
  active:      { type: Boolean, default: true, index: true },
}, { timestamps: true });

BlockedIpSchema.index({ expiresAt: 1 });

export default mongoose.model('BlockedIp', BlockedIpSchema, 'blocked_ips');
