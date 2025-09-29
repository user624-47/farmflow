import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import { 
  Wheat, Droplets, Thermometer, Zap, 
  TrendingUp, AlertTriangle, RefreshCw, Clock, Calendar, 
  BarChart3, Activity, Droplet, Sun, Wind, CloudRain, ThermometerSun,
  ArrowUpDown, ArrowUp, ArrowDown, Gauge, CalendarDays, MapPin,
  Info, CheckCircle, AlertCircle, Clock3, CalendarCheck, Leaf, Sprout
} from "lucide-react";
import cropService from "@/services/cropService";
import type { 
  CropInsightData, 
  CropGrowthStage, 
  RiskFactor,
  WeatherForecast, 
  HistoricalYieldData 
} from "@/services/types/crop";
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

interface CropInsightsProps {
  weatherData: any;
  cropType: string;
  location: string;
}

const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical' = 'low') => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-red-600 text-white border-red-700';
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': 
    default: 
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date without time
const formatDateShort = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

// Calculate days between two dates
const getDaysBetween = (startDate: string, endDate: string) => {
  return differenceInDays(new Date(endDate), new Date(startDate));
};

// Get the next growth stage
const getNextStage = (currentStage: number, stages: CropGrowthStage[]) => {
  return stages.find(stage => stage.stage_order === currentStage + 1);
};

// Format temperature with degree symbol
const formatTemp = (temp: number) => {
  return `${Math.round(temp)}°C`;
};

// Format percentage
const formatPercent = (value: number) => {
  return `${Math.round(value)}%`;
};

export const CropInsights = ({ weatherData, cropType, location }: CropInsightsProps) => {
  const { 
    data: insights, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<CropInsightData>({
    queryKey: ['cropInsights', cropType],
    queryFn: () => cropService.fetchCropInsights(cropType, location),
    enabled: !!cropType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currentStage = insights?.growth_stages?.find(
    stage => stage.stage_name.toLowerCase() === insights.current_stage.toLowerCase()
  );

  const optimalConditions = (() => {
    if (!currentStage) return [];
    
    return [
      { 
        name: 'Temperature', 
        value: insights?.current_conditions?.temperature || 0, 
        min: currentStage.optimal_temp_min || 15, 
        max: currentStage.optimal_temp_max || 30,
        unit: '°C',
        icon: <Thermometer className="h-4 w-4" />
      },
      { 
        name: 'Humidity', 
        value: insights?.current_conditions?.humidity || 0, 
        min: 40, 
        max: 85,
        unit: '%',
        icon: <Droplets className="h-4 w-4" />
      },
      { 
        name: 'Soil Moisture', 
        value: insights?.current_conditions?.soil_moisture || 0, 
        min: 30, 
        max: 80,
        unit: '%',
        icon: <Droplets className="h-4 w-4" />
      },
      { 
        name: 'Light', 
        value: insights?.current_conditions?.light_intensity || 0, 
        min: 500, 
        max: 1200,
        unit: ' lux',
        icon: <Zap className="h-4 w-4" />
      },
    ];
  })();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading crop insights</AlertTitle>
        <AlertDescription>
          {error?.message || 'Failed to load crop insights. Please try again.'}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Wheat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Crop Selected</h3>
            <p className="text-muted-foreground">Please select a crop to view insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStageStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': 
      default: 
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getOptimalityColor = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return 'text-green-600';
    if (value < min * 0.8 || value > max * 1.2) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {cropType} Insights
          </h2>
          <p className="text-muted-foreground">
            Current stage: <span className="font-medium capitalize">{insights.current_stage}</span>
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Growth Stage */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-green-600" />
            Growth Stage - {cropType}
          </CardTitle>
          <CardDescription>Current development stage and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
              <div>
                <h4 className="text-lg font-semibold text-green-700 capitalize">{insights.current_stage} Stage</h4>
                <p className="text-sm text-muted-foreground">{insights.days_until_next_stage} days until next stage</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 mb-1">{insights.stage_progress}%</div>
                <Progress value={insights.stage_progress} className="w-24 h-2" />
              </div>
            </div>

            <div className="grid gap-2">
              {insights.growth_stages?.map((stage: CropGrowthStage, index: number) => {
                const isCurrent = stage.stage_name === insights.current_stage;
                const status = isCurrent ? 'current' : 
                  index < insights.growth_stages.findIndex(s => s.stage_name === insights.current_stage) ? 'completed' : 'upcoming';
                
                return (
                  <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="font-medium capitalize">{stage.stage_name}</p>
                        <p className="text-xs text-muted-foreground">{stage.duration_days} days</p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(status === 'current' ? 'medium' : 'low')}>
                      {status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-blue-500" />
            Current Conditions
          </CardTitle>
          <CardDescription>Real-time environmental conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">{insights.health_score}/100</div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-200">
                  {insights.health_score > 70 ? 'Excellent' : 
                   insights.health_score > 40 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              
              {currentStage && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm">Current Stage: <span className="capitalize">{currentStage.stage_name}</span></h4>
                  <p className="text-sm text-muted-foreground">
                    {currentStage.description || 'No description available for this stage.'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {optimalConditions.map((condition, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {condition.icon}
                      <span className="font-medium text-sm">{condition.name}</span>
                    </div>
                    <span className="font-bold">
                      {condition.value}{condition.unit}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    <span>Optimal: {condition.min}-{condition.max}{condition.unit}</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full w-full flex-1 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, condition.value))}%`,
                        backgroundColor: condition.value >= condition.min && condition.value <= condition.max 
                          ? 'rgb(34 197 94)'  // green-500
                          : 'rgb(234 179 8)'  // yellow-500
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Issues & Recommendations
          </CardTitle>
          <CardDescription>Potential problems and suggested actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.issues.length > 0 ? (
              <div className="space-y-3">
                {insights.issues.map((issue, index) => (
                  <Alert key={index} className="text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{issue.type}</span>
                        <Badge 
                          variant="outline" 
                          className={`${getSeverityColor(issue.severity)} capitalize`}
                        >
                          {issue.severity} severity
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm">{issue.description}</p>
                      {issue.recommendations.length > 0 && (
                        <ul className="mt-2 ml-4 list-disc text-sm text-muted-foreground">
                          {issue.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No critical issues detected.</p>
                <p className="text-sm">Your crop appears to be healthy.</p>
              </div>
            )}

            {insights.ai_recommendations?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {insights.ai_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 mr-2" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Growth Stages Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Growth Stages Overview
          </CardTitle>
          <CardDescription>All growth stages for {cropType}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.growth_stages?.map((stage, index) => {
              const isCurrent = stage.stage_name === insights.current_stage;
              return (
                <div 
                  key={stage.id} 
                  className={`p-4 rounded-lg border ${isCurrent ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{stage.stage_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stage.duration_days} days
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <Badge>Current</Badge>
                    )}
                  </div>
                  {stage.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Temperature:</span>{' '}
                        <span className="font-medium">
                          {stage.optimal_temp_min}°C - {stage.optimal_temp_max}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Water:</span>{' '}
                        <span className="font-medium">
                          {stage.water_needs === 'high' ? 'High' : stage.water_needs === 'low' ? 'Low' : 'Moderate'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-right text-xs text-muted-foreground">
        Last updated: {formatDate(insights.last_updated)}
      </div>
    </div>
  );
};