import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyActivity extends Document {
  userId: string;
  date: string; // YYYY-MM-DD
  filesEdited: number;
  languages: string[];
  totalSaveEvents: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyActivitySchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  filesEdited: { type: Number, default: 0 },
  languages: [{ type: String }],
  totalSaveEvents: { type: Number, default: 0 },
  active: { type: Boolean, default: false },
}, { timestamps: true });

DailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyActivity>('DailyActivity', DailyActivitySchema);
