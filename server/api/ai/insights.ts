import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const router = express.Router();

// Get environment variables with fallbacks
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// Log environment variable status (for debugging)
console.log('Supabase URL:', supabaseUrl ? '***' : 'Not set');
console.log('Supabase Key:', supabaseKey ? '***' : 'Not set');
console.log('OpenAI Key:', openaiApiKey ? '***' : 'Not set');

if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
  const missingVars: string[] = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL or VITE_SUPABASE_URL');
  if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  if (!openaiApiKey) missingVars.push('OPENAI_API_KEY or VITE_OPENAI_API_KEY');
  
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Middleware
router.use(express.json());

// Generate insights endpoint
router.post('/', async (req, res) => {
  try {
    const { farmId } = req.body;

    // 1. Fetch farm data
    const { data: farm, error: farmError } = await supabase
      .from('livestock')
      .select('*')
      .eq('id', farmId)
      .single();
    
    if (farmError || !farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    // 2. Fetch crops data
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('*')
      .eq('farm_id', farmId);

    if (cropsError) {
      throw cropsError;
    }

    // 3. Generate AI insights
    const analysisData = {
      farm,
      crops: crops || [],
      weather: []
    };

    const aiResult = await analyzeFarmDataWithAI(analysisData, openai);

    // 4. Format and save insights
    const insightsToSave = (aiResult.insights || []).map((insight: any) => ({
      farm_id: farmId,
      organization_id: farm.organization_id || '',
      insight_type: 'ai_insight',
      title: insight.title || 'New Insight',
      description: insight.description || '',
      severity: ['low', 'medium', 'high'].includes(insight.severity) 
        ? insight.severity 
        : 'medium',
      recommended_actions: Array.isArray(insight.recommended_actions) 
        ? insight.recommended_actions 
        : [],
      confidence: typeof insight.confidence === 'number' 
        ? Math.min(Math.max(insight.confidence, 0), 1) 
        : 0.7,
      metadata: insight.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 5. Save insights to database
    const { data: savedInsights, error: saveError } = await supabase
      .from('ai_insights')
      .insert(insightsToSave)
      .select('*');

    if (saveError) {
      throw saveError;
    }

    return res.status(200).json({ insights: savedInsights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return res.status(500).json({ 
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function analyzeFarmDataWithAI(data: any, openaiClient: OpenAI) {
  const prompt = `Analyze this farm data and provide insights:
  Farm: ${JSON.stringify(data.farm, null, 2)}
  Crops: ${JSON.stringify(data.crops, null, 2)}`;

  const completion = await openaiClient.chat.completions.create({
    messages: [{
      role: 'system',
      content: 'You are an agricultural expert. Analyze the farm data and provide valuable insights.'
    }, {
      role: 'user',
      content: prompt
    }],
    model: 'gpt-3.5-turbo',
  });

  return {
    insights: [{
      title: 'AI Analysis',
      description: completion.choices[0]?.message?.content || 'No insights generated',
      severity: 'medium',
      recommended_actions: ['Review the analysis', 'Consider implementing suggested changes'],
      confidence: 0.8,
      metadata: {}
    }]
  };
}

export default router;
