import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Droplets, Thermometer, Wind, CloudRain, Sun, Cloud } from 'lucide-react';
import { getCropWithWeather } from '@/services/cropLocationService';
import { getStatusColor } from '@/lib/utils';

interface CropDetailsPanelProps {
  cropId: string | null;
  onClose: () => void;
}

export function CropDetailsPanel({ cropId, onClose }: CropDetailsPanelProps) {
  const [crop, setCrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCropDetails = async () => {
      if (!cropId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getCropWithWeather(cropId);
        if (data) {
          setCrop(data);
        } else {
          setError('Failed to load crop details');
        }
      } catch (err) {
        console.error('Error fetching crop details:', err);
        setError('Error loading crop details');
      } finally {
        setLoading(false);
      }
    };

    fetchCropDetails();
  }, [cropId]);

  if (!cropId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a crop to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="p-4 text-center text-destructive">
        {error || 'Failed to load crop details'}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{crop.name}</h3>
        <Badge className={`${getStatusColor(crop.status)} capitalize`}>
          {crop.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {crop.weather && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {Math.round(crop.weather.temperature)}°C
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Droplets className="h-4 w-4" />
                  {crop.weather.humidity}% humidity
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-4 w-4" />
                  {crop.weather.conditions}
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {crop.weather.forecast.slice(0, 3).map((day: any) => (
                <div key={day.date} className="space-y-1">
                  <div className="font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-2xl">
                    {getWeatherIcon(day.conditions)}
                  </div>
                  <div className="font-medium">{Math.round(day.temp)}°C</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {crop.soilQuality && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Soil Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">pH Level</span>
              <span className="font-medium">{crop.soilQuality.ph.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Soil Type</span>
              <span className="font-medium">{crop.soilQuality.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Organic Matter</span>
              <span className="font-medium">{crop.soilQuality.organicMatter.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="text-sm text-primary hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function getWeatherIcon(conditions: string) {
  const lowerConditions = conditions.toLowerCase();
  
  if (lowerConditions.includes('rain')) {
    return <CloudRain className="h-6 w-6 mx-auto" />;
  }
  
  if (lowerConditions.includes('cloud')) {
    return <Cloud className="h-6 w-6 mx-auto" />;
  }
  
  return <Sun className="h-6 w-6 mx-auto" />;
}
