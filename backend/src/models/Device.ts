import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  userId: string;
  deviceName: string;
  deviceTokenHash: string; // Hashed version of the token given to VS Code
  revokedAt: Date | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema: Schema = new Schema({
  userId: { type: String, required: true },
  deviceName: { type: String, required: true, trim: true },
  deviceTokenHash: { type: String, required: true },
  revokedAt: { type: Date, default: null },
  lastSyncAt: { type: Date, default: null },
}, { timestamps: true });

DeviceSchema.index({ userId: 1, revokedAt: 1 });

export default mongoose.model<IDevice>('Device', DeviceSchema);
