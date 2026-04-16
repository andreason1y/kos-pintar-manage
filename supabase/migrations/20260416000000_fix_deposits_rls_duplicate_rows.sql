-- Fix: duplicate rows returned from deposits table due to RLS policy using
-- IN (SELECT ...). PostgreSQL's planner can implement IN as a hash/nested-loop
-- join against the subquery result. When the properties table has multiple
-- permissive SELECT policies, a single property row can satisfy more than one
-- policy and appear multiple times in the join output, causing each deposits
-- row to be returned multiple times.
--
-- Fix: replace IN (SELECT ...) with EXISTS (SELECT 1 ...).
-- EXISTS is always evaluated as a correlated filter (boolean per row),
-- never as a join, so it cannot produce duplicate rows regardless of
-- how many policies match on the referenced table.

DROP POLICY IF EXISTS "Users can manage own deposits" ON public.deposits;

CREATE POLICY "Users can manage own deposits"
ON public.deposits
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = deposits.property_id
      AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = deposits.property_id
      AND user_id = auth.uid()
  )
);
