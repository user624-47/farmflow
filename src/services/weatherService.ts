import { WeatherData, WeatherAlert } from "@/types/weather";
import { supabase } from "@/integrations/supabase/client";

// Debug log to check if environment variables are loaded
console.log('Environment variables:', import.meta.env);

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
// Using standard weather API (2.5) which is more reliable
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

if (!OPENWEATHER_API_KEY) {
  console.error('OpenWeatherMap API key is not set. Please check your .env file.');
}

// Default fallback location (Lagos, Nigeria)
const DEFAULT_LOCATION = {
  lat: 6.5244,
  lon: 3.3792,
  name: 'Lagos, Nigeria'
};

// Function to safely get organization data
interface OrganizationData {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
}

// Function to get location from organization settings
async function getOrganizationLocation(organizationId: string) {
  try {
    const orgData = await getOrganizationData(organizationId);
    
    if (!orgData) {
      console.warn('Using default location: Organization not found');
      return DEFAULT_LOCATION;
    }

    // Check if we have valid coordinates
    const hasValidCoords = 
      orgData.latitude !== undefined && 
      orgData.latitude !== null && 
      orgData.longitude !== undefined && 
      orgData.longitude !== null &&
      !isNaN(Number(orgData.latitude)) && 
      !isNaN(Number(orgData.longitude));

    if (hasValidCoords) {
      return {
        lat: Number(orgData.latitude),
        lon: Number(orgData.longitude),
        name: orgData.location_name || orgData.name || DEFAULT_LOCATION.name
      };
    }

    console.warn('Using default location: No valid coordinates found');
    return {
      ...DEFAULT_LOCATION,
      name: orgData.name || DEFAULT_LOCATION.name
    };
  } catch (error) {
    console.error('Error in getOrganizationLocation:', error);
    return DEFAULT_LOCATION;
  }
}

async function getOrganizationData(organizationId: string): Promise<OrganizationData | null> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single<OrganizationData>();

    if (error || !data) {
      console.warn('Organization not found or error fetching data:', error?.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrganizationData:', error);
    return null;
  }
}

interface OpenWeatherCurrent {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  sunrise: number;
  sunset: number;
}

interface OpenWeatherForecast {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  humidity: number;
  wind_speed: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  pop: number;
  rain?: number;
  snow?: number;
}

