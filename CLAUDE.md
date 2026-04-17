# CLAUDE.md — KosPintar

Context wajib dibaca sebelum menyentuh kode apapun.

---

## Apa ini

KosPintar adalah SaaS PWA manajemen properti kos berbasis langganan.
URL produksi: https://kos-pintar-manage.vercel.app

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

---

## Struktur Folder

```
src/
├── app/              # App.tsx, router.tsx, providers.tsx, error-boundary.tsx
├── components/       # Shared components (AppShell, AppSidebar, BottomNav, dll)
│   └── ui/           # shadcn/ui components (jangan edit manual)
├── guards/           # AuthGuard, AdminGuard, OnboardingGuard
├── hooks/            # use-queries.ts (semua React Query hooks), use-mobile.tsx
├── integrations/
│   └── supabase/     # client.ts, types.ts (auto-generated — jangan edit)
├── lib/              # Context providers + utilities
│   ├── auth-context.tsx
│   ├── plan-context.tsx
│   ├── property-context.tsx
│   ├── demo-context.tsx
│   ├── email-service.ts    # STUB — belum diimplementasi
│   ├── notification-service.ts
│   └── nota-generator.ts
├── pages/            # Halaman utama + admin/
├── routes/           # admin.routes, private.routes, public.routes
├── services/
│   └── api.ts        # Centralized Supabase service layer (masih monolitik)
└── types/

supabase/
├── functions/
│   ├── admin-manage-user/index.ts   # Edge Function: CRUD user via admin
│   └── daily-billing/index.ts       # Edge Function: auto-invoice + reminder H-3/H0/H+3
└── migrations/       # Urut berdasarkan timestamp — jangan edit yang sudah ada
```

---

## Database Schema

### Tables

| Table | Kolom penting |
|-------|--------------|
| `profiles` | id, nama, no_hp, plan, subscription_active, last_login |
| `subscriptions` | user_id, plan, status (aktif), started_at, expires_at |
| `properties` | id, user_id, nama_kos, alamat |
| `room_types` | id, property_id, nama, harga_per_bulan, fasilitas[] |
| `rooms` | id, room_type_id, nomor, lantai, status (kosong/terisi) |
| `tenants` | id, property_id, room_id, nama, no_hp, email, gender, tanggal_masuk, tanggal_keluar, jatuh_tempo_hari, status |
| `transactions` | id, tenant_id, property_id, periode_bulan, periode_tahun, total_tagihan, jumlah_dibayar, status, is_overdue, overdue_days |
| `deposits` | id, tenant_id, property_id, jumlah |
| `expenses` | id, property_id, ... |
| `reminders` | id, tenant_id, property_id, type (h-3/h0/h+3), message, wa_link, is_read, periode_bulan, periode_tahun |
| `broadcasts` | id, message, created_at |
| `admins` | email |
| `settings` | key, value (numeric) |
| `settings_text` | key, value (text) |

### Auth Trigger

`handle_new_user` → auto-insert ke `profiles` saat user signup:
```sql
INSERT INTO profiles (id, nama, no_hp, plan, subscription_active)
VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
        NEW.raw_user_meta_data->>'no_hp', 'starter', false)
ON CONFLICT (id) DO NOTHING;
```

### Plans

| Plan | Max Kamar |
|------|-----------|
| starter | 10 |
| pro | 25 |
| bisnis | 60 |
| demo | 60 |

Legacy plan names (`mandiri` → `starter`, `juragan` → `pro`) di-handle di `plan-context.tsx` via `migratePlanType()`.

---

## Pola Koding

### Data Fetching
Selalu lewat `src/hooks/use-queries.ts`, bukan direct Supabase di komponen.

```ts
const { data: tenants, isLoading } = useTenants(propertyId);
```

### Supabase Service
Operasi Supabase yang lebih kompleks lewat `src/services/api.ts`.

