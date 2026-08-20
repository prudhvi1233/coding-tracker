import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  userId: string;
  challengeType: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed' | 'expired';
  completedAt?: Date;
  notified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema({
  userId: { type: String, required: true },
  challengeType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'failed', 'expired'], default: 'active' },
  completedAt: { type: Date },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

ChallengeSchema.index({ userId: 1, status: 1, endDate: 1 });

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
