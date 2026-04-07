
Masalah utamanya sekarang lebih ke logic aplikasi, bukan seed data atau data dummy.

Yang saya temukan:
- Data di database untuk akun `andreassina9a@gmail.com` / properti `Kos Lawyer` sudah konsisten: 3 tipe kamar, 12 kamar, 8 penyewa aktif, 11 transaksi, 6 pengeluaran, 9 deposit.
- Jadi kalau antar menu masih terasa tidak sinkron, penyebab terbesarnya adalah alur CRUD di frontend yang menulis ke beberapa tabel secara terpisah.

Akar masalah logic:
1. Mutasi penting tidak atomic
   - Tambah penyewa = insert `tenants` + update `rooms` + insert `transactions` + insert `deposits`
   - Semua dijalankan satu-per-satu dari client.
   - Kalau salah satu step gagal, tabel lain tetap berubah → menu Kamar, Penyewa, Pembayaran, Keuangan bisa beda isi.

2. Delete / end-contract belum membersihkan semua relasi
   - Hapus penyewa saat ini hanya update kamar + delete tenant.
   - Transaksi dan deposit lama bisa tertinggal, jadi Pembayaran/Keuangan masih membaca data yang secara bisnis sudah “hilang”.

3. Deposit flow belum benar-benar sinkron
   - Real mode sudah baca `deposits`, tapi demo mode belum punya sumber data deposit yang nyata.
   - Di `PenyewaPage`, demo branch untuk `handleEndContract` bahkan set `depositInfo(null)`, jadi alur deposit demo tidak pernah benar-benar sama dengan real.

4. Sinkronisasi antar menu terlalu bergantung pada “query per tabel”
   - Setiap halaman merakit data sendiri dari `rooms`, `tenants`, `transactions`, `expenses`, `deposits`.
   - Kalau ada satu relasi yang tertinggal/orphan, tiap halaman akan menghasilkan angka/tampilan berbeda.

5. Penanganan error antar step masih lemah
   - Banyak operasi lanjutan tidak dicek error-nya satu per satu.
   - Akibatnya UI bisa tampil “berhasil”, padahal hanya sebagian data yang tersimpan.

Kesimpulan singkat:
- Bukan terutama masalah RLS.
- Bukan terutama masalah dummy data.
- Ini masalah arsitektur mutation + relasi data yang belum dijaga secara transactional.

Rencana perbaikan:
1. Pindahkan operasi bisnis penting ke server-side flow
   - Buat RPC/Edge Function untuk:
     - tambah penyewa
     - akhiri sewa
     - hapus penyewa
     - pembayaran
   - Tiap flow harus menulis semua tabel terkait dalam satu transaksi bisnis.

2. Jadikan “tenant lifecycle” konsisten
   - Tambah penyewa harus selalu:
     - assign kamar
     - ubah status kamar
     - buat transaksi awal
     - buat deposit bila ada
   - Akhiri sewa harus selalu:
     - ubah status tenant
     - kosongkan kamar
     - selesaikan deposit
     - buat expense/income sesuai aturan deposit
   - Hapus penyewa harus jelas:
     - soft delete / block jika masih punya transaksi
     - atau cascade logic yang aman

3. Tambahkan model deposit ke demo context
   - Demo harus punya `deposits[]`, CRUD deposit, dan helper lookup.
   - Semua flow demo wajib memakai data deposit yang sama seperti real agar parity terjaga.

4. Rapikan invalidation dan refresh
   - Setelah mutasi sukses, invalidate semua query terkait:
     - rooms
     - tenants
     - transactions
     - expenses
     - deposits
   - Hindari partial refresh.

5. Standarkan derivation data antar halaman
   - Buat helper selector bersama untuk:
     - tenant + room label
     - unpaid list
     - room occupancy
     - income by room type
   - Dengan begitu Dashboard, Kamar, Penyewa, Pembayaran, Keuangan memakai logika turunan yang sama.

6. Tambahkan guard integritas di database
   - Minimal validasi bahwa:
     - tenant aktif dengan `room_id` harus sinkron dengan room `terisi`
     - tenant keluar tidak boleh tetap dianggap aktif di flow pembayaran aktif
   - Bila perlu pakai function/trigger validasi ringan, bukan mengandalkan frontend saja.

File yang paling perlu dibenahi:
- `src/pages/PenyewaPage.tsx`
- `src/pages/KamarPage.tsx`
- `src/pages/PembayaranPage.tsx`
- `src/pages/KeuanganPage.tsx`
- `src/lib/demo-context.tsx`
- `src/hooks/use-queries.ts`
- kemungkinan tambah server-side logic di Supabase (RPC atau edge function)

Prioritas implementasi:
1. Perbaiki flow tambah penyewa / akhiri sewa / hapus penyewa agar transactional
2. Tambahkan deposit ke demo context
3. Samakan selector data antar halaman
4. Baru setelah itu audit ulang semua kartu KPI dan daftar pembayaran

Hasil yang dituju:
- Data berubah sekali, lalu semua menu membaca hasil yang sama
- Tidak ada lagi kasus kamar kosong tapi penyewa masih aktif, atau penyewa sudah dihapus tapi transaksi/deposit masih muncul
- Demo dan real memakai alur bisnis yang setara
