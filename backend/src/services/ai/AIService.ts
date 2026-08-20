import { IAIProvider, InsightOutput } from './IAIProvider';
import { MockAIProvider } from './MockAIProvider';

export class AIService {
  private provider: IAIProvider;
  private mockFallback: MockAIProvider;

  constructor() {
    this.mockFallback = new MockAIProvider();
    
    // Abstracted for Phase 7 constraints.
    // In production, we could swap this to OpenAIProvider based on process.env.AI_PROVIDER
    this.provider = new MockAIProvider(); 
  }

  public async generateInsights(payload: any): Promise<InsightOutput[]> {
    try {
      // Execute the primary provider
      const insights = await this.provider.generateInsights(payload);
      this.validateInsights(insights);
      return insights;
    } catch (error) {
      console.error('Primary AI Provider failed, falling back to deterministic mock:', error);
      // Fallback guarantees we never crash if API is down
      return this.mockFallback.generateInsights(payload);
    }
  }

  private validateInsights(insights: InsightOutput[]) {
    // Validate that the AI returned structured expected data and nothing malicious
    if (!Array.isArray(insights)) throw new Error('AI Provider must return an array');
    
    const validCategories = ['productivity', 'streak', 'language', 'project', 'git', 'goals', 'habit', 'recommendation'];
    
    insights.forEach(insight => {
      if (!validCategories.includes(insight.category)) {
        throw new Error(`Invalid category generated: ${insight.category}`);
      }
      if (typeof insight.confidence !== 'number' || insight.confidence < 0 || insight.confidence > 100) {
        throw new Error(`Invalid confidence score: ${insight.confidence}`);
      }
      if (typeof insight.title !== 'string' || insight.title.length > 100) {
        throw new Error(`Invalid or too long title`);
      }
      if (typeof insight.message !== 'string' || insight.message.length > 1000) {
        throw new Error(`Invalid or too long message`);
      }
    });
  }
}

export const aiService = new AIService();
