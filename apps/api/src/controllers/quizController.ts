import { Response } from 'express';
import Quiz from '../models/Quiz';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.create({ ...req.body, mentor: req.user._id });
    res.status(201).json({ success: true, quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user._id },
      req.body, { new: true }
    );
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizForStudent = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.findById(req.params.id).select('-questions.correctOption -questions.explanation');
    if (!quiz || !quiz.isPublished) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Not enrolled' });

    res.json({ success: true, quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body; // { questionId: selectedOption }
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    let earned = 0;
    const results = quiz.questions.map((q) => {
      const selected = answers[q._id?.toString() || ''];
      const correct = selected === q.correctOption;
      if (correct) earned += q.marks;
      return { questionId: q._id, correct, correctOption: q.correctOption, explanation: q.explanation, marks: correct ? q.marks : 0 };
    });

    const score = Math.round((earned / quiz.totalMarks) * 100);
    const passed = score >= quiz.passingScore;

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course });
    if (enrollment) {
      const existingIdx = enrollment.quizResults.findIndex(r => r.quizId.toString() === quiz._id?.toString());
      if (existingIdx >= 0) {
        enrollment.quizResults[existingIdx] = { quizId: quiz._id as any, score, passed, attemptedAt: new Date() };
      } else {
        enrollment.quizResults.push({ quizId: quiz._id as any, score, passed, attemptedAt: new Date() });
      }
      await enrollment.save();
    }

    res.json({ success: true, score, passed, earned, totalMarks: quiz.totalMarks, passingScore: quiz.passingScore, results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMentorQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    const quizzes = await Quiz.find({ mentor: req.user._id }).populate('course', 'title').sort('-createdAt');
    res.json({ success: true, quizzes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
