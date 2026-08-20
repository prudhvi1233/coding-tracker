import mongoose, { Document, Schema } from 'mongoose';

export interface IGitCommit extends Document {
  userId: string;
  projectId: string;
  repositoryId: string;
  commitHash: string;
  shortHash: string;
  message: string;
  authorName: string;
  timestamp: Date;
  filesChanged: number;
  insertions: number;
  deletions: number;
  createdAt: Date;
  updatedAt: Date;
}

const GitCommitSchema: Schema = new Schema({
  userId: { type: String, required: true },
  projectId: { type: String, required: true },
  repositoryId: { type: Schema.Types.ObjectId, ref: 'GitRepository', required: true },
  commitHash: { type: String, required: true },
  shortHash: { type: String, required: true },
  message: { type: String, default: '' },
  authorName: { type: String, default: '' },
  timestamp: { type: Date, required: true },
  filesChanged: { type: Number, default: 0 },
  insertions: { type: Number, default: 0 },
  deletions: { type: Number, default: 0 },
}, { timestamps: true });

// Prevent duplicate commits for the same repository
GitCommitSchema.index({ repositoryId: 1, commitHash: 1 }, { unique: true });
// Optimize timeline queries
GitCommitSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IGitCommit>('GitCommit', GitCommitSchema);
