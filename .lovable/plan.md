

## Plan: Fix Penyewa Categories, Room Deletion Guard, Pembayaran Flow, and Remove Upgrade Link

### Issues Found

1. **Penyewa tab/categories not working properly**: The "Jatuh Tempo" filter checks `sisaHari <= 30 && sisaHari >= 0`, but tenants whose contracts have already expired (sisaHari < 0) are excluded. Also, `StatusBadge` shows transaction status which may be undefined for tenants without a current-month transaction, showing nothing.

2. **Deleting room with active tenant**: `handleDeleteRoom` and `handleDeleteType` in KamarPage directly delete from the database without checking if the room has an active tenant. This orphans the tenant (room_id pointing to a deleted room).

3. **Pembayaran issues**:
   - "Belum lunas" is auto-generated from transactions table — correct behavior, but there's no way to **manually add a new payment/transaction** for a tenant (e.g., for a new month).
   - Missing "Tambah Pembayaran" button and flow.

4. **Profil page upgrade prompt**: Lines 142-149 show "Upgrade ke Juragan" link for Mandiri users — user wants this removed.

---

### Changes

#### 1. Fix Penyewa tab filtering (PenyewaPage.tsx)

- **"Jatuh Tempo"** filter: change to `sisaHari <= 30` (include negative = expired contracts too), or split into "Jatuh Tempo" (0-30 days) and show expired contracts differently.
- When tenant has no transaction for current month, show a neutral badge instead of nothing.

#### 2. Guard room/room-type deletion (KamarPage.tsx)

- Before deleting a room: check if any active tenant occupies it. If yes, show toast error "Kamar ini masih ditempati penyewa. Keluarkan penyewa terlebih dahulu."
- Before deleting a room type: check if any room in that type has active tenants. If yes, block with similar message.
- Apply same logic in demo mode.

#### 3. Add manual payment creation (PembayaranPage.tsx)

- Add a "Tambah Tagihan" button in the header (like PenyewaPage has "Tambah").
- Bottom sheet form: select tenant (active tenants only), select periode (month/year), input total_tagihan (auto-filled from room price).
- On submit: insert into `transactions` table (or demo context).
- This lets owners create invoices for new months manually.

#### 4. Remove upgrade prompt from ProfilPage

- Remove lines 142-149 (the "Upgrade ke Juragan" button) from ProfilPage.tsx.

---

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/pages/PenyewaPage.tsx` | Fix "Jatuh Tempo" filter logic; handle missing tx status display |
| `src/pages/KamarPage.tsx` | Add tenant-occupancy guard before room/room-type deletion |
| `src/pages/PembayaranPage.tsx` | Add "Tambah Tagihan" button + bottom sheet form with tenant selector, period picker, and amount input |
| `src/lib/demo-context.tsx` | Ensure `addTransaction` helper exists for demo mode |
| `src/pages/ProfilPage.tsx` | Remove "Upgrade ke Juragan" link (lines 142-149) |

**Room deletion guard logic:**
```text
Before delete room:
  → check tenants where room_id = this room AND status = 'aktif'
  → if found: toast.error("Kamar masih ditempati") and abort

Before delete room type:
  → get all room IDs for this type
  → check tenants where room_id IN those IDs AND status = 'aktif'
  → if found: toast.error("Tipe kamar masih memiliki penyewa aktif") and abort
```

**Add Tagihan flow:**
```text
User clicks "+ Tambah Tagihan"
→ Bottom sheet opens
→ Select active tenant (dropdown)
→ Auto-fill: kamar info, harga from room type
→ Select periode (month/year)
→ Submit → insert transaction with status 'belum_bayar'
→ Invalidate all queries
```

