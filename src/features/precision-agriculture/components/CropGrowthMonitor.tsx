import { useState, useEffect, useCallback } from "react";
import { format, subMonths, isAfter, parseISO } from "date-fns";
// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// Icons
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  Clock, 
  Crop as CropIcon, 
  Droplet,
  Droplets, 
  Download,
  FileText, 
  Gauge, 
  Leaf, 
  Loader2, 
  MapPin, 
  RefreshCw, 
  Ruler, 
  Sun, 
  Thermometer, 
  Timer, 
  TrendingUp, 
  Wind 
} from "lucide-react";
// Charts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Services
import { getFieldSatelliteImage, getNDVITimeSeries } from "@/services/satelliteService";
import { Crop, FieldData } from "@/features/precision-agriculture/types";

interface WeatherData {
  temperature: number;
  rainfall: number;
  humidity: number;
  solarRadiation: number;
  forecast: {
    date: string;
    temperature: number;
    rainfall: number;
  }[];
}

const growthStages = [
  { id: 'germination', name: 'Germination', duration: 7, description: 'Seeds absorb water and begin to sprout' },
  { id: 'seedling', name: 'Seedling', duration: 21, description: 'First true leaves develop' },
  { id: 'vegetative', name: 'Vegetative', duration: 35, description: 'Rapid growth of leaves and stems' },
  { id: 'flowering', name: 'Flowering', duration: 14, description: 'Flowers develop and pollination occurs' },
  { id: 'fruiting', name: 'Fruiting', duration: 21, description: 'Fruits develop and mature' },
  { id: 'maturity', name: 'Maturity', duration: 7, description: 'Crop reaches full maturity and is ready for harvest' },
];

// Convert database crops to FieldData format
const mapCropToField = (crop: Crop): FieldData => {
  // Map status to growth stage
  const statusToStage: Record<string, string> = {
    'planted': 'germination',
    'growing': 'vegetative',
    'ready_for_harvest': 'fruiting',
    'harvested': 'maturity',
    'diseased': 'vegetative'
  };

  // Default coordinates (you might want to get these from your farm/crop data)
  // These are example coordinates for a location in Kenya
  const defaultLatitude = -1.2921; // Example: Nairobi, Kenya
  const defaultLongitude = 36.8219;

  return {
    id: crop.id,
    name: crop.crop_name,
    area: crop.farm_area || 0,
    cropType: crop.crop_name,
    variety: crop.variety,
    plantingDate: crop.planting_date || new Date().toISOString(),
    growthStage: statusToStage[crop.status] || 'vegetative',
    healthScore: 75, // Default health score
    ndvi: 0.6, // Default NDVI
    lastUpdated: crop.updated_at || new Date().toISOString(),
    // Add coordinates for satellite imagery
    latitude: crop.latitude || defaultLatitude,
    longitude: crop.longitude || defaultLongitude,
  };
};

const mockWeather: WeatherData = {
  temperature: 28.5,
  rainfall: 15.2,
  humidity: 65,
  solarRadiation: 850,
  forecast: [
    { date: '2023-10-01', temperature: 29, rainfall: 5 },
    { date: '2023-10-02', temperature: 30, rainfall: 0 },
    { date: '2023-10-03', temperature: 31, rainfall: 0 },
    { date: '2023-10-04', temperature: 28, rainfall: 12 },
    { date: '2023-10-05', temperature: 27, rainfall: 8 },
  ],
};

const getGrowthStageProgress = (growthStage: string) => {
  const stageIndex = growthStages.findIndex(stage => stage.id === growthStage);
  if (stageIndex === -1) return 0;
  
  const currentStage = growthStages[stageIndex];
  const daysInStage = 7; // This would be calculated based on planting date in a real app
  const progress = (daysInStage / currentStage.duration) * 100;
  
  return Math.min(100, Math.max(0, progress));
};

