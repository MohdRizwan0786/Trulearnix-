import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export const uploadToS3 = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET!,
    acl: 'public-read',
    metadata: (_, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      const folder = file.mimetype.startsWith('video/') ? 'videos' :
        file.mimetype.startsWith('image/') ? 'images' : 'documents';
      cb(null, `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm',
      'application/pdf', 'application/zip'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

export const deleteFromS3 = async (key: string) => {
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }));
};

export const getSignedVideoUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }), { expiresIn });
};
