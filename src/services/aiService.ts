import { v4 as uuidv4 } from 'uuid';

// Types for our AI service
type DetectionResult = {
  id: string;
  name: string;
  confidence: number;
  type: 'pest' | 'disease' | 'unknown';
  description: string;
  treatment: string;
  prevention: string[];
};

type AIDetectionResponse = {
  success: boolean;
  results: DetectionResult[];
  error?: string;
};

// System prompt for the AI
const SYSTEM_PROMPT = `You are an expert agricultural assistant specialized in identifying plant pests and diseases from images. 
When analyzing an image, please provide the following information in JSON format:
1. A list of detected pests or diseases
2. For each detection, include:
   - The common name of the pest/disease
   - A confidence level (0-100%)
   - The type (pest or disease)
   - A brief description
   - Recommended treatment
   - Prevention methods (as an array of strings)

If the image doesn't show any clear signs of pests or diseases, return an empty array.

Format your response as valid JSON with this structure:
{
  "results": [
    {
      "name": "Common name",
      "confidence": 0-100,
      "type": "pest|disease|unknown",
      "description": "Brief description",
      "treatment": "Recommended treatment",
      "prevention": ["Method 1", "Method 2"]
    }
  ]
}`;

// Function to call OpenAI's GPT-4 Vision API
export const analyzePlantImage = async (
  imageData: string,
  cropType?: string
): Promise<AIDetectionResponse> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key is not set');
    return {
      success: false,
      results: [],
      error: 'API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.'
    };
  }

  try {
    const userPrompt = cropType 
      ? `Analyze this image of a ${cropType} plant for any signs of pests or diseases.`
      : 'Analyze this plant image for any signs of pests or diseases.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high'  // Can be 'low', 'high', or 'auto'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,  // Lower temperature for more focused responses
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to analyze image with OpenAI');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response from OpenAI');
    }

    // Parse the JSON response from the AI
    let parsedResponse;
    try {
      // Sometimes the response might include markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
      parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Process the AI response into our standard format
    const results = processOpenAIResponse(parsedResponse);
    
    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Failed to analyze image'
    };
  }
};

// Process OpenAI's response into our standard format
const processOpenAIResponse = (data: any): DetectionResult[] => {
  try {
    // Handle different possible response formats
    const results = data.results || data.detections || [];
    
    return results.map((item: any) => ({
      id: uuidv4(),
      name: item.name || 'Unknown',
      confidence: item.confidence || 0,
      type: (item.type && ['pest', 'disease'].includes(item.type.toLowerCase())) 
        ? item.type.toLowerCase() as 'pest' | 'disease'
        : 'unknown',
      description: item.description || 'No description available.',
      treatment: item.treatment || 'No specific treatment information available.',
      prevention: Array.isArray(item.prevention) 
        ? item.prevention 
        : ['No specific prevention methods available.']
    }));
  } catch (error) {
    console.error('Error processing AI response:', error);
    return [];
  }
};

// Image preprocessing utilities
export const preprocessImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // Calculate new dimensions (max 1024px on the longest side)
        const maxSize = 1024;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Apply image processing
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with quality 0.8 (adjust as needed)
        const processedImage = canvas.toDataURL('image/jpeg', 0.8);
        resolve(processedImage);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};
