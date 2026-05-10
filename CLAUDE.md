# CLAUDE.md — KosPintar

Context wajib dibaca sebelum menyentuh kode apapun.

---

## Apa ini

KosPintar adalah SaaS PWA manajemen properti kos berbasis langganan untuk pasar Indonesia.
URL produksi: https://kos-pintar-manage111.vercel.app

**Target user**: Pemilik kos kecil-menengah (5–60 kamar) yang selama ini pakai WhatsApp + buku tulis.
**Pain point utama**: Tagihan manual ribet, lupa bayar, gak ada laporan keuangan.
**Revenue model**: Langganan bulanan/tahunan. Konversi dari free trial → berbayar = prioritas utama.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS + Framer Motion |
| Backend | Supabase (DB + Auth + Edge Functions) |
| State | React Query (TanStack v5) + React Context |
| Error tracking | Sentry |
| Deploy | Vercel (Hobby) |

**Tidak ada FastAPI. Tidak ada MongoDB. Backend = Supabase + Edge Functions saja.**
**Tidak ada CLI workflow** — semua DB changes via Supabase Dashboard SQL Editor, Edge Functions via Supabase Dashboard.

---

## Glosarium Domain

| Istilah Indonesia | Table / Field |
|-------------------|---------------|
| kamar | `rooms` |
| tipe kamar | `room_types` |
| penyewa | `tenants` |
| tagihan | `transactions` |
| pengeluaran | `expenses` |
| deposit / uang muka | `deposits` |
| pengingat | `reminders` |
| properti / kos | `properties` |
| langganan | `subscriptions` |
| lunas | `status = 'lunas'` |
| belum bayar | `status = 'belum_bayar'` |
| jatuh tempo | due date, dihitung dari `jatuh_tempo_hari` |
| telat | `is_overdue = true` |

---

## Struktur Folder

```
src/
├── app/              # App.tsx, router.tsx, providers.tsx, error-boundary.tsx
├── components/       # Shared components (AppShell, AppSidebar, BottomNav, dll)
│   ├── penyewa/      # Komponen spesifik penyewa (PenyewaForm)
│   └── ui/           # shadcn/ui — JANGAN EDIT MANUAL
├── guards/           # AuthGuard, AdminGuard, OnboardingGuard
├── hooks/
│   └── use-queries.ts    # SEMUA React Query hooks ada di sini
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts      # AUTO-GENERATED — JANGAN EDIT
├── lib/
│   ├── auth-context.tsx
│   ├── plan-context.tsx
│   ├── property-context.tsx
│   ├── demo-context.tsx
│   ├── helpers.ts
│   ├── avatar-colors.ts
│   ├── nota-generator.ts
│   └── notification-service.ts
├── pages/            # Halaman utama + admin/
├── routes/           # admin.routes, private.routes, public.routes
├── services/
│   ├── api.ts        # Centralized Supabase service layer
│   └── query-client.ts  # React Query configuration
└── types/

supabase/
├── functions/
│   ├── admin-manage-user/index.ts   # Edge Function: CRUD user via admin
│   └── daily-billing/index.ts       # Edge Function: auto-invoice + reminder
└── migrations/       # Urut timestamp — JANGAN EDIT YANG SUDAH ADA
```

---

## Database Schema

### Tables

