import mongoose, { Document, Schema } from 'mongoose';

export type HolidayType = 'national' | 'company';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  day: number;    // day of month
  month: number;  // 1-12
  year?: number;  // null if recurring every year
  type: HolidayType;
  recurring: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const HolidaySchema = new Schema<IHoliday>({
  name:      { type: String, required: true, trim: true },
  date:      { type: Date, required: true },
  day:       { type: Number, required: true },
  month:     { type: Number, required: true, min: 1, max: 12 },
  year:      Number,
  type:      { type: String, enum: ['national', 'company'], required: true },
  recurring: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

HolidaySchema.index({ month: 1, year: 1 });
HolidaySchema.index({ recurring: 1, month: 1 });

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);
