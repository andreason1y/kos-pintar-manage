-- Fix P0: Registration bug "Database error saving new user"
-- Root cause: live DB may have the new trigger (that references `plan` and
-- `subscription_active`) but those columns were not yet added to `profiles`.
-- This migration is idempotent — safe to run even if columns/trigger already exist.

-- Step 1: Ensure all required columns exist on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS no_hp TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Step 2: Normalize the plan column default to 'starter' in case it was
-- previously created with DEFAULT 'mandiri' by an older migration run.
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'starter';

-- Step 3: Migrate any lingering legacy plan names on existing rows
UPDATE public.profiles SET plan = 'starter' WHERE plan = 'mandiri';
UPDATE public.profiles SET plan = 'pro'     WHERE plan = 'juragan';

-- Step 4: Recreate handle_new_user with the canonical correct version.
-- ON CONFLICT (id) DO NOTHING guards against any edge-case double-fire.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, no_hp, plan, subscription_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
    NEW.raw_user_meta_data->>'no_hp',
    'starter',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 5: Recreate the trigger in case it was accidentally dropped or is missing.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
