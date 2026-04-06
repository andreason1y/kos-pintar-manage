CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, no_hp)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), NEW.raw_user_meta_data->>'no_hp');
  RETURN NEW;
END;
$$;