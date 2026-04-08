
-- Admin activity log table
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity log" ON public.admin_activity_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add last_login to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Insert text settings for landing page content management
INSERT INTO public.settings_text (key, value) VALUES
  ('announcement_banner_text', '🔥 Early Bird: Tersisa {slots} slot — Hemat 50% hari ini'),
  ('pricing_footer_text', 'Harga naik setelah 100 pengguna pertama'),
  ('hero_headline', 'Aplikasi Manajemen Kos Terbaik di Indonesia'),
  ('hero_subheadline', 'Kelola Penyewa, Tagihan & Keuangan Kos dalam Satu Aplikasi'),
  ('hero_subtext', 'Tagihan otomatis, reminder WA, nota PDF, dan laporan keuangan lengkap. Hemat hingga Rp 1.800.000/tahun dibanding aplikasi kos lain.'),
  ('footer_tagline', 'Aplikasi manajemen kos-kosan terbaik di Indonesia. Kelola penyewa, tagihan, dan keuangan kos dalam satu aplikasi.'),
  ('contact_wa', '62818477620'),
  ('contact_email', 'hello@kospintar.id'),
  ('admin_email', 'andreassina9a@gmail.com'),
  ('app_version', '1.0.0'),
  ('faq_data', '[{"q":"Apakah data saya aman?","a":"Ya, data disimpan di server terenkripsi dan hanya bisa diakses oleh Anda."},{"q":"Apa beda paket Mandiri dan Juragan?","a":"Paket Mandiri mendukung hingga 40 kamar. Paket Juragan mendukung hingga 200 kamar, plus prioritas support."},{"q":"Apakah ada biaya tambahan?","a":"Tidak ada. Harga sudah termasuk semua fitur untuk kelola kos-kosan Anda."},{"q":"Bagaimana cara perpanjang langganan?","a":"Kami akan kirim notifikasi sebelum masa langganan habis. Perpanjang langsung dari aplikasi."},{"q":"Apakah bisa dicoba dulu?","a":"Ya, tersedia mode demo tanpa perlu daftar. Klik Coba Demo di halaman utama."}]'),
  ('testimonials_data', '[{"quote":"Sewa sudah otomatis tercatat, saya tinggal cek HP kalau ada yang belum bayar. Jauh lebih rapi dari buku tulis.","name":"Pak Hendra S.","kos":"Kos di Bandung Utara","stars":5},{"quote":"Harganya flat, punya 18 kamar tapi bayarnya sama aja kayak yang punya 5 kamar. Masuk akal banget.","name":"Bu Ratna W.","kos":"Kos di Sleman, Yogyakarta","stars":5},{"quote":"Nota PDF langsung kirim ke WA penyewa, penyewa jadi lebih serius bayarnya.","name":"Pak Doni A.","kos":"Kos di Gubeng, Surabaya","stars":5}]'),
  ('in_app_announcement_text', '')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert numeric settings
INSERT INTO public.settings (key, value) VALUES
  ('announcement_banner_active', 1),
  ('maintenance_mode', 0),
  ('in_app_announcement_active', 0)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add unique constraint on settings keys if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_key_unique') THEN
    ALTER TABLE public.settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_text_key_unique') THEN
    ALTER TABLE public.settings_text ADD CONSTRAINT settings_text_key_unique UNIQUE (key);
  END IF;
END $$;
