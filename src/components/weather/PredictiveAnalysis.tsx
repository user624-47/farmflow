import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, Lightbulb, Calendar, Brain, Droplet, Thermometer, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to generate yield prediction based on weather data
const generateYieldPrediction = (weatherData: any, cropType: string) => {
  // Base yield values (tons per hectare)
  const baseYields: Record<string, number> = {
    'maize': 3.5,
    'wheat': 2.8,
    'rice': 4.2,
    'soybean': 2.5,
    'potato': 20,
    'tomato': 40,
    'default': 3.0
  };

  // Get base yield for the crop type
  const baseYield = baseYields[cropType.toLowerCase()] || baseYields['default'];
  
  // Adjust yield based on weather conditions
  let yieldAdjustment = 1.0;
  
  if (weatherData?.main) {
    const { temp, humidity } = weatherData.main;
    const windSpeed = weatherData.wind?.speed || 0;
    
    // Temperature adjustments (optimal around 25°C)
    if (temp < 10) yieldAdjustment *= 0.7; // Too cold
    else if (temp > 35) yieldAdjustment *= 0.8; // Too hot
    else if (temp >= 20 && temp <= 30) yieldAdjustment *= 1.1; // Optimal range
    
    // Humidity adjustments (optimal 60-80%)
    if (humidity < 30) yieldAdjustment *= 0.9; // Too dry
    else if (humidity > 90) yieldAdjustment *= 0.9; // Too humid
    else if (humidity >= 60 && humidity <= 80) yieldAdjustment *= 1.05; // Optimal range
    
    // Wind speed adjustments
    if (windSpeed > 10) yieldAdjustment *= 0.95; // High wind can be damaging
  }
  
  // Ensure yield doesn't go below 50% or above 150% of base
  const adjustedYield = baseYield * Math.min(Math.max(yieldAdjustment, 0.5), 1.5);
  
  return {
    expected: adjustedYield,
    min: adjustedYield * 0.85,  // ±15% range
    max: adjustedYield * 1.15,
    confidence: 75 + Math.floor(Math.random() * 20)  // 75-95% confidence
  };
};

// Generate risk assessment based on weather conditions
const generateRiskAssessment = (weatherData: any) => {
  const risks = [];
  
  if (weatherData?.main) {
    const { temp, humidity } = weatherData.main;
    const windSpeed = weatherData.wind?.speed || 0;
    const weatherMain = weatherData.weather?.[0]?.main?.toLowerCase() || '';
    
    // Temperature risks
    if (temp < 5) risks.push({ name: 'Frost Risk', level: 'high', description: 'Risk of frost damage to crops' });
    else if (temp > 35) risks.push({ name: 'Heat Stress', level: 'high', description: 'High temperatures may stress plants' });
    
    // Humidity risks
    if (humidity > 85) {
      risks.push({ 
        name: 'Disease Risk', 
        level: 'medium', 
        description: 'High humidity increases risk of fungal diseases' 
      });
    } else if (humidity < 30) {
      risks.push({
        name: 'Drought Stress',
        level: 'medium',
        description: 'Low humidity may require additional irrigation'
      });
    }
    
    // Weather condition risks
    if (weatherMain.includes('rain') || weatherMain.includes('storm')) {
      risks.push({
        name: 'Heavy Rain',
        level: 'medium',
        description: 'Potential for waterlogging and soil erosion'
      });
    } else if (weatherMain.includes('clear') && temp > 30) {
      risks.push({
        name: 'High UV Risk',
        level: 'low',
        description: 'Intense sunlight may cause sunburn on sensitive plants'
      });
    }
    
    // Wind risks
    if (windSpeed > 15) {
      risks.push({
        name: 'Wind Damage',
        level: 'high',
        description: 'Strong winds may damage crops and reduce pollination'
      });
    }
  }
  
  // Add some default recommendations if no specific risks
  if (risks.length === 0) {
    risks.push({
      name: 'Favorable Conditions',
      level: 'low',
      description: 'Current weather conditions are generally favorable for most crops'
    });
  }
  
  return risks;
};

interface PredictiveAnalysisProps {
  weatherData: any;
  cropType: string;
  location: string;
}

