// src/components/livestock/LivestockBreedSelector.tsx
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Create a type-safe Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Define the type for a breed
interface NigerianBreed {
  id: string;
  breed_name: string;
  local_name?: string | null;
  livestock_type: string;
  characteristics?: Record<string, unknown> | null;
  climate_adaptability?: string[] | null;
  disease_resistance?: string[] | null;
  productivity_data?: Record<string, unknown> | null;
  recommended_regions?: string[] | null;
  created_at: string;
  updated_at: string;
}

interface LivestockBreedSelectorProps {
  livestockType: string;
  selectedBreed?: string;
  onBreedSelect: (breedId: string, breedName: string) => void;
}

export const LivestockBreedSelector = ({ 
  livestockType, 
  selectedBreed, 
  onBreedSelect 
}: LivestockBreedSelectorProps) => {
  const [breeds, setBreeds] = useState<NigerianBreed[]>([]);
  const [selectedBreedInfo, setSelectedBreedInfo] = useState<NigerianBreed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (livestockType) {
      fetchBreeds();
    }
  }, [livestockType]);

  const fetchBreeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('nigerian_livestock_breeds')
        .select('*')
        .eq('livestock_type', livestockType)
        .order('breed_name');

      if (error) {
        throw error;
      }

      if (data) {
        // Type assertion to ensure data matches NigerianBreed[]
        const typedData = data as unknown as NigerianBreed[];
        setBreeds(typedData);
        
        if (selectedBreed) {
          const breed = typedData.find(b => b.id === selectedBreed);
          if (breed) {
            setSelectedBreedInfo(breed);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching breeds:', err);
      setError('Failed to load breeds. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBreedSelection = (breedId: string) => {
    const breed = breeds.find(b => b.id === breedId);
    if (breed) {
      setSelectedBreedInfo(breed);
      onBreedSelect(breedId, breed.breed_name);
    } else {
      setSelectedBreedInfo(null);
    }
  };

  const formatCharacteristics = (characteristics: Record<string, unknown> | null | undefined) => {
    if (!characteristics) return null;
    
    return Object.entries(characteristics).map(([key, value]) => (
      <div key={key} className="grid grid-cols-2 gap-2 py-1">
        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
        <span className="font-medium">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Nigerian Breed (Recommended)
        </label>
        <Select 
          value={selectedBreed} 
          onValueChange={handleBreedSelection}
          disabled={loading || breeds.length === 0}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                loading ? "Loading breeds..." : 
                breeds.length === 0 ? "No Nigerian breeds available" : 
                "Select Nigerian breed"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {breeds.map((breed) => (
              <SelectItem key={breed.id} value={breed.id}>
                <div className="flex items-center gap-2">
                  <span>{breed.breed_name || 'Unnamed Breed'}</span>
                  {breed.local_name && (
                    <span className="text-muted-foreground">({breed.local_name})</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>

      {selectedBreedInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedBreedInfo.breed_name}</CardTitle>
            {selectedBreedInfo.local_name && (
              <CardDescription>
                Local Name: <strong>{selectedBreedInfo.local_name}</strong>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBreedInfo.characteristics && (
              <div>
                <h4 className="font-medium mb-2">Characteristics</h4>
                <div className="text-sm">
                  {formatCharacteristics(selectedBreedInfo.characteristics)}
                </div>
              </div>
            )}

            {selectedBreedInfo.climate_adaptability && selectedBreedInfo.climate_adaptability.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Climate Adaptability</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedBreedInfo.climate_adaptability.map((climate) => (
                    <Badge key={climate} variant="outline" className="text-xs">
                      {climate.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedBreedInfo.disease_resistance && selectedBreedInfo.disease_resistance.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Disease Resistance</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedBreedInfo.disease_resistance.map((disease) => (
                    <Badge key={disease} variant="secondary" className="text-xs">
                      {disease.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedBreedInfo.recommended_regions && selectedBreedInfo.recommended_regions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommended Regions</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedBreedInfo.recommended_regions.map((region) => (
                    <Badge key={region} variant="default" className="text-xs">
                      {region.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedBreedInfo.productivity_data && (
              <div>
                <h4 className="font-medium mb-2">Productivity Data</h4>
                <div className="text-sm">
                  {formatCharacteristics(selectedBreedInfo.productivity_data)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};