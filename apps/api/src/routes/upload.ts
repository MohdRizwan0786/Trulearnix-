import { Router } from 'express';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth';
import { uploadToS3, processAndSaveUpload } from '../services/s3Service';
import MediaFile from '../models/MediaFile';

const router = Router();
const API_URL = process.env.API_URL || 'https://api.trulearnix.com';

function getType(mime: string): 'image' | 'video' | 'document' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

// ─── Upload image ─────────────────────────────────────────────────────────────
router.post('/image', protect, uploadToS3.single('image'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const { filename } = await processAndSaveUpload(req.file);
    const url = `${API_URL}/uploads/${filename}`;
    await MediaFile.create({
      filename, originalName: req.file.originalname,
      url, type: 'image', size: req.file.size, mimeType: req.file.mimetype,
      uploadedBy: req.user?._id,
    }).catch(() => {});
    res.json({ success: true, url, filename });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Upload video ─────────────────────────────────────────────────────────────
router.post('/video', protect, authorize('mentor', 'admin', 'superadmin'), uploadToS3.single('video'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const { filename, cdnUrl } = await processAndSaveUpload(req.file);
    const url = cdnUrl || `${API_URL}/uploads/${filename}`;
    await MediaFile.create({
      filename, originalName: req.file.originalname,
      url, type: 'video', size: req.file.size, mimeType: req.file.mimetype,
      uploadedBy: req.user?._id,
    }).catch(() => {});
    res.json({ success: true, url, filename });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Upload document ──────────────────────────────────────────────────────────
router.post('/document', protect, uploadToS3.single('document'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const { filename } = await processAndSaveUpload(req.file);
    const url = `${API_URL}/uploads/${filename}`;
    await MediaFile.create({
      filename, originalName: req.file.originalname,
      url, type: 'document', size: req.file.size, mimeType: req.file.mimetype,
      uploadedBy: req.user?._id,
    }).catch(() => {});
    res.json({ success: true, url, filename });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Upload any file (admin CMS) ─────────────────────────────────────────────
router.post('/any', protect, uploadToS3.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const { filename, cdnUrl } = await processAndSaveUpload(req.file);
    const type = getType(req.file.mimetype);
    const url = (type === 'video' && cdnUrl) ? cdnUrl : `${API_URL}/uploads/${filename}`;
    await MediaFile.create({
      filename, originalName: req.file.originalname,
      url, type, size: req.file.size, mimeType: req.file.mimetype,
      uploadedBy: req.user?._id,
    }).catch(() => {});
    res.json({ success: true, url, filename, type });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Admin: list all media files ──────────────────────────────────────────────
router.get('/media/list', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { type } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    const files = await MediaFile.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, files });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Admin: delete media file ─────────────────────────────────────────────────
router.delete('/media/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const file = await MediaFile.findByIdAndDelete(req.params.id);
    if (file?.filename) {
      const uploadDir = process.env.UPLOAD_DIR || '/var/www/trulearnix/uploads/';
      const filePath = `${uploadDir.replace(/\/$/, '')}/${file.filename}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'File deleted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Signed URL ───────────────────────────────────────────────────────────────
router.get('/signed-url/:key', protect, async (req, res) => {
  const url = `${API_URL}/uploads/${decodeURIComponent(req.params.key)}`;
  res.json({ success: true, url });
});

export default router;
