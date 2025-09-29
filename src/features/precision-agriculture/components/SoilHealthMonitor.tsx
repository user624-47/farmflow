import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TreePine, Droplets, Thermometer, Gauge, Leaf, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SoilHealthData {
  ph: number;
  moisture: number;
  temperature: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  lastUpdated: string;
}

const SoilHealthMonitor = ({ fieldId }: { fieldId: string }) => {
  // In a real implementation, this would fetch data from an API
  const soilData: SoilHealthData = {
    ph: 6.2,
    moisture: 65,
    temperature: 24,
    nitrogen: 75,
    phosphorus: 60,
    potassium: 80,
    organicMatter: 3.5,
    lastUpdated: new Date().toISOString(),
  };

  const getPHStatus = (ph: number) => {
    if (ph < 5.5) return { status: 'Acidic', color: 'bg-orange-500' };
    if (ph > 7.5) return { status: 'Alkaline', color: 'bg-blue-500' };
    return { status: 'Optimal', color: 'bg-green-500' };
  };

  const getNutrientStatus = (value: number) => {
    if (value < 40) return 'Low';
    if (value < 70) return 'Moderate';
    return 'Optimal';
  };

  const phStatus = getPHStatus(soilData.ph);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TreePine className="h-5 w-5 text-green-600" />
              Soil Health Monitor
            </CardTitle>
            <CardDescription>Field ID: {fieldId}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last updated: {new Date(soilData.lastUpdated).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* pH Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">pH Level</span>
              <span className="text-sm font-medium">{soilData.ph.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${phStatus.color}`} 
                  style={{ width: `${((soilData.ph - 4) / 6) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">{phStatus.status}</span>
            </div>
          </div>

          {/* Moisture */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Droplets className="h-4 w-4 text-blue-500" />
                Moisture
              </span>
              <span className="text-sm font-medium">{soilData.moisture}%</span>
            </div>
            <Progress value={soilData.moisture} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dry</span>
              <span>Optimal</span>
              <span>Wet</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Thermometer className="h-4 w-4 text-red-500" />
                Temperature
              </span>
              <span className="text-sm font-medium">{soilData.temperature}°C</span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
                    {soilData.temperature < 15 ? 'Cool' : soilData.temperature > 30 ? 'Hot' : 'Optimal'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Organic Matter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Leaf className="h-4 w-4 text-green-600" />
                Organic Matter
              </span>
              <span className="text-sm font-medium">{soilData.organicMatter}%</span>
            </div>
            <Progress value={(soilData.organicMatter / 10) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Optimal</span>
              <span>High</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-amber-600" />
            Nutrient Levels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Nitrogen (N)', value: soilData.nitrogen, color: 'bg-blue-500' },
              { name: 'Phosphorus (P)', value: soilData.phosphorus, color: 'bg-purple-500' },
              { name: 'Potassium (K)', value: soilData.potassium, color: 'bg-yellow-500' },
            ].map((nutrient) => (
              <div key={nutrient.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{nutrient.name.split(' ')[0]}</span>
                  <span className="font-medium">{getNutrientStatus(nutrient.value)}</span>
                </div>
                <Progress value={nutrient.value} className="h-2" indicatorColor={nutrient.color} />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full">
            View Detailed Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoilHealthMonitor;
