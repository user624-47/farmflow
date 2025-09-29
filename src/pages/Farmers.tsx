import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Users, Sparkles, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { SmartForm } from "@/components/ai/SmartForm";
import { AIInsights } from "@/components/ai/AIInsights";

interface Farmer {
  id: string;
  farmer_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  farm_size?: number;
  farm_location?: string;
  crops_grown?: string[];
  livestock_owned?: string[];
  created_at: string;
}

const Farmers = () => {
  const { user, userRole, organizationId, setupOrganization } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState({
    farmer_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    farm_size: "",
    farm_location: "",
    state: "",
    lga: "",
    crops_grown: "",
    livestock_owned: ""
  });

  useEffect(() => {
    fetchFarmers();
  }, [organizationId]);

  const fetchFarmers = async () => {
    if (!organizationId) {
      console.log("No organizationId found:", { user, userRole, organizationId });
      setLoading(false);
      return;
    }
    
    console.log("Fetching farmers with organizationId:", organizationId, "user:", user?.id);
    
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      console.log("Farmers fetch result:", { data, error });

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error("Fetch farmers error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch farmers. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      const farmerData = {
        ...formData,
        organization_id: organizationId,
        farm_size: formData.farm_size ? parseFloat(formData.farm_size) : null,
        crops_grown: formData.crops_grown ? formData.crops_grown.split(",").map(s => s.trim()) : null,
        livestock_owned: formData.livestock_owned ? formData.livestock_owned.split(",").map(s => s.trim()) : null,
      };

      if (editingFarmer) {
        const { error } = await supabase
          .from("farmers")
          .update(farmerData)
          .eq("id", editingFarmer.id);
        if (error) throw error;
        toast({ title: "Success", description: "Farmer updated successfully" });
      } else {
        const { error } = await supabase
          .from("farmers")
          .insert([farmerData]);
        if (error) throw error;
        toast({ title: "Success", description: "Farmer added successfully" });
      }

      setIsDialogOpen(false);
      setEditingFarmer(null);
      resetForm();
      fetchFarmers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      farmer_id: farmer.farmer_id,
      first_name: farmer.first_name,
      last_name: farmer.last_name,
      phone: farmer.phone || "",
      email: farmer.email || "",
      farm_size: farmer.farm_size?.toString() || "",
      farm_location: farmer.farm_location || "",
      state: "",
      lga: "",
      crops_grown: farmer.crops_grown?.join(", ") || "",
      livestock_owned: farmer.livestock_owned?.join(", ") || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this farmer?")) return;

    try {
      const { error } = await supabase
        .from("farmers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Farmer deleted successfully" });
      fetchFarmers();
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
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      farm_size: "",
      farm_location: "",
      state: "",
      lga: "",
      crops_grown: "",
      livestock_owned: ""
    });
  };

  const handleAISuggestion = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(value) ? value.join(", ") : value.toString()
    }));
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.farmer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = true; // Always allow for demo - was: userRole === "admin" || userRole === "extension_officer";
  const canViewAll = true; // Always allow for demo - was: userRole === "admin" || userRole === "extension_officer";

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access farmer management.</p>
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
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">
            <Users className="h-8 w-8" />
            Farmers Management
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Manage farmer registrations with AI-powered insights and recommendations
          </p>
        </div>
      </div>

      <Tabs defaultValue="farmers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="farmers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Farmers
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

        <TabsContent value="farmers" className="space-y-6">
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
              <Button onClick={() => { resetForm(); setEditingFarmer(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Farmer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFarmer ? "Edit Farmer" : "Add New Farmer"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the farmer's information below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farmer_id">Farmer ID</Label>
                    <Input
                      id="farmer_id"
                      value={formData.farmer_id}
                      onChange={(e) => setFormData({...formData, farmer_id: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm_size">Farm Size (hectares)</Label>
                    <Input
                      id="farm_size"
                      type="number"
                      step="0.1"
                      value={formData.farm_size}
                      onChange={(e) => setFormData({...formData, farm_size: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="farm_location">Farm Location</Label>
                  <Input
                    id="farm_location"
                    value={formData.farm_location}
                    onChange={(e) => setFormData({...formData, farm_location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="crops_grown">Crops Grown (comma-separated)</Label>
                  <Input
                    id="crops_grown"
                    value={formData.crops_grown}
                    onChange={(e) => setFormData({...formData, crops_grown: e.target.value})}
                    placeholder="e.g., Rice, Maize, Cassava"
                  />
                </div>
                <div>
                  <Label htmlFor="livestock_owned">Livestock Owned (comma-separated)</Label>
                  <Input
                    id="livestock_owned"
                    value={formData.livestock_owned}
                    onChange={(e) => setFormData({...formData, livestock_owned: e.target.value})}
                    placeholder="e.g., Cattle, Goats, Poultry"
                  />
                </div>
                
                <SmartForm
                  formType="farmer"
                  formData={formData}
                  onSuggestion={handleAISuggestion}
                  farmLocation={formData.farm_location || "Nigeria"}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    {editingFarmer ? "Update Farmer" : "Add Farmer"}
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
          placeholder="Search farmers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFarmers.map((farmer) => (
          <Card key={farmer.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {farmer.first_name} {farmer.last_name}
                </CardTitle>
                {canManage && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(farmer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(farmer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                Farmer ID: {farmer.farmer_id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {farmer.phone && (
                  <p className="text-sm">📞 {farmer.phone}</p>
                )}
                {farmer.farm_size && (
                  <p className="text-sm">🌾 {farmer.farm_size} hectares</p>
                )}
                {farmer.farm_location && (
                  <p className="text-sm">📍 {farmer.farm_location}</p>
                )}
                {farmer.crops_grown && farmer.crops_grown.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {farmer.crops_grown.map((crop, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {crop}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFarmers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farmers found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No farmers match your search criteria." : "Get started by adding your first farmer."}
            </p>
            {canManage && !searchTerm && (
              <Button onClick={() => { resetForm(); setEditingFarmer(null); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Farmer
              </Button>
            )}
          </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {organizationId && (
            <AIInsights organizationId={organizationId} moduleType="farmers" />
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredFarmers.slice(0, 4).map((farmer) => (
              <AIRecommendations
                key={farmer.id}
                type="farmer"
                data={farmer}
                farmLocation={farmer.farm_location || "Nigeria"}
                organizationId={organizationId}
              />
            ))}
          </div>
          {filteredFarmers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Farmers for AI Analysis</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add farmers to get AI-powered recommendations and insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Farmers;