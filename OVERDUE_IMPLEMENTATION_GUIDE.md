# Overdue Dashboard Feature - Implementation Guide

## Overview
This document describes the changes made to implement the overdue dashboard feature for Kos Pintar.

### Changes Made:
1. **Database Schema**: Added `is_overdue` and `overdue_days` fields to transactions table
2. **Trigger & Functions**: Created database functions to automatically calculate overdue status
3. **Data Fetching**: Added `useOverduePaymentStats` query hook
4. **Dashboard UI**: 
   - Removed "Total Penyewa" stat card
   - Modified "Kamar Terisi" to show "X/Y" format (e.g., "12/30")
   - Added "Overdue" stat card (red/destructive color, clickable to navigate to Pembayaran page)
5. **Demo Mode**: Updated mock transaction data with `is_overdue` and `overdue_days` fields

## Files Modified

### 1. Database Migration
**File**: `supabase/migrations/20260413100000_add_overdue_tracking.sql`

This migration contains:
- Add `is_overdue` BOOLEAN column to transactions
- Add `overdue_days` INTEGER column to transactions
- Create `get_due_date()` function to calculate due dates
- Create `calc_overdue_status()` function to determine overdue status
- Create trigger `trg_transactions_calc_overdue` for automatic calculations
- Create index for efficient queries
- Backfill existing transactions with overdue status

**To Apply**: Copy the SQL script content and run it in Supabase SQL Editor:
```sql
-- Open Supabase Dashboard → SQL Editor
-- Create New Query
-- Copy content from supabase/migrations/20260413100000_add_overdue_tracking.sql
-- Execute
```

### 2. Frontend Query Hook
**File**: `src/hooks/use-queries.ts`

Added:
- `fetchOverduePaymentStats(propertyId)` - Fetches count of overdue payments
- `useOverduePaymentStats()` - React Query hook for overdue stats
- Updated `useInvalidate()` to include `overdueStats` invalidation

### 3. Dashboard Component
**File**: `src/pages/DashboardPage.tsx`

Changes:
- Import `useOverduePaymentStats` hook
- Add `overduePayments` to `DashboardStats` interface
- Import `AlertCircle` icon (removed `Users` icon)
- Updated stat cards rendering:
  - Removed "Total Penyewa" card
  - Changed "Kamar Terisi" from showing just number to "X/Y" format
  - Added new "Overdue" card (red, with click handler to navigate to pembayaran page)
- Wire up click handler: `navigate("/pembayaran?filter=overdue")`

### 4. Demo Mode
**File**: `src/lib/demo-context.tsx`

Updates:
- Added `is_overdue?: boolean` and `overdue_days?: number` to `DemoTransaction` interface
- Updated mock transactions data:
  - tx-5: `is_overdue: true, overdue_days: 12` (belum_bayar)
  - tx-8: `is_overdue: true, overdue_days: 12` (belum_bayar)
  - All others: `is_overdue: false, overdue_days: 0`

## How Overdue is Calculated

**Due Date Formula:**
```
Due Date = Date(periode_tahun, periode_bulan, day_of_month_from_tanggal_masuk)
```

**Overdue Determination:**
```
is_overdue = (status != 'lunas' AND due_date < today)
overdue_days = max(0, today - due_date)
```

**Example:**
- Tenant check-in date: 2025-10-01 (day = 1)
- Invoice period: April 2026
- Due date: 2026-04-01
- Today: 2026-04-13
- Status: belum_bayar
- Result: is_overdue = true, overdue_days = 12

## Supabase SQL Script (Ready to Copy-Paste)

```sql
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

-- Step 4: Create trigger function to auto-update is_overdue and overdue_days
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

-- Step 5: Create trigger on INSERT and UPDATE
CREATE TRIGGER trg_transactions_calc_overdue
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_overdue();

-- Step 6: Create index for efficient querying overdue payments
CREATE INDEX idx_transactions_overdue_property
ON transactions(property_id, is_overdue)
WHERE is_overdue = true;

-- Step 7: Backfill existing transactions with overdue status
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
```

## Next Steps After Migration

1. **Apply SQL Migration** in Supabase SQL Editor (copy script above)
2. **Regenerate Types** (auto-generated from schema):
   ```bash
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```
3. **No code changes needed** - all frontend changes already implemented

## Testing the Feature

### In Demo Mode:
- Navigate to Dashboard
- You should see 3 stat cards: Kamar (12/12), Overdue (2), Belum Lunas (4)
- Click on Overdue card → navigates to Pembayaran page

### In Production (After Migration):
- Dashboard will automatically show overdue count
- Overdue stat updates whenever transactions are created/updated
- Click on Overdue → shows payment page filtered for overdue items

## Troubleshooting

**Issue**: Overdue count shows 0 but there should be overdue payments
- Check if transaction `status` is 'lunas' (only non-lunas are overdue)
- Verify `tanggal_masuk` and `periode_bulan`/`periode_tahun` calculate correct due date
- Run backfill query manually

**Issue**: Overdue card doesn't navigate
- Check if router is properly set up for "/pembayaran" route
- Verify query parameter filter logic in PembayaranPage

## Performance Notes

- Index `idx_transactions_overdue_property` optimizes overdue queries
- Trigger automatically updates fields on INSERT/UPDATE (no manual calculation)
- React Query caches with 5-minute stale time
- Demo mode doesn't hit database (in-memory)
