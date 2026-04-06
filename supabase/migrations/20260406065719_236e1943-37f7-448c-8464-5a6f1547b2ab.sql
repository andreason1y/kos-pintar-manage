
CREATE TABLE public.deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  jumlah bigint NOT NULL DEFAULT 0,
  jumlah_dikembalikan bigint NOT NULL DEFAULT 0,
  catatan_potongan text,
  status text NOT NULL DEFAULT 'ditahan' CHECK (status IN ('ditahan', 'dikembalikan')),
  tanggal_kembali date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deposits"
ON public.deposits
FOR ALL
TO authenticated
USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));
