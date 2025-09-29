-- Add latitude and longitude columns to organizations table
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add a comment to describe the purpose of these columns
COMMENT ON COLUMN public.organizations.latitude IS 'Geographic latitude of the farm location for weather and analysis';
COMMENT ON COLUMN public.organizations.longitude IS 'Geographic longitude of the farm location for weather and analysis';

-- Create an index on the location for faster geospatial queries
CREATE INDEX IF NOT EXISTS organizations_location_idx ON public.organizations USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