| Table | Kolom penting |
|-------|--------------|
| `profiles` | id, nama, no_hp, plan, subscription_active, last_login |
| `subscriptions` | user_id, plan, status (aktif), started_at, expires_at |
| `properties` | id, user_id, nama_kos, alamat |
| `room_types` | id, property_id, nama, harga_per_bulan |
| `rooms` | id, room_type_id, nomor, lantai, status (kosong/terisi) |
| `tenants` | id, property_id, room_id, nama, no_hp, email, gender, tanggal_masuk, tanggal_keluar, jatuh_tempo_hari, status |
| `transactions` | id, tenant_id, property_id, periode_bulan, periode_tahun, total_tagihan, jumlah_dibayar, status, is_overdue, overdue_days, due_date, metode_bayar, nota_number |
| `deposits` | id, tenant_id, property_id, jumlah, jumlah_dikembalikan, status, catatan_potongan, tanggal_kembali |
| `expenses` | id, property_id, judul, kategori, jumlah, tanggal, is_recurring |
| `reminders` | id, tenant_id, property_id, type (h-3/h0/h+3), message, wa_link, is_read, periode_bulan, periode_tahun |
| `broadcasts` | id, message, created_at |
| `admins` | email |
| `admin_activity_log` | id, admin_email, action, detail |
| `plan_limits` | plan, max_rooms, harga_per_tahun, nama_display |
| `midtrans_orders` | id, user_id, order_id, plan, amount, status |
| `payment_transactions` | id, user_id, order_id, plan, amount, snap_token, status |
| `settings` | key, value (numeric) |
| `settings_text` | key, value (text) |

### Enums (dari types.ts)

```
deposit_status_enum: "ditahan" | "dikembalikan"
gender_type: "L" | "P"
payment_method: "tunai" | "transfer" | "qris"
payment_status: "belum_bayar" | "belum_lunas" | "lunas"
payment_transaction_status_enum: "pending" | "success" | "failed"
plan_enum: "starter" | "pro" | "bisnis"
room_status: "kosong" | "terisi"
tenant_status: "aktif" | "keluar"
```

### RPC Functions

| Function | Tujuan |
|----------|--------|
| `add_tenant` | Atomically: insert tenant + update room status + create transaction + create deposit |
| `delete_tenant` | Atomically: delete tenant + related data + free room |
| `end_tenant_contract` | Atomically: set status keluar + handle deposit + free room |
| `get_due_date` | Calculate due date from period + jatuh_tempo_hari |
| `calc_overdue_status` | Calculate overdue days |
| `is_admin` | Check if current user is admin |
| `admin_get_users` | List all users (admin only) |
| `admin_get_user_stats` | Get property/room counts per user |

### Auth Trigger

`handle_new_user` → auto-insert ke `profiles` saat user signup.

### Plans

| Plan | Max Kamar |
|------|-----------|
| starter | 10 |
| pro | 25 |
| bisnis | 60 |
| demo | 60 (frontend only) |

Legacy plan names: `mandiri` → `starter`, `juragan` → `pro`.
Di-handle via `migratePlanType()` di `plan-context.tsx`. Jangan hardcode nama plan lama.

### RLS Gotcha — Pakai EXISTS bukan IN

```sql
-- ❌ JANGAN
USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))

-- ✅ BENAR
USING (EXISTS (SELECT 1 FROM properties WHERE id = table.property_id AND user_id = auth.uid()))
```

---

## Pola Koding

### Data Fetching
Selalu lewat `src/hooks/use-queries.ts` — bukan direct Supabase di komponen.

```ts
// ✅ Benar
const { data: tenants, isLoading } = useTenants();

// ❌ Jangan (kecuali mutation)
const { data } = await supabase.from('tenants').select('*')
```

### Mutations
Mutations masih dilakukan langsung di page components (belum pakai useMutation).
Setelah setiap mutation, **wajib invalidate cache** via `useInvalidate()`:

```ts
const invalidate = useInvalidate();
// setelah mutation berhasil:
invalidate.all(); // atau invalidate.tenants(), invalidate.rooms(), dll
```

### Contexts yang Tersedia

```ts
useAuth()      // → { session, user, loading, signOut }
useProperty()  // → { properties, activeProperty, loading, refetch }
usePlan()      // → { plan, limits, planLabel, expiresAt, triggerUpgrade() }
useDemo()      // → { isDemo, ...semua demo data + CRUD functions }
```

### Subscription Gate

```ts
const { plan, limits, triggerUpgrade } = usePlan();

if (roomCount >= limits.maxRooms) {
  triggerUpgrade('Batas kamar tercapai. Upgrade untuk tambah lebih banyak.');
  return;
}
```

