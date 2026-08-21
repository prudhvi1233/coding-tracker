import mongoose, { Document, Schema } from 'mongoose';

export interface ICodingActivity extends Document {
  userId: string;
  eventId?: string;
  fileName: string;
  relativeFilePath?: string;
  language: string;
  projectName: string;
  totalLines: number;
  timestamp: Date;
  createdAt: Date;
}

const CodingActivitySchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  eventId: { type: String, unique: true, sparse: true },
  fileName: { type: String, required: true },
  relativeFilePath: { type: String },
  language: { type: String, required: true },
  projectName: { type: String, required: true },
  totalLines: { type: Number, required: true },
  timestamp: { type: Date, required: true },
}, { timestamps: true });

CodingActivitySchema.index({ userId: 1, projectName: 1, relativeFilePath: 1 });
CodingActivitySchema.index({ userId: 1, projectName: 1, fileName: 1 });

export default mongoose.model<ICodingActivity>('CodingActivity', CodingActivitySchema);
