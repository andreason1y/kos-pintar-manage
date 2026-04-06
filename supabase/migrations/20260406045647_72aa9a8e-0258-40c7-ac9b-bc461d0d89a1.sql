
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('h-3', 'h0', 'h+3')),
  message text NOT NULL,
  wa_link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  periode_bulan integer NOT NULL,
  periode_tahun integer NOT NULL
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
ON public.reminders FOR ALL TO authenticated
USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE UNIQUE INDEX reminders_unique_per_tenant_period_type
ON public.reminders (tenant_id, periode_bulan, periode_tahun, type);
