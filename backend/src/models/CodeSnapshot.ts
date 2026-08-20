import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeSnapshot extends Document {
  userId: string;
  eventId?: string;
  projectName: string;
  relativeFilePath: string;
  fileName: string;
  language: string;
  code: string;
  contentHash: string;
  lineCount: number;
  manual: boolean;
  timestamp: Date;
  createdAt: Date;
}

const CodeSnapshotSchema: Schema = new Schema({
  userId: { type: String, required: true },
  eventId: { type: String, unique: true, sparse: true },
  projectName: { type: String, required: true },
  relativeFilePath: { type: String, required: true },
  fileName: { type: String, required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  contentHash: { type: String, required: true },
  lineCount: { type: Number, required: true },
  manual: { type: Boolean, default: false },
  timestamp: { type: Date, required: true },
}, { timestamps: true });

// Compound index for efficient browsing and history lookups
CodeSnapshotSchema.index({ userId: 1, projectName: 1, relativeFilePath: 1, timestamp: -1 });

export default mongoose.model<ICodeSnapshot>('CodeSnapshot', CodeSnapshotSchema);
