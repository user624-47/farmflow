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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Package, Sparkles, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { SmartForm } from "@/components/ai/SmartForm";
import { AIInsights } from "@/components/ai/AIInsights";

interface Input {
  id: string;
  input_type: string;
  input_name: string;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
  total_cost?: number;
  supplier?: string;
  date_supplied: string;
  season?: string;
  notes?: string;
  created_at: string;
}

interface Farmer {
  id: string;
  first_name: string;
  last_name: string;
  farmer_id: string;
}

const Inputs = () => {
  const { user, userRole, organizationId, setupOrganization } = useAuth();
  const [inputs, setInputs] = useState<Input[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<Input | null>(null);
  const [formData, setFormData] = useState({
    farmer_id: "",
    input_type: "",
    input_name: "",
    quantity: "",
    unit: "",
    cost_per_unit: "",
    total_cost: "",
    supplier: "",
    date_supplied: "",
    season: "",
    notes: ""
  });

  useEffect(() => {
    fetchInputs();
    fetchFarmers();
  }, [organizationId]);

  const fetchInputs = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("inputs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date_supplied", { ascending: false });

      if (error) throw error;
      setInputs(data || []);
    } catch (error) {
      console.error("Fetch inputs error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inputs. Please check your connection.",
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
    
    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization not set up. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      const inputData = {
        ...formData,
        organization_id: organizationId,
        quantity: parseFloat(formData.quantity),
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
        farmer_id: formData.farmer_id || null,
      };

      if (editingInput) {
        const { error } = await supabase
          .from("inputs")
          .update(inputData)
          .eq("id", editingInput.id);
        if (error) throw error;
        toast({ title: "Success", description: "Input updated successfully" });
      } else {
        const { error } = await supabase
          .from("inputs")
          .insert([inputData]);
        if (error) throw error;
        toast({ title: "Success", description: "Input added successfully" });
      }

      setIsDialogOpen(false);
      setEditingInput(null);
      resetForm();
      fetchInputs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (input: Input) => {
    setEditingInput(input);
    setFormData({
      farmer_id: (input as any).farmer_id || "",
      input_type: input.input_type,
      input_name: input.input_name,
      quantity: input.quantity.toString(),
      unit: input.unit,
      cost_per_unit: input.cost_per_unit?.toString() || "",
      total_cost: input.total_cost?.toString() || "",
      supplier: input.supplier || "",
      date_supplied: input.date_supplied,
      season: input.season || "",
      notes: input.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this input record?")) return;

    try {
      const { error } = await supabase
        .from("inputs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Input deleted successfully" });
      fetchInputs();
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
      input_type: "",
      input_name: "",
      quantity: "",
      unit: "",
      cost_per_unit: "",
      total_cost: "",
      supplier: "",
      date_supplied: "",
      season: "",
      notes: ""
    });
  };

  const handleAISuggestion = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(value) ? value.join(", ") : value.toString()
    }));
  };

  const filteredInputs = inputs.filter(input =>
    input.input_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    input.input_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    input.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = true; // Always allow for demo - was: userRole === "admin" || userRole === "extension_officer";

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access input management.</p>
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Organization Setup Required</h2>
          <p className="text-muted-foreground mb-4">Setting up your organization...</p>
          <Button onClick={() => setupOrganization()}>Set Up Organization</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">
            <Package className="h-8 w-8" />
            Agricultural Inputs
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Enhanced
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Track seeds, fertilizers, equipment with AI-powered cost optimization
          </p>
        </div>
      </div>

      <Tabs defaultValue="inputs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inputs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cost Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              {!user && <p className="text-sm text-muted-foreground">Not authenticated - showing demo mode</p>}
              {user && !userRole && <p className="text-sm text-muted-foreground">Loading user permissions...</p>}
              {user && userRole && <p className="text-sm text-muted-foreground">Role: {userRole}</p>}
            </div>
            {/* Always show button for demo purposes - remove canManage condition temporarily */}
            {true && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingInput(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Input
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInput ? "Edit Input" : "Add New Input"}
                </DialogTitle>
                <DialogDescription>
                  Record input distribution details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farmer_id">Farmer (Optional)</Label>
                    <Select value={formData.farmer_id} onValueChange={(value) => setFormData({...formData, farmer_id: value})}>
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
                    <Label htmlFor="input_type">Input Type</Label>
                    <Select value={formData.input_type} onValueChange={(value) => setFormData({...formData, input_type: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seed">Seeds</SelectItem>
                        <SelectItem value="fertilizer">Fertilizer</SelectItem>
                        <SelectItem value="pesticide">Pesticides</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="input_name">Input Name</Label>
                    <Input
                      id="input_name"
                      value={formData.input_name}
                      onChange={(e) => setFormData({...formData, input_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="tonnes">Tonnes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cost_per_unit">Cost per Unit (₦)</Label>
                    <Input
                      id="cost_per_unit"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_supplied">Date Supplied</Label>
                    <Input
                      id="date_supplied"
                      type="date"
                      value={formData.date_supplied}
                      onChange={(e) => setFormData({...formData, date_supplied: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="season">Season</Label>
                    <Input
                      id="season"
                      value={formData.season}
                      onChange={(e) => setFormData({...formData, season: e.target.value})}
                      placeholder="e.g., 2024 Wet Season"
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
                
                <SmartForm
                  formType="input"
                  formData={formData}
                  onSuggestion={handleAISuggestion}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    {editingInput ? "Update Input" : "Add Input"}
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
          placeholder="Search inputs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInputs.map((input) => (
          <Card key={input.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{input.input_name}</CardTitle>
                {canManage && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(input)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(input.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                <Badge variant="secondary">{input.input_type}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  📦 {input.quantity} {input.unit}
                </p>
                {input.cost_per_unit && (
                  <p className="text-sm">💰 ₦{input.cost_per_unit}/{input.unit}</p>
                )}
                {input.total_cost && (
                  <p className="text-sm font-semibold">Total: ₦{input.total_cost}</p>
                )}
                {input.supplier && (
                  <p className="text-sm">🏢 {input.supplier}</p>
                )}
                <p className="text-sm">📅 {new Date(input.date_supplied).toLocaleDateString()}</p>
                {input.season && (
                  <p className="text-sm">🌱 {input.season}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInputs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inputs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No inputs match your search criteria." : "Start tracking agricultural inputs and supplies."}
            </p>
            {canManage && !searchTerm && (
              <Button onClick={() => { resetForm(); setEditingInput(null); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Input
              </Button>
            )}
          </CardContent>
        </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Input Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ₦{filteredInputs.reduce((acc, input) => acc + (input.total_cost || 0), 0).toLocaleString()}
                </p>
                <p className="text-muted-foreground">This period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Most Used Input</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Object.entries(
                    filteredInputs.reduce((acc: any, input) => {
                      acc[input.input_type] = (acc[input.input_type] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || "N/A"}
                </p>
                <p className="text-muted-foreground">Input type</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Cost per Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₦{(filteredInputs.reduce((acc, input) => acc + (input.cost_per_unit || 0), 0) / filteredInputs.length || 0).toFixed(2)}
                </p>
                <p className="text-muted-foreground">Across all inputs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {organizationId && (
            <AIInsights organizationId={organizationId} moduleType="inputs" />
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredInputs.slice(0, 4).map((input) => (
              <AIRecommendations
                key={input.id}
                type="input"
                data={input}
                organizationId={organizationId}
              />
            ))}
          </div>
          {filteredInputs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Inputs for AI Analysis</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add agricultural inputs to get AI-powered cost optimization recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inputs;