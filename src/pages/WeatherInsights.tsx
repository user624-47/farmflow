import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeatherDashboard } from "@/components/weather/WeatherDashboard";
import { PredictiveAnalysis } from "@/components/weather/PredictiveAnalysis";
import { CropInsights } from "@/components/weather/CropInsights";
import { WeatherAlerts } from "@/components/weather/WeatherAlerts";
import { CloudRain, TrendingUp, Wheat, AlertTriangle, MapPin, Calendar, Loader2, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WeatherData, WeatherAlert, CropRecommendation, PredictiveAnalysisData, CropInsightsData } from "@/types/weather";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCrops } from "@/hooks/useCrops";
import { useFarmLocation } from "@/hooks/useFarmLocation";

// Import the weather service
import { fetchWeatherData } from "@/services/weatherService";

// API service for weather and crop insights
const weatherService = {
  fetchWeather: fetchWeatherData,
  
  fetchPredictiveAnalysis: async (location: string, cropType: string): Promise<PredictiveAnalysisData> => {
    // In a real implementation, this would use the weather data for predictions
    return {
      nextWeek: {
        avgTemp: 28.5,
        totalRainfall: 25.4,
        conditions: ["Sunny", "Partly Cloudy", "Scattered Showers"]
      },
      recommendations: [
        `Consider planting ${cropType} in the next week as conditions are favorable.`,
        "Monitor soil moisture levels and irrigate if rainfall is below average.",
        "Apply pre-emergent herbicide to prevent weed growth."
      ],
      riskFactors: [
        {
          name: "Temperature Fluctuations",
          level: 'medium' as const
        },
        {
          name: "Rainfall Variability",
          level: 'medium' as const
        },
        {
          name: "Pest Pressure",
          level: 'low' as const
        }
      ]
    };
  },
  
  fetchCropInsights: async (cropType: string, weatherData: WeatherData): Promise<CropInsightsData> => {
    // Determine crop status based on weather conditions
    const tempStatus = weatherData.current.temperature > 30 || weatherData.current.temperature < 15 
      ? 'poor' 
      : weatherData.current.temperature > 28 || weatherData.current.temperature < 18 
        ? 'moderate' 
        : 'optimal';
        
    const moistureStatus = weatherData.current.humidity > 85 
      ? 'poor' 
      : weatherData.current.humidity < 40 
        ? 'moderate' 
        : 'optimal';
    
    const overallStatus = tempStatus === 'optimal' && moistureStatus === 'optimal' 
      ? 'optimal' 
      : 'moderate';
    
    // Determine growth stage based on temperature and month
    const currentMonth = new Date().getMonth();
    const isGrowingSeason = currentMonth >= 3 && currentMonth <= 9; // April to October
    const growthStage = isGrowingSeason ? 'Vegetative Growth' : 'Dormant';
    
    return {
      crop: cropType,
      currentConditions: {
        status: overallStatus,
        temperature: `${weatherData.current.temperature}°C`,
        moisture: `${weatherData.current.humidity}% humidity`,
        growthStage: growthStage
      },
      recommendations: [
        "Apply balanced fertilizer to support healthy growth.",
        weatherData.current.humidity > 80 
          ? "Monitor for signs of fungal diseases due to high humidity." 
          : "Humidity levels are optimal for growth.",
        !isGrowingSeason 
          ? "Consider cold protection measures as temperatures drop." 
          : "Monitor for pests during the growing season."
      ],
      forecastImpact: [
        {
          period: "Next 7 days",
          impact: tempStatus === 'optimal' ? 'positive' : 'neutral',
          details: tempStatus === 'optimal' 
            ? "Temperatures are in the optimal range for growth." 
            : "Monitor temperature fluctuations that may affect growth."
        },
        {
          period: "Next 14 days",
          impact: 'neutral',
          details: "Expected weather patterns are typical for this season."
        }
      ]
    };
  }
};

