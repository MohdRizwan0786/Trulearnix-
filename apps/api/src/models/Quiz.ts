import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  marks: number;
}

export interface IQuiz extends Document {
  title: string;
  course: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  module?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  mentor: mongoose.Types.ObjectId;
  questions: IQuestion[];
  duration: number; // minutes
  passingScore: number;
  totalMarks: number;
  attempts: number; // max attempts allowed (0 = unlimited)
  isPublished: boolean;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true },
  explanation: String,
  marks: { type: Number, default: 1 }
});

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  module: { type: Schema.Types.ObjectId },
  lesson: { type: Schema.Types.ObjectId },
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [QuestionSchema],
  duration: { type: Number, default: 30 },
  passingScore: { type: Number, default: 70 },
  totalMarks: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

QuizSchema.pre('save', function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  next();
});

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