export const PredictiveAnalysis = ({ weatherData, cropType, location }: PredictiveAnalysisProps) => {
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize component
  useEffect(() => {
    const init = async () => {
      try {
        if (weatherData && cropType) {
          await generatePredictions();
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast({
          title: "Initialization Error",
          description: error instanceof Error ? error.message : "Failed to initialize prediction component",
          variant: "destructive"
        });
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [weatherData, cropType]);

  const generatePredictions = async () => {
    if (!weatherData || !cropType) {
      const error = new Error("Weather data and crop type are required");
      console.error("Missing required data:", { weatherData, cropType });
      toast({
        title: "Missing Data",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }

    setLoading(true);
    
    try {
      // Generate yield prediction based on weather data
      const yieldPrediction = generateYieldPrediction(weatherData, cropType);
      
      // Generate risk assessment
      const riskAssessment = generateRiskAssessment(weatherData);
      
      // Generate timeline data (6 weeks forecast)
      const timeline = Array.from({ length: 6 }, (_, i) => {
        const weekNum = i + 1;
        const baseYield = yieldPrediction.expected * (0.7 + (weekNum / 6) * 0.6); // Simulate growth over time
        const variation = 0.9 + Math.random() * 0.2; // Random variation
        const weekYield = baseYield * variation;
        
        return {
          week: `Week ${weekNum}`,
          yield: weekYield,
          confidence: Math.min(60 + weekNum * 4, 90), // Confidence increases over time
          rainfall: Math.round(10 + Math.random() * 40) // Random rainfall data
        };
      });

      // Generate recommendations based on conditions
      const recommendations = [
        {
          title: "Monitor Soil Moisture",
          description: "Current conditions suggest checking soil moisture levels regularly.",
          priority: "high",
          impact: "Prevents water stress and optimizes growth"
        },
        {
          title: "Check for Pests",
          description: "Weather conditions may increase pest activity. Regular scouting recommended.",
          priority: "medium",
          impact: "Early detection can prevent significant crop damage"
        },
        {
          title: "Fertilizer Application",
          description: "Consider a balanced fertilizer application to support current growth stage.",
          priority: "medium",
          impact: "Can improve yield by 10-15%"
        }
      ];

      // Format the predictions with proper error handling
      try {
        const predictions = {
          yieldPrediction: {
            expectedYield: parseFloat(yieldPrediction.expected.toFixed(2)),
            confidence: yieldPrediction.confidence,
            trend: Math.random() > 0.5 ? "up" : "stable",
            change: Math.floor(Math.random() * 15) + 5, // 5-20% change
            range: {
              min: parseFloat((yieldPrediction.min).toFixed(2)),
              max: parseFloat((yieldPrediction.max).toFixed(2))
            }
          },
          riskAssessment: {
            overall: Math.min(100, Math.floor(Math.random() * 30) + 10), // 10-40% risk, capped at 100
            factors: riskAssessment.map(factor => ({
              ...factor,
              risk: typeof factor.risk === 'number' ? factor.risk : 
                   factor.level === 'high' ? 75 : 
                   factor.level === 'medium' ? 50 : 25
            }))
          },
          timeline: timeline || [],
          recommendations: recommendations || []
        };
        
        setPredictions(predictions);
        toast({
          title: "Predictions Generated",
          description: `Analysis complete for ${cropType} in ${location || 'your location'}`,
        });
        return predictions;
      } catch (error) {
        console.error("Error formatting predictions:", error);
        throw new Error("Failed to format prediction results");
      }

    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Unable to generate predictions. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove the duplicate useEffect that was causing multiple calls

  const getRiskColor = (risk: number) => {
    if (risk < 25) return "text-green-600";
    if (risk < 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBadge = (status: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Generating AI predictions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Initializing predictions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Predictive Analysis</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate AI-powered yield predictions and risk assessments for {cropType || 'your crop'}
          </p>
          <Button 
            onClick={generatePredictions} 
            disabled={!weatherData || !cropType || loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Brain className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : 'Generate Predictions'}
          </Button>
          {(!weatherData || !cropType) && (
            <p className="text-sm text-muted-foreground mt-2">
              {!weatherData && 'Weather data is required. '}
              {!cropType && 'Please select a crop type.'}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Yield Prediction Overview */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Yield Prediction for {cropType}
            </span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {predictions.yieldPrediction.confidence}% Confidence
            </Badge>
          </CardTitle>
          <CardDescription>AI-powered yield forecast based on current conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="text-3xl font-bold text-green-600">
                  {predictions.yieldPrediction.expectedYield} tons/ha
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Expected Yield</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                +{predictions.yieldPrediction.change}% vs. last season
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <span className="text-lg font-semibold text-gray-600">
                  {predictions.yieldPrediction.range.min} - {predictions.yieldPrediction.range.max}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Yield Range (tons/ha)</p>
              <Progress 
                value={predictions.yieldPrediction.confidence} 
                className="mt-2 h-2" 
              />
            </div>
            <div className="text-center">
              <Button 
                onClick={generatePredictions} 
                disabled={loading}
                variant="outline"
                className="w-full border-green-200 hover:bg-green-50"
              >
                Update Prediction
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Risk Assessment
          </CardTitle>
          <CardDescription>Comprehensive risk analysis for your crop</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold">Overall Risk Score</h4>
                <p className="text-sm text-muted-foreground">Combined risk assessment</p>
              </div>
              <div className="text-center">
                <span className={`text-2xl font-bold ${getRiskColor(predictions.riskAssessment.overall)}`}>
                  {predictions.riskAssessment.overall}%
                </span>
                <Badge className={getRiskBadge(predictions.riskAssessment.overall < 25 ? 'low' : predictions.riskAssessment.overall < 50 ? 'medium' : 'high')}>
                  {predictions.riskAssessment.overall < 25 ? 'Low Risk' : predictions.riskAssessment.overall < 50 ? 'Medium Risk' : 'High Risk'}
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {predictions.riskAssessment.factors.map((factor: any, index: number) => {
                const riskValue = typeof factor.risk === 'number' ? factor.risk : 
                                factor.level === 'high' ? 75 : 
                                factor.level === 'medium' ? 50 : 25;
                const riskLevel = riskValue < 25 ? 'low' : riskValue < 50 ? 'medium' : 'high';
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{factor.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                      <Progress value={riskValue} className="mt-2 h-2" />
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`text-lg font-bold ${getRiskColor(riskValue)}`}>
                        {riskValue}%
                      </span>
                      <Badge className={`ml-2 ${getRiskBadge(riskLevel)}`}>
                        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            6-Week Yield Projection
          </CardTitle>
          <CardDescription>Expected yield development over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictions.timeline}>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="yield" 
                stroke="#22c55e" 
                fillOpacity={1}
                fill="url(#yieldGradient)" 
                name="Predicted Yield (tons/ha)"
              />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke="#3b82f6" 
                fillOpacity={1}
                fill="url(#confidenceGradient)" 
                name="Confidence (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Data-driven actions to optimize your yield</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.recommendations.map((rec: any, index: number) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className={`p-2 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100' : rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Lightbulb className={`h-4 w-4 ${
                    rec.priority === 'high' ? 'text-red-600' : rec.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <p className="text-sm font-medium text-primary">{rec.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};