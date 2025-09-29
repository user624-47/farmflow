import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SmartFormProps {
  formType: "farmer" | "crop" | "livestock" | "input";
  formData: any;
  onSuggestion: (field: string, value: any) => void;
  farmLocation?: string;
}

export const SmartForm = ({ formType, formData, onSuggestion, farmLocation }: SmartFormProps) => {
  const [suggestions, setSuggestions] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data: aiResponse, error } = await supabase.functions.invoke('ai-form-helper', {
        body: {
          formType,
          formData,
          farmLocation: farmLocation || "Nigeria"
        }
      });

      if (error) throw error;

      setSuggestions(aiResponse.suggestions || {});
      toast({
        title: "AI Suggestions Generated",
        description: "Smart suggestions to help complete your form",
      });
    } catch (error: any) {
      console.error("AI suggestions error:", error);
      toast({
        title: "AI Suggestions",
        description: "Using local suggestions based on best practices",
      });
      
      // Fallback to local suggestions
      generateLocalSuggestions();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalSuggestions = () => {
    const localSuggestions: any = {};
    
    switch (formType) {
      case "crop":
        if (formData.crop_name && !formData.expected_harvest_date && formData.planting_date) {
          const plantDate = new Date(formData.planting_date);
          const harvestDays = getCropHarvestDays(formData.crop_name);
          const expectedHarvest = new Date(plantDate);
          expectedHarvest.setDate(plantDate.getDate() + harvestDays);
          
          localSuggestions.expected_harvest_date = {
            value: expectedHarvest.toISOString().split('T')[0],
            reason: `Typical ${formData.crop_name} harvest cycle is ${harvestDays} days`
          };
        }
        
        if (formData.crop_name && !formData.variety) {
          localSuggestions.variety = {
            value: getRecommendedVarieties(formData.crop_name),
            reason: "Popular varieties for your region"
          };
        }
        break;
        
      case "livestock":
        if (formData.livestock_type && !formData.vaccination_date) {
          const vaccinationSchedule = getVaccinationSchedule(formData.livestock_type);
          localSuggestions.vaccination_schedule = {
            value: vaccinationSchedule,
            reason: "Recommended vaccination schedule"
          };
        }
        break;
        
      case "input":
        if (formData.input_type === "fertilizer" && !formData.quantity) {
          localSuggestions.quantity = {
            value: "Based on farm area, recommended quantity",
            reason: "Calculate based on soil test and crop requirements"
          };
        }
        break;
    }
    
    setSuggestions(localSuggestions);
  };

  const getCropHarvestDays = (cropName: string): number => {
    const cropCycles: { [key: string]: number } = {
      "rice": 120,
      "maize": 90,
      "cassava": 365,
      "yam": 270,
      "beans": 75,
      "groundnut": 90,
      "millet": 90,
      "sorghum": 105
    };
    return cropCycles[cropName.toLowerCase()] || 90;
  };

  const getRecommendedVarieties = (cropName: string): string[] => {
    const varieties: { [key: string]: string[] } = {
      "rice": ["FARO 44", "FARO 52", "NERICA L-19"],
      "maize": ["ART/98/SW6-OB", "SAMMAZ 15", "SAMMAZ 17"],
      "cassava": ["TMS 30572", "NR 8082", "TME 419"],
      "yam": ["TDr 131", "TDr 89/02665", "TDr 95/19177"]
    };
    return varieties[cropName.toLowerCase()] || [];
  };

  const getVaccinationSchedule = (livestockType: string): string[] => {
    const schedules: { [key: string]: string[] } = {
      "cattle": ["Foot and Mouth Disease - Every 6 months", "Anthrax - Annual"],
      "poultry": ["Newcastle Disease - Every 3 months", "Infectious Bronchitis - Every 6 months"],
      "goat": ["PPR Vaccine - Annual", "Anthrax - Annual"],
      "sheep": ["PPR Vaccine - Annual", "Clostridial diseases - Every 6 months"]
    };
    return schedules[livestockType.toLowerCase()] || [];
  };

  const applySuggestion = (field: string, value: any) => {
    onSuggestion(field, value);
    toast({
      title: "Suggestion Applied",
      description: `Updated ${field} with AI recommendation`,
    });
  };

  if (Object.keys(suggestions).length === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generateSuggestions}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {loading ? "Getting AI Suggestions..." : "Get AI Suggestions"}
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">AI Suggestions</span>
      </div>
      {Object.entries(suggestions).map(([field, suggestion]: [string, any]) => (
        <div key={field} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm capitalize">{field.replace('_', ' ')}</p>
              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applySuggestion(field, suggestion.value)}
            >
              Apply
            </Button>
          </div>
          {Array.isArray(suggestion.value) ? (
            <div className="flex flex-wrap gap-1">
              {suggestion.value.map((item: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">
              {suggestion.value}
            </Badge>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={generateSuggestions}
        disabled={loading}
      >
        Refresh Suggestions
      </Button>
    </div>
  );
};