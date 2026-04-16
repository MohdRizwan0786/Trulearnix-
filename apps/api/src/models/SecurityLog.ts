import mongoose, { Schema } from 'mongoose';

const SecurityLogSchema = new Schema({
  ip:          { type: String, required: true, index: true },
  method:      { type: String, default: 'GET' },
  endpoint:    { type: String, default: '/' },
  statusCode:  { type: Number, default: 200 },
  threat: {
    type: String,
    enum: ['brute_force', 'rate_abuse', 'sqli', 'nosql_injection', 'xss',
           'path_traversal', 'command_injection', 'scanner', 'bad_bot',
           'suspicious_payload', 'none'],
    default: 'none', index: true,
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info', index: true,
  },
  reason:      { type: String, default: '' },
  payloadSnip: { type: String, default: '' },
  userAgent:   { type: String, default: '' },
  country:     { type: String, default: 'Unknown' },
  city:        { type: String, default: '' },
  userId:      { type: String, default: '' },
  blocked:     { type: Boolean, default: false, index: true },
  responseMs:  { type: Number, default: 0 },
}, { timestamps: true });

SecurityLogSchema.index({ createdAt: -1 });
SecurityLogSchema.index({ threat: 1, createdAt: -1 });
SecurityLogSchema.index({ ip: 1, createdAt: -1 });
SecurityLogSchema.index({ severity: 1, createdAt: -1 });
// Auto-expire after 90 days
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model('SecurityLog', SecurityLogSchema, 'security_logs');
