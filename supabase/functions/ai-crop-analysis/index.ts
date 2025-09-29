import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { farmLocation, cropType, analysisType = 'yield_prediction' } = await req.json();
    
    console.log('Starting AI crop analysis:', { farmLocation, cropType, analysisType });

    // Get weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(farmLocation)}&appid=${openWeatherApiKey}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    // Get 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(farmLocation)}&appid=${openWeatherApiKey}&units=metric`
    );
    
    const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

    // Get crop data from database (last 12 months)
    const { data: cropHistory, error: cropError } = await supabase
      .from('crops')
      .select('*')
      .eq('crop_name', cropType)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (cropError) {
      console.error('Error fetching crop data:', cropError);
    }

    // Prepare data for AI analysis
    const analysisPrompt = buildAnalysisPrompt(analysisType, {
      weather: weatherData,
      forecast: forecastData,
      cropHistory: cropHistory || [],
      cropType,
      farmLocation
    });

    console.log('Sending prompt to OpenAI...');

    // Call OpenAI API for analysis
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural analyst and data scientist specializing in crop yield prediction, weather impact analysis, and farming optimization. Provide detailed, actionable insights based on weather data and historical crop performance.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorData}`);
    }

    const aiResponse = await openAIResponse.json();
    const analysis = aiResponse.choices[0].message.content;

    console.log('Analysis complete, returning results');

    return new Response(JSON.stringify({
      analysis,
      weather: {
        current: weatherData,
        forecast: forecastData?.list?.slice(0, 5) || []
      },
      cropData: {
        historical: cropHistory || [],
        analysisType
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-crop-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildAnalysisPrompt(analysisType: string, data: any): string {
  const { weather, forecast, cropHistory, cropType, farmLocation } = data;
  
  let prompt = `Analyze the following agricultural data for ${cropType} cultivation in ${farmLocation}:\n\n`;
  
  // Current weather
  prompt += `CURRENT WEATHER:\n`;
  prompt += `- Temperature: ${weather.main.temp}°C (feels like ${weather.main.feels_like}°C)\n`;
  prompt += `- Humidity: ${weather.main.humidity}%\n`;
  prompt += `- Weather: ${weather.weather[0].description}\n`;
  prompt += `- Wind Speed: ${weather.wind?.speed || 0} m/s\n`;
  prompt += `- Pressure: ${weather.main.pressure} hPa\n\n`;
  
  // Forecast
  if (forecast && forecast.list) {
    prompt += `5-DAY FORECAST:\n`;
    forecast.list.slice(0, 5).forEach((day: any, index: number) => {
      prompt += `Day ${index + 1}: ${day.main.temp}°C, ${day.weather[0].description}, Humidity: ${day.main.humidity}%\n`;
    });
    prompt += '\n';
  }
  
  // Historical data
  if (cropHistory.length > 0) {
    prompt += `HISTORICAL CROP DATA (Last 12 months):\n`;
    cropHistory.forEach((crop: any) => {
      prompt += `- Planted: ${crop.planting_date || 'N/A'}, Harvested: ${crop.actual_harvest_date || 'Expected: ' + crop.expected_harvest_date}\n`;
      prompt += `  Area: ${crop.farm_area || 'N/A'} hectares, Yield: ${crop.quantity_harvested || 'N/A'} ${crop.unit || 'kg'}\n`;
    });
    prompt += '\n';
  }
  
  // Analysis type specific instructions
  switch (analysisType) {
    case 'yield_prediction':
      prompt += `TASK: Provide a comprehensive yield prediction analysis including:\n`;
      prompt += `1. Expected yield range based on current conditions\n`;
      prompt += `2. Key factors affecting yield potential\n`;
      prompt += `3. Recommended actions to optimize yield\n`;
      prompt += `4. Risk assessment and mitigation strategies\n`;
      prompt += `5. Optimal planting/harvesting timing recommendations\n`;
      break;
      
    case 'weather_impact':
      prompt += `TASK: Analyze weather impact on crop performance including:\n`;
      prompt += `1. How current weather affects crop growth stages\n`;
      prompt += `2. Potential weather-related risks in the forecast\n`;
      prompt += `3. Irrigation and water management recommendations\n`;
      prompt += `4. Disease and pest risk assessment based on weather\n`;
      prompt += `5. Immediate actions needed based on weather conditions\n`;
      break;
      
    case 'disease_risk':
      prompt += `TASK: Assess disease and pest risk factors including:\n`;
      prompt += `1. Weather-based disease risk assessment\n`;
      prompt += `2. Common diseases for ${cropType} in current conditions\n`;
      prompt += `3. Preventive measures and treatment recommendations\n`;
      prompt += `4. Monitoring schedule and early warning signs\n`;
      prompt += `5. Integrated pest management strategies\n`;
      break;
      
    default:
      prompt += `TASK: Provide general agricultural analysis and recommendations.\n`;
  }
  
  prompt += `\nProvide specific, actionable recommendations formatted in clear sections. Include confidence levels where appropriate.`;
  
  return prompt;
}