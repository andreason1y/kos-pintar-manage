-- Tripay payment orders table
CREATE TABLE IF NOT EXISTS public.tripay_orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_ref    text        UNIQUE NOT NULL,
  reference       text        UNIQUE,
  plan            text        NOT NULL,
  duration_months integer     NOT NULL DEFAULT 1,
  amount          integer     NOT NULL,
  status          text        NOT NULL DEFAULT 'UNPAID',
  payment_method  text,
  checkout_url    text,
  pay_code        text,
  pay_name        text,
  tripay_response jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tripay_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tripay orders"
  ON public.tripay_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages tripay orders"
  ON public.tripay_orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.tripay_orders_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tripay_orders_updated_at
  BEFORE UPDATE ON public.tripay_orders
  FOR EACH ROW EXECUTE FUNCTION public.tripay_orders_set_updated_at();
