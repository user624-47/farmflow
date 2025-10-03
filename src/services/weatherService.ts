import { WeatherData, WeatherAlert, HistoricalWeatherData, WeatherForecast } from "@/types/weather";

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

if (!OPENWEATHER_API_KEY) {
  console.error('OpenWeatherMap API key is not set. Please check your .env file.');
}

// Default fallback location (Lagos, Nigeria)
const DEFAULT_LOCATION = {
  latitude: 6.5244,
  longitude: 3.3792,
  name: 'Lagos, Nigeria'
};

/**
 * Fetches current weather and forecast data for a location
 */
async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    // In a real implementation, this would be an API call to OpenWeatherMap
    // For now, we'll return mock data
    console.log(`Fetching weather data for ${latitude}, ${longitude}`);
    
    const current: WeatherData['current'] = {
      location: 'Farm Location',
      temperature: 27,
      humidity: 65,
      windSpeed: 3.2,
      pressure: 1013,
      description: 'Partly cloudy',
      icon: '03d',
      feelsLike: 29,
      visibility: 10,
      sunrise: '06:30',
      sunset: '18:45'
    };

    const forecast: WeatherForecast[] = [
      // Mock forecast data
    ];

    return { current, forecast };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data');
  }
}

/**
 * Gets the URL for a weather icon
 */
function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Fetches historical weather data for a specific location and date range
 */
async function fetchWeatherHistory(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<HistoricalWeatherData[]> {
  try {
    console.log(`Fetching weather history for ${lat}, ${lon} from ${startDate} to ${endDate}`);
    
    // Mock data - in a real implementation, this would be an API call to OpenWeatherMap
    const mockData: HistoricalWeatherData[] = [
      {
        date: startDate,
        temp: {
          min: 20,
          max: 28,
          avg: 24,
        },
        humidity: 65,
        wind_speed: 3.2,
        weather: [{
          main: 'Clouds',
          description: 'scattered clouds',
          icon: '03d'
        }],
        rain: 0
      },
      // Add more mock data as needed
    ];

    return mockData;
    
    // Actual implementation would look like this:
    /*
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${startTimestamp}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather history');
    }

    const data = await response.json();
    return data.daily.map((day: any) => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      temp: {
        min: day.temp.min,
        max: day.temp.max,
        avg: day.temp.day,
      },
      humidity: day.humidity,
      wind_speed: day.wind_speed,
      weather: day.weather,
      rain: day.rain,
    }));
    */
  } catch (error) {
    console.error('Error fetching weather history:', error);
    throw new Error('Failed to fetch weather history');
  }
}

export { fetchWeatherData, getWeatherIconUrl, fetchWeatherHistory };
