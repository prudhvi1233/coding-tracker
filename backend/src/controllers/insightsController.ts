import { Request, Response, NextFunction } from 'express';
import Insight from '../models/Insight';
import { insightGeneratorService } from '../services/insightGeneratorService';

export const getInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const query: any = { 
      userId, 
      dismissed: false,
      expiresAt: { $gt: new Date() } // Only non-expired
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const insights = await Insight.find(query).sort({ importance: -1, generatedAt: -1 });
    res.json(insights);
  } catch (error: any) { next(error);
  }
};

export const getInsightsSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const now = new Date();
    const insights = await Insight.find({ userId, dismissed: false, expiresAt: { $gt: now } }).sort({ importance: -1, generatedAt: -1 });
    
    res.json({
      activeCount: insights.length,
      topInsight: insights.length > 0 ? insights[0] : null,
    });
  } catch (error: any) { next(error);
  }
};

export const refreshInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Force run
    await insightGeneratorService.generateInsightsForUser(userId, true);
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const dismissInsight = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    await Insight.findOneAndUpdate({ _id: id, userId }, { dismissed: true });
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    if (feedback !== 'helpful' && feedback !== 'not_helpful') {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    await Insight.findOneAndUpdate({ _id: id, userId }, { feedback });
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};
