-- Add location columns to crops table
ALTER TABLE public.crops
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS boundary_geojson JSONB;

-- Create spatial index for geofencing
CREATE INDEX IF NOT EXISTS idx_crops_location ON public.crops USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Add soil quality columns
ALTER TABLE public.crops
ADD COLUMN IF NOT EXISTS soil_ph DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS soil_type TEXT,
ADD COLUMN IF NOT EXISTS organic_matter DECIMAL(4,2);
