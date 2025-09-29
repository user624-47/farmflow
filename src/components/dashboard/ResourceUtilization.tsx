import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Zap, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResourceData {
  input_type: string;
  total_quantity: number;
  total_cost: number;
  farms_using: number;
  efficiency_score: number;
  cost_per_unit: number;
}

interface ResourceSummary {
  total_inputs: number;
  total_value: number;
  avg_efficiency: number;
  low_efficiency_count: number;
}

export const ResourceUtilization = ({ organizationId }: { organizationId: string }) => {
  const [resourceData, setResourceData] = useState<ResourceData[]>([]);
  const [summary, setSummary] = useState<ResourceSummary>({
    total_inputs: 0,
    total_value: 0,
    avg_efficiency: 0,
    low_efficiency_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResourceData();
  }, [organizationId]);

  const fetchResourceData = async () => {
    try {
      const { data: inputs, error } = await supabase
        .from("inputs")
        .select("input_type, quantity, total_cost, cost_per_unit, farmer_id")
        .eq("organization_id", organizationId)
        .not("total_cost", "is", null);

      if (error) throw error;

      // Group by input type
      const inputMap = new Map<string, {
        total_quantity: number;
        total_cost: number;
        farmers: Set<string>;
        cost_per_unit_sum: number;
        entries: number;
      }>();

      inputs?.forEach(input => {
        const existing = inputMap.get(input.input_type) || {
          total_quantity: 0,
          total_cost: 0,
          farmers: new Set<string>(),
          cost_per_unit_sum: 0,
          entries: 0
        };

        existing.total_quantity += input.quantity || 0;
        existing.total_cost += input.total_cost || 0;
        if (input.farmer_id) existing.farmers.add(input.farmer_id);
        existing.cost_per_unit_sum += input.cost_per_unit || 0;
        existing.entries += 1;

        inputMap.set(input.input_type, existing);
      });

      // Calculate efficiency scores and process data
      const processedData: ResourceData[] = Array.from(inputMap.entries()).map(([input_type, data]) => {
        const avgCostPerUnit = data.entries > 0 ? data.cost_per_unit_sum / data.entries : 0;
        const costEfficiency = Math.max(0, 100 - (avgCostPerUnit / 1000) * 10); // Simple efficiency calculation
        const utilizationRate = Math.min(100, (data.farmers.size / 50) * 100); // Assuming 50 is max farmers
        const efficiency_score = (costEfficiency + utilizationRate) / 2;

        return {
          input_type,
          total_quantity: data.total_quantity,
          total_cost: data.total_cost,
          farms_using: data.farmers.size,
          efficiency_score,
          cost_per_unit: avgCostPerUnit
        };
      }).sort((a, b) => b.total_cost - a.total_cost);

      setResourceData(processedData);

      // Calculate summary
      const totalInputs = processedData.length;
      const totalValue = processedData.reduce((sum, item) => sum + item.total_cost, 0);
      const avgEfficiency = processedData.length > 0 
        ? processedData.reduce((sum, item) => sum + item.efficiency_score, 0) / processedData.length 
        : 0;
      const lowEfficiencyCount = processedData.filter(item => item.efficiency_score < 60).length;

      setSummary({
        total_inputs: totalInputs,
        total_value: totalValue,
        avg_efficiency: avgEfficiency,
        low_efficiency_count: lowEfficiencyCount
      });

    } catch (error) {
      console.error("Error fetching resource data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-500" />
            <CardTitle>Resource Utilization</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="stats-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-500" />
            <CardTitle>Resource Utilization</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={summary.avg_efficiency >= 70 ? "default" : "secondary"}>
              <Target className="h-3 w-3 mr-1" />
              {summary.avg_efficiency.toFixed(0)}% avg efficiency
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-accent/20">
              <div className="text-lg font-bold">{summary.total_inputs}</div>
              <div className="text-xs text-muted-foreground">Input Types</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <div className="text-lg font-bold text-blue-600">
                ₦{(summary.total_value / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <div className="text-lg font-bold text-green-600">
                {summary.avg_efficiency.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Efficiency</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <div className="text-lg font-bold text-orange-600">
                {summary.low_efficiency_count}
              </div>
              <div className="text-xs text-muted-foreground">Need Attention</div>
            </div>
          </div>

          {/* Resource breakdown */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Resource Efficiency Breakdown</h4>
            {resourceData.slice(0, 6).map((resource, index) => (
              <div key={resource.input_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium capitalize">
                      {resource.input_type}
                    </span>
                    <Badge variant={getEfficiencyBadge(resource.efficiency_score)} className="text-xs">
                      {resource.efficiency_score.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>₦{(resource.total_cost / 1000).toFixed(0)}K</span>
                    <span>•</span>
                    <span>{resource.farms_using} farms</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={resource.efficiency_score} 
                    className="flex-1 h-2"
                  />
                  <div className="flex items-center space-x-1">
                    {resource.efficiency_score >= 80 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : resource.efficiency_score >= 60 ? (
                      <Zap className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Cost per unit: ₦{resource.cost_per_unit.toFixed(2)} • 
                  Quantity: {resource.total_quantity.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {summary.low_efficiency_count > 0 && (
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Optimization Opportunities</span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {summary.low_efficiency_count} resource types have efficiency below 60%. 
                Consider reviewing suppliers, bulk purchasing, or alternative products.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};