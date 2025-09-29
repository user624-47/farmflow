import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PawPrint, Activity, Heart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LivestockData {
  id: string;
  livestock_type: string;
  quantity: number;
  health_status: string;
  updated_at: string;
  productivity_data?: any;  // Changed from production_data to match database schema
  organization_id: string;
  farmer_id: string;
  breed?: string;
  age_months?: number;
  vaccination_date?: string;
  breeding_status?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  notes?: string;
  created_at: string;
}

interface ProcessedLivestockData {
  livestock_type: string;
  total_quantity: number;
  healthy_count: number;
  production_value: number;
  avg_productivity: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export const LivestockAnalytics = ({ organizationId }: { organizationId: string }) => {
  const [livestockData, setLivestockData] = useState<ProcessedLivestockData[]>([]);
  interface HealthMetrics {
    total_animals: number;
    healthy_percentage: number;
    recent_vaccinations: number;
  }

  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    total_animals: 0,
    healthy_percentage: 0,
    recent_vaccinations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivestockAnalytics();
  }, [organizationId]);

  const fetchLivestockAnalytics = async () => {
    try {
      // Fetch all livestock data in one query
      // Fetch livestock data, including productivity_data
      const { data: livestock, error: livestockError } = await supabase
        .from("livestock")
        .select(`
          id, 
          livestock_type, 
          quantity, 
          health_status, 
          updated_at, 
          productivity_data,
          organization_id,
          farmer_id,
          breed,
          age_months,
          vaccination_date,
          breeding_status,
          acquisition_date,
          acquisition_cost,
          notes,
          created_at
        `)
        .eq("organization_id", organizationId);

      if (livestockError) throw new Error("Failed to fetch livestock data");

      // Get recent health records (last 30 days)
      const recentHealthRecords = livestock.filter(animal => {
        const updatedAt = new Date(animal.updated_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return updatedAt > thirtyDaysAgo;
      });

      // Process livestock data
      const livestockMap = new Map<string, {
        total_quantity: number;
        healthy_count: number;
        production_value: number;
        production_count: number;
      }>();

      // Process all livestock data
      livestock?.forEach(animal => {
        const existing = livestockMap.get(animal.livestock_type) || {
          total_quantity: 0,
          healthy_count: 0,
          production_value: 0,
          production_count: 0
        };

        // Calculate production value from productivity_data if available
        let productionValue = 0;
        if (animal.productivity_data) {
          // Example: Sum up all numeric values in productivity_data
          // Adjust this based on your actual productivity_data structure
          Object.values(animal.productivity_data).forEach(value => {
            if (typeof value === 'number') {
              productionValue += value;
            }
          });
        }

        livestockMap.set(animal.livestock_type, {
          total_quantity: existing.total_quantity + (animal.quantity || 0),
          healthy_count: existing.healthy_count + 
            (animal.health_status === 'healthy' ? animal.quantity || 0 : 0),
          production_value: existing.production_value + productionValue,
          production_count: existing.production_count
        });
      });

      // Calculate metrics
      const totalAnimals = livestock?.reduce((sum, animal) => sum + (animal.quantity || 0), 0) || 0;
      const healthyAnimals = livestock?.reduce((sum, animal) => 
        sum + (animal.health_status === 'healthy' ? animal.quantity || 0 : 0), 0) || 0;

      // Convert map to array for rendering
      const processedData: ProcessedLivestockData[] = Array.from(livestockMap.entries())
        .filter(([_, data]) => data.total_quantity > 0) // Only include types with animals
        .map(([livestock_type, data]) => {
          // Calculate average productivity, defaulting to 0 if no production data
          const avg_productivity = data.production_count && data.total_quantity > 0
            ? data.production_value / data.total_quantity
            : 0;
            
          return {
            livestock_type,
            total_quantity: data.total_quantity,
            healthy_count: data.healthy_count,
            production_value: data.production_value || 0,
            avg_productivity
          };
        });

      setLivestockData(processedData);

      // Update health metrics
      setHealthMetrics({
        total_animals: totalAnimals,
        healthy_percentage: totalAnimals > 0 ? (healthyAnimals / totalAnimals) * 100 : 0,
        recent_vaccinations: recentHealthRecords.filter(animal => 
          animal.health_status?.toLowerCase().includes('vaccin')
        ).length
      });

    } catch (error) {
      console.error("Error fetching livestock analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PawPrint className="h-5 w-5 text-orange-500" />
            <CardTitle>Livestock Analytics</CardTitle>
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Livestock Distribution */}
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PawPrint className="h-5 w-5 text-orange-500" />
            <CardTitle>Livestock Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-accent/20">
                <div className="text-lg font-bold">{healthMetrics?.total_animals || 0}</div>
                <div className="text-xs text-muted-foreground">Total Animals</div>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <div className="text-lg font-bold text-green-600">
                  {healthMetrics?.healthy_percentage?.toFixed(0) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <div className="text-lg font-bold text-blue-600">
                  {healthMetrics?.recent_vaccinations || 0}
                </div>
                <div className="text-xs text-muted-foreground">Recent Vaccinations</div>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={livestockData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ livestock_type, percent }) => 
                      `${livestock_type} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="total_quantity"
                  >
                    {livestockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Animals']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Metrics */}
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <CardTitle>Production Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Production summary */}
            <div className="grid grid-cols-2 gap-4">
              {livestockData.slice(0, 4).map((item, index) => (
                <div key={item.livestock_type} className="flex items-center justify-between p-3 rounded-lg bg-accent/20">
                  <div>
                    <div className="text-sm font-medium capitalize">{item.livestock_type || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.total_quantity || 0} animals
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      ₦{((item.production_value || 0) / 1000).toFixed(0)}K
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      {item.total_quantity > 0 
                        ? ((item.healthy_count / item.total_quantity) * 100).toFixed(0) 
                        : 0}% healthy
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Productivity chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={livestockData.slice(0, 4)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="livestock_type" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}`, 'Avg Productivity']}
                  />
                  <Bar dataKey="avg_productivity" fill="hsl(var(--primary))" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};