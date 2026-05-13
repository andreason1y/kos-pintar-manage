-- Tabel untuk menyimpan kode OTP login sementara
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk lookup cepat saat validasi OTP
CREATE INDEX otp_codes_user_id_idx ON public.otp_codes (user_id);
CREATE INDEX otp_codes_expires_at_idx ON public.otp_codes (expires_at);

-- RLS: hanya service role (Edge Function) yang bisa akses
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Tidak ada policy user-facing — semua akses via service role dari Edge Function
