-- Add production_data column to livestock table
ALTER TABLE public.livestock 
ADD COLUMN IF NOT EXISTS production_data JSONB DEFAULT '[]'::jsonb;

-- Update the updated_at timestamp when production_data changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at column when production_data changes
CREATE TRIGGER update_livestock_updated_at
BEFORE UPDATE OF production_data ON public.livestock
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create an index on production_data for better query performance
CREATE INDEX IF NOT EXISTS idx_livestock_production_data ON public.livestock USING GIN (production_data);
