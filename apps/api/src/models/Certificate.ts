import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  certificateId: string;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  studentName: string;
  courseName: string;
  mentorName: string;
  issuedAt: Date;
  pdfUrl: string;
  verificationUrl: string;
  score?: number;
}

const CertificateSchema = new Schema<ICertificate>({
  certificateId: { type: String, unique: true, required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  mentorName: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  pdfUrl: { type: String, required: true },
  verificationUrl: { type: String, required: true },
  score: Number
}, { timestamps: true });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
