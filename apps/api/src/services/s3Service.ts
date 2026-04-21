import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Cloudflare R2 — S3-compatible client
export const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'trulearnix';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const UPLOAD_DIR = '/var/www/trulearnix/uploads/';

// Store in memory first so we can process images before uploading
export const uploadToS3 = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'application/zip',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
});

/**
 * Process uploaded file and upload to Cloudflare R2.
 * - Images → sharp: preserve original format, quality 95
 * - Videos/PDFs/ZIP → upload as-is
 * Returns { filename, filepath, url }
 */
export async function processAndSaveUpload(file: Express.Multer.File): Promise<{ filename: string; filepath: string; cdnUrl?: string }> {
  const isImage = file.mimetype.startsWith('image/');
  const ext = isImage ? getImageExt(file.mimetype) : path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

  let buffer: Buffer = file.buffer;
  const contentType = file.mimetype;

  if (isImage) {
    const img = sharp(file.buffer, { failOnError: false });
    if (file.mimetype === 'image/jpeg') {
      buffer = await img.jpeg({ quality: 95, chromaSubsampling: '4:4:4', force: true }).toBuffer();
    } else if (file.mimetype === 'image/png') {
      buffer = await img.png({ compressionLevel: 1, effort: 1, force: true }).toBuffer();
    } else if (file.mimetype === 'image/webp') {
      buffer = await img.webp({ quality: 95, effort: 4, lossless: false, force: true }).toBuffer();
    }
    // GIF and others — use raw buffer as-is
  }

  // Upload to R2
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));

  // Also save locally as fallback
  const filepath = path.join(UPLOAD_DIR, filename);
  try { fs.writeFileSync(filepath, buffer); } catch {}

  const cdnUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${filename}` : undefined;
  return { filename, filepath, cdnUrl };
}

function getImageExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mime] || '.jpg';
}

export const deleteFromS3 = async (key: string) => {
  // Delete from R2
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {}
  // Delete from local disk too
  try {
    const localPath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  } catch {}
};

export const getSignedVideoUrl = async (key: string, _expiresIn = 3600): Promise<string> => {
  if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${key}`;
  return `${process.env.API_URL || 'https://api.trulearnix.com'}/uploads/${key}`;
};

const RECORDINGS_DIR = '/var/www/trulearnix/uploads/recordings';

/**
 * Upload a recording file to R2.
 * Waits up to 2 minutes for LiveKit to finalize the file before uploading.
 * Returns the R2 public URL, or null if R2 is not configured / upload fails.
 */
export async function uploadRecordingToR2(fileName: string): Promise<{ url: string; size: number } | null> {
  if (!R2_PUBLIC_URL || R2_PUBLIC_URL === 'PENDING') return null;

  const filePath = path.join(RECORDINGS_DIR, fileName);

  // Wait up to 2 min for LiveKit to finalize the MP4 file
  for (let i = 0; i < 24; i++) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) break;
    await new Promise(r => setTimeout(r, 5000));
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[R2] Recording file not found: ${filePath}`);
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const key = `recordings/${fileName}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'video/mp4',
    CacheControl: 'public, max-age=31536000',
  }));

  const url = `${R2_PUBLIC_URL}/${key}`;
  const size = buffer.length;
  console.log(`[R2] Recording uploaded: ${url} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  return { url, size };
}
