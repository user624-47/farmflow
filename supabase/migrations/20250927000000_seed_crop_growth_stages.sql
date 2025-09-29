-- Seed data for crop growth stages

-- First, get the crop IDs (replace these with actual IDs from your database)
DO $$
DECLARE
  rice_id UUID;
  maize_id UUID;
BEGIN
  -- Get the crop IDs
  SELECT id INTO rice_id FROM public.crops WHERE crop_name = 'Rice' LIMIT 1;
  SELECT id INTO maize_id FROM public.crops WHERE crop_name = 'Maize' LIMIT 1;
  
  -- Insert growth stages for Rice
  IF rice_id IS NOT NULL THEN
    INSERT INTO public.crop_growth_stages (crop_id, stage_name, stage_order, duration_days, description, optimal_temp_min, optimal_temp_max, water_needs, nutrient_needs, common_issues)
    VALUES
      (rice_id, 'Germination', 1, 10, 'Seed absorbs water and begins to sprout', 25, 35, 'Keep soil consistently moist', 'High phosphorus', '["Seed rot", "Poor germination"]'::jsonb),
      (rice_id, 'Seedling', 2, 20, 'First leaves emerge and grow', 25, 33, 'Maintain 2-3cm of standing water', 'Balanced NPK', '["Rice blast", "Stem borer"]'::jsonb),
      (rice_id, 'Tillering', 3, 30, 'Plant develops multiple stems', 25, 32, 'Maintain 3-5cm of standing water', 'High nitrogen', '["Blast", "Sheath blight"]'::jsonb),
      (rice_id, 'Panicle Initiation', 4, 15, 'Flower heads begin to form', 25, 30, 'Maintain 5-10cm of standing water', 'Balanced NPK', '["Leaf folder", "Bacterial blight"]'::jsonb),
      (rice_id, 'Flowering', 5, 10, 'Flowers emerge and pollination occurs', 25, 32, 'Maintain 5-10cm of standing water', 'High potassium', '["Blast", "Sheath blight"]'::jsonb),
      (rice_id, 'Milk Stage', 6, 10, 'Grains begin to fill with milky liquid', 22, 30, 'Gradually reduce water level', 'Low nitrogen', '["Birds", "Rodents"]'::jsonb),
      (rice_id, 'Maturity', 7, 15, 'Grains harden and turn golden', 20, 30, 'Drain field for harvest', 'None', '["Birds", "Rodents"]'::jsonb);
  END IF;

  -- Insert growth stages for Maize
  IF maize_id IS NOT NULL THEN
    INSERT INTO public.crop_growth_stages (crop_id, stage_name, stage_order, duration_days, description, optimal_temp_min, optimal_temp_max, water_needs, nutrient_needs, common_issues)
    VALUES
      (maize_id, 'Germination', 1, 7, 'Seed absorbs water and begins to sprout', 15, 30, 'Keep soil moist but not waterlogged', 'High phosphorus', '["Seed rot", "Poor emergence"]'::jsonb),
      (maize_id, 'Seedling', 2, 20, 'First leaves emerge and grow', 18, 32, 'Water when top inch of soil is dry', 'Balanced NPK', '["Cutworms", "Armyworms"]'::jsonb),
      (maize_id, 'Vegetative Growth', 3, 30, 'Rapid leaf and stem growth', 20, 35, '1-1.5 inches of water per week', 'High nitrogen', '["Maize streak virus", "Leaf blight"]'::jsonb),
      (maize_id, 'Tasseling', 4, 10, 'Male flowers appear at top of plant', 22, 32, 'Consistent moisture is critical', 'Balanced NPK', '["Earworms", "Corn borers"]'::jsonb),
      (maize_id, 'Silking', 5, 7, 'Female flowers (silks) emerge', 22, 30, 'Critical water need - 1.5-2 inches per week', 'High potassium', '["Drought stress", "Ear rot"]'::jsonb),
      (maize_id, 'Grain Filling', 6, 25, 'Kernels develop and fill', 20, 30, '1-1.5 inches of water per week', 'Balanced NPK', '["Birds", "Rodents"]'::jsonb),
      (maize_id, 'Maturity', 7, 15, 'Kernels harden and dry down', 18, 30, 'Reduce watering as crop matures', 'None', '["Mold", "Pre-harvest sprouting"]'::jsonb);
  END IF;
END $$;
