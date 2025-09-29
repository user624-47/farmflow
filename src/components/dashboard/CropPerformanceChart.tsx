import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wheat, TrendingUp, Target } from "lucide-react";

interface CropData {
  crop_name: string;
  total_yield: number;
  total_planted: number;
  avg_yield_per_hectare: number;
  farms_count: number;
}

export const CropPerformanceChart = ({ organizationId }: { organizationId: string }) => {
  const [cropData, setCropData] = useState<CropData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCropPerformance();
  }, [organizationId]);

  const fetchCropPerformance = async () => {
    try {
      const { data: crops, error } = await supabase
        .from("crops")
        .select("crop_name, quantity_harvested, quantity_planted, farm_area")
        .eq("organization_id", organizationId)
        .not("quantity_harvested", "is", null);

      if (error) throw error;

      // Group by crop type and calculate metrics
      const cropMap = new Map<string, {
        total_yield: number;
        total_planted: number;
        total_area: number;
        count: number;
      }>();

      crops?.forEach(crop => {
        const existing = cropMap.get(crop.crop_name) || {
          total_yield: 0,
          total_planted: 0,
          total_area: 0,
          count: 0
        };

        cropMap.set(crop.crop_name, {
          total_yield: existing.total_yield + (crop.quantity_harvested || 0),
          total_planted: existing.total_planted + (crop.quantity_planted || 0),
          total_area: existing.total_area + (crop.farm_area || 0),
          count: existing.count + 1
        });
      });

      const processedData: CropData[] = Array.from(cropMap.entries()).map(([crop_name, data]) => ({
        crop_name,
        total_yield: data.total_yield,
        total_planted: data.total_planted,
        avg_yield_per_hectare: data.total_area > 0 ? data.total_yield / data.total_area : 0,
        farms_count: data.count
      })).sort((a, b) => b.total_yield - a.total_yield);

      setCropData(processedData);
    } catch (error) {
      console.error("Error fetching crop performance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Wheat className="h-5 w-5 text-green-500" />
            <CardTitle>Crop Performance Analytics</CardTitle>
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
            <Wheat className="h-5 w-5 text-green-500" />
            <CardTitle>Crop Performance Analytics</CardTitle>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>Yield Efficiency</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top performing crops summary */}
          <div className="grid grid-cols-3 gap-4">
            {cropData.slice(0, 3).map((crop, index) => (
              <div key={crop.crop_name} className="text-center p-3 rounded-lg bg-accent/20">
                <div className="text-lg font-bold text-foreground">
                  {(crop.total_yield / 1000).toFixed(1)}T
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {crop.crop_name}
                </div>
                <div className="text-xs text-green-600 flex items-center justify-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {crop.avg_yield_per_hectare.toFixed(1)} T/ha
                </div>
              </div>
            ))}
          </div>

          {/* Yield chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="crop_name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'total_yield' ? `${(value / 1000).toFixed(1)}T` : `${value.toFixed(1)} T/ha`,
                    name === 'total_yield' ? 'Total Yield' : 'Yield per Hectare'
                  ]}
                  labelFormatter={(label) => `Crop: ${label}`}
                />
                <Bar dataKey="total_yield" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};