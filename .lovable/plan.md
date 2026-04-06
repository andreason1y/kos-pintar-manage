

# Plan: Seed Real Database with Demo Data for User andreassina9a@gmail.com

## Context
- User ID: `7c155119-ea6f-469e-87dc-7f5fb56024d6`
- Existing property: **Kos Lawyer** (`0cd559f1-8d0a-49b8-acd5-efbe94d48d52`)
- All tables (room_types, rooms, tenants, transactions, expenses, deposits) are currently empty
- Will copy the demo data structure but adapt it for the real property

## What will be inserted (via psql INSERT, not migration)

### 1. Room Types (3 types)
- Standar — Rp 1.200.000 (WiFi, Lemari, Parkir Motor)
- Deluxe — Rp 1.800.000 (AC, WiFi, KM Dalam, Lemari, TV)
- Suite — Rp 2.500.000 (AC, WiFi, KM Dalam, Lemari, TV, Air Panas, Parkir Motor)

### 2. Rooms (12 rooms)
- 5 Standar (A1-A5), 4 Deluxe (B1-B4), 3 Suite (C1-C3)
- Mix of terisi/kosong matching demo distribution

### 3. Tenants (9 tenants — 8 aktif, 1 keluar)
Same names and data as demo: Budi Santoso, Siti Rahayu, Ahmad Fauzi, Dewi Lestari, Rizky Pratama, Nurul Hidayah, Fajar Ramadhan, Anisa Putri, Doni Saputra (keluar)

### 4. Transactions (~11 records)
- Current month: 8 transactions (mix lunas, belum_lunas, belum_bayar)
- Previous month: 3 transactions (all lunas)

### 5. Expenses (6 records)
Listrik, Air, Internet, Kebersihan, Perbaikan, Keamanan for current month

### 6. Deposits (for active tenants)
One deposit per active tenant with status "ditahan"

## Technical Approach
- Use `supabase--read_query` tool with INSERT statements (since we have insert access)
- Generate UUIDs with `gen_random_uuid()`
- Use CTEs or sequential inserts to chain room_type IDs → rooms → tenants → transactions
- All linked to property `0cd559f1-8d0a-49b8-acd5-efbe94d48d52`

