
INSERT INTO settings (key, value) VALUES
  ('early_bird_enabled', 1),
  ('price_mandiri_normal', 399000),
  ('price_juragan_normal', 799000),
  ('price_mandiri_early', 249000),
  ('price_juragan_early', 499000),
  ('early_bird_total_slots', 100)
ON CONFLICT DO NOTHING;
