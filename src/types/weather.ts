export interface WeatherCurrent {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  description: string;
  icon: string;
  feelsLike: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherForecast {
  date: string;
  temp: number;
  humidity: number;
  condition: string;
  rainfall: number;
  windSpeed: number;
  icon: string;
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: WeatherForecast[];
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  event: string;
  description: string;
  start: string;
  end: string;
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
}

export interface CropRecommendation {
  crop: string;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
  details: string;
}

export interface PredictiveAnalysisData {
  nextWeek: {
    avgTemp: number;
    totalRainfall: number;
    conditions: string[];
  };
  recommendations: string[];
  riskFactors: {
    name: string;
    level: 'low' | 'medium' | 'high';
  }[];
}

export interface CropInsightsData {
  crop: string;
  currentConditions: {
    status: 'optimal' | 'moderate' | 'poor';
    temperature: string;
    moisture: string;
    growthStage: string;
  };
  recommendations: string[];
  forecastImpact: {
    period: string;
    impact: 'positive' | 'neutral' | 'negative';
    details: string;
  }[];
}
