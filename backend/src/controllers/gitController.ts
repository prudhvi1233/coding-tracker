import { Request, Response, NextFunction } from 'express';
import GitRepository from '../models/GitRepository';
import GitCommit from '../models/GitCommit';

export const syncGitData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      projectId, 
      projectName, 
      repositoryName, 
      currentBranch, 
      remoteUrlSanitized,
      changedFiles,
      stagedFiles,
      unstagedFiles,
      untrackedFiles,
      isDirty,
      commits // Array of commits from the extension
    } = req.body;
    
    const userId = req.user?.id;

    if (!userId || !projectId || typeof userId !== 'string' || typeof projectId !== 'string') {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    if (commits && !Array.isArray(commits)) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Double-check sanitization on backend to prevent trusting extension blindly
    let safeUrl = typeof remoteUrlSanitized === 'string' ? remoteUrlSanitized : '';
    if (safeUrl) {
      try {
        if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://') || safeUrl.startsWith('ssh://')) {
          const parsed = new URL(safeUrl);
          parsed.username = '';
          parsed.password = '';
          parsed.search = '';
          safeUrl = parsed.toString();
        } else {
          const scpMatch = safeUrl.match(/^([^@]+)@([^:]+):(.+)$/);
          if (scpMatch) safeUrl = `${scpMatch[2]}:${scpMatch[3]}`;
          else safeUrl = safeUrl.replace(/:\/\/[^@]+@/, '://').replace(/^[^@]+@/, '').split('?')[0];
        }
      } catch (error: any) {
        safeUrl = safeUrl.replace(/:\/\/[^@]+@/, '://').replace(/^[^@]+@/, '').split('?')[0];
      }
    }

    // Upsert repository
    let repository = await GitRepository.findOne({ userId, projectId });
    if (!repository) {
      repository = new GitRepository({ userId, projectId, projectName, repositoryName });
    }

    repository.currentBranch = currentBranch || repository.currentBranch;
    repository.remoteUrlSanitized = safeUrl || repository.remoteUrlSanitized;
    repository.changedFiles = changedFiles ?? repository.changedFiles;
    repository.stagedFiles = stagedFiles ?? repository.stagedFiles;
    repository.unstagedFiles = unstagedFiles ?? repository.unstagedFiles;
    repository.untrackedFiles = untrackedFiles ?? repository.untrackedFiles;
    repository.isDirty = isDirty ?? repository.isDirty;
    repository.lastSyncedAt = new Date();

    if (commits && commits.length > 0) {
      repository.lastCommitHash = commits[0].commitHash;
      repository.lastCommitMessage = commits[0].message;
      repository.lastCommitTimestamp = new Date(commits[0].timestamp);
    }
    await repository.save();

    // Insert commits, ignoring duplicates
    let newCommitsAdded = 0;
    if (commits && Array.isArray(commits)) {
      for (const commit of commits) {
        try {
          const newCommit = new GitCommit({
            userId,
            projectId,
            repositoryId: repository._id,
            commitHash: commit.commitHash,
            shortHash: commit.shortHash,
            message: commit.message,
            authorName: commit.authorName,
            timestamp: new Date(commit.timestamp),
            filesChanged: commit.filesChanged || 0,
            insertions: commit.insertions || 0,
            deletions: commit.deletions || 0
          });
          await newCommit.save();
          newCommitsAdded++;
        } catch (error: any) {
          // Ignore duplicate key errors (11000)
          if (error.code !== 11000) {
            
          }
        }
      }
    }

    // Update total commits safely
    repository.totalCommits = await GitCommit.countDocuments({ repositoryId: repository._id.toString() } as any); // repository._id });
    await repository.save();

    res.json({ success: true, newCommitsAdded });
  } catch (error: any) { next(error);
  }
};

export const getRepositories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    const repos = await GitRepository.find({ userId }).sort({ lastSyncedAt: -1 });
    res.json(repos);
  } catch (error: any) { next(error);
  }
};

export const getRepositoryDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const repo = await GitRepository.findOne({ _id: id, userId });
    if (!repo) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    const linesStats = await GitCommit.aggregate([
      { $match: { repositoryId: repo._id } },
      { $group: {
        _id: null,
        totalInsertions: { $sum: '$insertions' },
        totalDeletions: { $sum: '$deletions' }
      }}
    ]);

    res.json({
      ...repo.toObject(),
      totalInsertions: linesStats[0]?.totalInsertions || 0,
      totalDeletions: linesStats[0]?.totalDeletions || 0
    });
  } catch (error: any) { next(error);
  }
};

export const getCommits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Security check
    const repo = await GitRepository.findOne({ _id: id, userId });
    if (!repo) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    
    const commits = await GitCommit.find({ repositoryId: id })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json(commits);
  } catch (error: any) { next(error);
  }
};

export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [reposCount, totalCommits, commitsThisWeek, commitsThisMonth, lineStats, mostActiveRepo] = await Promise.all([
      GitRepository.countDocuments({ userId }),
      GitCommit.countDocuments({ userId }),
      GitCommit.countDocuments({ userId, timestamp: { $gte: oneWeekAgo } }),
      GitCommit.countDocuments({ userId, timestamp: { $gte: oneMonthAgo } }),
      GitCommit.aggregate([
        { $match: { userId } },
        { $group: { _id: null, insertions: { $sum: '$insertions' }, deletions: { $sum: '$deletions' } } }
      ]),
      GitRepository.find({ userId }).sort({ totalCommits: -1 }).limit(1)
    ]);

    res.json({
      totalRepositories: reposCount,
      totalCommits,
      commitsThisWeek,
      commitsThisMonth,
      totalInsertions: lineStats[0]?.insertions || 0,
      totalDeletions: lineStats[0]?.deletions || 0,
      mostActiveRepository: mostActiveRepo[0]?.projectName || 'None'
    });
  } catch (error: any) { next(error);
  }
};

export const getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // For the heatmap/chart, group commits by day
    const activity = await GitCommit.aggregate([
      { $match: { userId } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        commits: { $sum: 1 },
        insertions: { $sum: '$insertions' },
        deletions: { $sum: '$deletions' }
      }},
      { $sort: { _id: 1 } }
    ]);

    const result = activity.map(a => ({
      date: a._id,
      commits: a.commits,
      insertions: a.insertions,
      deletions: a.deletions
    }));

    res.json(result);
  } catch (error: any) { next(error);
  }
};
