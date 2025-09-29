import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Package, CreditCard, Wheat, PawPrint, BarChart3, Plus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, Cloud, Brain, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CropPerformanceChart } from "@/components/dashboard/CropPerformanceChart";
import { LivestockAnalytics } from "@/components/dashboard/LivestockAnalytics";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { ResourceUtilization } from "@/components/dashboard/ResourceUtilization";
import { AIInsights } from "@/components/ai/AIInsights";

const Index = () => {
  const { user, userRole, organizationId, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    farmers: { total: 0, change: 0 },
    inputs: { total: 0, value: 0, change: 0 },
    loans: { total: 0, value: 0, change: 0 },
    crops: { total: 0, yield: 0, change: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchDashboardData();
  }, [organizationId]);

  const fetchDashboardData = async () => {
    if (!organizationId) return;
    
    try {
      setIsLoadingData(true);
      
      // Fetch farmers count
      const { data: farmers, error: farmersError } = await supabase
        .from("farmers")
        .select("id, created_at")
        .order("created_at", { ascending: false });

      // Fetch inputs data
      const { data: inputs, error: inputsError } = await supabase
        .from("inputs")
        .select("total_cost, created_at")
        .order("created_at", { ascending: false });

      // Fetch loans data
      const { data: loans, error: loansError } = await supabase
        .from("loans")
        .select("amount, status, created_at")
        .order("created_at", { ascending: false });

      // Fetch crops data
      const { data: crops, error: cropsError } = await supabase
        .from("crops")
        .select("quantity_harvested, unit, created_at")
        .order("created_at", { ascending: false });

      if (farmersError || inputsError || loansError || cropsError) {
        console.error("Error fetching dashboard data");
        return;
      }

      // Process the data
      const farmerCount = farmers?.length || 0;
      const inputsValue = inputs?.reduce((sum, input) => sum + (input.total_cost || 0), 0) || 0;
      const activeLoans = loans?.filter(loan => loan.status !== 'completed') || [];
      const loansValue = activeLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
      const totalYield = crops?.reduce((sum, crop) => sum + (crop.quantity_harvested || 0), 0) || 0;

      setDashboardData({
        farmers: { total: farmerCount, change: 12 },
        inputs: { total: inputs?.length || 0, value: inputsValue, change: 8 },
        loans: { total: activeLoans.length, value: loansValue, change: -3 },
        crops: { total: crops?.length || 0, yield: totalYield, change: 15 }
      });

      // Set recent activity (latest farmers)
      setRecentActivity(farmers?.slice(0, 5) || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const statsCards = [
    {
      title: "Total Farmers",
      value: dashboardData.farmers.total.toLocaleString(),
      icon: Users,
      description: "Active farmers in system",
      change: `${dashboardData.farmers.change > 0 ? '+' : ''}${dashboardData.farmers.change}% from last month`,
      trend: dashboardData.farmers.change > 0 ? 'up' : 'down',
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Inputs Distributed",
      value: `₦${(dashboardData.inputs.value / 1000000).toFixed(1)}M`,
      icon: Package,
      description: "Total value distributed",
      change: `${dashboardData.inputs.change > 0 ? '+' : ''}${dashboardData.inputs.change}% from last month`,
      trend: dashboardData.inputs.change > 0 ? 'up' : 'down',
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "Active Loans",
      value: `₦${(dashboardData.loans.value / 1000000).toFixed(1)}M`,
      icon: CreditCard,
      description: "Outstanding loan amount",
      change: `${dashboardData.loans.change > 0 ? '+' : ''}${dashboardData.loans.change}% from last month`,
      trend: dashboardData.loans.change > 0 ? 'up' : 'down',
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      title: "Crop Yield",
      value: `${(dashboardData.crops.yield / 1000).toFixed(1)}T`,
      icon: Wheat,
      description: "Total harvest this season",
      change: `${dashboardData.crops.change > 0 ? '+' : ''}${dashboardData.crops.change}% from last season`,
      trend: dashboardData.crops.change > 0 ? 'up' : 'down',
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    }
  ];

  if (!organizationId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back! Here's comprehensive insights about your farming operations.
          </p>
        </div>
        {(userRole === "admin" || userRole === "extension_officer") && (
          <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Quick Actions
          </Button>
        )}
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="metric-card group overflow-hidden">
            <div className={`absolute inset-0 opacity-5 ${stat.color}`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {isLoadingData ? (
                    <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center space-x-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Overview - Full width */}
      <FinancialOverview organizationId={organizationId} />

      {/* Crop Performance Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CropPerformanceChart organizationId={organizationId} />
        <ResourceUtilization organizationId={organizationId} />
      </div>

      {/* Livestock Analytics */}
      <LivestockAnalytics organizationId={organizationId} />

      {/* AI Insights and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="stats-card">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <CardDescription>
              Latest updates across your farm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingData ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      5 new farmers registered this month
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      Fertilizer distribution completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      Livestock health records updated
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      Crop yield data collected
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="stats-card">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
            </div>
            <CardDescription>
              Important activities and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Livestock Vaccination</p>
                  <p className="text-xs text-muted-foreground">Due for 50 farmers this week</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <Package className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Next Season Planning</p>
                  <p className="text-xs text-muted-foreground">Seed distribution planning</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <BarChart3 className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Performance Review</p>
                  <p className="text-xs text-muted-foreground">Monthly analytics due</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="stats-card">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">System Status</CardTitle>
            </div>
            <CardDescription>
              Current system health and AI capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Processing</span>
                  <span className="text-sm text-green-600 font-medium">Optimal</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Analysis</span>
                  <span className="text-sm text-blue-600 font-medium">Active</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Insights Generation</span>
                  <span className="text-sm text-green-600 font-medium">Ready</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <div className="grid gap-6">
        <Card className="stats-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">AI-Powered Farm Insights</CardTitle>
              </div>
              <Button variant="outline" size="sm">
                View Full Analysis
              </Button>
            </div>
            <CardDescription>
              Intelligent recommendations based on your farm data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIInsights organizationId={organizationId} moduleType="overview" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
