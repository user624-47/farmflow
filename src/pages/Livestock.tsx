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
import { Plus, Edit, Trash2, Search, PawPrint, Heart, Sparkles, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { SmartForm } from "@/components/ai/SmartForm";
import { AIInsights } from "@/components/ai/AIInsights";
import { LivestockBreedSelector } from "@/components/livestock/LivestockBreedSelector";
import { LivestockHealthRecord } from "@/components/livestock/LivestockHealthRecord";
import { LivestockProductionTracking } from "@/components/livestock/LivestockProductionTracking";

interface Livestock {
  id: string;
  livestock_type: string;
  breed?: string;
  quantity: number;
  age_months?: number;
  health_status: string;
  vaccination_date?: string;
  breeding_status?: string;
  productivity_data?: any;
  acquisition_date?: string;
  acquisition_cost?: number;
  notes?: string;
  created_at: string;
}

interface Farmer {
  id: string;
  first_name: string;
  last_name: string;
  farmer_id: string;
}

const Livestock = () => {
  const { user, userRole, organizationId, setupOrganization } = useAuth();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLivestock, setEditingLivestock] = useState<Livestock | null>(null);
  const [formData, setFormData] = useState({
    farmer_id: "",
    livestock_type: "",
    breed: "",
    nigerian_breed_id: "",
    quantity: "",
    age_months: "",
    health_status: "healthy",
    vaccination_date: "",
    breeding_status: "",
    acquisition_date: "",
    acquisition_cost: "",
    notes: ""
  });
  const [selectedLivestock, setSelectedLivestock] = useState<Livestock | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");

  useEffect(() => {
    fetchLivestock();
    fetchFarmers();
  }, [organizationId]);

  const fetchLivestock = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("livestock")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLivestock(data || []);
    } catch (error) {
      console.error("Fetch livestock error:", error);
      toast({
        title: "Error", 
        description: "Failed to fetch livestock. Please check your connection.",
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
      const livestockData = {
        ...formData,
        organization_id: organizationId,
        quantity: parseInt(formData.quantity),
        age_months: formData.age_months ? parseInt(formData.age_months) : null,
        acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : null,
        vaccination_date: formData.vaccination_date || null,
        acquisition_date: formData.acquisition_date || null,
      };

      if (editingLivestock) {
        const { error } = await supabase
          .from("livestock")
          .update(livestockData)
          .eq("id", editingLivestock.id);
        if (error) throw error;
        toast({ title: "Success", description: "Livestock updated successfully" });
      } else {
        const { error } = await supabase
          .from("livestock")
          .insert([livestockData]);
        if (error) throw error;
        toast({ title: "Success", description: "Livestock added successfully" });
      }

      setIsDialogOpen(false);
      setEditingLivestock(null);
      resetForm();
      fetchLivestock();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (livestock: Livestock) => {
    setEditingLivestock(livestock);
    setFormData({
      farmer_id: (livestock as any).farmer_id || "",
      livestock_type: livestock.livestock_type,
      breed: livestock.breed || "",
      nigerian_breed_id: "", // Will need to fetch from breed mapping if needed
      quantity: livestock.quantity.toString(),
      age_months: livestock.age_months?.toString() || "",
      health_status: livestock.health_status,
      vaccination_date: livestock.vaccination_date || "",
      breeding_status: livestock.breeding_status || "",
      acquisition_date: livestock.acquisition_date || "",
      acquisition_cost: livestock.acquisition_cost?.toString() || "",
      notes: livestock.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this livestock record?")) return;

    try {
      const { error } = await supabase
        .from("livestock")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Livestock deleted successfully" });
      fetchLivestock();
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
      livestock_type: "",
      breed: "",
      nigerian_breed_id: "",
      quantity: "",
      age_months: "",
      health_status: "healthy",
      vaccination_date: "",
      breeding_status: "",
      acquisition_date: "",
      acquisition_cost: "",
      notes: ""
    });
  };

  const handleAISuggestion = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(value) ? value.join(", ") : value.toString()
    }));
  };

  const handleBreedSelect = (breedId: string, breedName: string) => {
    setFormData(prev => ({
      ...prev,
      nigerian_breed_id: breedId,
      breed: breedName
    }));
  };

  const handleViewLivestock = (livestock: Livestock) => {
    setSelectedLivestock(livestock);
    setViewMode("details");
  };

  const handleBackToList = () => {
    setSelectedLivestock(null);
    setViewMode("list");
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "outline";
      case "sick": return "destructive";
      case "recovering": return "secondary";
      default: return "secondary";
    }
  };

  const filteredLivestock = livestock.filter(item =>
    item.livestock_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.health_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = true; // Always allow for demo - was: userRole === "admin" || userRole === "extension_officer" || userRole === "farmer";

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access livestock management.</p>
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PawPrint className="h-8 w-8" />
            Livestock Management
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Enhanced
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Track livestock health, breeding, and productivity with AI insights
          </p>
        </div>
      </div>

      <Tabs defaultValue="livestock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="livestock">Livestock</TabsTrigger>
          <TabsTrigger value="health">Health Records</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="livestock" className="space-y-6">
          {viewMode === "list" ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  {!user && <p className="text-sm text-muted-foreground">Not authenticated - showing demo mode</p>}
                  {user && !userRole && <p className="text-sm text-muted-foreground">Loading user permissions...</p>}
                  {user && userRole && <p className="text-sm text-muted-foreground">Role: {userRole}</p>}
                </div>
                {canManage && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingLivestock(null); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Livestock
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLivestock ? "Edit Livestock" : "Add New Livestock"}
                    </DialogTitle>
                    <DialogDescription>
                      Record livestock information and management details.
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
                        <Label htmlFor="livestock_type">Livestock Type</Label>
                        <Select value={formData.livestock_type} onValueChange={(value) => setFormData({...formData, livestock_type: value})} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cattle">Cattle</SelectItem>
                            <SelectItem value="goat">Goats</SelectItem>
                            <SelectItem value="sheep">Sheep</SelectItem>
                            <SelectItem value="poultry">Poultry</SelectItem>
                            <SelectItem value="fish">Fish</SelectItem>
                            <SelectItem value="pig">Pigs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <LivestockBreedSelector
                          livestockType={formData.livestock_type}
                          selectedBreed={formData.nigerian_breed_id}
                          onBreedSelect={handleBreedSelect}
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="age_months">Age (Months)</Label>
                        <Input
                          id="age_months"
                          type="number"
                          value={formData.age_months}
                          onChange={(e) => setFormData({...formData, age_months: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="health_status">Health Status</Label>
                        <Select value={formData.health_status} onValueChange={(value) => setFormData({...formData, health_status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="sick">Sick</SelectItem>
                            <SelectItem value="recovering">Recovering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vaccination_date">Last Vaccination</Label>
                        <Input
                          id="vaccination_date"
                          type="date"
                          value={formData.vaccination_date}
                          onChange={(e) => setFormData({...formData, vaccination_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="breeding_status">Breeding Status</Label>
                        <Select value={formData.breeding_status} onValueChange={(value) => setFormData({...formData, breeding_status: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="breeding">Breeding</SelectItem>
                            <SelectItem value="pregnant">Pregnant</SelectItem>
                            <SelectItem value="lactating">Lactating</SelectItem>
                            <SelectItem value="not_breeding">Not Breeding</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="acquisition_date">Acquisition Date</Label>
                        <Input
                          id="acquisition_date"
                          type="date"
                          value={formData.acquisition_date}
                          onChange={(e) => setFormData({...formData, acquisition_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="acquisition_cost">Acquisition Cost (₦)</Label>
                        <Input
                          id="acquisition_cost"
                          type="number"
                          step="0.01"
                          value={formData.acquisition_cost}
                          onChange={(e) => setFormData({...formData, acquisition_cost: e.target.value})}
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
                      formType="livestock"
                      formData={formData}
                      onSuggestion={handleAISuggestion}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">
                        {editingLivestock ? "Update Livestock" : "Add Livestock"}
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
              placeholder="Search livestock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLivestock.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="text-lg capitalize cursor-pointer"
                      onClick={() => handleViewLivestock(item)}
                    >
                      {item.livestock_type}
                    </CardTitle>
                    {canManage && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLivestock(item);
                          }}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant={getHealthStatusColor(item.health_status)} className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {item.health_status}
                    </Badge>
                    {item.breed && <span className="text-sm">• {item.breed}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      🐄 {item.quantity} {item.quantity === 1 ? 'head' : 'heads'}
                    </p>
                    {item.age_months && (
                      <p className="text-sm">📅 {item.age_months} months old</p>
                    )}
                    {item.vaccination_date && (
                      <p className="text-sm">💉 Last vaccinated: {new Date(item.vaccination_date).toLocaleDateString()}</p>
                    )}
                    {item.breeding_status && (
                      <p className="text-sm">🐣 {item.breeding_status.replace("_", " ")}</p>
                    )}
                    {item.acquisition_date && (
                      <p className="text-sm">📦 Acquired: {new Date(item.acquisition_date).toLocaleDateString()}</p>
                    )}
                    {item.acquisition_cost && (
                      <p className="text-sm">💰 Cost: ₦{item.acquisition_cost.toLocaleString()}</p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-muted-foreground">📝 {item.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLivestock.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PawPrint className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No livestock found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? "No livestock match your search criteria." : "Start tracking livestock health and productivity."}
                </p>
                {canManage && !searchTerm && (
                  <Button onClick={() => { resetForm(); setEditingLivestock(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Livestock
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
            </>
          ) : (
            selectedLivestock && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleBackToList}>
                    ← Back to Livestock List
                  </Button>
                  <h2 className="text-2xl font-bold capitalize">
                    {selectedLivestock.livestock_type} Management
                  </h2>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PawPrint className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={getHealthStatusColor(selectedLivestock.health_status)}>
                            <Heart className="h-3 w-3 mr-1" />
                            {selectedLivestock.health_status}
                          </Badge>
                          {selectedLivestock.breed && <span>• {selectedLivestock.breed}</span>}
                        </div>
                        <p className="text-lg font-semibold">
                          🐄 {selectedLivestock.quantity} {selectedLivestock.quantity === 1 ? 'head' : 'heads'}
                        </p>
                        {selectedLivestock.age_months && (
                          <p>📅 {selectedLivestock.age_months} months old</p>
                        )}
                        {selectedLivestock.vaccination_date && (
                          <p>💉 Last vaccinated: {new Date(selectedLivestock.vaccination_date).toLocaleDateString()}</p>
                        )}
                        {selectedLivestock.breeding_status && (
                          <p>🐣 {selectedLivestock.breeding_status.replace("_", " ")}</p>
                        )}
                        {selectedLivestock.acquisition_cost && (
                          <p>💰 Acquisition Cost: ₦{selectedLivestock.acquisition_cost.toLocaleString()}</p>
                        )}
                        {selectedLivestock.notes && (
                          <p className="text-muted-foreground">📝 {selectedLivestock.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <LivestockProductionTracking
                    livestockId={selectedLivestock.id}
                    livestockType={selectedLivestock.livestock_type}
                    organizationId={organizationId!}
                  />
                </div>

                <LivestockHealthRecord
                  livestockId={selectedLivestock.id}
                  organizationId={organizationId!}
                />
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="health">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Health Management</h2>
            <p className="text-muted-foreground">
              Comprehensive health tracking for all livestock in your organization.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredLivestock.map((animal) => (
                <Card key={animal.id}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{animal.livestock_type}</CardTitle>
                    <CardDescription>
                      {animal.breed && <span>{animal.breed} • </span>}
                      {animal.quantity} {animal.quantity === 1 ? 'head' : 'heads'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LivestockHealthRecord
                      livestockId={animal.id}
                      organizationId={organizationId!}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="production">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Production Tracking</h2>
            <p className="text-muted-foreground">
              Track milk, eggs, offspring, and other livestock production.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredLivestock.map((animal) => (
                <Card key={animal.id}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{animal.livestock_type}</CardTitle>
                    <CardDescription>
                      {animal.breed && <span>{animal.breed} • </span>}
                      {animal.quantity} {animal.quantity === 1 ? 'head' : 'heads'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LivestockProductionTracking
                      livestockId={animal.id}
                      livestockType={animal.livestock_type}
                      organizationId={organizationId!}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          {organizationId && (
            <AIInsights organizationId={organizationId} moduleType="livestock" />
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredLivestock.slice(0, 4).map((animal) => (
              <AIRecommendations
                key={animal.id}
                type="livestock"
                data={animal}
                organizationId={organizationId}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Livestock;