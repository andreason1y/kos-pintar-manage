-- tripay_orders was created directly in Supabase Dashboard (outside migration system).
-- This migration documents the existing schema and applies missing pieces:
-- admin read policy, performance indexes, and paid_at column.

-- Add paid_at column (not in original schema)
ALTER TABLE public.tripay_orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Admin read policy (missing from original RLS setup)
DROP POLICY IF EXISTS "Admins can read all tripay orders" ON public.tripay_orders;
CREATE POLICY "Admins can read all tripay orders"
  ON public.tripay_orders FOR SELECT TO authenticated
  USING (public.is_admin());

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS tripay_orders_user_id_idx ON public.tripay_orders (user_id);
CREATE INDEX IF NOT EXISTS tripay_orders_status_idx  ON public.tripay_orders (status);
