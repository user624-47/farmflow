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

    const { formType, formData, farmLocation } = await req.json();

    console.log("Generating form suggestions for:", formType, formData);

    let prompt = "";
    switch (formType) {
      case "crop":
        prompt = `Based on this crop form data, provide intelligent suggestions to complete missing fields:
        Current data: ${JSON.stringify(formData)}
        Location: ${farmLocation}
        
        Analyze and suggest values for any missing fields including:
        - Expected harvest date (if planting date is provided)
        - Recommended varieties for the crop and location
        - Optimal farm area for the crop type
        - Appropriate units for the crop
        - Expected yield estimates
        - Seasonal recommendations
        
        Consider local growing conditions, climate, and best practices.
        Return as JSON object with field names as keys and objects with 'value' and 'reason' properties.`;
        break;

      case "livestock":
        prompt = `Based on this livestock form data, provide intelligent suggestions:
        Current data: ${JSON.stringify(formData)}
        Location: ${farmLocation}
        
        Suggest values for missing fields:
        - Breeding recommendations based on livestock type
        - Vaccination schedules
        - Expected costs based on type and quantity
        - Age-appropriate management practices
        - Health monitoring recommendations
        
        Return as JSON object with field names as keys and objects with 'value' and 'reason' properties.`;
        break;

      case "input":
        prompt = `Based on this agricultural input form data, provide suggestions:
        Current data: ${JSON.stringify(formData)}
        Location: ${farmLocation}
        
        Suggest values for:
        - Cost estimates based on input type and location
        - Optimal quantities based on application rates
        - Seasonal timing recommendations
        - Quality specifications
        - Alternative suppliers or products
        
        Return as JSON object with field names as keys and objects with 'value' and 'reason' properties.`;
        break;

      case "farmer":
        prompt = `Based on this farmer profile data, provide suggestions:
        Current data: ${JSON.stringify(formData)}
        Location: ${farmLocation}
        
        Suggest improvements for:
        - Crop diversification based on farm size and location
        - Livestock options suitable for the farm
        - Farm management practices
        - Market opportunities
        
        Return as JSON object with field names as keys and objects with 'value' and 'reason' properties.`;
        break;

      default:
        throw new Error("Invalid form type");
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
            content: 'You are an agricultural form assistant that helps farmers complete forms with intelligent suggestions based on best practices, local conditions, and agricultural knowledge. Always provide practical, realistic suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      suggestions = {};
    }

    console.log("Generated suggestions:", suggestions);

    return new Response(JSON.stringify({ 
      suggestions,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-form-helper function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: {}
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});