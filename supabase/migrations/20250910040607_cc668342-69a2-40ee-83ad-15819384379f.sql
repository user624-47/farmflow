-- Multi-tenant Farmers Management System Schema

-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'extension_officer', 'farmer');

-- Organizations table (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'trial',
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table for multi-tenant access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Farmers table
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id TEXT NOT NULL, -- Custom farmer ID
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  state TEXT,
  lga TEXT, -- Local Government Area
  farm_size DECIMAL,
  farm_location TEXT,
  crops_grown TEXT[], -- Array of crops
  livestock_owned TEXT[], -- Array of livestock types
  id_number TEXT, -- National ID, BVN, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, farmer_id)
);

-- Inputs table (seeds, fertilizer, equipment, etc)
CREATE TABLE public.inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL, -- seed, fertilizer, pesticide, equipment
  input_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL, -- kg, bags, liters, pieces
  cost_per_unit DECIMAL,
  total_cost DECIMAL,
  supplier TEXT,
  date_supplied DATE NOT NULL,
  season TEXT, -- wet, dry, 2023/2024
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  loan_type TEXT NOT NULL, -- input_loan, cash_loan, equipment_loan
  amount DECIMAL NOT NULL,
  interest_rate DECIMAL DEFAULT 0,
  duration_months INTEGER,
  status TEXT DEFAULT 'pending', -- pending, approved, disbursed, completed, defaulted
  application_date DATE NOT NULL,
  approval_date DATE,
  disbursement_date DATE,
  due_date DATE,
  amount_repaid DECIMAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crops table
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  farm_area DECIMAL, -- in hectares
  quantity_planted DECIMAL,
  quantity_harvested DECIMAL,
  unit TEXT, -- kg, tonnes, bags
  season TEXT,
  status TEXT DEFAULT 'planted', -- planted, growing, harvested, failed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Livestock table
CREATE TABLE public.livestock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  livestock_type TEXT NOT NULL, -- cattle, goat, sheep, poultry, fish
  breed TEXT,
  quantity INTEGER NOT NULL,
  age_months INTEGER,
  health_status TEXT DEFAULT 'healthy',
  vaccination_date DATE,
  breeding_status TEXT, -- pregnant, lactating, breeding, not_breeding
  productivity_data JSONB, -- milk_per_day, eggs_per_week, etc
  acquisition_date DATE,
  acquisition_cost DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update their org" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their organization" ON public.user_roles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for farmers (and other tables follow similar pattern)
CREATE POLICY "Users can access farmers in their organization" ON public.farmers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Extension officers and admins can manage farmers" ON public.farmers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'extension_officer')
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can access inputs in their organization" ON public.inputs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Extension officers and admins can manage inputs" ON public.inputs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'extension_officer')
    )
  );

CREATE POLICY "Users can access loans in their organization" ON public.loans
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Extension officers and admins can manage loans" ON public.loans
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'extension_officer')
    )
  );

CREATE POLICY "Users can access crops in their organization" ON public.crops
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Extension officers and admins can manage crops" ON public.crops
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'extension_officer')
    )
  );

CREATE POLICY "Users can access livestock in their organization" ON public.livestock
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Extension officers and admins can manage livestock" ON public.livestock
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'extension_officer')
    )
  );

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _organization_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role = _role
  )
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inputs_updated_at
  BEFORE UPDATE ON public.inputs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_livestock_updated_at
  BEFORE UPDATE ON public.livestock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();