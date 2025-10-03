import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  Sun, 
  Cloud,
  CloudSnow,
  Zap,
  Sunrise,
  Sunset,
  RefreshCw,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { WeatherData } from "@/types/weather";

interface WeatherDashboardProps {
  weatherData: WeatherData | undefined;
  location: string;
  loading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const WeatherIcon = ({ condition }: { condition: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    'sunny': <Sun className="h-6 w-6 text-yellow-400" />,
    'partly-cloudy': <Cloud className="h-6 w-6 text-gray-400" />,
    'cloudy': <Cloud className="h-6 w-6 text-gray-500" />,
    'rain': <CloudRain className="h-6 w-6 text-blue-400" />,
    'showers': <CloudRain className="h-6 w-6 text-blue-500" />,
    'thunderstorm': <Zap className="h-6 w-6 text-yellow-500" />,
    'snow': <CloudSnow className="h-6 w-6 text-blue-200" />,
    'default': <Sun className="h-6 w-6 text-yellow-400" />
  };

  return iconMap[condition.toLowerCase()] || iconMap['default'];
};

export const WeatherDashboard = ({ 
  weatherData, 
  location, 
  loading, 
  isRefreshing = false, 
  onRefresh 
}: WeatherDashboardProps) => {
  if (loading && !weatherData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Weather Data Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            We couldn't fetch weather data for the specified location. Please check your internet connection or try a different location.
          </p>
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { current, forecast } = weatherData;
  
  // Format forecast data for charts
  const chartData = forecast?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    temp: Math.round(day.temp),
    humidity: day.humidity || 0,
    rain: day.rainfall || 0,
    wind_speed: day.windSpeed || 0,
    condition: day.condition,
    icon: day.icon
  })) || [];
  
  // Calculate min/max temps for Y-axis
  const tempValues = forecast?.map(d => d.temp) || [];
  const minTemp = Math.min(...tempValues, current.temperature) - 2;
  const maxTemp = Math.max(...tempValues, current.temperature) + 2;

  return (
    <div className="space-y-6">
      {/* Header with location and refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {location} Weather
          </h2>
          <p className="text-sm text-muted-foreground">
            {current.description} • Updated {new Date().toLocaleTimeString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Current weather overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-4 top-4">
            <WeatherIcon condition={current.icon} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{current.temperature}°C</div>
            <p className="text-sm text-muted-foreground mt-1">
              Feels like {current.feelsLike}°C
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">{current.humidity}%</div>
              <Droplets className="h-6 w-6 text-blue-400" />
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0%</span>
                <span>100%</span>
              </div>
              <Progress value={current.humidity} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wind
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{current.windSpeed} <span className="text-lg">km/h</span></div>
                <p className="text-sm text-muted-foreground mt-1">
                  {current.windSpeed < 5 ? 'Light breeze' : 
                   current.windSpeed < 12 ? 'Moderate wind' : 'Strong wind'}
                </p>
              </div>
              <Wind className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sun & Pressure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sunrise className="h-4 w-4 text-amber-400" />
                <span className="text-sm">Sunrise: {current.sunrise}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sunset className="h-4 w-4 text-orange-400" />
                <span className="text-sm">Sunset: {current.sunset}</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pressure</p>
                  <p className="text-lg font-medium">{current.pressure} hPa</p>
                </div>
                <Gauge className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>5-Day Forecast</CardTitle>
            <CardDescription>Temperature and precipitation forecast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#8884d8" 
                    domain={[Math.floor(minTemp), Math.ceil(maxTemp)]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#82ca9d" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="temp" 
                    name="Temperature (°C)"
                    stroke="#8884d8" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#8884d8', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="rainfall" 
                    name="Rainfall (mm)"
                    stroke="#82ca9d" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#82ca9d', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Precipitation</CardTitle>
            <CardDescription>Expected rainfall in mm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    formatter={(value: number) => [`${value} mm`, 'Rainfall']}
                  />
                  <Bar 
                    dataKey="rainfall" 
                    name="Rainfall"
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Daily forecast */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Forecast</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {chartData.map((day) => (
            <Card key={day.date} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {day.date}
                </CardTitle>
                <CardDescription className="text-xs">{day.condition || 'Clear'}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{day.temp}°C</div>
                  <div className="text-sm text-muted-foreground">
                    {day.rain > 0 ? (
                      <span className="flex items-center gap-1">
                        <CloudRain className="h-3.5 w-3.5 text-blue-400" />
                        {day.rain}mm
                      </span>
                    ) : 'No rain'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Wind: {day.wind_speed} km/h
                  </div>
                </div>
                {day.icon && (
                  <div className="text-4xl">
                    <WeatherIcon condition={day.icon} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Weather alerts */}
      {weatherData.alerts && weatherData.alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700 dark:text-red-400">
                Weather Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {weatherData.alerts.map((alert, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-4 py-1">
                <h4 className="font-medium text-red-700 dark:text-red-300">
                  {alert.event}
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {alert.description}
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {new Date(alert.start).toLocaleString()} - {new Date(alert.end).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};