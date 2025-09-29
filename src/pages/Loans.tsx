import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, CreditCard, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Loan {
  id: string;
  loan_type: string;
  amount: number;
  interest_rate?: number;
  duration_months?: number;
  status: string;
  application_date: string;
  approval_date?: string;
  disbursement_date?: string;
  due_date?: string;
  amount_repaid?: number;
  notes?: string;
  created_at: string;
}

interface Farmer {
  id: string;
  first_name: string;
  last_name: string;
  farmer_id: string;
}

const Loans = () => {
  const { userRole, organizationId } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    farmer_id: "",
    loan_type: "",
    amount: "",
    interest_rate: "",
    duration_months: "",
    status: "pending",
    application_date: "",
    approval_date: "",
    disbursement_date: "",
    due_date: "",
    amount_repaid: "",
    notes: ""
  });

  useEffect(() => {
    fetchLoans();
    fetchFarmers();
  }, [organizationId]);

  const fetchLoans = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("organization_id", organizationId)
        .order("application_date", { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch loans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("id, first_name, last_name, farmer_id")
        .eq("organization_id", organizationId);

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error("Failed to fetch farmers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    try {
      const loanData = {
        ...formData,
        organization_id: organizationId,
        amount: parseFloat(formData.amount),
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
        amount_repaid: formData.amount_repaid ? parseFloat(formData.amount_repaid) : 0,
        approval_date: formData.approval_date || null,
        disbursement_date: formData.disbursement_date || null,
        due_date: formData.due_date || null,
      };

      if (editingLoan) {
        const { error } = await supabase
          .from("loans")
          .update(loanData)
          .eq("id", editingLoan.id);
        if (error) throw error;
        toast({ title: "Success", description: "Loan updated successfully" });
      } else {
        const { error } = await supabase
          .from("loans")
          .insert([loanData]);
        if (error) throw error;
        toast({ title: "Success", description: "Loan added successfully" });
      }

      setIsDialogOpen(false);
      setEditingLoan(null);
      resetForm();
      fetchLoans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      farmer_id: (loan as any).farmer_id || "",
      loan_type: loan.loan_type,
      amount: loan.amount.toString(),
      interest_rate: loan.interest_rate?.toString() || "",
      duration_months: loan.duration_months?.toString() || "",
      status: loan.status,
      application_date: loan.application_date,
      approval_date: loan.approval_date || "",
      disbursement_date: loan.disbursement_date || "",
      due_date: loan.due_date || "",
      amount_repaid: loan.amount_repaid?.toString() || "",
      notes: loan.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this loan record?")) return;

    try {
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Loan deleted successfully" });
      fetchLoans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      farmer_id: "",
      loan_type: "",
      amount: "",
      interest_rate: "",
      duration_months: "",
      status: "pending",
      application_date: "",
      approval_date: "",
      disbursement_date: "",
      due_date: "",
      amount_repaid: "",
      notes: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "disbursed": return "secondary";
      case "completed": return "outline";
      case "defaulted": return "destructive";
      default: return "secondary";
    }
  };

  const filteredLoans = loans.filter(loan =>
    loan.loan_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = userRole === "admin" || userRole === "extension_officer";

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">Loans Management</h1>
          <p className="text-muted-foreground">
            Track agricultural loans and repayments
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingLoan(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLoan ? "Edit Loan" : "Add New Loan"}
                </DialogTitle>
                <DialogDescription>
                  Record loan application and management details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farmer_id">Farmer</Label>
                    <Select value={formData.farmer_id} onValueChange={(value) => setFormData({...formData, farmer_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select farmer" />
                      </SelectTrigger>
                      <SelectContent>
                        {farmers.map((farmer) => (
                          <SelectItem key={farmer.id} value={farmer.id}>
                            {farmer.first_name} {farmer.last_name} ({farmer.farmer_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="loan_type">Loan Type</Label>
                    <Select value={formData.loan_type} onValueChange={(value) => setFormData({...formData, loan_type: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input_loan">Input Loan</SelectItem>
                        <SelectItem value="cash_loan">Cash Loan</SelectItem>
                        <SelectItem value="equipment_loan">Equipment Loan</SelectItem>
                        <SelectItem value="seasonal_loan">Seasonal Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_months">Duration (Months)</Label>
                    <Input
                      id="duration_months"
                      type="number"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="disbursed">Disbursed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="defaulted">Defaulted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="application_date">Application Date</Label>
                    <Input
                      id="application_date"
                      type="date"
                      value={formData.application_date}
                      onChange={(e) => setFormData({...formData, application_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="approval_date">Approval Date</Label>
                    <Input
                      id="approval_date"
                      type="date"
                      value={formData.approval_date}
                      onChange={(e) => setFormData({...formData, approval_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="disbursement_date">Disbursement Date</Label>
                    <Input
                      id="disbursement_date"
                      type="date"
                      value={formData.disbursement_date}
                      onChange={(e) => setFormData({...formData, disbursement_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount_repaid">Amount Repaid (₦)</Label>
                    <Input
                      id="amount_repaid"
                      type="number"
                      step="0.01"
                      value={formData.amount_repaid}
                      onChange={(e) => setFormData({...formData, amount_repaid: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingLoan ? "Update Loan" : "Add Loan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search loans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLoans.map((loan) => (
          <Card key={loan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{loan.loan_type.replace("_", " ").toUpperCase()}</CardTitle>
                {canManage && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(loan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(loan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                <Badge variant={getStatusColor(loan.status)}>{loan.status}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ₦{loan.amount.toLocaleString()}
                </p>
                {loan.interest_rate && (
                  <p className="text-sm">📈 {loan.interest_rate}% interest</p>
                )}
                {loan.duration_months && (
                  <p className="text-sm">⏱️ {loan.duration_months} months</p>
                )}
                <p className="text-sm">📅 Applied: {new Date(loan.application_date).toLocaleDateString()}</p>
                {loan.due_date && (
                  <p className="text-sm">🎯 Due: {new Date(loan.due_date).toLocaleDateString()}</p>
                )}
                {loan.amount_repaid !== undefined && loan.amount_repaid > 0 && (
                  <p className="text-sm">💰 Repaid: ₦{loan.amount_repaid.toLocaleString()}</p>
                )}
                {loan.amount_repaid !== undefined && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      Progress: {Math.round((loan.amount_repaid / loan.amount) * 100)}%
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min((loan.amount_repaid / loan.amount) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLoans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No loans found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No loans match your search criteria." : "Start managing agricultural loans and financing."}
            </p>
            {canManage && !searchTerm && (
              <Button onClick={() => { resetForm(); setEditingLoan(null); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Loan
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Loans;