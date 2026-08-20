import mongoose, { Document, Schema } from 'mongoose';

export interface IGitRepository extends Document {
  userId: string;
  projectId: string; // Identifier connecting it to the coding tracker project
  projectName: string;
  repositoryName: string;
  currentBranch: string;
  remoteUrlSanitized: string;
  
  // Status counts
  changedFiles: number;
  stagedFiles: number;
  unstagedFiles: number;
  untrackedFiles: number;
  isDirty: boolean;
  
  lastCommitHash: string;
  lastCommitMessage: string;
  lastCommitTimestamp: Date;
  totalCommits: number;
  
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GitRepositorySchema: Schema = new Schema({
  userId: { type: String, required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  repositoryName: { type: String, required: true },
  currentBranch: { type: String, default: '' },
  remoteUrlSanitized: { type: String, default: '' },
  
  changedFiles: { type: Number, default: 0 },
  stagedFiles: { type: Number, default: 0 },
  unstagedFiles: { type: Number, default: 0 },
  untrackedFiles: { type: Number, default: 0 },
  isDirty: { type: Boolean, default: false },
  
  lastCommitHash: { type: String, default: '' },
  lastCommitMessage: { type: String, default: '' },
  lastCommitTimestamp: { type: Date },
  totalCommits: { type: Number, default: 0 },
  
  lastSyncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

GitRepositorySchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.model<IGitRepository>('GitRepository', GitRepositorySchema);