const WeatherInsights = () => {
  const { organizationId } = useAuth();
  const [cropType, setCropType] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Get farm location
  const { farmLocation, isLoading: isLoadingLocation, error: locationError } = useFarmLocation();
  
  // Get the location name for display
  const locationDisplayName = farmLocation?.address || 
    (farmLocation ? `Lat: ${farmLocation.latitude?.toFixed(4)}, Lng: ${farmLocation.longitude?.toFixed(4)}` : 'Unknown Location');
  
  // Fetch crops data
  const { crops, loading: isLoadingCrops } = useCrops({
    organizationId,
    pageSize: 100,
  });

  const handleConfigureLocation = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  // Handle refresh function
  const handleRefresh = useCallback((refetch: () => Promise<unknown>) => {
    if (!farmLocation) {
      toast({
        title: "Cannot Refresh",
        description: "Farm location is not set. Please configure your farm location first.",
        variant: "destructive",
        action: (
          <Button variant="outline" onClick={handleConfigureLocation}>
            Configure Location
          </Button>
        ),
      });
      return Promise.resolve();
    }
    
    return refetch().catch((error: Error) => {
      toast({
        title: "Error Refreshing Weather Data",
        description: error.message,
        variant: "destructive"
      });
    });
  }, [toast, farmLocation, handleConfigureLocation]);

  // Show error toast if location is not set
  useEffect(() => {
    if (locationError) {
      toast({
        title: "Location Required",
        description: locationError,
        variant: "destructive",
        action: (
          <Button variant="outline" onClick={handleConfigureLocation}>
            Update Location
          </Button>
        ),
      });
    }
  }, [locationError, toast, handleConfigureLocation]);

  // Fetch weather data with React Query
  const {
    data: weatherData,
    isLoading: isLoadingWeather,
    isError: isWeatherError,
    error: weatherError,
    refetch: refetchWeather,
    isRefetching: isRefreshingWeather
  } = useQuery<WeatherData, Error>({
    queryKey: ['weather', farmLocation?.latitude, farmLocation?.longitude],
    queryFn: async () => {
      if (!farmLocation) {
        throw new Error('Farm location not available');
      }
      if (!farmLocation.latitude || !farmLocation.longitude) {
        throw new Error('Invalid location coordinates');
      }
      // Pass organizationId to fetch weather data
      return await fetchWeatherData(organizationId || '');
    },
    enabled: !!farmLocation && !locationError,
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Fetch predictive analysis
  const {
    data: predictiveData,
    isLoading: isLoadingPrediction,
    isError: isPredictionError
  } = useQuery<PredictiveAnalysisData>({
    queryKey: ['predictive', farmLocation?.latitude, farmLocation?.longitude, cropType],
    queryFn: () => {
      if (!farmLocation) {
        throw new Error('Farm location not available');
      }
      const locationName = farmLocation?.address || 
        `Lat: ${farmLocation.latitude?.toFixed(4)}, Lng: ${farmLocation.longitude?.toFixed(4)}`;
      return weatherService.fetchPredictiveAnalysis(locationName, cropType);
    },
    enabled: !!organizationId && !!cropType,
    retry: 2
  });
  // Fetch crop insights
  const {
    data: cropData,
    isLoading: isLoadingCropInsights,
    isError: isCropInsightsError
  } = useQuery<CropInsightsData | null>({
    queryKey: ['cropInsights', cropType, weatherData],
    queryFn: () => weatherData ? weatherService.fetchCropInsights(cropType, weatherData) : Promise.resolve(null),
    enabled: !!weatherData && !!cropType,
    retry: 2
  });

  // Handle errors
  useEffect(() => {
    if (isWeatherError) {
      const errorMessage = weatherError?.message || "Failed to load weather data";
      const showLocationButton = errorMessage.includes('location');
      
      toast({
        title: "Weather Data Error",
        description: errorMessage,
        variant: "destructive",
        ...(showLocationButton ? {
          action: (
            <Button variant="outline" onClick={handleConfigureLocation}>
              <Settings className="mr-2 h-4 w-4" />
              Configure Location
            </Button>
          )
        } : {})
      });
    }
  }, [isWeatherError, weatherError, toast, handleConfigureLocation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">
            Weather & Crop Insights
          </h1>
          <p className="text-lg text-muted-foreground">
            Advanced weather analytics and predictive farming intelligence
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border-blue-500/30">
          <CloudRain className="w-3 h-3 mr-1" />
          Live Data
        </Badge>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              <span className="whitespace-nowrap">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="whitespace-nowrap">Predictive Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="crop" className="flex items-center gap-2">
              <Wheat className="h-4 w-4" />
              <span className="whitespace-nowrap">Crop Insights</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="whitespace-nowrap">Alerts</span>
            </TabsTrigger>
          </TabsList>
          
          {weatherData && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <WeatherDashboard 
            weatherData={weatherData} 
            location={locationDisplayName} 
            loading={isLoadingWeather || isLoadingLocation} 
            onRefresh={() => handleRefresh(refetchWeather)}
            isRefreshing={isRefreshingWeather}
          />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalysis 
            weatherData={weatherData}
            cropType={cropType}
            location={locationDisplayName}
          />
        </TabsContent>

        <TabsContent value="crop" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Select Crop</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Select 
                  value={cropType} 
                  onValueChange={setCropType}
                  disabled={isLoadingCrops}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder={
                      isLoadingCrops ? "Loading crops..." : "Select a crop"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {crops?.map((crop) => (
                      <SelectItem key={crop.id} value={crop.crop_name}>
                        {crop.crop_name} ({crop.variety || 'No variety'})
                      </SelectItem>
                    ))}
                    {crops?.length === 0 && (
                      <div className="text-sm p-2 text-muted-foreground">
                        No crops found. Add crops to your farm to see insights.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {cropType ? (
            <CropInsights 
              weatherData={weatherData}
              cropType={cropType}
              location={locationDisplayName}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Wheat className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p>Select a crop to view growth stage analysis and insights</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <WeatherAlerts 
            weatherData={weatherData}
            cropType={cropType}
            location={locationDisplayName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WeatherInsights;