const getNDVIColor = (ndvi: number) => {
  if (ndvi < 0.2) return 'bg-red-500';
  if (ndvi < 0.4) return 'bg-yellow-500';
  if (ndvi < 0.7) return 'bg-green-500';
  return 'bg-green-700';
};

const getNDVIDescription = (ndvi: number) => {
  if (ndvi < 0.2) return 'Bare soil';
  if (ndvi < 0.4) return 'Low vegetation';
  if (ndvi < 0.7) return 'Healthy vegetation';
  return 'Dense healthy vegetation';
};

interface CropGrowthMonitorProps {
  crops: Crop[];
}

const CropGrowthMonitor = ({ crops }: CropGrowthMonitorProps) => {
  const defaultField: FieldData = {
    id: '',
    name: 'Select a crop',
    area: 0,
    cropType: 'N/A',
    variety: '',
    plantingDate: new Date().toISOString(),
    growthStage: 'vegetative',
    healthScore: 0,
    ndvi: 0,
    lastUpdated: new Date().toISOString(),
  };

  const [fields, setFields] = useState<FieldData[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [dateRange, setDateRange] = useState<[number]>([30]); // days
  const [activeTab, setActiveTab] = useState('overview');
  const [satelliteImage, setSatelliteImage] = useState<string>('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [ndviData, setNdviData] = useState<Array<{date: Date, ndvi: number}>>([]);
  const [isLoadingNdvi, setIsLoadingNdvi] = useState(false);
  
  // Get current field or use default
  const currentField = fields.find(field => field.id === selectedField) || defaultField;
  const currentStage = growthStages.find(stage => stage.id === currentField.growthStage) || growthStages[0];
  const growthProgress = getGrowthStageProgress(currentField.growthStage);

  // Debug: Log environment variables and field data
  useEffect(() => {
    console.log('Environment Variables:', {
      clientId: import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID ? 'Set' : 'Not Set',
      clientSecret: import.meta.env.VITE_SENTINEL_HUB_CLIENT_SECRET ? 'Set' : 'Not Set',
      nodeEnv: import.meta.env.MODE
    });
    console.log('Current field data:', {
      name: currentField.name,
      latitude: currentField.latitude,
      longitude: currentField.longitude,
      hasCoordinates: !!(currentField.latitude && currentField.longitude)
    });
  }, [currentField]);
  
  // Load satellite data for the selected field and date
  const loadSatelliteData = useCallback(async () => {
    if (!selectedField || !selectedDate) {
      console.log('No field selected or date not set');
      return;
    }

    console.log('Loading satellite data for field:', currentField.name, 'at location:', currentField.latitude, currentField.longitude);
    
    try {
      setIsLoadingImage(true);
      setIsLoadingNdvi(true);

      // Load satellite image
      try {
        console.log('Fetching satellite image...');
        const imageUrl = await getFieldSatelliteImage(currentField, selectedDate);
        console.log('Received satellite image URL:', imageUrl);
        if (imageUrl) {
          // Add timestamp to prevent caching issues
          const timestamp = new Date().getTime();
          const cacheBustingUrl = imageUrl.includes('?') 
            ? `${imageUrl}&t=${timestamp}` 
            : `${imageUrl}?t=${timestamp}`;
          
          console.log('Setting image URL with cache busting:', cacheBustingUrl);
          setSatelliteImage(cacheBustingUrl);
        } else {
          console.warn('No image URL returned from getFieldSatelliteImage');
          setSatelliteImage(`https://via.placeholder.com/1024x1024.png?text=No+Image+for+${encodeURIComponent(currentField.name)}`);
        }
      } catch (imageError) {
        console.error('Error loading satellite image:', imageError);
        setSatelliteImage(`https://via.placeholder.com/1024x1024.png?text=Image+Error+for+${encodeURIComponent(currentField.name)}`);
      }

      // Load NDVI time series data (last 30 days)
      try {
        const endDate = new Date(selectedDate);
        const startDate = subMonths(endDate, 1);
        console.log('Fetching NDVI data from', startDate, 'to', endDate);
        const ndviData = await getNDVITimeSeries(currentField, startDate, endDate);
        console.log('Received NDVI data points:', ndviData.length);
        setNdviData(ndviData);
      } catch (ndviError) {
        console.error('Error loading NDVI data:', ndviError);
        // Fallback to mock data
        console.log('Falling back to mock NDVI data');
        setNdviData(generateMockNDVIData(subMonths(selectedDate, 1), selectedDate));
      }
    } catch (error) {
      console.error('Unexpected error in loadSatelliteData:', error);
    } finally {
      setIsLoadingImage(false);
      setIsLoadingNdvi(false);
    }
  }, [currentField, selectedDate]);

  // Load satellite data when field or date changes
  useEffect(() => {
    loadSatelliteData();
  }, [loadSatelliteData]);

  // Generate mock NDVI data for development
  const generateMockNDVIData = useCallback((startDate: Date, endDate: Date) => {
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Generate random NDVI value between 0.2 and 0.9
      const ndvi = 0.2 + Math.random() * 0.7;
      data.push({
        date: new Date(currentDate),
        ndvi: parseFloat(ndvi.toFixed(2))
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }, []);

  // Convert crops to fields when component mounts or crops change
  useEffect(() => {
    if (crops && crops.length > 0) {
      const mappedFields = crops.map(mapCropToField);
      setFields(mappedFields);
      if (mappedFields.length > 0 && !selectedField) {
        setSelectedField(mappedFields[0].id);
      }
    }
  }, [crops, selectedField]);
  
  // Ensure we have a valid growth progress value
  const currentGrowthProgress = currentField ? getGrowthStageProgress(currentField.growthStage) : 0;
  
  // Add missing Download icon to the imports
  const DownloadIcon = Download;
  
  if (fields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No crops available for monitoring. Add crops to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Crop Growth Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze crop health, growth stages, and field conditions
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={selectedField} 
            onValueChange={setSelectedField}
            disabled={fields.length === 0}
          >
            <SelectTrigger className="w-[180px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder={fields.length > 0 ? "Select crop" : "No crops available"} />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name} {field.variety ? `(${field.variety})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange[0].toString()} onValueChange={(value) => setDateRange([parseInt(value)])}>
            <SelectTrigger className="w-[120px]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="satellite">Satellite View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Field Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Field Information</CardTitle>
                <CardDescription>Details about the selected field</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Crop Name</h3>
                    <p className="text-lg font-medium">{currentField?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Crop Type</h3>
                    <p className="text-lg font-medium">{currentField?.cropType || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Area</h3>
                    <p className="text-lg font-medium">{currentField?.area || 0} {currentField?.area === 1 ? 'hectare' : 'hectares'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Planting Date</h3>
                    <p className="text-lg font-medium">
                      {currentField?.plantingDate ? new Date(currentField.plantingDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Stage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Growth Stage</CardTitle>
                <CardDescription>Current crop development phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${getNDVIColor(currentField.ndvi)}`}>
                      <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{currentStage.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentStage.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(growthProgress)}%</span>
                    </div>
                    <Progress value={growthProgress} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Next Stage: {
                      growthStages[Math.min(growthStages.findIndex(stage => stage.id === currentField.growthStage) + 1, growthStages.length - 1)]?.name || 'Harvest'
                    }</h4>
                    <div className="text-xs text-muted-foreground">
                      Estimated in ~{currentStage.duration - Math.floor((growthProgress / 100) * currentStage.duration)} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health & Conditions Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Health & Conditions</CardTitle>
                <CardDescription>Field conditions and crop health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Crop Health</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className={`h-3 w-3 rounded-full ${
                          currentField.healthScore > 70 ? 'bg-green-500' : 
                          currentField.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                      />
                      <span className="font-medium">
                        {currentField.healthScore > 70 ? 'Good' : 
                         currentField.healthScore > 40 ? 'Moderate' : 'Poor'}
                      </span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {currentField.healthScore}/100
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Vegetation Index (NDVI)</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`h-3 w-3 rounded-full ${getNDVIColor(currentField.ndvi)}`} />
                      <span className="font-medium">{getNDVIDescription(currentField.ndvi)}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {currentField.ndvi.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center text-sm">
                      <Thermometer className="h-4 w-4 mr-2 text-amber-600" />
                      <span>Temperature: {mockWeather.temperature}°C</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Droplet className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Rainfall: {mockWeather.rainfall}mm (24h)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                      <span>Humidity: {mockWeather.humidity}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Growth Timeline</CardTitle>
              <CardDescription>Progress through growth stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 h-full w-0.5 bg-muted" />
                <div className="space-y-8">
                  {growthStages.map((stage, index) => {
                    const isCurrent = stage.id === currentField.growthStage;
                    const isCompleted = growthStages.findIndex(s => s.id === currentField.growthStage) > index;
                    
                    return (
                      <div key={stage.id} className="relative flex gap-4">
                        <div className={`absolute left-0 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center ${
                          isCurrent ? 'bg-primary text-primary-foreground' : 
                          isCompleted ? 'bg-green-500 text-white' : 'bg-muted'
                        }`}>
                          {isCurrent ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : isCompleted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className={`ml-8 p-4 rounded-lg border ${
                          isCurrent ? 'border-primary' : 'border-transparent'
                        }`}>
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{stage.name}</h3>
                            <span className="text-sm text-muted-foreground">
                              {stage.duration} days
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                          {isCurrent && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{Math.round(growthProgress)}%</span>
                              </div>
                              <Progress value={growthProgress} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="satellite" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Satellite Imagery</CardTitle>
                <CardDescription>
                  {format(selectedDate, 'MMMM d, yyyy')} • {currentField.name}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => isAfter(date, new Date())}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => loadSatelliteData()}
                  disabled={isLoadingImage}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingImage ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                {isLoadingImage ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading satellite image...</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={satelliteImage}
                    alt={`Satellite view of ${currentField.name}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">NDVI</h3>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getNDVIColor(currentField.ndvi)}`} />
                        <span>{currentField.ndvi.toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">Health</h3>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          currentField.healthScore > 70 ? 'bg-green-500' : 
                          currentField.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span>{currentField.healthScore}/100</span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NDVI Trend</CardTitle>
              <CardDescription>Vegetation health over the last 3 months</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingNdvi ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading NDVI data...</p>
                  </div>
                </div>
              ) : ndviData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ndviData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')} 
                    />
                    <YAxis domain={[0, 1]} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                      formatter={(value) => [Number(value).toFixed(2), 'NDVI']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ndvi" 
                      name="NDVI" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No NDVI data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Time Series
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Compare
            </Button>
          </div>
        </TabsContent>

        {/* Add other tabs content here if needed */}
        
      </Tabs>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Field Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">NDVI</h3>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-2xl font-bold">{currentField.ndvi.toFixed(2)}</span>
              <span className="text-sm text-green-500 mb-0.5">+0.05</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getNDVIDescription(currentField.ndvi)}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Health</h3>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-2xl font-bold">{currentField.healthScore}</span>
              <span className="text-sm text-green-500 mb-0.5">+5%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentField.healthScore > 70 ? 'Good' : 
               currentField.healthScore > 40 ? 'Moderate' : 'Needs attention'}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Growth Stage</h3>
            <div className="mt-1">
              <span className="text-2xl font-bold">{currentStage.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(growthProgress)}% complete
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium text-muted-foreground">Area</h3>
            <div className="mt-1">
              <span className="text-2xl font-bold">{currentField.area}</span>
              <span className="text-muted-foreground ml-1">ha</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentField.cropType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropGrowthMonitor;
