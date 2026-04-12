-- Migrate existing users from old plan names to new ones
-- mandiri → starter
-- juragan → pro

UPDATE public.subscriptions
SET plan = 'starter'
WHERE plan = 'mandiri';

UPDATE public.subscriptions
SET plan = 'pro'
WHERE plan = 'juragan';

UPDATE public.profiles
SET plan = 'starter'
WHERE plan = 'mandiri';

UPDATE public.profiles
SET plan = 'pro'
WHERE plan = 'juragan';
