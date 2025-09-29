-- Create Nigerian crop varieties table
CREATE TABLE public.nigerian_crop_varieties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  variety_name TEXT NOT NULL,
  variety_code TEXT,
  maturity_days INTEGER,
  yield_potential NUMERIC,
  drought_tolerance TEXT CHECK (drought_tolerance IN ('low', 'medium', 'high')),
  disease_resistance TEXT[],
  recommended_regions TEXT[],
  planting_season TEXT[],
  seed_rate NUMERIC,
  seed_rate_unit TEXT,
  spacing TEXT,
  fertilizer_recommendation JSONB,
  market_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market prices table
CREATE TABLE public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commodity TEXT NOT NULL,
  market_name TEXT NOT NULL,
  state TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price_date DATE NOT NULL,
  price_trend TEXT CHECK (price_trend IN ('up', 'down', 'stable')),
  seasonal_high NUMERIC,
  seasonal_low NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS notifications table
CREATE TABLE public.sms_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.farmers(id),
  organization_id UUID,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extension services table
CREATE TABLE public.extension_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  audio_url TEXT,
  language TEXT DEFAULT 'en',
  category TEXT NOT NULL,
  target_audience TEXT[],
  seasonal_relevance TEXT[],
  views_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial services table
CREATE TABLE public.financial_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.farmers(id),
  organization_id UUID,
  service_type TEXT NOT NULL CHECK (service_type IN ('loan', 'insurance', 'savings', 'mobile_money')),
  provider TEXT NOT NULL,
  amount NUMERIC,
  interest_rate NUMERIC,
  duration_months INTEGER,
  status TEXT DEFAULT 'pending',
  application_date DATE NOT NULL,
  approval_date DATE,
  disbursement_date DATE,
  repayment_schedule JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processing facilities table
CREATE TABLE public.processing_facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT,
  facility_type TEXT NOT NULL,
  commodities_processed TEXT[],
  capacity NUMERIC,
  capacity_unit TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  operating_months TEXT[],
  minimum_quantity NUMERIC,
  pricing_structure JSONB,
  certifications TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.nigerian_crop_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_facilities ENABLE ROW LEVEL SECURITY;

-- Create policies for Nigerian crop varieties (public read)
CREATE POLICY "Nigerian crop varieties are viewable by everyone"
ON public.nigerian_crop_varieties
FOR SELECT
USING (true);

-- Create policies for market prices (public read)
CREATE POLICY "Market prices are viewable by everyone"
ON public.market_prices
FOR SELECT
USING (true);

-- Create policies for SMS notifications
CREATE POLICY "Extension officers and admins can manage SMS notifications"
ON public.sms_notifications
FOR ALL
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'extension_officer'::app_role])
));

-- Create policies for extension services
CREATE POLICY "Extension services are viewable by everyone in organization"
ON public.extension_services
FOR SELECT
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
) OR organization_id IS NULL);

CREATE POLICY "Extension officers and admins can manage extension services"
ON public.extension_services
FOR ALL
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'extension_officer'::app_role])
));

-- Create policies for financial services
CREATE POLICY "Extension officers and admins can manage financial services"
ON public.financial_services
FOR ALL
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'extension_officer'::app_role])
));

CREATE POLICY "Users can access financial services in their organization"
ON public.financial_services
FOR SELECT
USING (organization_id IN (
  SELECT user_roles.organization_id
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
));

-- Create policies for processing facilities (public read)
CREATE POLICY "Processing facilities are viewable by everyone"
ON public.processing_facilities
FOR SELECT
USING (is_active = true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_nigerian_crop_varieties_updated_at
BEFORE UPDATE ON public.nigerian_crop_varieties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_prices_updated_at
BEFORE UPDATE ON public.market_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extension_services_updated_at
BEFORE UPDATE ON public.extension_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_services_updated_at
BEFORE UPDATE ON public.financial_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_facilities_updated_at
BEFORE UPDATE ON public.processing_facilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();