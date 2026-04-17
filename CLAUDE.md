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
| jatuh tempo | due date, dihitung dari `tanggal_masuk` day |
| telat | `is_overdue = true` |

---

## Struktur Folder

```
src/
├── app/              # App.tsx, router.tsx, providers.tsx, error-boundary.tsx
├── components/       # Shared components (AppShell, AppSidebar, BottomNav, dll)
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
│   ├── email-service.ts       # STUB — belum diimplementasi
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

| Plan | Max Kamar | Harga Normal |
|------|-----------|-------------|
| starter | 10 | Rp 399.000 |
| pro | 25 | Rp 699.000 |
| bisnis | 60 | Rp 1.299.000 |
| demo | 60 | — |

Legacy plan names: `mandiri` → `starter`, `juragan` → `pro`.
Di-handle via `migratePlanType()` di `plan-context.tsx`. Jangan hardcode nama plan lama.

### RLS Gotcha — Pakai EXISTS bukan IN

RLS policy yang pakai `IN (SELECT ...)` bisa return duplicate rows karena PostgreSQL planner bisa jalan sebagai join.
**Selalu pakai `EXISTS`:**

```sql
-- ❌ JANGAN
USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))

-- ✅ BENAR
USING (EXISTS (SELECT 1 FROM properties WHERE id = table.property_id AND user_id = auth.uid()))
```

Repo ini pernah kena bug ini di tabel `deposits` (fix di migration `20260416_fix_deposits_rls_duplicate_rows.sql`).

---

## Pola Koding

### Data Fetching
Selalu lewat `src/hooks/use-queries.ts` — bukan direct Supabase di komponen.

```ts
// ✅ Benar
const { data: tenants, isLoading } = useTenants(propertyId);

// ❌ Jangan
const { data } = await supabase.from('tenants').select('*')  // langsung di komponen
```

### Mutation + Cache Invalidation
Setelah setiap mutation, **wajib invalidate cache** yang relevan:

```ts
const queryClient = useQueryClient();
// setelah mutation berhasil:
queryClient.invalidateQueries({ queryKey: ['tenants', propertyId] });
```

Jangan andalkan auto-refetch — data bisa stale sampai 5 menit (`STALE_TIME = 5 * 60 * 1000`).

### Contexts yang Tersedia

```ts
useAuth()      // → { session, user, loading, signOut }
useProperty()  // → { properties, selectedProperty, loading }
usePlan()      // → { plan, limits, planLabel, expiresAt, triggerUpgrade() }
useDemo()      // → { isDemo }
```

### Subscription Gate
Untuk block fitur berdasarkan plan:

```ts
const { plan, limits, triggerUpgrade } = usePlan();

if (roomCount >= limits.maxRooms) {
  triggerUpgrade('Batas kamar tercapai. Upgrade untuk tambah lebih banyak.');
  return;
}
```

### Route Guard Flow
```
AuthGuard → cek session
  └── OnboardingGuard → cek properties.length > 0
        └── halaman private
