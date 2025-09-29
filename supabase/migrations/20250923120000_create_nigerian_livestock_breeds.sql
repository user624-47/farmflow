-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.nigerian_livestock_breeds CASCADE;

-- Create table for Nigerian livestock breeds
CREATE TABLE public.nigerian_livestock_breeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breed_name TEXT NOT NULL,
    local_name TEXT,
    livestock_type TEXT NOT NULL,
    characteristics TEXT,
    climate_adaptability TEXT[],
    disease_resistance TEXT[],
    productivity_data JSONB,
    recommended_regions TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE public.nigerian_livestock_breeds IS 'Stores information about Nigerian livestock breeds';
COMMENT ON COLUMN public.nigerian_livestock_breeds.breed_name IS 'The standard name of the breed';
COMMENT ON COLUMN public.nigerian_livestock_breeds.local_name IS 'Local or indigenous name of the breed';
COMMENT ON COLUMN public.nigerian_livestock_breeds.livestock_type IS 'Type of livestock (e.g., cattle, goat, sheep, poultry)';
COMMENT ON COLUMN public.nigerian_livestock_breeds.characteristics IS 'Physical and behavioral characteristics';
COMMENT ON COLUMN public.nigerian_livestock_breeds.climate_adaptability IS 'List of climate conditions the breed is adapted to';
COMMENT ON COLUMN public.nigerian_livestock_breeds.disease_resistance IS 'List of diseases the breed is resistant to';
COMMENT ON COLUMN public.nigerian_livestock_breeds.productivity_data IS 'JSON data about productivity metrics';
COMMENT ON COLUMN public.nigerian_livestock_breeds.recommended_regions IS 'List of Nigerian regions where this breed is recommended';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nigerian_livestock_breeds_livestock_type 
    ON public.nigerian_livestock_breeds(livestock_type);

CREATE INDEX IF NOT EXISTS idx_nigerian_livestock_breeds_breed_name 
    ON public.nigerian_livestock_breeds(breed_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_breed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        NEW.updated_at = now();
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
RETURNS boolean
LANGUAGE sql
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
$$;

-- First, create the table without sample data

-- Create the trigger after the table is created
CREATE TRIGGER update_nigerian_breeds_updated_at
BEFORE UPDATE ON public.nigerian_livestock_breeds
FOR EACH ROW
EXECUTE FUNCTION update_breed_updated_at();

-- Now insert sample data
INSERT INTO public.nigerian_livestock_breeds (
    breed_name, 
    local_name, 
    livestock_type, 
    characteristics,
    climate_adaptability,
    disease_resistance,
    productivity_data,
    recommended_regions
) VALUES (
    'White Fulani',
    'Bunaji',
    'cattle',
    'Large, white or light gray with long lyre-shaped horns',
    ARRAY['hot', 'dry'],
    ARRAY['trypanosomiasis'],
    '{"milk_yield_liters_per_day": 4, "meat_yield_kg": 250, "calving_interval_days": 400}'::jsonb,
    ARRAY['north_central', 'north_east', 'north_west']
);

INSERT INTO public.nigerian_livestock_breeds (
    breed_name, 
    local_name, 
    livestock_type, 
    characteristics,
    climate_adaptability,
    disease_resistance,
    productivity_data,
    recommended_regions
) VALUES (
    'West African Dwarf',
    NULL,
    'goat',
    'Small, compact, and hardy with short legs',
    ARRAY['tropical', 'humid'],
    ARRAY['heartwater', 'pneumonia'],
    '{"twins_percentage": 60, "meat_yield_kg": 15, "milk_yield_liters_per_day": 0.5}'::jsonb,
    ARRAY['south_south', 'south_east', 'south_west']
);
