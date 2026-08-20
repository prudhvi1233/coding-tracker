import { Request, Response, NextFunction } from 'express';
import CodeSnapshot from '../models/CodeSnapshot';

export const saveSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectName, relativeFilePath, fileName, language, code, contentHash, lineCount, manual, timestamp } = req.body;
    const userId = req.user?.id;

    if (!userId || !projectName || !relativeFilePath || !fileName || !language || !code || !contentHash || !timestamp) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Check for duplicate by contentHash
    const latestSnapshot = await CodeSnapshot.findOne({
      userId,
      projectName,
      relativeFilePath
    }).sort({ timestamp: -1 });

    if (latestSnapshot && latestSnapshot.contentHash === contentHash) {
      // It's a duplicate, do not save
      res.json({ success: true, created: false, reason: 'duplicate' });
      return;
    }

    const snapshot = new CodeSnapshot({
      userId,
      projectName,
      relativeFilePath,
      fileName,
      language,
      code,
      contentHash,
      lineCount,
      manual: !!manual,
      timestamp: new Date(timestamp),
    });

    await snapshot.save();

    res.status(200).json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const projects = await CodeSnapshot.distinct('projectName', { userId });
    res.json(projects);
  } catch (error: any) { next(error);
  }
};

export const getProjectFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectName } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const files = await CodeSnapshot.distinct('relativeFilePath', { userId, projectName });
    res.json(files);
  } catch (error: any) { next(error);
  }
};

export const getSnapshotsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectName, relativeFilePath } = req.query;
    const userId = req.user?.id;

    if (!userId || !projectName || !relativeFilePath) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Exclude the 'code' field to save bandwidth
    const snapshots = await CodeSnapshot.find({
      userId,
      projectName: projectName as string,
      relativeFilePath: relativeFilePath as string
    })
    .select('-code')
    .sort({ timestamp: -1 });

    res.json(snapshots);
  } catch (error: any) { next(error);
  }
};

export const getSnapshotById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { snapshotId } = req.params;
    const userId = req.user?.id;
    const snapshot = await CodeSnapshot.findOne({ _id: snapshotId, userId });

    if (!snapshot) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    res.json(snapshot);
  } catch (error: any) { next(error);
  }
};
