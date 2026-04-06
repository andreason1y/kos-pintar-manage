
-- Properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nama_kos TEXT NOT NULL,
  alamat TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own properties" ON public.properties
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Room types table
CREATE TABLE public.room_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  nama TEXT NOT NULL,
  harga_per_bulan BIGINT NOT NULL DEFAULT 0,
  fasilitas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own room types" ON public.room_types
  FOR ALL USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  ) WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

-- Rooms table
CREATE TYPE public.room_status AS ENUM ('kosong', 'terisi');

CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE NOT NULL,
  nomor TEXT NOT NULL,
  lantai INT NOT NULL DEFAULT 1,
  status public.room_status NOT NULL DEFAULT 'kosong',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rooms" ON public.rooms
  FOR ALL USING (
    room_type_id IN (
      SELECT rt.id FROM public.room_types rt
      JOIN public.properties p ON rt.property_id = p.id
      WHERE p.user_id = auth.uid()
    )
  ) WITH CHECK (
    room_type_id IN (
      SELECT rt.id FROM public.room_types rt
      JOIN public.properties p ON rt.property_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Tenants table
CREATE TYPE public.tenant_status AS ENUM ('aktif', 'keluar');
CREATE TYPE public.gender_type AS ENUM ('L', 'P');

CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  no_hp TEXT,
  gender public.gender_type NOT NULL DEFAULT 'L',
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_keluar DATE,
  status public.tenant_status NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tenants" ON public.tenants
  FOR ALL USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  ) WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

-- Transactions table
CREATE TYPE public.payment_status AS ENUM ('belum_bayar', 'belum_lunas', 'lunas');
CREATE TYPE public.payment_method AS ENUM ('tunai', 'transfer', 'qris');

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  periode_bulan INT NOT NULL,
  periode_tahun INT NOT NULL,
  total_tagihan BIGINT NOT NULL DEFAULT 0,
  jumlah_dibayar BIGINT NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'belum_bayar',
  metode_bayar public.payment_method,
  tanggal_bayar DATE,
  catatan TEXT,
  nota_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  ) WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'lainnya',
  jumlah BIGINT NOT NULL DEFAULT 0,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  ) WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT,
  no_hp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
