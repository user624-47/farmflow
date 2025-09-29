import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Application as AppType } from "@/types/application";
import { Application, ProductType } from "@/components/applications/CreateApplicationDialog";
import { ApplicationsList } from "@/components/applications/ApplicationsList";
import { CreateApplicationDialog } from "@/components/applications/CreateApplicationDialog";

// Mock supabase client since we don't have the actual implementation
// Define a type for the Supabase response to ensure type safety
interface SupabaseResponse<T = any> {
  data: T | null;
  error: Error | null;
}

const supabase = {
  from: (table: string) => ({
    select: (fields: string) => {
      const response: SupabaseResponse<any[]> = {
        data: [],
        error: null,
      };

      const responseWithMethods = {
        ...response,
        eq: (field: string, value: any) => ({
          ...response,
          order: (field: string, options: { ascending: boolean }) => response,
        }),
        order: (field: string, options: { ascending: boolean }) => response,
      };

      return responseWithMethods;
    },
    delete: () => {
      const deleteResponse: SupabaseResponse<null> & {
        eq: (field: string, value: any) => SupabaseResponse<null>;
      } = {
        data: null,
        error: null,
        eq: (field: string, value: any) => ({
          data: null,
          error: null,
        }),
      };

      return deleteResponse;
    },
  }),
  rpc: (fn: string, params: any): SupabaseResponse => ({
    data: null,
    error: null,
  }),
};

// Mock useToast
const mockToast = (params: any) => console.log('Toast:', params);

const useToast = () => ({
  toast: mockToast,
});

// Mock useAuth
const useAuth = () => ({
  user: { id: 'user-123' },
  role: 'farmer',
  organizationId: 'org-123', // Added to match component usage
});

// Application type is imported from @/types/application

// UI Components
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Icons
import { 
  FileText, 
  Loader2, 
  Plus, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  LifeBuoy,
  Calendar as CalendarIcon,
  RefreshCw,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Droplets,
  Bug,
  Leaf
} from "lucide-react";

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Types
type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

// Application type is imported from @/types/application

// Stats type for the dashboard
type Stats = {
  total: number;
  fertilizer: number;
  pesticide: number;
  herbicide: number;
  fungicide: number;
  insecticide: number;
  next_due: number;
  total_cost: number;
  monthly_trend: { month: string; count: number }[];
  product_distribution: { name: string; value: number }[];
};

