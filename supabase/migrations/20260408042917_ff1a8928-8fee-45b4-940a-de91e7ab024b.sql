
DROP FUNCTION IF EXISTS public.admin_get_users();

CREATE FUNCTION public.admin_get_users()
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone, nama text, no_hp text, provider text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT u.id, u.email::text, u.created_at, p.nama, p.no_hp,
    COALESCE(u.raw_app_meta_data->>'provider', 'email')::text as provider
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE public.is_admin()
  ORDER BY u.created_at DESC
$$;
