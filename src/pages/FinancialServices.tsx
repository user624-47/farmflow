import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, PiggyBank, Smartphone, Plus, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/languages";
import { useAuth } from "@/contexts/AuthContext";
import { CreateFinancialServiceDialog } from "@/components/financial/CreateFinancialServiceDialog";
import { format } from "date-fns";

export default function FinancialServices() {
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ["financial-services", searchTerm, selectedType, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from("financial_services")
        .select(`
          *,
          farmers(first_name, last_name, farmer_id)
        `)
        .order("created_at", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("service_type", selectedType);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      if (searchTerm) {
        query = query.or(`provider.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'loan': return <CreditCard className="h-4 w-4" />;
      case 'insurance': return <DollarSign className="h-4 w-4" />;
      case 'savings': return <PiggyBank className="h-4 w-4" />;
      case 'mobile_money': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disbursed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalAmount = services?.reduce((sum, service) => sum + Number(service.amount || 0), 0) || 0;
  const approvedServices = services?.filter(s => s.status === 'approved').length || 0;
  const activeLoans = services?.filter(s => s.service_type === 'loan' && s.status === 'disbursed').length || 0;
  const savingsAccounts = services?.filter(s => s.service_type === 'savings').length || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading financial services...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Services</h1>
          <p className="text-muted-foreground">
            Access loans, insurance, savings, and mobile money services
          </p>
        </div>
        {(userRole === "admin" || userRole === "extension_officer") && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">All services combined</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedServices}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans}</div>
            <p className="text-xs text-muted-foreground">Currently disbursed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Accounts</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsAccounts}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Services Directory</CardTitle>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search by provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="loan">Loans</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services?.map((service) => (
              <Card key={service.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(service.service_type)}
                      <CardTitle className="text-lg capitalize">
                        {service.service_type.replace('_', ' ')}
                      </CardTitle>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.provider}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.amount && (
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(Number(service.amount))}
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {service.farmers && (
                      <div>
                        <span className="font-medium">Farmer:</span>{' '}
                        {service.farmers.first_name} {service.farmers.last_name} 
                        ({service.farmers.farmer_id})
                      </div>
                    )}

                    {service.interest_rate && (
                      <div>
                        <span className="font-medium">Interest Rate:</span>{' '}
                        {service.interest_rate}% per annum
                      </div>
                    )}

                    {service.duration_months && (
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {service.duration_months} months
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">Applied:</span>{' '}
                      {format(new Date(service.application_date), 'MMM d, yyyy')}
                    </div>

                    {service.approval_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">Approved:</span>{' '}
                        {format(new Date(service.approval_date), 'MMM d, yyyy')}
                      </div>
                    )}

                    {service.disbursement_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">Disbursed:</span>{' '}
                        {format(new Date(service.disbursement_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>

                  {service.notes && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      <span className="font-medium">Notes:</span> {service.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!services || services.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No financial services found. Create the first service record.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Financial Service Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Financial Service Providers in Nigeria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Microfinance Banks</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="block w-fit text-xs">LAPO Microfinance Bank</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">AB Microfinance Bank</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">Accion Microfinance Bank</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Government Programs</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="block w-fit text-xs">CBN Anchor Borrowers Program</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">NIRSAL Microfinance Bank</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">BOA/BOI AgriCredit</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Mobile Money</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="block w-fit text-xs">MTN Mobile Money</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">Airtel Money</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">9Mobile Money</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Insurance</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="block w-fit text-xs">Nigerian Agricultural Insurance Corporation</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">Leadway Assurance</Badge>
                <Badge variant="secondary" className="block w-fit text-xs">AIICO Insurance</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateFinancialServiceDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
}