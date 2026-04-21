import { Router } from 'express';
import Assignment from '../models/Assignment';
import { protect, authorize } from '../middleware/auth';
import { uploadToS3 } from '../services/s3Service';
import Enrollment from '../models/Enrollment';

const router = Router();

router.post('/', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, mentor: req.user._id });
    res.status(201).json({ success: true, assignment });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/course/:courseId', protect, async (req: any, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId, isPublished: true })
      .select('-submissions.score');
    res.json({ success: true, assignments });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/:id/submit', protect, authorize('student'), uploadToS3.single('file'), async (req: any, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: assignment.course });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });

    // Support both S3 (location) and local disk storage (filename)
    const fileUrl = (req.file as any)?.location
      || (req.file?.filename ? `https://api.trulearnix.com/uploads/${req.file.filename}` : undefined);
    if (!fileUrl) return res.status(400).json({ success: false, message: 'File upload failed' });
    const existing = assignment.submissions.findIndex(s => s.student.toString() === req.user._id.toString());
    const submission = { student: req.user._id, fileUrl, fileName: req.file?.originalname || '', submittedAt: new Date(), status: 'pending' as const };

    if (existing >= 0) { Object.assign(assignment.submissions[existing], submission); }
    else assignment.submissions.push(submission);

    await assignment.save();
    res.json({ success: true, message: 'Assignment submitted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/:id/review/:studentId', protect, authorize('mentor'), async (req: any, res) => {
  try {
    const { score, feedback } = req.body;
    const assignment = await Assignment.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const subIdx = assignment.submissions.findIndex(s => s.student.toString() === req.params.studentId);
    if (subIdx < 0) return res.status(404).json({ success: false, message: 'Submission not found' });

    assignment.submissions[subIdx].score = score;
    assignment.submissions[subIdx].feedback = feedback;
    assignment.submissions[subIdx].reviewedAt = new Date();
    assignment.submissions[subIdx].status = 'reviewed';
    await assignment.save();

    res.json({ success: true, message: 'Assignment reviewed' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
