

## Database & Code Audit — Issues Found

### Critical Issue: Plan Name Mismatch

The **database** uses `plan_enum` with values `mandiri` and `juragan`, but the **code** (`src/lib/plan-context.tsx`) defines `PlanType` as `starter | pro | bisnis | demo`. This means:
- The plan context will never match DB values
- Room limits, labels, and plan gating are all broken
- The settings table has duplicate pricing keys for both naming schemes (mandiri/juragan AND starter/pro/bisnis)

**Fix:** Align `plan-context.tsx` back to `mandiri | juragan | demo` to match the DB enum. Update `PLAN_LIMITS` and `PLAN_LABELS` accordingly. Remove the starter/pro/bisnis pricing columns and settings keys.

### Build Errors to Fix (6 total)

1. **`vite.config.ts`** — imports `vite-plugin-singlefile` which is not installed. Remove the unused import (line 6).

2. **`supabase/functions/admin-manage-user/index.ts`** — `err` is type `unknown`. Fix: `(err as Error).message`.

3. **`supabase/functions/daily-billing/index.ts`** — `error` is type `unknown`. Fix: `(error as Error).message`.

4. **`src/lib/notification-service.ts`** — references table `pembayaran` which doesn't exist (table is `transactions`). Also filters by `status: "belum_lunas"` which doesn't match the enum. Needs rewrite to use correct table/column names.

5. **`src/pages/KamarPage.tsx` (line 194)** — compares `plan === "juragan"` but `PlanType` doesn't include `juragan`. Will be fixed when we realign PlanType.

6. **`src/pages/PenyewaPage.tsx` (lines 149, 180)** — passes `email` and `sendEmailNotifications` to `DemoTenant` type which doesn't have those fields. Fix: add `email` and `send_email_notifications` to `DemoTenant` interface in `demo-context.tsx`.

### Duplicate Settings Keys

The `settings` table has redundant pricing keys from different iterations:
- `mandiri_price_normal/earlybird` + `juragan_price_normal/earlybird` (original)
- `price_mandiri_normal/early` + `price_juragan_normal/early` (older)
- `starter_price_normal/earlybird` + `pro_price_normal/earlybird` + `bisnis_price_normal/earlybird` (mismatched rename)

Plus the `settings` table schema has columns like `starter_price_normal`, `pro_price_normal`, `bisnis_price_normal` baked into the table structure — these are unused since pricing is stored via key-value rows.

**Fix:** Clean up by deleting the unused key-value rows (`starter_*`, `pro_*`, `bisnis_*`, `price_*` prefixed keys). Keep only `mandiri_*` and `juragan_*`. The extra columns on the settings table are harmless but could be dropped via migration.

### Implementation Steps

1. **Fix `vite.config.ts`** — remove `vite-plugin-singlefile` import
2. **Fix `plan-context.tsx`** — change PlanType back to `mandiri | juragan | demo`, update limits (mandiri: 40, juragan: 200) and labels
3. **Fix `demo-context.tsx`** — add `email?: string | null` and `send_email_notifications?: boolean` to `DemoTenant`
4. **Fix `notification-service.ts`** — update table name from `pembayaran` to `transactions` and fix column references
5. **Fix edge functions** — cast `err`/`error` to `Error` type in catch blocks
6. **Fix `KamarPage.tsx`** — the comparison will auto-resolve once PlanType includes `juragan`
7. **Clean up settings data** — delete duplicate/orphaned pricing keys from settings table
8. **Clean up settings_text data** — delete `starter_*`, `pro_*`, `bisnis_*` prefixed keys

