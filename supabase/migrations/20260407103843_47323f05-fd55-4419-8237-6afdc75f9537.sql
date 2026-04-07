
-- RPC: Add tenant atomically (insert tenant, update room, create transaction, create deposit)
CREATE OR REPLACE FUNCTION public.add_tenant(
  p_property_id uuid,
  p_room_id uuid,
  p_nama text,
  p_no_hp text DEFAULT NULL,
  p_gender text DEFAULT 'L',
  p_tanggal_masuk date DEFAULT CURRENT_DATE,
  p_tanggal_keluar date DEFAULT NULL,
  p_deposit_amount bigint DEFAULT 0
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

  -- Insert tenant
  INSERT INTO tenants (property_id, room_id, nama, no_hp, gender, tanggal_masuk, tanggal_keluar)
  VALUES (p_property_id, p_room_id, p_nama, p_no_hp, p_gender::gender_type, p_tanggal_masuk, p_tanggal_keluar)
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

-- RPC: End tenant contract atomically
CREATE OR REPLACE FUNCTION public.end_tenant_contract(
  p_tenant_id uuid,
  p_deposit_action text DEFAULT 'none',
  p_return_amount bigint DEFAULT 0,
  p_deduction_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant RECORD;
  v_deposit RECORD;
  v_today date := CURRENT_DATE;
BEGIN
  -- Get tenant and verify ownership
  SELECT t.*, p.user_id, p.id as prop_id
  INTO v_tenant
  FROM tenants t JOIN properties p ON t.property_id = p.id
  WHERE t.id = p_tenant_id;

  IF v_tenant IS NULL OR v_tenant.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update tenant status
  UPDATE tenants SET status = 'keluar', tanggal_keluar = v_today, room_id = NULL
  WHERE id = p_tenant_id;

  -- Free up room
  IF v_tenant.room_id IS NOT NULL THEN
    UPDATE rooms SET status = 'kosong' WHERE id = v_tenant.room_id;
  END IF;

  -- Handle deposit
  SELECT * INTO v_deposit FROM deposits
  WHERE tenant_id = p_tenant_id AND status = 'ditahan'
  LIMIT 1;

  IF v_deposit IS NOT NULL AND p_deposit_action != 'none' THEN
    IF p_deposit_action = 'full' THEN
      UPDATE deposits SET status = 'dikembalikan', jumlah_dikembalikan = v_deposit.jumlah, tanggal_kembali = v_today
      WHERE id = v_deposit.id;
      INSERT INTO expenses (property_id, judul, kategori, jumlah, tanggal, is_recurring)
      VALUES (v_tenant.prop_id, 'Pengembalian deposit - ' || v_tenant.nama, 'Pengembalian Deposit', v_deposit.jumlah, v_today, false);

    ELSIF p_deposit_action = 'partial' THEN
      UPDATE deposits SET status = 'dikembalikan', jumlah_dikembalikan = p_return_amount,
        catatan_potongan = p_deduction_note, tanggal_kembali = v_today
      WHERE id = v_deposit.id;
      IF p_return_amount > 0 THEN
        INSERT INTO expenses (property_id, judul, kategori, jumlah, tanggal, is_recurring)
        VALUES (v_tenant.prop_id, 'Pengembalian deposit - ' || v_tenant.nama, 'Pengembalian Deposit', p_return_amount, v_today, false);
      END IF;

    ELSIF p_deposit_action = 'forfeit' THEN
      UPDATE deposits SET status = 'dikembalikan', jumlah_dikembalikan = 0,
        catatan_potongan = 'Deposit hangus - ' || COALESCE(p_deduction_note, 'tidak ada alasan'),
        tanggal_kembali = v_today
      WHERE id = v_deposit.id;
    END IF;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- RPC: Delete tenant atomically (free room, cleanup)
CREATE OR REPLACE FUNCTION public.delete_tenant(
  p_tenant_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant RECORD;
BEGIN
  -- Get tenant and verify ownership
  SELECT t.*, p.user_id
  INTO v_tenant
  FROM tenants t JOIN properties p ON t.property_id = p.id
  WHERE t.id = p_tenant_id;

  IF v_tenant IS NULL OR v_tenant.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Free up room
  IF v_tenant.room_id IS NOT NULL THEN
    UPDATE rooms SET status = 'kosong' WHERE id = v_tenant.room_id;
  END IF;

  -- Delete related records
  DELETE FROM deposits WHERE tenant_id = p_tenant_id;
  DELETE FROM transactions WHERE tenant_id = p_tenant_id;
  DELETE FROM reminders WHERE tenant_id = p_tenant_id;
  DELETE FROM tenants WHERE id = p_tenant_id;

  RETURN json_build_object('success', true);
END;
$$;
