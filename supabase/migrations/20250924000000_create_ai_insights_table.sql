-- Create AI Insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence FLOAT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for authenticated users"
  ON public.ai_insights
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users within their organization"
  ON public.ai_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_insights_organization_id ON public.ai_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_farm_id ON public.ai_insights(farm_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at DESC);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_ai_insights_updated_at
BEFORE UPDATE ON public.ai_insights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
