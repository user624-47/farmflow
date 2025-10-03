// React & Hooks
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { WeatherRecords } from "@/components/weather/WeatherRecords";

// State Management
import { useAuth } from "@/contexts/AuthContext";
import { useFarmLocation } from "@/hooks/useFarmLocation";
import { toast, useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';

// Supabase
import { supabase } from "@/integrations/supabase/client";

// Services
import { getCropLocations, updateCropLocation } from "@/services/cropLocationService";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { 
  Popover, 
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Map Components
import { CropsMapView } from "@/components/crops/CropsMapView";
import { getStatusColor } from "@/utils/ui";

// Types
import type { Crop } from "@/types/crop";

// Define Farmer type locally since the module is missing
type Farmer = {
  id: string;
  first_name: string;
  last_name: string;
  farmer_id: string;
};

// Utils & Helpers
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { compressImage, validateImageFile } from "@/utils/imageUtils";
import { validateCropForm } from "@/utils/validation";

// Custom Hooks & Components
import { useCrops } from "@/hooks/useCrops";
import { CropCard } from "@/components/crops/CropCard";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { AIInsights } from "@/components/ai/AIInsights";

// Icons
import { 
  PlusCircle, 
  MapPin, 
  Map, 
  List, 
  Droplet, 
  Thermometer, 
  CloudRain,
  Check,
  ChevronsUpDown,
  Calendar,
  Droplets, 
  Edit, 
  Filter, 
  Image as ImageIcon, 
  Leaf, 
  Loader2, 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Wheat, 
  X,
  BarChart3
} from "lucide-react";

// Features
import { 
  SoilHealthMonitor, 
  PestDiseaseIdentifier, 
  CropGrowthMonitor 
} from "@/features/precision-agriculture";

// Using Crop type from @/types/crop
// getStatusColor is now imported from @/utils/ui

// Moved to @/components/crops/CropCard.tsx

interface CropForm extends Omit<Crop, 'id' | 'created_at' | 'updated_at' | 'farmer' | 'organization_id' | 'farm_area' | 'quantity_planted' | 'quantity_harvested'> {
  // Override specific fields to be required or have different types for the form
  farmer_id: string;
  crop_name: string;
  status: 'planted' | 'growing' | 'harvested' | 'failed' | 'ready_for_harvest' | 'diseased';
  // Form fields as strings for controlled inputs
  farm_area: string;
  quantity_planted: string;
  quantity_harvested: string;
  [key: string]: any; // Add index signature to match the base interface
}
// Main Crops Component with Map View
const Crops = () => {
  const { user, userRole, organizationId, setupOrganization } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Get farm location
  const { farmLocation, isLoading: isLoadingLocation, error: locationError } = useFarmLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    farmLocation ? { lat: farmLocation.latitude, lng: farmLocation.longitude } : null
  );
  const [farmers, setFarmers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    hasMore: false,
    total: 0
  });
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [soilData, setSoilData] = useState<{
    ph: number;
    type: string;
    organicMatter: number;
    moisture: number;
  } | null>(null);
  const [geofenceBoundary, setGeofenceBoundary] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch soil data based on location
  const fetchSoilData = useCallback(async (lat: number, lng: number) => {
    try {
      // In a real app, this would call your soil API
      // For now, we'll use mock data
      const mockSoilData = {
        ph: 6.5 + (Math.random() * 2 - 1), // Random pH between 5.5 and 7.5
        type: ['Clay', 'Loam', 'Sandy', 'Silt'][Math.floor(Math.random() * 4)],
        organicMatter: 2.5 + (Math.random() * 3), // 2.5% to 5.5%
        moisture: 30 + (Math.random() * 40) // 30% to 70%
      };
      setSoilData(mockSoilData);
      return mockSoilData;
    } catch (error) {
      console.error('Error fetching soil data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch soil data for this location',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);
  
  // Handle location selection from map
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    await fetchSoilData(lat, lng);
  }, [fetchSoilData]);
  
  const [formData, setFormData] = useState<CropForm>({
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
    notes: "",
    image_url: ""
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview URL when editingCrop changes
  useEffect(() => {
    if (editingCrop?.image_url) {
      setPreviewUrl(editingCrop.image_url);
    } else {
      setPreviewUrl(null);
    }
  }, [editingCrop]);

  // Check if user can manage crops
  const canManage = ['admin', 'manager', 'extension_officer'].includes(userRole || '');
  
  // Filter crops based on search term
  const filteredCrops = crops.filter(crop => 
    crop.crop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (crop.variety && crop.variety.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (crop.notes && crop.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Reset form to initial state
  const resetForm = () => {
    setFormData({
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
      notes: "",
      image_url: ""
    });
    setPreviewUrl(null);
    setEditingCrop(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization ID is missing. Please refresh the page and try again.",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    try {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Compress image before upload
      const compressedFile = await compressImage(file);

      // Create a sanitized file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${organizationId}/${fileName}`;

      // Upload the file to the 'crops' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('crops')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: compressedFile.type
        });

      if (uploadError) throw uploadError;

      if (!uploadData?.path) {
        throw new Error("Upload failed: No path returned");
      }

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('crops')
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error("Could not generate public URL for the uploaded file");
      }

      // Add timestamp to URL to prevent caching issues
      const timestamp = new Date().getTime();
      const urlWithCacheBust = `${publicUrl}?t=${timestamp}`;

      setFormData(prev => ({ ...prev, image_url: urlWithCacheBust }));
      setPreviewUrl(urlWithCacheBust);
      return urlWithCacheBust;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image (JPEG, PNG, WebP, or GIF)",
        variant: "destructive"
      });
      if (e.target) e.target.value = '';
      return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Please upload an image smaller than 5MB (current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        variant: "destructive"
      });
      if (e.target) e.target.value = '';
      return;
    }
    
    try {
      const result = await handleImageUpload(file);
      if (!result && e.target) {
        e.target.value = ''; // Reset file input if upload failed
      }
    } catch (error) {
      console.error('Error in file change handler:', error);
      if (e.target) e.target.value = '';
    }
  };

  // Handle form submission with enhanced error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using our validation utility
    const { valid, errors } = validateCropForm(formData);
    
    if (!valid) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive"
        });
      }
      return;
    }

    setLoading(true);
    
    try {
      // Prepare crop data with proper types
      const cropData = {
        ...formData,
        farm_area: formData.farm_area ? parseFloat(formData.farm_area) : null,
        quantity_planted: formData.quantity_planted ? parseInt(formData.quantity_planted, 10) : null,
        quantity_harvested: formData.quantity_harvested ? parseInt(formData.quantity_harvested, 10) : null,
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
        // Keep existing image_url if no new image was uploaded during edit
        image_url: formData.image_url || editingCrop?.image_url || null
      };

      if (editingCrop) {
        // Update existing crop
        const { data, error } = await supabase
          .from('crops')
          .update(cropData)
          .eq('id', editingCrop.id)
          .select()
          .single();

        if (error) throw new Error(`Failed to update crop: ${error.message}`);
        
        toast({
          title: "Success",
          description: "Crop updated successfully",
          variant: "default"
        });
      } else {
        // Create new crop
        const { data, error } = await supabase
          .from('crops')
          .insert([cropData])
          .select()
          .single();

        if (error) throw new Error(`Failed to create crop: ${error.message}`);
        
        toast({
          title: "Success",
          description: "Crop added successfully",
          variant: "default"
        });
      }

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      fetchCrops(1); // Reset to first page
      
    } catch (error) {
      console.error('Error saving crop:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: "Error",
        description: `Failed to save crop: ${errorMessage}`,
        variant: "destructive"
      });
      
      // Log detailed error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Detailed error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit crop
  const handleEdit = (crop: Crop) => {
    setEditingCrop(crop);
    setFormData({
      farmer_id: crop.farmer_id || "",
      crop_name: crop.crop_name || "",
      variety: crop.variety || "",
      planting_date: crop.planting_date || "",
      expected_harvest_date: crop.expected_harvest_date || "",
      actual_harvest_date: crop.actual_harvest_date || "",
      farm_area: crop.farm_area?.toString() || "",
      quantity_planted: crop.quantity_planted?.toString() || "",
      quantity_harvested: crop.quantity_harvested?.toString() || "",
      unit: crop.unit || "kg",
      season: crop.season || "",
      status: crop.status,
      notes: crop.notes || "",
      image_url: crop.image_url || ""
    });
    setPreviewUrl(crop.image_url || null);
    setIsDialogOpen(true);
  };


  // Set up real-time subscription for crops
  const setupRealtimeSubscription = () => {
    if (!organizationId) return () => {};
    
    const subscription = supabase
      .channel('crops_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crops',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setCrops(prevCrops => [payload.new as Crop, ...prevCrops]);
              break;
            case 'UPDATE':
              setCrops(prevCrops => 
                prevCrops.map(crop => 
                  crop.id === payload.new.id ? { ...crop, ...payload.new } as Crop : crop
                )
              );
              break;
            case 'DELETE':
              setCrops(prevCrops => 
                prevCrops.filter(crop => crop.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe();
    };
  };

  // Fetch crops data with pagination
  const fetchCrops = async (page = 1, pageSize = 10) => {
    if (!organizationId) return;
    
    setLoading(true);
    
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // First, get the total count
      const { count, error: countError } = await supabase
        .from("crops")
        .select('*', { count: 'exact', head: true })
        .eq("organization_id", organizationId);
      
      if (countError) throw countError;
      
      // Then get the paginated data
      const { data, error } = await supabase
        .from("crops")
        .select(`
          *,
          farmer:farmer_id (first_name, last_name, farmer_id)
        `)
        .eq("organization_id", organizationId)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      const newCrops = (data || []) as Crop[];
      setCrops(prev => page === 1 ? newCrops : [...prev, ...newCrops]);
      
      setPagination(prev => ({
        ...prev,
        page,
        hasMore: (count || 0) > to + 1,
        total: count || 0
      }));
      
    } catch (error) {
      console.error("Error fetching crops:", error);
      toast({
        title: "Error",
        description: "Failed to fetch crops. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load more crops
  const loadMoreCrops = () => {
    if (pagination.hasMore) {
      fetchCrops(pagination.page + 1, pagination.pageSize);
    }
  };

  // Fetch farmers data
  const fetchFarmers = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) throw error;
      
      setFarmers(data || []);
    } catch (error) {
      console.error("Error fetching farmers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch farmers. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete crop
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;
    
    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // The real-time subscription will update the UI automatically
      toast({
        title: "Success",
        description: "Crop deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast({
        title: "Error",
        description: "Failed to delete crop",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription and fetch initial data
  useEffect(() => {
    if (!organizationId) return;

    // Set up real-time subscription
    const subscription = setupRealtimeSubscription();

    // Fetch initial data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch crops with farmer data
        const { data: cropsData, error: cropsError } = await supabase
          .from("crops")
          .select(`
            *,
            farmer:farmer_id (id, first_name, last_name, farmer_id)
          `)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });

        if (cropsError) throw cropsError;
        
        // Fetch farmers
        const { data: farmersData, error: farmersError } = await supabase
          .from("farmers")
          .select("id, first_name, last_name, farmer_id")
          .eq("organization_id", organizationId);
          
        if (farmersError) throw farmersError;
        
        setCrops((cropsData || []) as Crop[]);
        setFarmers(farmersData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup subscription on unmount
    return () => {
      subscription();
    };
  }, [organizationId]);

  if (!organizationId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Organization Setup Required</h2>
          <p className="text-muted-foreground mb-4">Please set up your organization to continue</p>
          <Button onClick={() => setupOrganization && setupOrganization()}>Set Up Organization</Button>
        </div>
      </div>
    );
  }

  // Group crops by status for the tabs
  const cropsByStatus = {
    planted: filteredCrops.filter(crop => crop.status === 'planted'),
    growing: filteredCrops.filter(crop => crop.status === 'growing'),
    ready_for_harvest: filteredCrops.filter(crop => crop.status === 'ready_for_harvest'),
    harvested: filteredCrops.filter(crop => crop.status === 'harvested'),
    diseased: filteredCrops.filter(crop => crop.status === 'diseased')
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-[2000px] mx-auto px-6 py-6">
          <PageHeader
            title="Crop Management"
            description="Track and manage all your crops with precision agriculture tools"
            action={
              canManage && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setPreviewUrl(null);
                    setIsDialogOpen(true);
                  }}
                  disabled={uploading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Crop
                </Button>
              )
            }
          />
        </div>
      </div>

      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <TabsList className="grid w-full md:w-auto grid-cols-3 md:flex">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="all">All Crops</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="harvested">Harvested</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search crops..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      Active Crops
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {crops.filter(c => c.status !== 'harvested').length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Currently growing in your fields
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-amber-600" />
                      Field Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold">28°C</div>
                      <div className="text-sm text-muted-foreground">
                        <div>Partly Cloudy</div>
                        <div>65% Humidity</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      Water Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      15.2mm
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rainfall in last 24 hours
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
                <div className="xl:col-span-2">
                  <CropGrowthMonitor crops={crops} />
                </div>
                <div className="space-y-6">
                  <SoilHealthMonitor fieldId="field-1" />
                  <PestDiseaseIdentifier />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-6">
            <div className="grid gap-6 w-full">
              {isLoadingLocation ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p>Loading farm location...</p>
                  </div>
                </div>
              ) : locationError ? (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-red-600">
                    {locationError}. Please set your farm location in the organization settings.
                  </p>
                </div>
              ) : farmLocation ? (
                <WeatherRecords 
                  latitude={farmLocation.latitude}
                  longitude={farmLocation.longitude}
                  locationName={farmLocation.address || 'Farm Location'}
                />
              ) : (
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <p className="text-amber-700">
                    Farm location not set. Please update your organization settings to view weather data.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCrops.length === 0 ? (
              <div className="text-center py-12">
                <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No crops found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No crops match your search criteria." : "Get started by adding your first crop"}
                </p>
                {canManage && !searchTerm && (
                  <Button onClick={() => {
                    setEditingCrop(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Crop
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredCrops.map((crop) => (
                  <CropCard 
                    key={crop.id}
                    crop={crop}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredCrops
                  .filter(crop => crop.status !== 'harvested')
                  .map((crop) => (
                    <CropCard 
                      key={crop.id}
                      crop={crop}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      canManage={canManage}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="harvested" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredCrops
                  .filter(crop => crop.status === 'harvested')
                  .map((crop) => (
                    <CropCard 
                      key={crop.id}
                      crop={crop}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      canManage={canManage}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crop Analytics</CardTitle>
                <CardDescription>Detailed analytics and insights about your crops</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex flex-col items-center justify-center bg-muted/50 rounded-lg">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">Crop Analytics Coming Soon</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    We're working on bringing you detailed analytics and insights about your crop performance, yield predictions, and more.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Yield Prediction</CardTitle>
                      <CardDescription>Estimated yield for current season</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">+12.5%</div>
                          <p className="text-sm text-muted-foreground">vs last season</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Soil Health</CardTitle>
                      <CardDescription>Average across all fields</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-amber-600">Good</div>
                          <div className="text-sm text-muted-foreground">
                            <div>pH: 6.2 (Optimal)</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Crop Health</CardTitle>
                      <CardDescription>Based on latest field scans</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">94%</div>
                          <p className="text-sm text-muted-foreground">Healthy plants</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          setPreviewUrl(null);
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCrop ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Image Upload */}
              <div className="md:col-span-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="crop-image">Crop Image</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="space-y-1 text-center">
                      {previewUrl ? (
                        <div className="relative">
                          <img 
                            src={previewUrl} 
                            alt="Crop preview" 
                            className="mx-auto h-48 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(null);
                              setFormData(prev => ({ ...prev, image_url: '' }));
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="crop-image"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                            >
                              <span>Upload an image</span>
                              <input
                                id="crop-image"
                                ref={fileInputRef}
                                name="crop-image"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {uploading && (
                    <p className="mt-2 text-sm text-gray-500">Uploading image, please wait...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    name="status"
                    value={formData.status}
                    onValueChange={(value: string) => setFormData(prev => ({
                      ...prev, 
                      status: value as Crop['status']
                    }))}
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
                  <Label htmlFor="farmer_id">Farmer *</Label>
                  <Select 
                    name="farmer_id" 
                    value={formData.farmer_id}
                    onValueChange={(value) => setFormData({...formData, farmer_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map(farmer => (
                        <SelectItem key={farmer.id} value={farmer.id}>
                          {farmer.first_name} {farmer.last_name} ({farmer.farmer_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Middle Column - Basic Info */}
              <div className="md:col-span-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="crop_name">Crop Name *</Label>
                  <Input
                    id="crop_name"
                    name="crop_name"
                    value={formData.crop_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Maize, Beans"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    name="variety"
                    value={formData.variety}
                    onChange={handleInputChange}
                    placeholder="e.g., Pannar 53"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    name="season"
                    value={formData.season}
                    onChange={handleInputChange}
                    placeholder="e.g., Rainy Season 2023"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farm_area">Farm Area (acres)</Label>
                  <Input
                    id="farm_area"
                    name="farm_area"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.farm_area}
                    onChange={handleInputChange}
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>

              {/* Right Column - Dates and Quantities */}
              <div className="md:col-span-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="planting_date">Planting Date</Label>
                  <Input
                    id="planting_date"
                    name="planting_date"
                    type="date"
                    value={formData.planting_date}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_harvest_date">Expected Harvest Date</Label>
                  <Input
                    id="expected_harvest_date"
                    name="expected_harvest_date"
                    type="date"
                    value={formData.expected_harvest_date}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_harvest_date">Actual Harvest Date</Label>
                  <Input
                    id="actual_harvest_date"
                    name="actual_harvest_date"
                    type="date"
                    value={formData.actual_harvest_date}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_planted">Quantity Planted</Label>
                  <div className="flex">
                    <Input
                      id="quantity_planted"
                      name="quantity_planted"
                      type="number"
                      min="0"
                      value={formData.quantity_planted}
                      onChange={handleInputChange}
                      placeholder="e.g., 100"
                      className="rounded-r-none"
                    />
                    <Select 
                      value={formData.unit}
                      onValueChange={(value) => setFormData({...formData, unit: value})}
                    >
                      <SelectTrigger className="w-24 rounded-l-none border-l-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="seeds">seeds</SelectItem>
                        <SelectItem value="plants">plants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_harvested">Quantity Harvested</Label>
                  <div className="flex">
                    <Input
                      id="quantity_harvested"
                      name="quantity_harvested"
                      type="number"
                      min="0"
                      value={formData.quantity_harvested}
                      onChange={handleInputChange}
                      placeholder="e.g., 80"
                      className="rounded-r-none"
                    />
                    <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-gray-50 text-sm text-gray-500 w-24">
                      {formData.unit || 'kg'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Width - Notes */}
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about this crop..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                  setPreviewUrl(null);
                }}
                disabled={loading || uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading || uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Crop'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Crops;
