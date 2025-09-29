import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { organizationId, moduleType } = await req.json();

    console.log("Generating AI insights for organization:", organizationId, "module:", moduleType);

    // Fetch organizational data
    const [farmersResult, cropsResult, livestockResult, inputsResult] = await Promise.all([
      supabase.from('farmers').select('*').eq('organization_id', organizationId),
      supabase.from('crops').select('*').eq('organization_id', organizationId),
      supabase.from('livestock').select('*').eq('organization_id', organizationId),
      supabase.from('inputs').select('*').eq('organization_id', organizationId)
    ]);

    const farmers = farmersResult.data || [];
    const crops = cropsResult.data || [];
    const livestock = livestockResult.data || [];
    const inputs = inputsResult.data || [];

    console.log("Fetched data:", { farmers: farmers.length, crops: crops.length, livestock: livestock.length, inputs: inputs.length });

    // Create summary for AI analysis
    const dataSummary = {
      farmers: {
        total: farmers.length,
        averageFarmSize: farmers.reduce((acc, f) => acc + (f.farm_size || 0), 0) / farmers.length || 0,
        commonCrops: farmers.flatMap(f => f.crops_grown || []).reduce((acc: any, crop) => {
          acc[crop] = (acc[crop] || 0) + 1;
          return acc;
        }, {}),
        commonLivestock: farmers.flatMap(f => f.livestock_owned || []).reduce((acc: any, animal) => {
          acc[animal] = (acc[animal] || 0) + 1;
          return acc;
        }, {})
      },
      crops: {
        total: crops.length,
        statusDistribution: crops.reduce((acc: any, crop) => {
          acc[crop.status] = (acc[crop.status] || 0) + 1;
          return acc;
        }, {}),
        totalArea: crops.reduce((acc, crop) => acc + (crop.farm_area || 0), 0),
        averageYield: crops.filter(c => c.quantity_harvested && c.quantity_planted)
          .reduce((acc, c) => acc + (c.quantity_harvested / c.quantity_planted), 0) / crops.length || 0
      },
      livestock: {
        total: livestock.length,
        totalAnimals: livestock.reduce((acc, animal) => acc + animal.quantity, 0),
        healthDistribution: livestock.reduce((acc: any, animal) => {
          acc[animal.health_status] = (acc[animal.health_status] || 0) + 1;
          return acc;
        }, {}),
        typeDistribution: livestock.reduce((acc: any, animal) => {
          acc[animal.livestock_type] = (acc[animal.livestock_type] || 0) + 1;
          return acc;
        }, {})
      },
      inputs: {
        total: inputs.length,
        totalCost: inputs.reduce((acc, input) => acc + (input.total_cost || 0), 0),
        typeDistribution: inputs.reduce((acc: any, input) => {
          acc[input.input_type] = (acc[input.input_type] || 0) + 1;
          return acc;
        }, {})
      }
    };

    const prompt = `Analyze this agricultural organization's data and provide comprehensive insights:

    Data Summary: ${JSON.stringify(dataSummary, null, 2)}
    
    Generate insights for module: ${moduleType}
    
    Provide analysis including:
    1. Performance metrics and trends
    2. Key strengths and areas for improvement
    3. Productivity analysis
    4. Cost efficiency insights
    5. Risk assessment
    6. Growth opportunities
    7. Comparative benchmarks
    8. Actionable recommendations
    
    Return a structured JSON response with:
    {
      "performance": {
        "score": number (0-100),
        "trend": "up/down/stable",
        "change": number (percentage change)
      },
      "keyMetrics": [
        {
          "name": string,
          "value": number,
          "unit": string,
          "trend": "up/down/stable",
          "change": number
        }
      ],
      "strengths": [string],
      "improvements": [string],
      "recommendations": [
        {
          "title": string,
          "description": string,
          "priority": "high/medium/low",
          "impact": string
        }
      ],
      "benchmarks": {
        "industry_average": number,
        "top_performers": number,
        "position": string
      }
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural data analyst with deep knowledge of farm management, productivity metrics, and agricultural best practices. Provide data-driven insights and practical recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    let insights;
    try {
      insights = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      // Generate fallback insights
      insights = {
        performance: { score: 75, trend: "up", change: 5 },
        keyMetrics: [
          { name: "Data Completeness", value: Math.min(100, (farmers.length + crops.length + livestock.length + inputs.length) * 5), unit: "%", trend: "up", change: 10 }
        ],
        strengths: ["Active data collection", "Diverse agricultural activities"],
        improvements: ["Increase data consistency", "Enhance record keeping"],
        recommendations: [
          {
            title: "Improve Data Collection",
            description: "Enhance systematic data recording for better insights",
            priority: "medium",
            impact: "Better decision making"
          }
        ],
        benchmarks: {
          industry_average: 70,
          top_performers: 90,
          position: "Above Average"
        }
      };
    }

    console.log("Generated insights:", insights);

    return new Response(JSON.stringify({ 
      insights,
      dataSummary,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});