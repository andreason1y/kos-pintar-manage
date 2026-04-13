-- Migration: Add overdue tracking to transactions
-- Date: 2026-04-13
-- Description: Add is_overdue and overdue_days fields with trigger-based calculation

-- Step 1: Add columns to transactions table
ALTER TABLE transactions
ADD COLUMN is_overdue BOOLEAN DEFAULT false,
ADD COLUMN overdue_days INTEGER DEFAULT 0;

-- Step 2: Create helper function for calculating due date
CREATE OR REPLACE FUNCTION get_due_date(
  p_periode_tahun INTEGER,
  p_periode_bulan INTEGER,
  p_tanggal_masuk DATE
) RETURNS DATE AS $$
DECLARE
  v_due_date DATE;
  v_day_of_month INTEGER;
  v_last_day_of_month DATE;
BEGIN
  v_day_of_month := EXTRACT(DAY FROM p_tanggal_masuk)::INTEGER;
  v_last_day_of_month := (DATE_TRUNC('month', (p_periode_tahun || '-' || LPAD(p_periode_bulan::TEXT, 2, '0') || '-01')::DATE) + INTERVAL '1 month - 1 day')::DATE;

  -- If requested day exceeds the month's last day, use last day of month
  IF v_day_of_month > EXTRACT(DAY FROM v_last_day_of_month)::INTEGER THEN
    v_due_date := v_last_day_of_month;
  ELSE
    v_due_date := (p_periode_tahun || '-' || LPAD(p_periode_bulan::TEXT, 2, '0') || '-' ||
                   LPAD(v_day_of_month::TEXT, 2, '0'))::DATE;
  END IF;

  RETURN v_due_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Create function to calculate overdue status
-- Due date is calculated as: date(periode_tahun, periode_bulan - 1, day_of_month from tanggal_masuk)
CREATE OR REPLACE FUNCTION calc_overdue_status(
  p_periode_tahun INTEGER,
  p_periode_bulan INTEGER,
  p_tanggal_masuk DATE,
  p_status VARCHAR
) RETURNS TABLE(is_overdue BOOLEAN, overdue_days INTEGER) AS $$
DECLARE
  v_due_date DATE;
BEGIN
  v_due_date := get_due_date(p_periode_tahun, p_periode_bulan, p_tanggal_masuk);

  RETURN QUERY SELECT
    (p_status != 'lunas' AND v_due_date < CURRENT_DATE)::BOOLEAN,
    CASE WHEN v_due_date < CURRENT_DATE
         THEN (CURRENT_DATE - v_due_date)::INTEGER
         ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Create trigger function to auto-update is_overdue and overdue_days
CREATE OR REPLACE FUNCTION trigger_update_overdue()
RETURNS TRIGGER AS $$
DECLARE
  v_tenants_record RECORD;
  v_result RECORD;
BEGIN
  -- Get tenants data to get tanggal_masuk
  SELECT tanggal_masuk INTO v_tenants_record
  FROM tenants
  WHERE id = NEW.tenant_id;

  -- Calculate overdue status
  SELECT * INTO v_result FROM calc_overdue_status(
    NEW.periode_tahun,
    NEW.periode_bulan,
    v_tenants_record.tanggal_masuk,
    NEW.status
  );

  -- Update NEW record with calculated values
  NEW.is_overdue := v_result.is_overdue;
  NEW.overdue_days := v_result.overdue_days;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger on INSERT and UPDATE
CREATE TRIGGER trg_transactions_calc_overdue
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_overdue();

-- Step 5: Create index for efficient querying overdue payments
CREATE INDEX idx_transactions_overdue_property
ON transactions(property_id, is_overdue)
WHERE is_overdue = true;

-- Step 6: Backfill existing transactions with overdue status
WITH transaction_dates AS (
  SELECT
    t.id,
    t.status,
    t.property_id,
    t.tenant_id,
    get_due_date(t.periode_tahun, t.periode_bulan, tn.tanggal_masuk) AS due_date
  FROM transactions t
  JOIN tenants tn ON t.tenant_id = tn.id
)
UPDATE transactions t
SET
  is_overdue = (td.due_date < CURRENT_DATE AND t.status != 'lunas'),
  overdue_days = CASE WHEN td.due_date < CURRENT_DATE AND t.status != 'lunas'
                      THEN (CURRENT_DATE - td.due_date)::INTEGER
                      ELSE 0
                 END
FROM transaction_dates td
WHERE t.id = td.id;
