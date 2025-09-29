import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";

interface Farmer {
  id: string;
  first_name: string;
  last_name: string;
  farmer_id: string;
}

const CropForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(!!id);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [formData, setFormData] = useState({
    farmer_id: "",
    crop_name: "",
    variety: "",
    planting_date: "",
    expected_harvest_date: "",
    actual_harvest_date: "",
    farm_area: "",
    quantity_planted: "",
    quantity_harvested: "",
    unit: "kg",
    season: "",
    status: "planted",
    notes: ""
  });

  // Fetch farmers and crop data (if editing)
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;

      try {
        // Fetch farmers
        const { data: farmersData } = await supabase
          .from("farmers")
          .select("id, first_name, last_name, farmer_id")
          .eq("organization_id", organizationId);
        
        setFarmers(farmersData || []);

        // If editing, fetch crop data
        if (id) {
          const { data: cropData, error } = await supabase
            .from("crops")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (!cropData) {
            navigate("/crops");
            return;
          }

          setFormData({
            farmer_id: cropData.farmer_id || "",
            crop_name: cropData.crop_name || "",
            variety: cropData.variety || "",
            planting_date: cropData.planting_date || "",
            expected_harvest_date: cropData.expected_harvest_date || "",
            actual_harvest_date: cropData.actual_harvest_date || "",
            farm_area: cropData.farm_area?.toString() || "",
            quantity_planted: cropData.quantity_planted?.toString() || "",
            quantity_harvested: cropData.quantity_harvested?.toString() || "",
            unit: cropData.unit || "kg",
            season: cropData.season || "",
            status: cropData.status || "planted",
            notes: cropData.notes || ""
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
        navigate("/crops");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, organizationId, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.crop_name) {
      toast({
        title: "Error",
        description: "Crop name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const cropData = {
        ...formData,
        farm_area: formData.farm_area ? parseFloat(formData.farm_area) : null,
        quantity_planted: formData.quantity_planted ? parseFloat(formData.quantity_planted) : null,
        quantity_harvested: formData.quantity_harvested ? parseFloat(formData.quantity_harvested) : null,
        organization_id: organizationId,
        updated_at: new Date().toISOString()
      };

      if (id) {
        // Update existing crop
        const { error } = await supabase
          .from('crops')
          .update(cropData)
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Crop updated successfully",
        });
      } else {
        // Create new crop
        const { error } = await supabase
          .from('crops')
          .insert([{
            ...cropData,
            created_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Crop added successfully",
        });
      }
      
      navigate("/crops");
    } catch (error) {
      console.error('Error saving crop:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save crop",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Crops
      </Button>

      <h1 className="text-3xl font-bold mb-6">
        {id ? 'Edit Crop' : 'Add New Crop'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="crop_name">Crop Name *</Label>
            <Input
              id="crop_name"
              name="crop_name"
              value={formData.crop_name}
              onChange={handleChange}
              placeholder="e.g., Maize, Wheat, Rice"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variety">Variety</Label>
            <Input
              id="variety"
              name="variety"
              value={formData.variety}
              onChange={handleChange}
              placeholder="e.g., Hybrid 621, Pusa Basmati"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmer_id">Farmer</Label>
            <Select
              value={formData.farmer_id}
              onValueChange={(value) => handleSelectChange('farmer_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a farmer" />
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

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planted">Planted</SelectItem>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="ready_for_harvest">Ready for Harvest</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
                <SelectItem value="diseased">Diseased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planting_date">Planting Date</Label>
            <Input
              id="planting_date"
              name="planting_date"
              type="date"
              value={formData.planting_date}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_harvest_date">Expected Harvest Date</Label>
            <Input
              id="expected_harvest_date"
              name="expected_harvest_date"
              type="date"
              value={formData.expected_harvest_date}
              onChange={handleChange}
            />
          </div>

          {formData.status === 'harvested' && (
            <div className="space-y-2">
              <Label htmlFor="actual_harvest_date">Actual Harvest Date</Label>
              <Input
                id="actual_harvest_date"
                name="actual_harvest_date"
                type="date"
                value={formData.actual_harvest_date}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="farm_area">Farm Area (acres)</Label>
            <Input
              id="farm_area"
              name="farm_area"
              type="number"
              step="0.01"
              min="0"
              value={formData.farm_area}
              onChange={handleChange}
              placeholder="e.g., 2.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_planted">Quantity Planted</Label>
            <div className="flex gap-2">
              <Input
                id="quantity_planted"
                name="quantity_planted"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity_planted}
                onChange={handleChange}
                placeholder="e.g., 10"
              />
              <Select
                value={formData.unit}
                onValueChange={(value) => handleSelectChange('unit', value)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ton">ton</SelectItem>
                  <SelectItem value="bag">bag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.status === 'harvested' && (
            <div className="space-y-2">
              <Label htmlFor="quantity_harvested">Quantity Harvested</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity_harvested"
                  name="quantity_harvested"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity_harvested}
                  onChange={handleChange}
                  placeholder="e.g., 150"
                />
                <div className="flex items-center px-3 border rounded-md bg-muted">
                  {formData.unit}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              name="season"
              value={formData.season}
              onChange={handleChange}
              placeholder="e.g., Summer 2023, Rabi 2023"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this crop..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/crops")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : id ? 'Update Crop' : 'Add Crop'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CropForm;
