import crypto from 'crypto';
import Insight from '../models/Insight';
import { insightsAnalyticsService } from './insightsAnalyticsService';
import { privacyService } from './privacyService';
import { aiService } from './ai/AIService';

class InsightGeneratorService {
  private lastRefreshMap = new Map<string, number>();

  public async generateInsightsForUser(userId: string, force: boolean = false) {
    const now = Date.now();
    
    // Rate limit: No more than 1 refresh per 5 minutes per user unless forced
    const lastRefresh = this.lastRefreshMap.get(userId) || 0;
    if (!force && now - lastRefresh < 5 * 60 * 1000) {
      return; 
    }
    this.lastRefreshMap.set(userId, now);

    try {
      // 1. Gather deterministic analytics
      const rawData = await insightsAnalyticsService.getAnalyticsPayload(userId);
      
      // 2. Sanitize for privacy
      const sanitizedData = privacyService.sanitizeInsightPayload(rawData, false); // Hardcode privacy to false for now unless configured
      
      // 3. Hash to prevent duplicate identical insights
      const sourceDataHash = crypto.createHash('sha256').update(JSON.stringify(sanitizedData)).digest('hex');

      // Check if we recently generated insights for this exact dataset
      const existing = await Insight.findOne({ 
        userId, 
        sourceDataHash,
        expiresAt: { $gt: new Date() } // Only block if it hasn't expired yet
      });
      if (existing) {
        return; // Data hasn't meaningfully changed
      }

      // 4. Generate wording via AI Service
      const generated = await aiService.generateInsights(sanitizedData);

      // 5. Store new insights
      const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000); // Expires in 7 days
      
      const toInsert = generated.map(g => ({
        userId,
        ...g,
        sourceDataHash,
        expiresAt
      }));

      for (const item of toInsert) {
        try {
          await new Insight(item).save();
        } catch (err: any) {
          // Ignore duplicate key errors if multiple threads try to insert
          if (err.code !== 11000) {
            console.error('Failed to save insight', err);
          }
        }
      }

    } catch (e) {
      console.error('Error generating insights', e);
    }
  }
}

export const insightGeneratorService = new InsightGeneratorService();
