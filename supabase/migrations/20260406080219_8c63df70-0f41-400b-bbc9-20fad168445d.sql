
-- Admins whitelist table (MUST be created before is_admin function)
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Seed initial admin
INSERT INTO public.admins (email) VALUES ('andreassina9a@gmail.com');

-- Admin check function (now admins table exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
$$;

CREATE POLICY "Admins can read admin list"
ON public.admins FOR SELECT
TO authenticated
USING (public.is_admin());

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'aktif',
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  expires_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can read own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Broadcasts table
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read broadcasts"
ON public.broadcasts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create broadcasts"
ON public.broadcasts FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admin read-all policies
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can read all properties"
ON public.properties FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can read all rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can read all room_types"
ON public.room_types FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin function to get all users
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  nama text,
  no_hp text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text, u.created_at, p.nama, p.no_hp
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE public.is_admin()
  ORDER BY u.created_at DESC
$$;

-- Admin function to get user stats
CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
RETURNS TABLE (
  user_id uuid,
  property_count bigint,
  room_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    COUNT(DISTINCT p.id) as property_count,
    COUNT(DISTINCT r.id) as room_count
  FROM properties p
  LEFT JOIN room_types rt ON rt.property_id = p.id
  LEFT JOIN rooms r ON r.room_type_id = rt.id
  WHERE public.is_admin()
  GROUP BY p.user_id
$$;
