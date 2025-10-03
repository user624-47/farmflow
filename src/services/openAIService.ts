import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export interface AIIAnalysisResult {
  insights: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    recommended_actions: string[];
    metadata?: Record<string, any>;
  }>;
}

export const analyzeFarmDataWithAI = async (data: any): Promise<AIIAnalysisResult> => {
  try {
    const prompt = `Analyze the following farm data and provide actionable insights. 
    Focus on crop health, livestock, soil health, potential issues, and recommendations. Be concise and specific.
    
    Farm Data: ${JSON.stringify(data, null, 2)}
    
    Provide the response in JSON format with this structure:
    {
      "insights": [
        {
          "title": "Insight title",
          "description": "Detailed description of the insight",
          "severity": "low|medium|high",
          "confidence": 0.0-1.0,
          "recommended_actions": ["action 1", "action 2"],
          "metadata": {}
        }
      ]
    }`;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are an agricultural expert AI assistant. Provide clear, actionable insights based on farm data."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI service');
    
    return JSON.parse(content) as AIIAnalysisResult;
  } catch (error) {
    console.error('Error analyzing data with AI:', error);
    throw new Error('Failed to analyze data with AI');
  }
};

export const generateCropRecommendation = async (cropData: any): Promise<string> => {
  try {
      const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are an agricultural expert. Provide specific, actionable recommendations for crop management."
      },
      {
        role: "user",
        content: `Based on this crop data, what are your recommendations? ${JSON.stringify(cropData)}`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No recommendations available.';
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return 'Unable to generate recommendations at this time.';
  }
};
