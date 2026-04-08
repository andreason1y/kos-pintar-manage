
-- Insert new settings keys if they don't exist
INSERT INTO public.settings (key, value) VALUES
  ('mandiri_price_normal', 499000),
  ('mandiri_price_earlybird', 249000),
  ('juragan_price_normal', 999000),
  ('juragan_price_earlybird', 499000),
  ('earlybird_active', 1),
  ('earlybird_slots_total', 100)
ON CONFLICT DO NOTHING;

-- Create a text settings table for string-based settings
CREATE TABLE IF NOT EXISTS public.settings_text (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings_text ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings_text" ON public.settings_text
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage settings_text" ON public.settings_text
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Insert text settings
INSERT INTO public.settings_text (key, value) VALUES
  ('earlybird_label', 'Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama'),
  ('mandiri_sublabel', 'Kurang dari Rp 700/hari'),
  ('juragan_sublabel', ''),
  ('mandiri_earlybird_badge', '🔥 Early Bird'),
  ('juragan_earlybird_badge', '🔥 Early Bird — Kos Besar')
ON CONFLICT DO NOTHING;