### Route Guard Flow
```
Router (auth state check)
  └── OnboardingGuard → cek properties.length > 0
        └── halaman private
```

### Error Handling Pattern

```ts
// Service layer: Sentry + throw
Sentry.captureException(error, { tags: { source: 'namaFitur' } });

// Component layer: toast
if (error) { toast.error(error.message); return; }
```

---

## Edge Functions

### `admin-manage-user`
Dipanggil dari `AdminUsers.tsx`. Actions: `create_user`, `reset_password`, `send_reset_email`, `update_user`.
Butuh caller yang ada di tabel `admins`.

### `daily-billing`
Auto-generate invoice bulanan + reminder H-3/H0/H+3.
**Cron belum di-setup** — perlu Supabase Dashboard > Edge Functions > Schedule.

---

## Status & Pekerjaan Tertunda

### 🔴 P0 — Registration Bug
**Symptom**: "Database error saving new user" saat signup.
**Dugaan**: Trigger `handle_new_user` di live DB tidak sinkron dengan migration terbaru.
**Langkah fix**:
1. Jalankan di Supabase SQL Editor:
   ```sql
   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';
   ```
2. Pastikan kolom `plan` dan `subscription_active` ada di tabel `profiles`

### 🟡 P1 — Midtrans Payment Integration
**Status**: Table `midtrans_orders` dan `payment_transactions` sudah ada di DB. Kode integrasi belum lengkap.

### 🟡 P1 — Daily Billing Cron
**Status**: Edge Function sudah ada, scheduler belum.
**Fix**: Supabase Dashboard → Edge Functions → Schedule → setiap hari jam 01:00 WIB.

### 🟢 Fixed — Deposits RLS Duplicate
Fix di migration `20260416_fix_deposits_rls_duplicate_rows.sql`. Pakai EXISTS + deduplicate di frontend.

### 🟢 Fixed — add_tenant RPC
Fix di migration `20260414`. Tanggal keluar tidak lagi salah masuk ke tanggal masuk.

---

## Anti-Patterns — Jangan Lakukan Ini

```ts
// ❌ Direct Supabase call di komponen untuk READ
const { data } = await supabase.from('tenants').select('*');

// ❌ Hardcode nama plan lama
if (plan === 'mandiri') { ... }

// ❌ RLS policy pakai IN (SELECT ...)

// ❌ Mutation tanpa invalidate cache

// ❌ Schema change tanpa migration file

// ❌ Edit types.ts manual (auto-generated)

// ❌ Edit file di src/components/ui/ (shadcn/ui)

// ❌ Commit .env file (sudah di .gitignore)
```

---

## Environment Variables

### Frontend (`.env` — JANGAN COMMIT)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY   # anon key — public by design
VITE_SUPABASE_PROJECT_ID
VITE_SENTRY_DSN                 # production only
```

### Edge Functions (Supabase secrets)
```
SUPABASE_URL                    # auto-available
SUPABASE_SERVICE_ROLE_KEY       # auto-available
SUPABASE_ANON_KEY               # auto-available
RESEND_API_KEY                  # set manual — untuk email (belum aktif)
MIDTRANS_SERVER_KEY             # set manual — untuk payment (belum aktif)
```

---

## Dev Commands

```bash
bun install       # atau npm install
bun run dev       # localhost:8080
bun run build
bun run lint
```

---

## Rules

✅ Selalu reply dalam Bahasa Indonesia.
✅ Buat migration file baru untuk setiap schema change.
✅ Invalidate React Query cache setelah setiap mutation.
✅ Pakai `EXISTS` bukan `IN (SELECT ...)` untuk RLS policy.
✅ Error handling: Sentry.captureException + toast.error.
✅ Tanya dulu sebelum refactor besar atau ubah arsitektur.
✅ Jangan edit migration yang sudah ada — selalu buat file baru.
✅ Demo mode bypass auth — jangan test auth flow di sana.
