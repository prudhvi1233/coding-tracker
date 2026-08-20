import mongoose, { Document, Schema } from 'mongoose';

export interface IInsight extends Document {
  userId: string;
  category: 'productivity' | 'streak' | 'language' | 'project' | 'git' | 'goals' | 'habit' | 'recommendation';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  importance: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  sourceDataHash: string; // Hash of the metrics used to generate this to prevent duplicates
  generatedAt: Date;
  expiresAt: Date;
  metadata?: any;
  dismissed: boolean;
  feedback: 'helpful' | 'not_helpful' | null;
  createdAt: Date;
  updatedAt: Date;
}

const InsightSchema: Schema = new Schema({
  userId: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['productivity', 'streak', 'language', 'project', 'git', 'goals', 'habit', 'recommendation'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  importance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  confidence: { type: Number, min: 0, max: 100, default: 50 },
  sourceDataHash: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed },
  dismissed: { type: Boolean, default: false },
  feedback: { type: String, enum: ['helpful', 'not_helpful', null], default: null }
}, { timestamps: true });

// Prevent exact identical insights for the same exact data hash
InsightSchema.index({ userId: 1, sourceDataHash: 1 }, { unique: true });
InsightSchema.index({ userId: 1, expiresAt: 1 });
InsightSchema.index({ userId: 1, category: 1 });
InsightSchema.index({ userId: 1, dismissed: 1 });

export default mongoose.model<IInsight>('Insight', InsightSchema);