### Context yang tersedia
- `useAuth()` → session, user, loading
- `useProperty()` → properties, selectedProperty, loading
- `usePlan()` → plan, limits, triggerUpgrade()
- `useDemo()` → isDemo

### Route Guard
Semua halaman private dibungkus `AuthGuard` → `OnboardingGuard` secara berurutan.

---

## Edge Functions

### `admin-manage-user`
Dipanggil dari AdminUsers.tsx. Actions: `create_user`, `reset_password`, `send_reset_email`, `update_user`.
Membutuhkan admin auth (dicek via tabel `admins`).

### `daily-billing`
Harus dipanggil via cron/scheduler setiap hari. Fungsi:
1. Auto-generate invoice bulanan (matching `tanggal_masuk` day)
2. Generate reminders H-3, H0, H+3 ke tabel `reminders`

**Cron belum di-setup.** Perlu Supabase scheduled functions atau pg_cron.

---

## Status & Pekerjaan Tertunda

### 🔴 P0 — Registration Bug
**Symptom**: "Database error saving new user" saat signup.
**Dugaan**: Trigger `handle_new_user` gagal karena mismatch kolom `profiles`.
**Langkah fix**:
1. Jalankan di Supabase SQL Editor:
   ```sql
   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';
   ```
2. Bandingkan dengan trigger di `migrations/20260412110716_*.sql`
3. Pastikan kolom `plan` dan `subscription_active` ada di tabel `profiles`

### 🟡 P1 — Midtrans Payment Integration
**Status**: Belum ada kode sama sekali di repo ini.
**Rencana**: Supabase Edge Function untuk Snap token + webhook handler.
**Jangan pakai FastAPI.**
**Jangan pindah ke Midtrans production sampai sandbox beres.**

### 🟡 P1 — Resend Email
**Status**: `email-service.ts` ada tapi masih stub (hanya console.log).
**Yang perlu dibuat**: Edge Function untuk kirim email via Resend API.
**Butuh**: RESEND_API_KEY di Supabase secrets.

### 🟡 P2 — Daily Billing Cron
**Status**: Edge Function `daily-billing` sudah ada tapi belum ada scheduler.
**Rencana**: Setup Supabase cron via `pg_cron` atau Supabase Dashboard > Edge Functions > Schedule.

### 🟡 P2 — Subscription Gate
`UpgradeModal` dan `usePlan()` sudah ada. Tinggal pasang gate di fitur-fitur yang butuh plan upgrade.

---

## Peringatan & Rules

⚠️ **`.env` ter-commit ke repo publik** — Sentry DSN ke-expose. Tambahkan `.env` ke `.gitignore` dan rotate Sentry DSN. Supabase anon key by design public.

⚠️ **`src/integrations/supabase/types.ts` jangan diedit manual** — generate ulang via `supabase gen types typescript`.

⚠️ **Jangan buat migration baru yang mengubah migration yang sudah ada** — selalu buat file migration baru.

⚠️ **Demo mode** (`/demo` route) bypass auth sepenuhnya — jangan test auth flow dalam mode demo.

✅ **Selalu reply dalam Bahasa Indonesia.**

✅ **Tambah migration file baru** untuk setiap perubahan schema DB.

✅ **Invalidate React Query cache** setelah mutation — jangan andalkan auto-refetch.

---

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY   # Supabase anon key (public by design)
VITE_SUPABASE_PROJECT_ID
VITE_SENTRY_DSN                 # Jangan commit ke repo publik
```

Untuk Edge Functions (di Supabase secrets, bukan .env):
```
SUPABASE_URL                    # auto-available
SUPABASE_SERVICE_ROLE_KEY       # auto-available
SUPABASE_ANON_KEY               # auto-available
RESEND_API_KEY                  # perlu di-set manual (untuk email)
MIDTRANS_SERVER_KEY             # perlu di-set manual (untuk payment)
```

---

## Dev Commands

```bash
bun install
bun run dev          # localhost:8080
bun run build
bun run lint
```
