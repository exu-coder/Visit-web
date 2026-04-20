-- Attempts log
CREATE TABLE public.coupon_redemption_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_attempted TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemption_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own attempts"
  ON public.coupon_redemption_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own attempts"
  ON public.coupon_redemption_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
  ON public.coupon_redemption_attempts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage attempts"
  ON public.coupon_redemption_attempts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_coupon_attempts_user_time
  ON public.coupon_redemption_attempts (user_id, created_at DESC);

-- Rate limit check function: returns true if user is allowed to attempt
-- Limits: max 10 attempts per 10 minutes, max 3 failed attempts per minute
CREATE OR REPLACE FUNCTION public.check_coupon_redemption_rate_limit(_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, reason TEXT, retry_after_seconds INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_total INTEGER;
  recent_failed INTEGER;
BEGIN
  -- Total attempts in last 10 minutes
  SELECT COUNT(*) INTO recent_total
  FROM public.coupon_redemption_attempts
  WHERE user_id = _user_id
    AND created_at > now() - interval '10 minutes';

  -- Failed attempts in last 1 minute
  SELECT COUNT(*) INTO recent_failed
  FROM public.coupon_redemption_attempts
  WHERE user_id = _user_id
    AND success = false
    AND created_at > now() - interval '1 minute';

  IF recent_total >= 10 THEN
    RETURN QUERY SELECT false, 'Too many attempts. Try again in 10 minutes.'::TEXT, 600;
    RETURN;
  END IF;

  IF recent_failed >= 3 THEN
    RETURN QUERY SELECT false, 'Too many failed attempts. Try again in 1 minute.'::TEXT, 60;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, 0;
END;
$$;