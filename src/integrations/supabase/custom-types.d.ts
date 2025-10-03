import { Database as GeneratedDatabase } from './database.types';
import { AIInsight } from '@/types/ai-insights';

declare module '@/integrations/supabase/types' {
  interface Database extends GeneratedDatabase {
    public: {
      Tables: GeneratedDatabase['public']['Tables'] & {
        ai_insights: {
          Row: AIInsight;
          Insert: Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>>;
        };
      };
    };
  }
}
