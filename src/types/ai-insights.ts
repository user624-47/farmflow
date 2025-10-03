// Define the AIInsight interface
export interface AIInsight {
  id?: string;
  farm_id: string;
  organization_id: string;
  insight_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommended_actions: string[];
  confidence: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Type for inserting new AI insights
export type AIInsightInsert = Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>;

// Type for updating AI insights
export type AIInsightUpdate = Partial<AIInsightInsert>;
