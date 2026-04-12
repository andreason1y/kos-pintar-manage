-- Update handle_new_user trigger to use 'starter' as default plan instead of 'mandiri'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, no_hp, plan, subscription_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), NEW.raw_user_meta_data->>'no_hp', 'starter', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- Insert pricing settings for starter/pro/bisnis plans
INSERT INTO settings (key, value) VALUES
  ('starter_price_normal', 399000),
  ('starter_price_earlybird', 199000),
  ('pro_price_normal', 699000),
  ('pro_price_earlybird', 349000),
  ('bisnis_price_normal', 1299000),
  ('bisnis_price_earlybird', 649000)
ON CONFLICT DO NOTHING;

-- Insert plan sublabels and early bird badges for settings_text table
INSERT INTO settings_text (key, value) VALUES
  ('starter_sublabel', '10 Kamar'),
  ('starter_earlybird_badge', 'Early Bird'),
  ('pro_sublabel', '25 Kamar'),
  ('pro_earlybird_badge', 'Early Bird'),
  ('bisnis_sublabel', '60 Kamar'),
  ('bisnis_earlybird_badge', 'Early Bird')
ON CONFLICT DO NOTHING;
