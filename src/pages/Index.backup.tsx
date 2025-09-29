import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Package, CreditCard, Wheat, BarChart3, Plus, TrendingUp, TrendingDown, AlertTriangle, Cloud, Calendar } from "lucide-react";
import { useDashboardData, processDashboardData } from "@/hooks/useDashboardData";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, organizationId, loading } = useAuth();
  
  // Use the custom hook for data fetching
  const { 
    farmers, 
    inputs, 
    loans, 
    crops, 
    loading: isLoadingData, 
    error,
    refresh 
  } = useDashboardData(organizationId);
  
  // Process the data for display
  const dashboardData = processDashboardData({
    farmers,
    inputs,
    loans: loans.filter(loan => loan.status !== 'completed'),
    crops
  });
  
  // Get recent activity (latest farmers)
  const recentActivity = [...farmers].slice(0, 5);
  
  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
  };
  
  // Navigate to add farmer
  const handleAddFarmer = () => {
    navigate('/farmers/new');
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

  // Check if we have any data to show
  const hasData = [farmers, inputs, loans, crops].some(arr => arr.length > 0);
  
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
  
  // Show loading skeleton
  if (isLoadingData) {
    return <DashboardSkeleton />;
  }
  
  // Show error state if there was an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="rounded-full bg-red-100 p-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || 'An error occurred while loading the dashboard data.'}
        </p>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to FarmFlow
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's get started with setting up your farm
            </p>
          </div>
        </div>
        
        <EmptyState
          title="No farm data yet"
          description="Start by adding your first farmer to get started with FarmFlow."
          action={{
            label: "Add First Farmer",
            onClick: handleAddFarmer
          }}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-sm text-red-700 mt-1">
            We couldn't load the dashboard. Please try refreshing the page.
          </p>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your farming operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={handleRefresh}
              disabled={isLoadingData}
            >
              <svg 
                className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isLoadingData ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => {}}
            >
              <Calendar className="h-4 w-4" />
              This month
            </Button>
          </div>
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

      {/* Enhanced Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Farmers */}
        <Card className="stats-card">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Registrations</CardTitle>
            </div>
            <CardDescription>
              Latest farmers added to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingData ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.slice(0, 3).map((farmer: any, i) => (
                  <div key={i} className="flex items-center space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      New farmer registered
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
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
                  <p className="text-xs text-muted-foreground">Due for 50 farmers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <Package className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Fertilizer Distribution</p>
                  <p className="text-xs text-muted-foreground">Scheduled for next week</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <BarChart3 className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Quarterly Report</p>
                  <p className="text-xs text-muted-foreground">Due in 5 days</p>
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
              Current system health and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Health</span>
                  <span className="text-sm text-green-600 font-medium">Excellent</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Sync</span>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Analysis</span>
                  <span className="text-sm text-blue-600 font-medium">Ready</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Integration Placeholder */}
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Weather & Crop Insights</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={handleRefresh}
                disabled={isLoadingData}
              >
                <svg 
                  className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isLoadingData ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => {}}
              >
                <Calendar className="h-4 w-4" />
                This month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect weather data and enable AI analysis for personalized farming insights
            </p>
            <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
              Enable Weather Integration
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
