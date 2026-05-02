-- Simplifikasi schema:
-- 1. Hapus kolom fasilitas dari room_types (fitur per-kamar dihilangkan)
-- 2. Hapus kolom send_email_notifications dari tenants (fitur notif otomatis ke penyewa dihapus)

ALTER TABLE room_types DROP COLUMN IF EXISTS fasilitas;

ALTER TABLE tenants DROP COLUMN IF EXISTS send_email_notifications;
