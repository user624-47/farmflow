export interface Farmer {
  id: string;
  first_name: string;
  last_name: string;
  farmer_id: string;
}

export interface Crop {
  id: string;
  crop_name: string;
  variety?: string;
  status: 'planted' | 'growing' | 'harvested' | 'failed' | 'ready_for_harvest' | 'diseased';
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  farm_area?: number | null;
  quantity_planted?: number | null;
  quantity_harvested?: number | null;
  unit?: string;
  season?: string;
  notes?: string;
  image_url?: string | null;
  created_at?: string;
  farmer_id?: string;
  organization_id?: string;
  updated_at?: string;
  farmer?: Pick<Farmer, 'first_name' | 'last_name' | 'farmer_id'>;
}

export interface CropForm extends Omit<Crop, 'id' | 'created_at' | 'updated_at' | 'farmer'> {
  [key: string]: any;
}

export interface CropFilters {
  status?: string;
  season?: string;
  farmer_id?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}