interface StandardWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
    timezone: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export const fetchWeatherData = async (organizationId: string): Promise<WeatherData> => {
  try {
    console.log('Using API Key:', OPENWEATHER_API_KEY ? 'Key exists (first 5 chars: ' + OPENWEATHER_API_KEY.substring(0, 5) + '...)' : 'No key found');
    
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key is not configured. Please check your .env file and ensure it contains VITE_OPENWEATHER_API_KEY.');
    }

    // Get location from organization settings
    const location = await getOrganizationLocation(organizationId);
    if (!location) {
      throw new Error('Could not determine organization location');
    }
    
    const { lat, lon, name } = location;
    console.log('Using organization location:', { lat, lon, name });
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid latitude or longitude values');
    }
    
    // Get current weather data
    const currentWeatherUrl = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    console.log('Fetching current weather data from:', currentWeatherUrl);
    
    // Get 5-day forecast (3-hour intervals)
    const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    console.log('Fetching forecast data from:', forecastUrl);
    
    // Make both requests in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);
    
    // Check current weather response
    if (!currentResponse.ok) {
      const errorData = await currentResponse.json().catch(() => ({}));
      console.error('Current Weather API Error:', errorData);
      
      if (currentResponse.status === 401) {
        throw new Error('Invalid or missing OpenWeatherMap API key. Please check your .env file.');
      }
      
      throw new Error(`Failed to fetch current weather data: ${currentResponse.status} ${currentResponse.statusText}`);
    }
    
    // Check forecast response
    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json().catch(() => ({}));
      console.error('Forecast API Error:', errorData);
      
      if (forecastResponse.status !== 401) { // Don't show API key error for forecast if we already showed it for current
        console.warn('Failed to fetch forecast data, continuing with current weather only');
      }
    }
    
    const weatherData = await currentResponse.json() as StandardWeatherResponse;
    let forecastData = null;
    
    try {
      forecastData = forecastResponse.ok ? await forecastResponse.json() : null;
    } catch (error) {
      console.error('Error parsing forecast data:', error);
    }

    // Transform the data to match your WeatherData interface
    const currentWeather = weatherData.weather?.[0];
    const timezoneOffset = weatherData.timezone || 0;
    
    // Transform forecast data if available
    let forecast: any[] = [];
    
    if (forecastData?.list) {
      // Group forecast by day
      const dailyForecast = new Map<string, any>();
      
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateString = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
        
        if (!dailyForecast.has(dateString)) {
          dailyForecast.set(dateString, {
            date: date.toISOString(),
            temp: item.main.temp,
            humidity: item.main.humidity,
            condition: item.weather[0]?.description || 'Unknown',
            rainfall: item.rain?.['3h'] || 0,
            windSpeed: item.wind?.speed || 0,
            icon: item.weather[0]?.icon || '01d',
            count: 1
          });
        } else {
          // Average out the values for the day
          const dayData = dailyForecast.get(dateString)!;
          dayData.temp = (dayData.temp * dayData.count + item.main.temp) / (dayData.count + 1);
          dayData.humidity = (dayData.humidity * dayData.count + item.main.humidity) / (dayData.count + 1);
          dayData.windSpeed = (dayData.windSpeed * dayData.count + (item.wind?.speed || 0)) / (dayData.count + 1);
          dayData.rainfall += item.rain?.['3h'] || 0;
          dayData.count += 1;
        }
      });
      
      // Convert to array and format
      forecast = Array.from(dailyForecast.values())
        .map(day => ({
          date: day.date,
          temp: Math.round(day.temp),
          humidity: Math.round(day.humidity),
          condition: day.condition,
          rainfall: Math.round(day.rainfall * 10) / 10, // 1 decimal place
          windSpeed: Math.round(day.windSpeed * 10) / 10, // 1 decimal place
          icon: day.icon
        }))
        .slice(0, 7); // Limit to 7 days
    }
    
    // If no forecast data, include today's weather as a forecast
    if (forecast.length === 0) {
      forecast.push({
        date: new Date((weatherData.dt + timezoneOffset) * 1000).toISOString(),
        temp: Math.round(weatherData.main?.temp),
        humidity: weatherData.main?.humidity,
        condition: currentWeather?.description || 'Unknown',
        rainfall: 0,
        windSpeed: weatherData.wind?.speed,
        icon: currentWeather?.icon || '01d'
      });
    }
    
    const transformedData: WeatherData = {
      current: {
        location: name || 'Unknown Location',
        temperature: weatherData.main?.temp ?? 0,
        humidity: weatherData.main?.humidity ?? 0,
        windSpeed: weatherData.wind?.speed ?? 0,
        pressure: weatherData.main?.pressure ?? 0,
        description: currentWeather?.description || 'Unknown',
        icon: currentWeather?.icon || '01d',
        feelsLike: weatherData.main?.feels_like ?? 0,
        visibility: (weatherData.visibility || 0) / 1000, // Convert meters to km
        sunrise: weatherData.sys?.sunrise 
          ? new Date((weatherData.sys.sunrise + timezoneOffset) * 1000).toISOString()
          : new Date().toISOString(),
        sunset: weatherData.sys?.sunset 
          ? new Date((weatherData.sys.sunset + timezoneOffset) * 1000).toISOString()
          : new Date().toISOString()
      },
      forecast: forecast,
      alerts: []
    };
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data. Please try again later.');
  }
};

export const getWeatherIconUrl = (iconCode: string): string => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

// Helper function to map OpenWeatherMap severity to our severity levels
function mapSeverity(severity: string): 'advisory' | 'watch' | 'warning' | 'emergency' {
  const lowerSeverity = severity.toLowerCase();
  if (lowerSeverity.includes('warning')) return 'warning';
  if (lowerSeverity.includes('watch')) return 'watch';
  if (lowerSeverity.includes('emergency')) return 'emergency';
  return 'advisory';
}
