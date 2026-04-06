import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import Certificate from '../models/Certificate';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export const generateCertificateId = (studentId: string, courseId: string): string => {
  const raw = `${studentId}-${courseId}-${Date.now()}`;
  return crypto.createHmac('sha256', process.env.CERTIFICATE_SECRET!).update(raw).digest('hex').substring(0, 16).toUpperCase();
};

export const generateCertificatePDF = async (
  studentName: string,
  courseName: string,
  mentorName: string,
  certificateId: string,
  issuedAt: Date,
  score?: number
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 841.89, H = 595.28;

    // Background gradient simulation
    doc.rect(0, 0, W, H).fill('#0f0c29');
    doc.rect(0, 0, W, 8).fill('#6366f1');
    doc.rect(0, H - 8, W, 8).fill('#6366f1');
    doc.rect(0, 0, 8, H).fill('#6366f1');
    doc.rect(W - 8, 0, 8, H).fill('#6366f1');

    // Decorative circles
    doc.circle(80, 80, 120).fillOpacity(0.05).fill('#6366f1');
    doc.circle(W - 80, H - 80, 120).fillOpacity(0.05).fill('#6366f1');

    // Logo / Brand
    doc.fontSize(32).fillOpacity(1).fill('#6366f1').font('Helvetica-Bold')
      .text('TruLearnix', 0, 40, { align: 'center' });

    // Certificate title
    doc.fontSize(14).fill('#a5b4fc').font('Helvetica')
      .text('CERTIFICATE OF COMPLETION', 0, 85, { align: 'center', characterSpacing: 4 });

    // Divider
    doc.moveTo(W * 0.25, 115).lineTo(W * 0.75, 115).strokeColor('#6366f1').lineWidth(1).stroke();

    // Main text
    doc.fontSize(16).fill('#94a3b8').font('Helvetica')
      .text('This is to certify that', 0, 135, { align: 'center' });

    doc.fontSize(40).fill('#ffffff').font('Helvetica-Bold')
      .text(studentName, 0, 160, { align: 'center' });

    doc.moveTo(W * 0.3, 215).lineTo(W * 0.7, 215).strokeColor('#6366f1').lineWidth(0.5).stroke();

    doc.fontSize(16).fill('#94a3b8').font('Helvetica')
      .text('has successfully completed the course', 0, 225, { align: 'center' });

    doc.fontSize(28).fill('#a5b4fc').font('Helvetica-Bold')
      .text(courseName, 60, 255, { align: 'center', width: W - 120 });

    if (score !== undefined) {
      doc.fontSize(14).fill('#6ee7b7').font('Helvetica')
        .text(`Final Score: ${score}%`, 0, 305, { align: 'center' });
    }

    // Bottom section
    doc.fontSize(12).fill('#64748b').font('Helvetica')
      .text(`Issued on: ${issuedAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 80, H - 100);

    doc.fontSize(12).fill('#64748b').font('Helvetica')
      .text(`Instructor: ${mentorName}`, 80, H - 80);

    doc.fontSize(10).fill('#475569').font('Helvetica')
      .text(`Certificate ID: ${certificateId}`, W / 2, H - 100, { align: 'center', width: W / 2 - 80 });

    doc.fontSize(10).fill('#475569').font('Helvetica')
      .text(`Verify at: ${process.env.WEB_URL}/verify/${certificateId}`, W / 2, H - 80, { align: 'center', width: W / 2 - 80 });

    doc.end();
  });
};

export const uploadCertificateToS3 = async (pdfBuffer: Buffer, certificateId: string): Promise<string> => {
  const key = `certificates/${certificateId}.pdf`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ACL: 'public-read'
  }));
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const issueCertificate = async (
  studentId: string, courseId: string,
  studentName: string, courseName: string, mentorName: string,
  score?: number
) => {
  const existing = await Certificate.findOne({ student: studentId, course: courseId });
  if (existing) return existing;

  const certificateId = generateCertificateId(studentId, courseId);
  const issuedAt = new Date();

  const pdfBuffer = await generateCertificatePDF(studentName, courseName, mentorName, certificateId, issuedAt, score);
  const pdfUrl = await uploadCertificateToS3(pdfBuffer, certificateId);

  const certificate = await Certificate.create({
    certificateId,
    student: studentId,
    course: courseId,
    studentName,
    courseName,
    mentorName,
    issuedAt,
    pdfUrl,
    verificationUrl: `${process.env.WEB_URL}/verify/${certificateId}`,
    score
  });

  return certificate;
};
