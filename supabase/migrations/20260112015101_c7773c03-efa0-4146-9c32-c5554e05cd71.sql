-- Create packages table for admin-managed glory packages
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER, -- For discount/sale display
  image_url TEXT,
  features TEXT[], -- Array of feature strings
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site settings table for branding
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, promo
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- wallet, bank, upi
  details TEXT NOT NULL, -- wallet address, bank details, upi id
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Packages policies (public read, admin write)
CREATE POLICY "Anyone can view active packages" ON public.packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.packages
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Site settings policies (public read, admin write)
CREATE POLICY "Anyone can view site settings" ON public.site_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Announcements policies (public read active, admin write)
CREATE POLICY "Anyone can view active announcements" ON public.announcements
FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Payment methods policies (public read active, admin write)
CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site name
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('site_name', 'Roshan Glory Shop');

-- Add ban column to profiles for user management
ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;

-- Policy for admins to update any profile (for banning)
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));