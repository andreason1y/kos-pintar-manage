-- Clean up orphaned settings rows (starter/pro/bisnis and price_ prefixed duplicates)
DELETE FROM public.settings WHERE key IN (
  'starter_price_normal', 'starter_price_earlybird',
  'pro_price_normal', 'pro_price_earlybird',
  'bisnis_price_normal', 'bisnis_price_earlybird',
  'price_mandiri_normal', 'price_mandiri_early',
  'price_juragan_normal', 'price_juragan_early',
  'early_bird_enabled', 'early_bird_total_slots'
);

-- Clean up orphaned settings_text rows
DELETE FROM public.settings_text WHERE key IN (
  'starter_sublabel', 'starter_earlybird_badge',
  'pro_sublabel', 'pro_earlybird_badge',
  'bisnis_sublabel', 'bisnis_earlybird_badge'
);

-- Also update handle_new_user to use 'mandiri' instead of 'starter'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, no_hp, plan, subscription_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), NEW.raw_user_meta_data->>'no_hp', 'mandiri', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;