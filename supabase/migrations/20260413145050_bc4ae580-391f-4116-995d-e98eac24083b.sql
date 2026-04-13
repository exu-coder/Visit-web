
-- Add category and sub_category columns to packages
ALTER TABLE public.packages ADD COLUMN category text NOT NULL DEFAULT 'visit';
ALTER TABLE public.packages ADD COLUMN sub_category text DEFAULT NULL;

-- category: 'visit' or 'tcp'
-- sub_category: for tcp packages, 'guild' or 'friend'
