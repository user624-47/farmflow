import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define interfaces for the data we expect from Supabase
interface InputRecord {
  id: string;
  organization_id: string;
  total_cost: number | null;
  date_supplied: string | null;
}

interface LivestockRecord {
  id: string;
  organization_id: string | null;
  acquisition_cost: number | null;
  acquisition_date: string | null;
  livestock_type: string;
}

interface LoanRecord {
  id: string;
  organization_id: string | null;
  amount: number | null;
  status: string | null;
  disbursement_date: string | null;
}


interface FinancialData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  loan_disbursements: number;
}

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  active_loans: number;
  loan_value: number;
  profit_margin: number;
}

export const FinancialOverview = ({ organizationId }: { organizationId: string }) => {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    active_loans: 0,
    loan_value: 0,
    profit_margin: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [organizationId]);

  const fetchFinancialData = async () => {
    try {
      // Fetch inputs (expenses)
      const { data: inputs, error: inputsError } = await supabase
        .from("inputs")
        .select("total_cost, date_supplied")
        .eq("organization_id", organizationId)
        .not("total_cost", "is", null) as { data: InputRecord[] | null; error: any };

      // Fetch livestock data (using acquisition cost as a proxy for revenue in this example)
      const { data: livestock, error: livestockError } = await supabase
        .from("livestock")
        .select("acquisition_cost, acquisition_date")
        .eq("organization_id", organizationId)
        .not("acquisition_cost", "is", null) as { data: LivestockRecord[] | null; error: any };
        
      if (livestockError) {
        console.error("Error fetching livestock data:", livestockError);
      }

      // Fetch loans
      const { data: loans, error: loansError } = await supabase
        .from("loans")
        .select("amount, status, disbursement_date")
        .eq("organization_id", organizationId) as { data: LoanRecord[] | null; error: any };

      if (inputsError || livestockError || loansError) {
        console.error("Errors:", { inputsError, livestockError, loansError });
        throw new Error("Failed to fetch financial data");
      }

      // Process monthly data
      const monthlyData = new Map<string, {
        revenue: number;
        expenses: number;
        loan_disbursements: number;
      }>();

      // Process inputs (expenses)
      inputs?.forEach(input => {
        if (input.date_supplied) {
          const month = new Date(input.date_supplied).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          const existing = monthlyData.get(month) || { revenue: 0, expenses: 0, loan_disbursements: 0 };
          existing.expenses += input.total_cost || 0;
          monthlyData.set(month, existing);
        }
      });

      // Process livestock data (using acquisition cost as a proxy for revenue)
      livestock?.forEach(animal => {
        if (animal.acquisition_date) {
          const month = new Date(animal.acquisition_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          const existing = monthlyData.get(month) || { revenue: 0, expenses: 0, loan_disbursements: 0 };
          existing.revenue += animal.acquisition_cost || 0;
          monthlyData.set(month, existing);
        }
      });

      // Process loans
      loans?.forEach(loan => {
        if (loan.disbursement_date && loan.status === 'approved' && loan.amount) {
          const month = new Date(loan.disbursement_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          const existing = monthlyData.get(month) || { revenue: 0, expenses: 0, loan_disbursements: 0 };
          existing.loan_disbursements += loan.amount || 0;
          monthlyData.set(month, existing);
        }
      });

      // Convert to array and sort by date
      const chartData: FinancialData[] = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          expenses: data.expenses,
          profit: data.revenue - data.expenses,
          loan_disbursements: data.loan_disbursements
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6); // Last 6 months

      setFinancialData(chartData);

      // Calculate summary
      const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
      const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
      const netProfit = totalRevenue - totalExpenses;
      const activeLoans = loans?.filter(loan => loan.status !== 'completed').length || 0;
      const loanValue = loans?.filter(loan => loan.status !== 'completed')
        .reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0;

      setSummary({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        active_loans: activeLoans,
        loan_value: loanValue,
        profit_margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      });

    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="stats-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle>Financial Overview</CardTitle>
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
    <Card className="stats-card lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle>Financial Overview</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={summary.profit_margin > 0 ? "default" : "destructive"}>
              {summary.profit_margin > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {summary.profit_margin.toFixed(1)}% margin
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Revenue</span>
              </div>
              <div className="text-xl font-bold text-green-700 mt-1">
                ₦{(summary.total_revenue / 1000000).toFixed(1)}M
              </div>
            </div>

            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Expenses</span>
              </div>
              <div className="text-xl font-bold text-red-700 mt-1">
                ₦{(summary.total_expenses / 1000000).toFixed(1)}M
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Net Profit</span>
              </div>
              <div className="text-xl font-bold text-blue-700 mt-1">
                ₦{(summary.net_profit / 1000000).toFixed(1)}M
              </div>
            </div>

            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Active Loans</span>
              </div>
              <div className="text-xl font-bold text-orange-700 mt-1">
                {summary.active_loans}
              </div>
              <div className="text-xs text-orange-600">
                ₦{(summary.loan_value / 1000000).toFixed(1)}M value
              </div>
            </div>
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `₦${(value / 1000000).toFixed(2)}M`,
                    name === 'revenue' ? 'Revenue' : 
                    name === 'expenses' ? 'Expenses' : 'Profit'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};