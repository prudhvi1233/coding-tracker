import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  userId: string;
  achievementKey: string;
  title: string;
  description: string;
  unlockedAt: Date;
  metadata?: any;
  notified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema: Schema = new Schema({
  userId: { type: String, required: true },
  achievementKey: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  unlockedAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

AchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
