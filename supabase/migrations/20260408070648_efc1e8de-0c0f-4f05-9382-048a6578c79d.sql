
-- Add subscription columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'mandiri';

-- Create payment_transactions table for Midtrans payments
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id text UNIQUE NOT NULL,
  plan text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  snap_token text,
  midtrans_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment transactions"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payment transactions"
  ON public.payment_transactions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow edge functions (service role) to insert/update
CREATE POLICY "Service role can manage payment transactions"
  ON public.payment_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Set admin email as an admin bypass for subscription check
-- Update existing admin profile to have subscription_active = true
UPDATE public.profiles SET subscription_active = true WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'andreassina9a@gmail.com'
);
