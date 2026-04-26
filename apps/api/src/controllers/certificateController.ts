import { Response } from 'express';
import Certificate from '../models/Certificate';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import User from '../models/User';
import { issueCertificate } from '../services/certificateService';
import { AuthRequest } from '../middleware/auth';

export const claimCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });
    if (!enrollment.completedAt)
      return res.status(400).json({ success: false, message: 'Your mentor has not yet marked this batch as complete.' });

    const course = await Course.findById(courseId).populate('mentor', 'name');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const avgScore = enrollment.quizResults.length
      ? enrollment.quizResults.reduce((s, q) => s + q.score, 0) / enrollment.quizResults.length
      : undefined;

    const mentor = course.mentor as any;
    const certificate = await issueCertificate(
      req.user._id.toString(), courseId,
      req.user.name, course.title, mentor.name, avgScore
    );

    enrollment.certificateId = certificate.certificateId;
    enrollment.certificateUrl = certificate.pdfUrl;
    await enrollment.save();

    res.json({ success: true, certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title thumbnail').sort('-issuedAt');
    res.json({ success: true, certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCertificate = async (req: any, res: Response) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id })
      .populate('student', 'name').populate('course', 'title');
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
    res.json({ success: true, valid: true, certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
