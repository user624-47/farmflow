import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendationsProps {
  type: "farmer" | "crop" | "livestock" | "input";
  data?: any;
  farmLocation?: string;
  organizationId?: string;
}

export const AIRecommendations = ({ type, data, farmLocation, organizationId }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const { data: aiResponse, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          type,
          data,
          farmLocation: farmLocation || "Nigeria",
          organizationId
        }
      });

      if (error) throw error;

      setRecommendations(aiResponse.recommendations || []);
      toast({
        title: "AI Recommendations Generated",
        description: "Smart recommendations based on your data",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium": return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "low": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRecommendationColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Get smart recommendations powered by AI analysis
            </CardDescription>
          </div>
          <Button 
            onClick={generateRecommendations} 
            disabled={loading}
            size="sm"
          >
            {loading ? "Generating..." : "Get AI Insights"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Click "Get AI Insights" to generate personalized recommendations
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    {getRecommendationIcon(rec.priority)}
                    {rec.title}
                  </h4>
                  <Badge variant={getRecommendationColor(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {rec.description}
                </p>
                {rec.actions && rec.actions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Recommended Actions:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {rec.actions.map((action: string, actionIndex: number) => (
                        <li key={actionIndex} className="flex items-center gap-1">
                          <span>•</span> {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.expectedImpact && (
                  <div className="mt-2 text-xs">
                    <Badge variant="outline">
                      Expected Impact: {rec.expectedImpact}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};