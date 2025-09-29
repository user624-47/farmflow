import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle, Info, BarChart3, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIService, AIInsight } from "@/services/aiInsightService";
import { supabase } from "@/integrations/supabase/client";

interface AIInsightsProps {
  organizationId: string;
  farmId?: string;
  livestockId?: string;
  moduleType?: "overview" | "farm" | "crops" | "livestock" | "inputs" | "farmers";
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'high':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'medium':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'low':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
};

export const AIInsights = ({ 
  organizationId, 
  farmId, 
  livestockId,
  moduleType = 'overview' 
}: AIInsightsProps) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, [organizationId, farmId, moduleType, livestockId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      if (livestockId) {
        // Fetch livestock-specific insights
        const livestockInsights = await AIService.generateLivestockInsights(livestockId);
        setInsights(livestockInsights);
      } else if (farmId) {
        // Fall back to farm-specific insights if no livestockId is provided
        const farmInsights = await AIService.generateFarmInsights(farmId);
        setInsights(farmInsights);
      } else {
        // If no specific ID is provided, show a message or handle accordingly
        setInsights([]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch AI insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    if (!livestockId && !farmId) return;
    
    try {
      setRefreshing(true);
      const newInsights = livestockId 
        ? await AIService.generateLivestockInsights(livestockId)
        : await AIService.generateFarmInsights(farmId!);
      setInsights(newInsights);
      toast({
        title: 'Success',
        description: 'Insights refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const renderInsights = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (insights.length === 0) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No insights available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {farmId 
              ? 'Generate insights for this farm by clicking the refresh button.' 
              : 'Select a farm to view insights.'}
          </p>
          {farmId && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={refreshInsights}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Generating...' : 'Generate Insights'}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">AI-Powered Insights</h3>
          {farmId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshInsights}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <Card key={insight.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(insight.severity)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                  <Badge 
                    variant={insight.severity === 'high' ? 'destructive' : 'outline'}
                    className="capitalize"
                  >
                    {insight.severity} priority
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  {insight.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <div className="flex items-center">
                      <Progress 
                        value={(insight.confidence || 0) * 100} 
                        className="h-2 w-24 mr-2" 
                      />
                      <span className="font-medium">
                        {Math.round((insight.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                      Recommended Actions
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(insight.recommended_actions) && insight.recommended_actions.map((action, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              {farmId 
                ? 'Intelligent analysis and recommendations for your farm.'
                : 'Select a farm to view AI-powered insights.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderInsights()}
      </CardContent>
    </Card>
  );
};
