import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Activity, AlertTriangle, Calendar, Zap } from 'lucide-react';

interface LivestockStats {
  total: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  healthAlerts: number;
  upcomingTasks: number;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
}

export function LivestockDashboard() {
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LivestockStats | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    fetchLivestockData();
    fetchAIInsights();
  }, [organizationId]);

  const fetchLivestockData = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // Fetch livestock data
      const { data: livestock } = await supabase
        .from('livestock')
        .select('*')
        .eq('organization_id', organizationId);

      // Process data for stats
      if (livestock) {
        const typeCounts = {};
        const statusCounts = {};
        
        livestock.forEach(animal => {
          // Count by type
          if (animal.livestock_type) {
            typeCounts[animal.livestock_type] = (typeCounts[animal.livestock_type] || 0) + 1;
          }
          
          // Count by status
          if (animal.health_status) {
            statusCounts[animal.health_status] = (statusCounts[animal.health_status] || 0) + 1;
          }
        });

        setStats({
          total: livestock.length,
          byType: Object.entries(typeCounts).map(([type, count]) => ({
            type,
            count: count as number
          })),
          byStatus: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count: count as number
          })),
          healthAlerts: livestock.filter(a => a.health_status === 'critical').length,
          upcomingTasks: 5 // Mock data - in a real app, this would come from your tasks/events
        });
      }
    } catch (error) {
      console.error('Error fetching livestock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    // In a real app, this would call your AI service
    // For now, we'll use mock data
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        title: 'Feed Optimization Opportunity',
        description: 'AI suggests adjusting feed ratios for 15 cattle to improve weight gain by 12%',
        priority: 'high',
        date: '2023-09-23'
      },
      {
        id: '2',
        title: 'Health Alert: Potential Illness',
        description: '3 animals showing early signs of respiratory infection',
        priority: 'high',
        date: '2023-09-22'
      },
      {
        id: '3',
        title: 'Breeding Window',
        description: 'Optimal breeding window for 5 heifers starts next week',
        priority: 'medium',
        date: '2023-09-25'
      }
    ];
    
    setAiInsights(mockInsights);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Livestock</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.healthAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingTasks || 0}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground">Recommendations available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Livestock by Type Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Livestock by Type</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byType || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.length > 0 ? (
                aiInsights.map((insight) => (
                  <div 
                    key={insight.id}
                    className="flex items-start p-3 space-x-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      <div className="flex items-center pt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.priority)}`}>
                          {insight.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No insights available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
