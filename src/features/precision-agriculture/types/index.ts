export interface Crop {
  id: string;
  crop_name: string;
  variety?: string;
  status: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  farm_area?: number;
  quantity_planted?: number;
  quantity_harvested?: number;
  unit?: string;
  season?: string;
  notes?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  farmer_id?: string;
  organization_id?: string;
  latitude?: number;
  longitude?: number;
  farmer?: {
    first_name: string;
    last_name: string;
    farmer_id: string;
  };
}

export interface FieldData {
  id: string;
  name: string;
  area: number;
  cropType: string;
  variety?: string;
  plantingDate: string;
  growthStage: string;
  healthScore: number;
  ndvi: number;
  lastUpdated: string;
  latitude?: number;
  longitude?: number;
}

export interface NDVIDataPoint {
  date: Date;
  ndvi: number;
}
