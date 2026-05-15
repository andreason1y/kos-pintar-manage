-- Fix: replace IN (SELECT ...) with EXISTS (SELECT 1 ...) on all remaining tables.
-- Same root cause as the deposits fix (20260416000000): when properties table has
-- multiple permissive SELECT policies (user + admin), PostgreSQL's planner can
-- implement IN as a join, causing duplicate rows for each matching policy.
-- EXISTS is always a correlated boolean filter per row, never a join.

-- room_types
DROP POLICY IF EXISTS "Users can manage own room types" ON public.room_types;
CREATE POLICY "Users can manage own room types"
ON public.room_types FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = room_types.property_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = room_types.property_id AND user_id = auth.uid()
  )
);

-- rooms (joins through room_types → properties)
DROP POLICY IF EXISTS "Users can manage own rooms" ON public.rooms;
CREATE POLICY "Users can manage own rooms"
ON public.rooms FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.room_types rt
    JOIN public.properties p ON rt.property_id = p.id
    WHERE rt.id = rooms.room_type_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_types rt
    JOIN public.properties p ON rt.property_id = p.id
    WHERE rt.id = rooms.room_type_id AND p.user_id = auth.uid()
  )
);

-- tenants
DROP POLICY IF EXISTS "Users can manage own tenants" ON public.tenants;
CREATE POLICY "Users can manage own tenants"
ON public.tenants FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = tenants.property_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = tenants.property_id AND user_id = auth.uid()
  )
);

-- transactions
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions"
ON public.transactions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = transactions.property_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = transactions.property_id AND user_id = auth.uid()
  )
);

-- expenses
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
CREATE POLICY "Users can manage own expenses"
ON public.expenses FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = expenses.property_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = expenses.property_id AND user_id = auth.uid()
  )
);

-- reminders
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
CREATE POLICY "Users can manage own reminders"
ON public.reminders FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = reminders.property_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = reminders.property_id AND user_id = auth.uid()
  )
);
