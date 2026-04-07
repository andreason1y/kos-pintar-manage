

## Plan: Fix Data Sync & Align Demo with Real Data

### Root Cause of Sync Issues

After inspecting the database for `andreassina9a@gmail.com`:

1. **Tenant "Budi Santoso"** is `status: aktif` but `room_id: NULL` — appears as tenant without room in Penyewa, invisible in Kamar, breaks Keuangan room-type pie chart
2. **Room "A1" doesn't exist** — rooms start at A2 (11 rooms instead of 12 for the Standar type)
3. **Tenant "Budi"** (manually added) occupies A5 but has no historical transactions — shows as tenant with no payment history
4. These orphaned references cause data to look different across Dashboard, Kamar, Penyewa, Pembayaran, and Keuangan pages

### Solution

**Step 1: Delete all existing data for this user** (via Supabase insert tool for DELETE operations)

Delete in order to respect dependencies:
1. `deposits` where `property_id = '0cd559f1-...'`
2. `transactions` where `property_id = '0cd559f1-...'`
3. `expenses` where `property_id = '0cd559f1-...'`
4. `reminders` where `property_id = '0cd559f1-...'`
5. `tenants` where `property_id = '0cd559f1-...'`
6. `rooms` where `room_type_id` in the 3 room type IDs
7. `room_types` where `property_id = '0cd559f1-...'`

Keep the `properties` row intact (Kos Lawyer).

**Step 2: Insert new clean dummy data** with proper relationships

Property: **Kos Lawyer**, Komplek Tarakanita (existing)

Room Types (same as demo):
- Standar: Rp 1.200.000 — 5 rooms (A1-A5), fasilitas: WiFi, Lemari, Parkir Motor
- Deluxe: Rp 1.800.000 — 4 rooms (B1-B4), fasilitas: AC, WiFi, KM Dalam, Lemari, TV
- Suite: Rp 2.500.000 — 3 rooms (C1-C3), fasilitas: AC, WiFi, KM Dalam, Lemari, TV, Air Panas, Parkir Motor

Rooms: 12 total, 8 terisi + 4 kosong (A3, A5, B3, C3)

Tenants: 8 aktif (each linked to a specific occupied room) + 1 keluar (no room):
| Tenant | Room | Type | Gender |
|--------|------|------|--------|
| Budi Santoso | A1 | Standar | L |
| Siti Rahayu | A2 | Standar | P |
| Ahmad Fauzi | A4 | Standar | L |
| Dewi Lestari | B1 | Deluxe | P |
| Rizky Pratama | B2 | Deluxe | L |
| Nurul Hidayah | B4 | Deluxe | P |
| Fajar Ramadhan | C1 | Suite | L |
| Anisa Putri | C2 | Suite | P |
| Doni Saputra | — | — (keluar) | L |

Transactions: April 2026 (current month) for all 8 aktif tenants + March 2026 (last month) for 3 tenants. Mix of lunas, belum_lunas, belum_bayar.

Expenses: 6 items for April 2026 (Listrik, Air, Internet, Kebersihan, Perbaikan, Keamanan).

Deposits: 1 per aktif tenant (amount = 1x rent), Doni's deposit = dikembalikan.

**Step 3: Update demo-context.tsx seed data**

Replace demo property name/address with "Kos Lawyer" / "Komplek Tarakanita" and ensure:
- Same room types, rooms, tenants, transactions, expenses structure
- Same names, same room assignments
- Demo data mirrors the real DB exactly

### Technical Details

- All DELETE/INSERT operations use the Supabase insert tool (data operations, not schema changes)
- Use deterministic UUIDs for easy cross-referencing (e.g., `a1000001-...` pattern for room_types, `b1000001-...` for rooms, etc.)
- Room status must match: if a tenant points to a room, that room must be `terisi`
- Transaction `tenant_id` must reference an existing tenant
- Deposit `tenant_id` must reference an existing tenant

### Files Changed

1. **Database**: DELETE + INSERT via Supabase tools (no migration needed)
2. **`src/lib/demo-context.tsx`**: Update seed data constants (PROPERTY, ROOM_TYPES, ROOMS, TENANTS, TRANSACTIONS, EXPENSES) to match the new DB data

