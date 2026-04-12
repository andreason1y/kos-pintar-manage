

## Plan: Switch from Mandiri/Juragan to Starter/Pro/Bisnis

The landing page and admin settings already use starter/pro/bisnis. The plan context, admin user management, admin subscriptions, KamarPage, and DB settings rows still reference mandiri/juragan. This plan aligns everything to starter/pro/bisnis.

### 1. Update `plan-context.tsx`
- Change `PlanType` to `"starter" | "pro" | "bisnis" | "demo"`
- Update `PLAN_LIMITS`: Starter = 10, Pro = 25, Bisnis = 60
- Update `PLAN_LABELS`: Starter, Pro, Bisnis
- Update defaults from "mandiri" to "starter"
- Update `migratePlanType` to map mandiri→starter, juragan→pro

### 2. Update `AdminUsers.tsx`
- Replace all `"mandiri"` defaults with `"starter"`
- Replace `"juragan"` with `"pro"` 
- Update filter tabs: "Starter", "Pro", "Bisnis", "Belum"
- Update Select dropdowns to show Starter/Pro/Bisnis options
- Fix `handleSwitchPlan` to cycle starter→pro→bisnis→starter

### 3. Update `AdminSubscriptions.tsx`
- Replace `activatePlan` default from `"starter"` (already correct)
- Update Select options from Starter(10)/Pro(25)/Bisnis(60)

### 4. Update `KamarPage.tsx` (line 194)
- Change `plan === "juragan"` to `plan === "bisnis"`
- Update upgrade message to reference "Bisnis" instead of "Juragan"

### 5. Update DB settings rows (via insert tool)
- Rename `mandiri_price_normal` → `starter_price_normal` (value 399000)
- Rename `mandiri_price_earlybird` → `starter_price_earlybird` (value 199000)  
- Rename `juragan_price_normal` → `pro_price_normal` (value 699000)
- Rename `juragan_price_earlybird` → `pro_price_earlybird` (value 349000)
- Add bisnis pricing rows if not present
- Update settings_text: rename mandiri/juragan sublabel/badge keys to starter/pro/bisnis

### 6. Update `handle_new_user` trigger (migration)
- Change default plan from `'mandiri'` to `'starter'`

### 7. Update `profiles.plan` default
- Change column default from `'starter'::plan_enum` — already correct in schema

No changes needed for LandingPage or AdminSettings — they already use starter/pro/bisnis naming.

