import mongoose, { Document, Schema } from 'mongoose';

export interface ICodingSession extends Document {
  userId: string;
  projectName: string;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  estimatedDurationMinutes: number;
  filesEdited: string[];
  languages: string[];
  saveEvents: number;
  createdAt: Date;
  updatedAt: Date;
}

const CodingSessionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  projectName: { type: String, required: true },
  startedAt: { type: Date, required: true },
  lastActivityAt: { type: Date, required: true },
  endedAt: { type: Date },
  estimatedDurationMinutes: { type: Number, default: 0 },
  filesEdited: [{ type: String }],
  languages: [{ type: String }],
  saveEvents: { type: Number, default: 1 },
}, { timestamps: true });

// Indexes for fast lookups and aggregations
CodingSessionSchema.index({ userId: 1, startedAt: -1 });
CodingSessionSchema.index({ userId: 1, projectName: 1 });
CodingSessionSchema.index({ userId: 1, lastActivityAt: -1 });

export default mongoose.model<ICodingSession>('CodingSession', CodingSessionSchema);