```

### Error Handling Pattern

```ts
try {
  // operasi
} catch (error) {
  Sentry.captureException(error, { tags: { source: 'namaFitur' } });
  toast.error('Pesan error yang user-friendly');
}
```

---

## Edge Functions

### `admin-manage-user`
Dipanggil dari `AdminUsers.tsx`. Actions: `create_user`, `reset_password`, `send_reset_email`, `update_user`.
Butuh caller yang ada di tabel `admins`.

### `daily-billing`
Auto-generate invoice bulanan + reminder H-3/H0/H+3.
**Cron belum di-setup** — perlu Supabase Dashboard > Edge Functions > Schedule.

### Kapan Pakai Edge Function vs Client-side

| Kondisi | Dimana |
|---------|--------|
| Butuh service role key (bypass RLS) | Edge Function |
| Butuh API secret (Midtrans, Resend) | Edge Function |
| Logic bisnis sederhana + data milik user sendiri | Client-side via `use-queries.ts` |
| Batch operation lintas user | Edge Function |

---

## Cara Deploy (Tanpa CLI)

### Schema DB / Migration
1. Tulis SQL di file `supabase/migrations/YYYYMMDDHHMMSS_nama.sql`
2. Jalankan manual di Supabase Dashboard → SQL Editor
3. Commit file migration ke repo

### Edge Function
1. Edit/buat file di `supabase/functions/nama-function/index.ts`
2. Deploy via Supabase Dashboard → Edge Functions → Deploy
3. Commit ke repo

### Frontend
Push ke `main` → Vercel auto-deploy.

---

## Fitur Revenue-Critical (Prioritas Tinggi)

Fitur ini langsung berhubungan dengan konversi dan retensi user berbayar:

1. **Registration & onboarding** — user yang gagal daftar = lost forever
2. **Tambah penyewa + tagihan otomatis** — core value proposition
3. **Reminder H-3/H0/H+3** — alasan utama user bayar langganan
4. **Laporan keuangan (KeuanganPage)** — decision-maker untuk upgrade
5. **Subscription gate + upgrade flow** — monetisasi langsung

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
2. Bandingkan dengan `migrations/20260412110716_*.sql`
3. Pastikan kolom `plan` dan `subscription_active` ada di tabel `profiles`

### 🟡 P1 — Midtrans Payment Integration
**Status**: Belum ada kode di repo.
**Rencana**: Supabase Edge Function untuk Snap token + webhook handler.
**Jangan pakai FastAPI. Jangan pindah ke production sampai sandbox beres.**

### 🟡 P1 — Resend Email
**Status**: `email-service.ts` masih stub (console.log saja).
**Yang perlu dibuat**: Edge Function kirim email via Resend API.
**Butuh**: `RESEND_API_KEY` di Supabase secrets.

### 🟡 P2 — Daily Billing Cron
**Status**: Edge Function sudah ada, scheduler belum.
**Fix**: Supabase Dashboard → Edge Functions → Schedule → setiap hari jam 01:00 WIB.

### 🟡 P2 — Subscription Gate
`UpgradeModal` dan `usePlan()` sudah siap. Tinggal pasang di fitur yang perlu di-gate.

---

## Anti-Patterns — Jangan Lakukan Ini

```ts
// ❌ Direct Supabase call di komponen
const { data } = await supabase.from('tenants').select('*');

// ❌ Hardcode nama plan
if (plan === 'mandiri') { ... }  // nama lama, sudah deprecated

// ❌ RLS policy pakai IN (SELECT ...)
USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))

// ❌ Mutation tanpa invalidate cache
await supabase.from('tenants').insert(...)
// lupa: queryClient.invalidateQueries(...)

// ❌ Schema change tanpa migration file
// langsung edit di Supabase dashboard tanpa buat file .sql

// ❌ Edit types.ts manual
// file ini auto-generated dari schema Supabase

// ❌ Edit file di src/components/ui/
// shadcn/ui components, jangan diubah langsung
```

---

## Known Bugs & Workarounds

| Bug | Status | Workaround |
|-----|--------|------------|
| Deposits duplikat dari RLS `IN` | ✅ Fixed (migration 20260416) | Sudah pakai EXISTS |
| Tanggal keluar salah masuk ke tanggal masuk di RPC | ✅ Fixed (migration 20260414) | add_tenant RPC diperbaiki |
| Registration gagal (handle_new_user) | 🔴 Open | Lihat P0 di atas |

---

## Checklist Sebelum Push

- [ ] `bun run lint` — tidak ada error
- [ ] Tidak ada `console.log` yang tertinggal
- [ ] Mutation sudah invalidate cache yang relevan
- [ ] Kalau ada schema change → migration file sudah dibuat dan dijalankan
- [ ] Test di mobile viewport (target user pakai HP)
- [ ] Demo mode masih jalan (`/demo` route)

---

## Rules

✅ Selalu reply dalam Bahasa Indonesia.
✅ Buat migration file baru untuk setiap schema change.
✅ Invalidate React Query cache setelah setiap mutation.
✅ Pakai `EXISTS` bukan `IN (SELECT ...)` untuk RLS policy.
✅ Error handling: Sentry.captureException + toast.error.
✅ Tanya dulu sebelum refactor besar atau ubah arsitektur.

⚠️ `.env` ter-commit ke repo publik — Sentry DSN ke-expose. Rotate DSN dan tambah `.env` ke `.gitignore`.
⚠️ `types.ts` jangan diedit manual — generate ulang via `supabase gen types typescript`.
⚠️ Jangan edit migration yang sudah ada — selalu buat file baru.
⚠️ Demo mode bypass auth — jangan test auth flow di sana.

---

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY   # anon key — public by design
VITE_SUPABASE_PROJECT_ID
VITE_SENTRY_DSN                 # jangan commit ke repo publik
```

### Edge Functions (Supabase secrets)
```
SUPABASE_URL                    # auto-available
SUPABASE_SERVICE_ROLE_KEY       # auto-available
SUPABASE_ANON_KEY               # auto-available
RESEND_API_KEY                  # set manual — untuk email
MIDTRANS_SERVER_KEY             # set manual — untuk payment
```

---

## Dev Commands

```bash
bun install
bun run dev       # localhost:8080
bun run build
bun run lint
```
