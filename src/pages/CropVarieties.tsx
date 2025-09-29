import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Calendar, MapPin, Droplets, TrendingUp } from "lucide-react";

export default function CropVarieties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("all");

  const { data: varieties, isLoading } = useQuery({
    queryKey: ["crop-varieties", searchTerm, selectedCrop],
    queryFn: async () => {
      let query = supabase
        .from("nigerian_crop_varieties")
        .select("*")
        .order("crop_name", { ascending: true });

      if (selectedCrop !== "all") {
        query = query.eq("crop_name", selectedCrop);
      }

      if (searchTerm) {
        query = query.or(`crop_name.ilike.%${searchTerm}%,variety_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const uniqueCrops = [...new Set(varieties?.map(v => v.crop_name))];

  const getDroughtToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading Nigerian crop varieties...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nigerian Crop Varieties</h1>
          <p className="text-muted-foreground">
            Discover recommended crop varieties for Nigerian agricultural conditions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Varieties</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{varieties?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Registered varieties</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crop Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCrops.length}</div>
            <p className="text-xs text-muted-foreground">Different crops</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {varieties?.filter(v => v.yield_potential && v.yield_potential > 3).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">High-yield varieties</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drought Tolerant</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {varieties?.filter(v => v.drought_tolerance === 'high').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">High drought tolerance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crop Varieties Database</CardTitle>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search varieties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select crop type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                {uniqueCrops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {varieties?.map((variety) => (
              <Card key={variety.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{variety.variety_name}</CardTitle>
                    <Badge variant="outline">{variety.crop_name}</Badge>
                  </div>
                  {variety.variety_code && (
                    <p className="text-sm text-muted-foreground">Code: {variety.variety_code}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {variety.maturity_days && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{variety.maturity_days} days</span>
                      </div>
                    )}
                    {variety.yield_potential && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{variety.yield_potential}t/ha</span>
                      </div>
                    )}
                  </div>

                  {variety.drought_tolerance && (
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3 w-3" />
                      <Badge className={getDroughtToleranceColor(variety.drought_tolerance)}>
                        {variety.drought_tolerance.charAt(0).toUpperCase() + variety.drought_tolerance.slice(1)} Drought Tolerance
                      </Badge>
                    </div>
                  )}

                  {variety.recommended_regions && variety.recommended_regions.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <MapPin className="h-3 w-3" />
                        <span>Recommended Regions:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {variety.recommended_regions.slice(0, 3).map((region: string) => (
                          <Badge key={region} variant="secondary" className="text-xs">
                            {region}
                          </Badge>
                        ))}
                        {variety.recommended_regions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{variety.recommended_regions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {variety.planting_season && variety.planting_season.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Planting Season:</p>
                      <div className="flex flex-wrap gap-1">
                        {variety.planting_season.map((season: string) => (
                          <Badge key={season} variant="outline" className="text-xs">
                            {season}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {variety.disease_resistance && variety.disease_resistance.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Disease Resistance:</p>
                      <div className="flex flex-wrap gap-1">
                        {variety.disease_resistance.slice(0, 2).map((disease: string) => (
                          <Badge key={disease} variant="destructive" className="text-xs">
                            {disease}
                          </Badge>
                        ))}
                        {variety.disease_resistance.length > 2 && (
                          <Badge variant="destructive" className="text-xs">
                            +{variety.disease_resistance.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {variety.seed_rate && (
                    <div className="text-sm">
                      <span className="font-medium">Seed Rate:</span> {variety.seed_rate} {variety.seed_rate_unit}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!varieties || varieties.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No crop varieties found. Try adjusting your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}