// SortConfig type is defined above

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Applications() {
  const { user, organizationId } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<AppType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTimeframe, setFilterTimeframe] = useState<string>("all");
  const [applications, setApplications] = useState<AppType[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'application_date', 
    direction: 'desc' 
  });

  // Enhanced fetch applications with better data handling
  const fetchApplications = useCallback(async () => {
    if (!organizationId) {
      console.log('No organizationId found');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch applications with related data
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          crops (crop_name),
          farmers (first_name, last_name)
        `)
        .eq('organization_id', organizationId)
        .order('application_date', { ascending: false });
        
      if (appsError) {
        console.error('Error fetching applications:', appsError);
        mockToast({
          title: 'Error',
          description: 'Failed to load applications',
          variant: 'destructive',
        });
        throw appsError;
      }
      
      setApplications(apps || []);
      
      // Calculate more comprehensive stats
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const startOfThisWeek = startOfWeek(now);
      const endOfThisWeek = endOfWeek(now);
      
      // Group by month for trend data
      const monthlyData = new Map<string, number>();
      const productDistribution = new Map<string, number>();
      
      apps?.forEach(app => {
        // Monthly trend
        const month = format(new Date(app.application_date), 'MMM yyyy');
        monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
        
        // Product distribution
        const type = app.product_type || 'other';
        productDistribution.set(type, (productDistribution.get(type) || 0) + 1);
      });
      
      // Convert maps to arrays for charts
      const monthlyTrend = Array.from(monthlyData.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      
      const productDistributionData = Array.from(productDistribution.entries())
        .map(([name, value]) => ({ name, value }));
      
      // Calculate stats
      const statsData: Stats = {
        total: apps?.length || 0,
        fertilizer: apps?.filter(a => a.product_type === 'fertilizer').length || 0,
        pesticide: apps?.filter(a => a.product_type === 'pesticide').length || 0,
        herbicide: apps?.filter(a => a.product_type === 'herbicide').length || 0,
        fungicide: apps?.filter(a => a.product_type === 'fungicide').length || 0,
        insecticide: apps?.filter(a => a.product_type === 'insecticide').length || 0,
        next_due: apps?.filter(a => {
          if (!a.next_application_date) return false;
          const nextDate = new Date(a.next_application_date);
          return nextDate <= endOfThisWeek && nextDate >= now;
        }).length || 0,
        total_cost: apps?.reduce((sum, app) => sum + (app.cost || 0), 0) || 0,
        monthly_trend: monthlyTrend,
        product_distribution: productDistributionData
      };
      
      setStats(statsData);
      return apps;
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
      mockToast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Initial data fetch
  useEffect(() => {
    console.log('Component mounted or organizationId changed:', { organizationId }); // Debug log
    fetchApplications().catch(err => {
      console.error('Error in fetchApplications:', err);
    });
  }, [fetchApplications]);
  
  // Enhanced filtering and sorting with useMemo for better performance
  const filteredApplications = useMemo((): AppType[] => {
    return applications
      .filter(app => {
        // Search filter
        const matchesSearch = searchTerm === '' || 
          (app.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.crops?.crop_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.farmers && `${app.farmers.first_name} ${app.farmers.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Application type filter
        const matchesType = filterType === 'all' || 
          (app.product_type && app.product_type.toLowerCase() === filterType.toLowerCase());
        
        // Timeframe filter
        const now = new Date();
        const appDate = new Date(app.application_date);
        let matchesTimeframe = true;
        
        if (filterTimeframe === 'this-week') {
          const startOfThisWeek = startOfWeek(now);
          const endOfThisWeek = endOfWeek(now);
          matchesTimeframe = isWithinInterval(appDate, { start: startOfThisWeek, end: endOfThisWeek });
        } else if (filterTimeframe === 'this-month') {
          const startOfThisMonth = startOfMonth(now);
          const endOfThisMonth = endOfMonth(now);
          matchesTimeframe = isWithinInterval(appDate, { start: startOfThisMonth, end: endOfThisMonth });
        } else if (filterTimeframe === 'last-30-days') {
          matchesTimeframe = appDate >= subDays(now, 30);
        } else if (filterTimeframe === 'upcoming') {
          if (!app.next_application_date) return false;
          const nextDate = new Date(app.next_application_date);
          return nextDate >= now && nextDate <= endOfWeek(now);
        }
        
        // Tab filter
        const matchesTab = 
          activeTab === 'all' || 
          (activeTab === 'fertilizer' && app.product_type === 'fertilizer') ||
          (activeTab === 'pesticide' && ['pesticide', 'herbicide', 'fungicide', 'insecticide'].includes(app.product_type || ''));
        
        return matchesSearch && matchesType && matchesTimeframe && matchesTab;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortConfig.key) {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];
          
          // Handle nested objects
          if (sortConfig.key === 'crops' && a.crops && b.crops) {
            aValue = a.crops.crop_name;
            bValue = b.crops.crop_name;
          } else if (sortConfig.key === 'farmers' && a.farmers && b.farmers) {
            aValue = `${a.farmers.first_name} ${a.farmers.last_name}`;
            bValue = `${b.farmers.first_name} ${b.farmers.last_name}`;
          }
          
          if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
          if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
          
          const direction = sortConfig.direction === 'asc' ? 1 : -1;
          
          // Handle different data types
          if (aValue instanceof Date && bValue instanceof Date) {
            return (aValue < bValue ? -1 : 1) * direction;
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue) * direction;
          }
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return (aValue - bValue) * direction;
          }
          
          return 0;
        }
        return 0;
      });
  }, [applications, searchTerm, filterType, filterTimeframe, activeTab, sortConfig]);
  
  // Handle sort request
  const requestSort = (key: keyof AppType) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key: keyof AppType) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4 inline" /> : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };

  // Loading state with skeleton loader
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-40 bg-muted rounded-md animate-pulse"></div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        {/* Table Skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-muted/50 rounded-t-lg animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Error state with retry option
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive overflow-hidden">
          <CardHeader className="bg-destructive/5 border-b border-destructive/20">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We encountered an error while loading your applications. Please try again or contact support if the problem persists.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline">
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm">
                <p className="font-medium mb-1">Error details:</p>
                <code className="text-xs text-muted-foreground break-all">{error}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle dialog close
  const handleDialogClose = async (open: boolean) => {
    if (!open) {
      // Reset editing state and refresh data when dialog is closed
      setEditingApplication(null);
      await fetchApplications();
    }
  };

  // Handle edit application
  const handleEdit = (application: AppType) => {
    // Create a new object that matches the expected type in CreateApplicationDialog
    const dialogApp: Application = {
      ...application,
      product_type: application.product_type as ProductType,
      quantity: application.quantity,
      cost: application.cost,
      application_date: application.application_date,
      application_method: application.application_method,
      unit: application.unit,
      crop_id: application.crop_id,
      farmer_id: application.farmer_id,
      notes: application.notes || '',
      next_application_date: application.next_application_date,
      weather_conditions: application.weather_conditions || '',
      target_pest_disease: application.target_pest_disease || ''
    };
    
    setEditingApplication(application);
    setIsCreateDialogOpen(true);
  };

  // Handle delete application
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      mockToast({
        title: 'Success',
        description: 'Application deleted successfully',
      });
      
      // Refresh the applications list
      await fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      mockToast({
        title: 'Error',
        description: 'Failed to delete application',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="p-6">
        <PageHeader
          title="Applications"
          description="Manage and track all your farm applications in one place"
          action={
            <Button onClick={() => {
              setEditingApplication(null);
              setIsCreateDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          }
        />
      </div>

      {/* Main Content */}
      <div className="space-y-6 px-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all time
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fertilizer
              </CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fertilizer || 0}</div>
              <p className="text-xs text-muted-foreground">
                Applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pesticides
              </CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pesticide || 0}</div>
              <p className="text-xs text-muted-foreground">
                Applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Next Due
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.next_due || 0}</div>
              <p className="text-xs text-muted-foreground">
                Applications due this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  View and manage all your farm applications
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    className="pl-8 w-full sm:w-[200px] md:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fertilizer">Fertilizer</SelectItem>
                    <SelectItem value="pesticide">Pesticide</SelectItem>
                    <SelectItem value="herbicide">Herbicide</SelectItem>
                    <SelectItem value="fungicide">Fungicide</SelectItem>
                    <SelectItem value="insecticide">Insecticide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="fertilizer">Fertilizer</TabsTrigger>
                <TabsTrigger value="pesticide">Pesticides</TabsTrigger>
              </TabsList>
              
              <div className="rounded-none border-0">
                <ApplicationsList 
                  applications={filteredApplications} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  sortConfig={sortConfig}
                  onSort={requestSort}
                  getSortIndicator={getSortIndicator}
                />
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      {isCreateDialogOpen && editingApplication && (
        <CreateApplicationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          application={{
            ...editingApplication,
            product_type: editingApplication.product_type as ProductType,
            quantity: editingApplication.quantity,
            cost: editingApplication.cost,
            application_date: editingApplication.application_date,
            application_method: editingApplication.application_method,
            unit: editingApplication.unit,
            crop_id: editingApplication.crop_id,
            farmer_id: editingApplication.farmer_id,
            notes: editingApplication.notes || '',
            next_application_date: editingApplication.next_application_date,
            weather_conditions: editingApplication.weather_conditions || '',
            target_pest_disease: editingApplication.target_pest_disease || ''
          }}
          onSuccess={() => {
            fetchApplications();
            mockToast({
              title: 'Success',
              description: 'Application updated successfully',
            });
          }}
        />
      )}
      
      {isCreateDialogOpen && !editingApplication && (
        <CreateApplicationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            fetchApplications();
            mockToast({
              title: 'Success',
              description: 'Application created successfully',
            });
          }}
        />
      )}
    </div>
  );
}