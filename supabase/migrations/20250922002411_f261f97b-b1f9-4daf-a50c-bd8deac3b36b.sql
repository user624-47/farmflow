-- Create table for fertilizer and pesticide applications
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_date DATE NOT NULL,
  crop_id UUID REFERENCES public.crops(id),
  farmer_id UUID REFERENCES public.farmers(id),
  organization_id UUID,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('fertilizer', 'pesticide', 'herbicide', 'fungicide', 'insecticide')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  application_method TEXT,
  target_pest_disease TEXT,
  weather_conditions TEXT,
  notes TEXT,
  next_application_date DATE,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
CREATE POLICY "Extension officers and admins can manage applications"
ON public.applications
FOR ALL
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'extension_officer'::app_role])
));

CREATE POLICY "Users can access applications in their organization"
ON public.applications
FOR SELECT
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();