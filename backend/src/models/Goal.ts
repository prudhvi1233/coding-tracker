import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  userId: string;
  title: string;
  description: string;
  goalType: 'coding_days' | 'coding_time' | 'file_saves' | 'snapshots' | 'git_commits' | 'projects' | 'language_days' | 'streak';
  targetValue: number;
  currentValue: number;
  unit: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  language?: string;
  projectId?: string;
  projectName?: string;
  status: 'active' | 'completed' | 'expired' | 'archived';
  completedAt?: Date;
  notified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  goalType: { type: String, required: true },
  targetValue: { type: Number, required: true, min: 1 },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  periodType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  language: { type: String },
  projectId: { type: String },
  projectName: { type: String },
  status: { type: String, enum: ['active', 'completed', 'expired', 'archived'], default: 'active' },
  completedAt: { type: Date },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, endDate: 1 });

export default mongoose.model<IGoal>('Goal', GoalSchema);
