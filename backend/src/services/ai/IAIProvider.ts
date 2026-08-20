export interface InsightOutput {
  category: 'productivity' | 'streak' | 'language' | 'project' | 'git' | 'goals' | 'habit' | 'recommendation';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  importance: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface IAIProvider {
  generateInsights(sanitizedPayload: any): Promise<InsightOutput[]>;
}
