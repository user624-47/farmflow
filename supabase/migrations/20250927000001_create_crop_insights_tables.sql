-- Create crop_yield_history table
CREATE TABLE IF NOT EXISTS public.crop_yield_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  yield NUMERIC(10, 2) NOT NULL,
  harvest_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crop_insights table
CREATE TABLE IF NOT EXISTS public.crop_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  current_stage TEXT,
  stage_progress INTEGER CHECK (stage_progress >= 0 AND stage_progress <= 100),
  recommendations JSONB,
  risk_factors JSONB,
  growth_projection TEXT,
  comparison_to_average TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crop_id, location)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crop_yield_history_crop_id ON public.crop_yield_history(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_yield_history_location ON public.crop_yield_history(location);
CREATE INDEX IF NOT EXISTS idx_crop_insights_crop_id ON public.crop_insights(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_insights_location ON public.crop_insights(location);

-- Add comments for documentation
COMMENT ON TABLE public.crop_yield_history IS 'Stores historical yield data for crops by location';
COMMENT ON TABLE public.crop_insights IS 'Stores AI-generated insights and analysis for crops by location';
