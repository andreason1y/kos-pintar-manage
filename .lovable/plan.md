

## Plan: Sync Feature Parity Between Demo and Real Mode

### Problem Identified

**Real mode missing visualizations (that demo has):**
1. `KeuanganPage` — `barData` returns `[]` in real mode (line 137), so the 6-month bar chart never renders
2. `KeuanganPage` — `pieData` returns `[]` in real mode (line 138), so the room-type pie chart never renders  
3. `KeuanganPage` — `pengeluaranLalu` is hardcoded to `0` in real mode (line 136), so expense trend comparison is broken
4. `DashboardPage` — `pengeluaranBulanLalu` is `0` in real mode (line 143), breaking laba trend

**Demo mode missing features (that real has):**
1. All CRUD operations blocked with generic toast — user can't experience add/edit/delete flows
2. No interactive demo for: adding tenants, paying bills, adding expenses, managing rooms

### Changes

#### 1. Fix Real Mode Visualizations in `KeuanganPage.tsx`

In the real-mode branch of `computed` useMemo (lines 107-142):

- **Bar chart**: Build 6-month trend by querying `txData` for each of the last 6 months and fetching/estimating expenses per month
- **Pie chart**: Group `txMonth` payments by room type using `roomData.roomTypes` mapping (tenant → room → room_type)
- **pengeluaranLalu**: Fetch previous month expenses via a second `useExpenses(bulanLalu, tahunLalu)` hook call, or compute from available data

#### 2. Fix Real Mode Dashboard Trend in `DashboardPage.tsx`

- Add `useExpenses(bulanLalu, tahunLalu)` to fetch last month's expenses
- Use it to compute `pengeluaranBulanLalu` properly instead of `0`

#### 3. Enable Interactive Demo Mode

Instead of blocking all operations with a toast, allow demo mutations to work on local state:

- Add mutable state arrays to `DemoProvider` in `demo-context.tsx`: `tenants`, `rooms`, `transactions`, `expenses` as `useState` arrays initialized from the seed data
- Add mutation functions: `addTenant`, `updateTenant`, `deleteTenant`, `addRoom`, `deleteRoom`, `addExpense`, `updateExpense`, `deleteExpense`, `updateTransaction`
- Update each page's mutation handlers to call demo context mutations when `isDemo` is true, instead of showing a toast

### Files to Edit

1. **`src/pages/KeuanganPage.tsx`** — Add bar chart and pie chart computation for real mode; add second expenses query for previous month
2. **`src/pages/DashboardPage.tsx`** — Add previous month expenses query for accurate laba trend
3. **`src/lib/demo-context.tsx`** — Add mutable state and mutation functions for interactive demo
4. **`src/pages/PenyewaPage.tsx`** — Replace demo toast blocks with demo context mutations
5. **`src/pages/KamarPage.tsx`** — Same: use demo context mutations
6. **`src/pages/PembayaranPage.tsx`** — Same: use demo context mutations
7. **`src/hooks/use-queries.ts`** — Add `useExpenses` for previous month support (already parameterized, just need to call it)

### Priority Order
1. Fix real mode charts first (highest impact, user's primary complaint)
2. Then enable interactive demo

