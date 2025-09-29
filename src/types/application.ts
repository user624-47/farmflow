export interface Application {
  id: string;
  product_name: string;
  product_type: string;
  application_date: string;
  application_method: string;
  quantity: number;
  unit: string;
  crop_id: string;
  farmer_id: string;
  organization_id: string;
  notes?: string | null;
  cost: number | null;
  next_application_date: string | null;
  weather_conditions?: string;
  target_pest_disease?: string | null;
  created_at: string;
  updated_at: string;
  crops?: {
    crop_name: string;
  };
  farmers?: {
    first_name: string;
    last_name: string;
  };
}
