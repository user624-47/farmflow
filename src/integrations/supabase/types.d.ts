import { Database as GeneratedDatabase } from '../../types/database.types';
import { AIInsight } from '../../types/ai-insights';

declare global {
  namespace SupabaseDB {
    interface Database extends GeneratedDatabase {
      public: {
        Tables: GeneratedDatabase['public']['Tables'] & {
          ai_insights: {
            Row: AIInsight;
            Insert: Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>;
            Update: Partial<Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>>;
            Relationships: [];
          };
        };
      };
    }
  }
}
