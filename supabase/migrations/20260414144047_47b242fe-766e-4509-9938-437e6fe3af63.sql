
-- Create free_trial_uses table
CREATE TABLE public.free_trial_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  used_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.free_trial_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trial" ON public.free_trial_uses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial" ON public.free_trial_uses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage trials" ON public.free_trial_uses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add unique constraint on site_settings.setting_key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_setting_key_key'
  ) THEN
    ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);
  END IF;
END $$;
