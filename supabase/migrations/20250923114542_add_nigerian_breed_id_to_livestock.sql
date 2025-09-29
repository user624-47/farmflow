-- Add nigerian_breed_id column to livestock table
ALTER TABLE public.livestock 
ADD COLUMN nigerian_breed_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.livestock.nigerian_breed_id IS 'Reference to Nigerian breed identifier for livestock';

-- Update the updated_at trigger to include nigerian_breed_id
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at column when nigerian_breed_id changes
CREATE TRIGGER update_livestock_breed_updated_at
BEFORE UPDATE OF nigerian_breed_id ON public.livestock
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
