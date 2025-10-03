import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, Thermometer, Droplets, Wind, Sun, CloudRain, Cloud, CloudSun } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { fetchWeatherHistory } from '@/services/weatherService';

interface WeatherRecord {
  date: string;
  temp: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  wind_speed: number;
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  rain?: number;
}

interface WeatherRecordsProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function WeatherRecords({ latitude, longitude, locationName }: WeatherRecordsProps) {
  const [weatherData, setWeatherData] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const startDate = format(dateRange.from, 'yyyy-MM-dd');
        const endDate = format(dateRange.to, 'yyyy-MM-dd');
        
        const data = await fetchWeatherHistory(latitude, longitude, startDate, endDate);
        setWeatherData(data);
      } catch (err) {
        console.error('Error fetching weather history:', err);
        setError('Failed to load weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, latitude, longitude]);

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'rain':
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'clouds':
        return <Cloud className="h-5 w-5 text-gray-500" />;
      case 'thunderstorm':
        return <CloudRain className="h-5 w-5 text-purple-500" />;
      case 'snow':
        return <Cloud className="h-5 w-5 text-blue-200" />;
      default:
        return <CloudSun className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weather Records</CardTitle>
            <CardDescription>
              Historical weather data for {locationName}
            </CardDescription>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-[260px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                      {format(dateRange.to, 'MMM dd, yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM dd, yyyy')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                toDate={new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : weatherData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No weather data available for the selected period.</div>
        ) : (
          <div className="space-y-4">
            {weatherData.map((record) => (
              <div key={record.date} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">
                    {format(parseISO(record.date), 'EEEE, MMMM d, yyyy')}
                  </h4>
                  <div className="flex items-center">
                    {record.weather[0] && getWeatherIcon(record.weather[0].main)}
                    <span className="ml-2 capitalize">
                      {record.weather[0]?.description}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div className="flex items-center">
                    <Thermometer className="h-5 w-5 mr-2 text-amber-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className="font-medium">
                        {Math.round(record.temp.avg)}°C
                        <span className="text-sm text-muted-foreground ml-2">
                          {Math.round(record.temp.min)}° / {Math.round(record.temp.max)}°
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="font-medium">{record.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wind</p>
                      <p className="font-medium">{Math.round(record.wind_speed * 3.6)} km/h</p>
                    </div>
                  </div>
                  {record.rain !== undefined && (
                    <div className="flex items-center">
                      <CloudRain className="h-5 w-5 mr-2 text-blue-400" />
                      <div>
                        <p className="text-sm text-muted-foreground">Rain</p>
                        <p className="font-medium">{record.rain} mm</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
