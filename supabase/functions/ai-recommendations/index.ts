import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { type, data, farmLocation, organizationId } = await req.json();

    console.log("Generating AI recommendations for:", type, data);

    let prompt = "";
    switch (type) {
      case "farmer":
        prompt = `Generate agricultural recommendations for a farmer profile:
        Location: ${farmLocation}
        Farm size: ${data?.farm_size || 'Not specified'} hectares
        Crops: ${data?.crops_grown?.join(', ') || 'Not specified'}
        Livestock: ${data?.livestock_owned?.join(', ') || 'Not specified'}
        
        Provide specific, actionable recommendations for:
        1. Crop diversification opportunities
        2. Livestock management improvements
        3. Farm expansion possibilities
        4. Sustainable farming practices
        5. Market opportunities
        
        Format as JSON array with objects containing: title, description, priority (high/medium/low), actions (array), expectedImpact`;
        break;

      case "crop":
        prompt = `Generate crop management recommendations for:
        Crop: ${data?.crop_name || 'Not specified'}
        Variety: ${data?.variety || 'Not specified'}
        Farm area: ${data?.farm_area || 'Not specified'} hectares
        Planting date: ${data?.planting_date || 'Not specified'}
        Season: ${data?.season || 'Not specified'}
        Status: ${data?.status || 'Not specified'}
        Location: ${farmLocation}
        
        Provide recommendations for:
        1. Optimal planting and harvesting timing
        2. Pest and disease management
        3. Fertilizer and input optimization
        4. Irrigation management
        5. Yield improvement strategies
        
        Format as JSON array with objects containing: title, description, priority, actions, expectedImpact`;
        break;

      case "livestock":
        prompt = `Generate livestock management recommendations for:
        Type: ${data?.livestock_type || 'Not specified'}
        Breed: ${data?.breed || 'Not specified'}
        Quantity: ${data?.quantity || 'Not specified'}
        Age: ${data?.age_months || 'Not specified'} months
        Health status: ${data?.health_status || 'Not specified'}
        Breeding status: ${data?.breeding_status || 'Not specified'}
        Location: ${farmLocation}
        
        Provide recommendations for:
        1. Health and vaccination schedule
        2. Breeding optimization
        3. Feed management and nutrition
        4. Housing and environmental conditions
        5. Disease prevention strategies
        
        Format as JSON array with objects containing: title, description, priority, actions, expectedImpact`;
        break;

      case "input":
        prompt = `Generate agricultural input recommendations for:
        Input type: ${data?.input_type || 'Not specified'}
        Input name: ${data?.input_name || 'Not specified'}
        Quantity: ${data?.quantity || 'Not specified'} ${data?.unit || ''}
        Cost per unit: ${data?.cost_per_unit || 'Not specified'}
        Supplier: ${data?.supplier || 'Not specified'}
        Season: ${data?.season || 'Not specified'}
        Location: ${farmLocation}
        
        Provide recommendations for:
        1. Cost optimization strategies
        2. Quality improvement suggestions
        3. Alternative input options
        4. Timing and application methods
        5. Supplier diversification
        
        Format as JSON array with objects containing: title, description, priority, actions, expectedImpact`;
        break;

      default:
        throw new Error("Invalid recommendation type");
    }

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
            content: 'You are an expert agricultural advisor with deep knowledge of farming practices, crop management, livestock care, and agricultural inputs. Provide practical, actionable recommendations based on agricultural best practices and local conditions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      // Fallback to structured recommendations
      recommendations = [
        {
          title: "AI Analysis Available",
          description: content.substring(0, 200) + "...",
          priority: "medium",
          actions: ["Review full AI analysis", "Implement suggested practices"],
          expectedImpact: "Improved agricultural outcomes"
        }
      ];
    }

    console.log("Generated recommendations:", recommendations);

    return new Response(JSON.stringify({ 
      recommendations,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      recommendations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});