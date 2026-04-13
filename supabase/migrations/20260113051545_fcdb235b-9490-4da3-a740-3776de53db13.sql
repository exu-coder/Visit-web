-- Add regional pricing column to packages table
ALTER TABLE public.packages 
ADD COLUMN regional_prices JSONB DEFAULT '{"India": null, "Bangladesh": null}'::jsonb;

-- Update existing packages with regional prices (null means use default price)
UPDATE public.packages SET regional_prices = '{"India": null, "Bangladesh": null}'::jsonb WHERE regional_prices IS NULL;