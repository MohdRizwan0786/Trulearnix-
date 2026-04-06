import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { uploadToS3, getSignedVideoUrl } from '../services/s3Service';

const router = Router();

router.post('/video', protect, authorize('mentor', 'admin'), uploadToS3.single('video'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: (req.file as any).location, key: (req.file as any).key });
});

router.post('/image', protect, uploadToS3.single('image'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: (req.file as any).location, key: (req.file as any).key });
});

router.post('/document', protect, uploadToS3.single('document'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: (req.file as any).location, key: (req.file as any).key });
});

router.get('/signed-url/:key', protect, async (req, res) => {
  try {
    const url = await getSignedVideoUrl(decodeURIComponent(req.params.key));
    res.json({ success: true, url });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
