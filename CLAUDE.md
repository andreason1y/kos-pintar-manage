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
├── pages/
│   ├── CheckoutPage.tsx      # Halaman pilih metode bayar Tripay
│   ├── PaymentStatusPage.tsx # Polling status pembayaran Tripay
│   └── admin/
├── routes/           # admin.routes, private.routes, public.routes
├── services/
│   ├── api.ts        # Centralized Supabase service layer
│   └── query-client.ts  # React Query configuration
└── types/

supabase/
├── functions/
│   ├── admin-manage-user/index.ts   # CRUD user via admin
│   ├── daily-billing/index.ts       # Auto-invoice + reminder (cron 07:00 WIB)
│   ├── send-otp/index.ts            # Kirim OTP login via email
│   ├── verify-otp/index.ts          # Verifikasi OTP login
│   ├── send-email/index.ts          # Hook email Supabase Auth (signup/reset)
│   ├── tripay-create/index.ts       # Buat order pembayaran Tripay
│   └── tripay-callback/index.ts     # Webhook callback dari Tripay
└── migrations/       # Urut timestamp — JANGAN EDIT YANG SUDAH ADA
```

---

## Database Schema

### Tables

| Table | Kolom penting |
|-------|--------------|
| `profiles` | id, nama, no_hp, plan, subscription_active, last_login |
| `subscriptions` | user_id, plan, status (aktif), started_at, expires_at, duration_months |
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
| `subscription_prices` | plan, duration_months, price — sumber harga resmi untuk checkout |
| `tripay_orders` | id, user_id, merchant_ref, plan, duration_months, amount, status, paid_at |
| `settings` | key, value (numeric) |
| `settings_text` | key, value (text) |

### Enums (dari types.ts)

```
deposit_status_enum: "ditahan" | "dikembalikan"
gender_type: "L" | "P"
payment_method: "tunai" | "transfer" | "qris"
payment_status: "belum_bayar" | "belum_lunas" | "lunas"
payment_transaction_status_enum: "pending" | "success" | "failed"
plan_enum: "mini" | "starter" | "pro"
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
| mini | 10 |
| starter | 25 |
| pro | 60 |
| demo | 60 (frontend only) |

Legacy plan names (sudah tidak dipakai, hanya untuk migrasi data lama):
- `mandiri` → `mini`
- `juragan` → `starter`
- `bisnis` → `pro`

Di-handle via `migratePlanType()` di `plan-context.tsx`. Jangan hardcode nama plan lama di kode baru.

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

### `send-otp` / `verify-otp`
OTP 2FA saat login. Rate limit 60 detik per user. OTP di-generate dengan `crypto.getRandomValues()`.

### `admin-manage-user`
Dipanggil dari `AdminUsers.tsx`. Actions: `create_user`, `reset_password`, `send_reset_email`, `update_user`.
Butuh caller yang ada di tabel `admins`.

### `send-email`
Hook email Supabase Auth untuk signup verification dan password reset. Menggunakan Resend API.
Secret: `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`.

### `daily-billing`
Auto-generate invoice bulanan + reminder H-3/H0/H+3.
**Cron aktif**: setiap hari jam 07:00 WIB via `pg_cron` (jadwal: `0 0 * * *`).

### `tripay-create`
Membuat order pembayaran Tripay. Harga diambil dari tabel `subscription_prices` (bukan dari frontend).
Dipanggil dari `CheckoutPage.tsx`. Mengembalikan `checkout_url` untuk redirect ke halaman bayar Tripay.

### `tripay-callback`
Webhook server-to-server dari Tripay setelah pembayaran selesai.
Validasi `X-Callback-Signature` via HMAC-SHA256. Mengaktifkan subscription dan mencatat `paid_at`.

### `~~create-payment~~` / `~~activate-subscription~~` (DEPRECATED)
Endpoint Midtrans lama — sudah dinonaktifkan, mengembalikan `410 Gone`. Jangan dipakai.

---

## Status Pekerjaan

### ✅ Selesai
- Registration bug (`handle_new_user` trigger) — sudah fix di live DB
- RLS semua tabel pakai `EXISTS` bukan `IN`
- CORS semua Edge Functions dibatasi ke origin produksi
- OTP: crypto secure + rate limiting
- Tripay checkout flow lengkap (create → redirect → callback → aktivasi subscription)
- Daily billing cron aktif (07:00 WIB)
- Error handling: toast warning saat subscription gagal dimuat
- Admin pages dibungkus `ErrorBoundary`
- Deposits RLS duplicate fix

### ⚠️ Perlu Ditest
- **Tripay sandbox end-to-end**: pilih paket → CheckoutPage → bayar di sandbox → cek `tripay_orders` + `subscriptions` di DB

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

// ❌ Panggil create-payment atau activate-subscription (sudah deprecated)
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
RESEND_API_KEY                  # untuk email (send-email function)
SEND_EMAIL_HOOK_SECRET          # untuk verifikasi hook email Supabase Auth
TRIPAY_MERCHANT_CODE            # kode merchant Tripay
TRIPAY_API_KEY                  # API key Tripay
TRIPAY_PRIVATE_KEY              # private key untuk HMAC signature
TRIPAY_BASE_URL                 # https://tripay.co.id/api (prod) atau /api-sandbox (sandbox)
TRIPAY_CALLBACK_URL             # URL webhook callback dari Tripay
TRIPAY_RETURN_URL               # URL redirect setelah bayar
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
✅ Harga checkout selalu diambil dari DB (`subscription_prices`), bukan dari frontend/URL params.
