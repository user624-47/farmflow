export interface Farmer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  farmer_id?: string;
  organization_id?: string;
  status?: 'active' | 'inactive';
  notes?: string;
  // Add any additional fields as needed
}
