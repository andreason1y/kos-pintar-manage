-- Migration: Fix add_tenant RPC to accept and save jatuh_tempo_hari and email
-- Date: 2026-04-14
-- Description: The previous RPC did not accept or save p_jatuh_tempo (jatuh_tempo_hari)
--              or p_email. This fix also corrects tanggal_keluar being passed as tanggal_masuk.

CREATE OR REPLACE FUNCTION public.add_tenant(
  p_property_id uuid,
  p_room_id uuid,
  p_nama text,
  p_no_hp text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_gender text DEFAULT 'L',
  p_tanggal_masuk date DEFAULT CURRENT_DATE,
  p_tanggal_keluar date DEFAULT NULL,
  p_deposit_amount bigint DEFAULT 0,
  p_jatuh_tempo int DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id uuid;
  v_harga bigint;
  v_bulan int;
  v_tahun int;
BEGIN
  -- Verify property ownership
  IF NOT EXISTS (SELECT 1 FROM properties WHERE id = p_property_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get room price
  SELECT rt.harga_per_bulan INTO v_harga
  FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id
  WHERE r.id = p_room_id;

  IF v_harga IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Insert tenant (now includes jatuh_tempo_hari and email)
  INSERT INTO tenants (property_id, room_id, nama, no_hp, email, gender, tanggal_masuk, tanggal_keluar, jatuh_tempo_hari)
  VALUES (
    p_property_id,
    p_room_id,
    p_nama,
    p_no_hp,
    p_email,
    p_gender::gender_type,
    p_tanggal_masuk,
    p_tanggal_keluar,
    p_jatuh_tempo
  )
  RETURNING id INTO v_tenant_id;

  -- Update room status
  UPDATE rooms SET status = 'terisi' WHERE id = p_room_id;

  -- Create initial transaction
  v_bulan := EXTRACT(MONTH FROM p_tanggal_masuk);
  v_tahun := EXTRACT(YEAR FROM p_tanggal_masuk);
  INSERT INTO transactions (tenant_id, property_id, periode_bulan, periode_tahun, total_tagihan)
  VALUES (v_tenant_id, p_property_id, v_bulan, v_tahun, v_harga);

  -- Create deposit if amount > 0
  IF p_deposit_amount > 0 THEN
    INSERT INTO deposits (tenant_id, property_id, jumlah)
    VALUES (v_tenant_id, p_property_id, p_deposit_amount);
  END IF;

  RETURN json_build_object('tenant_id', v_tenant_id, 'success', true);
END;
$$;
