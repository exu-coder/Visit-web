
-- Add credit balance to profiles
ALTER TABLE public.profiles ADD COLUMN credit_balance integer NOT NULL DEFAULT 0;

-- Create credit coupons table
CREATE TABLE public.credit_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  credit_amount integer NOT NULL,
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage credit coupons"
ON public.credit_coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view unredeemed coupons for validation"
ON public.credit_coupons FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update coupons to redeem"
ON public.credit_coupons FOR UPDATE
TO authenticated
USING (is_redeemed = false)
WITH CHECK (is_redeemed = true AND redeemed_by = auth.uid());
