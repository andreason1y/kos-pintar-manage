-- ============================================================
-- 1. Create subscription_prices table (multi-duration pricing)
-- ============================================================
CREATE TABLE public.subscription_prices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier            text NOT NULL,
  duration_months integer NOT NULL,
  price           integer NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_prices_tier_duration_unique UNIQUE (tier, duration_months)
);

ALTER TABLE public.subscription_prices ENABLE ROW LEVEL SECURITY;

-- Public (anon) can read for landing page (no auth required)
CREATE POLICY "Public read subscription prices"
  ON public.subscription_prices FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage subscription prices"
  ON public.subscription_prices FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 2. Seed pricing data (IDR, total per duration — not monthly)
-- ============================================================
INSERT INTO public.subscription_prices (tier, duration_months, price) VALUES
  ('mini',    1,  25000),
  ('mini',    3,  65000),
  ('mini',    6,  109000),
  ('mini',    12, 149000),
  ('starter', 1,  45000),
  ('starter', 3,  119000),
  ('starter', 6,  199000),
  ('starter', 12, 249000),
  ('pro',     1,  89000),
  ('pro',     3,  229000),
  ('pro',     6,  379000),
  ('pro',     12, 499000);

-- ============================================================
-- 3. Add duration_months column to subscriptions
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS duration_months integer NOT NULL DEFAULT 12;

-- ============================================================
-- 4. Rename plan names in subscriptions
--    Order matters: starter→mini first, then pro→starter, bisnis→pro
--    This avoids name collisions during the cascade rename.
-- ============================================================
UPDATE public.subscriptions SET plan = 'mini'    WHERE plan = 'starter';
UPDATE public.subscriptions SET plan = 'starter' WHERE plan = 'pro';
UPDATE public.subscriptions SET plan = 'pro'     WHERE plan = 'bisnis';

-- Also update denormalized plan field in profiles
UPDATE public.profiles SET plan = 'mini'    WHERE plan = 'starter';
UPDATE public.profiles SET plan = 'starter' WHERE plan = 'pro';
UPDATE public.profiles SET plan = 'pro'     WHERE plan = 'bisnis';

-- ============================================================
-- 5. Update plan_limits table (if it exists)
--    DELETE old rows, INSERT new rows to handle PK rename safely
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'plan_limits'
  ) THEN
    DELETE FROM public.plan_limits WHERE plan IN ('starter', 'pro', 'bisnis');
    INSERT INTO public.plan_limits (plan, max_rooms, harga_per_tahun, nama_display) VALUES
      ('mini',    10, 149000, 'Mini'),
      ('starter', 25, 249000, 'Starter'),
      ('pro',     60, 499000, 'Pro')
    ON CONFLICT (plan) DO UPDATE SET
      max_rooms       = EXCLUDED.max_rooms,
      harga_per_tahun = EXCLUDED.harga_per_tahun,
      nama_display    = EXCLUDED.nama_display;
  END IF;
END $$;
