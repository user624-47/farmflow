import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getCropLocations } from '@/services/cropLocationService';
import { fetchWeatherData } from '@/services/weatherService';
import { CropMap } from './CropMap';
import { CropDetailsPanel } from './CropDetailsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Droplets, Thermometer, Wind } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CropsMapView({ onAddCrop }: { onAddCrop: () => void }) {
  const { organizationId, organization } = useAuth();
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Fetch crops data
  const { 
    data: crops = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['cropLocations', organizationId],
    queryFn: () => getCropLocations(organizationId || ''),
    enabled: !!organizationId,
  });

  // Fetch weather data for the organization's location
  useEffect(() => {
    const fetchWeather = async () => {
      if (!organizationId || !organization) return;
      
      // Only fetch weather if we have a valid location
      if (!organization.latitude || !organization.longitude) {
        console.warn('No location set for organization');
        setWeatherError('Farm location not set');
        setWeatherLoading(false);
        return;
      }
      
      setWeatherLoading(true);
      setWeatherError(null);
      
      try {
        console.log('Fetching weather for location:', {
          lat: organization.latitude,
          lon: organization.longitude,
          name: organization.name
        });
        
        const data = await fetchWeatherData(organization.latitude, organization.longitude);
        setWeatherData({
          ...data,
          // Override with organization's location data
          locationName: organization.name,
          current: {
            ...data.current,
            // Ensure we're using the organization's coordinates
            coord: {
              lat: organization.latitude,
              lon: organization.longitude
            }
          }
        });
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setWeatherError('Failed to load weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [organizationId, organization]);

  const handleCropClick = useCallback((crop: any) => {
    setSelectedCropId(crop.id);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedCropId(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Crop Locations</h2>
          {organization?.name && (
            <p className="text-muted-foreground">{organization.name}</p>
          )}
        </div>
        <div className="w-full md:w-auto">
          <Button onClick={onAddCrop} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Crop
          </Button>
        </div>
      </div>

      {/* Weather Summary Card */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            {weatherLoading ? (
              <div className="flex items-center justify-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : weatherError ? (
              <div className="text-center text-muted-foreground">
                {weatherError}
                {organization?.name && (
                  <div className="mt-2 text-sm">
                    Update your farm location in Settings
                  </div>
                )}
              </div>
            ) : weatherData?.current ? (
              <div className="text-center space-y-1">
                <div className="text-4xl font-bold">
                  {Math.round(weatherData.current.temp)}°C
                </div>
                <div className="text-lg">
                  {weatherData.current.weather?.[0]?.main || 'N/A'}
                </div>
                <div className="flex items-center justify-center text-muted-foreground">
                  <Droplets className="mr-1 h-4 w-4" />
                  {weatherData.current.humidity}% Humidity
                </div>
                {weatherData.locationName && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {weatherData.locationName}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No weather data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[600px] lg:h-auto">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Farm Map</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading map...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  Error loading map data
                </div>
              ) : (
                <CropMap 
                  crops={crops} 
                  onCropClick={handleCropClick}
                  className="rounded-b-lg"
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="h-full">
          <CropDetailsPanel 
            cropId={selectedCropId} 
            onClose={handleCloseDetails} 
          />
        </div>
      </div>
    </div>
  );
}
