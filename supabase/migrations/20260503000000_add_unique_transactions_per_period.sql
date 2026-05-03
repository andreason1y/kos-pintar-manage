-- Hapus duplikat yang mungkin sudah ada sebelum menambah constraint
DELETE FROM transactions a
USING transactions b
WHERE a.id > b.id
  AND a.tenant_id = b.tenant_id
  AND a.periode_bulan = b.periode_bulan
  AND a.periode_tahun = b.periode_tahun;

-- Tambah unique constraint agar billing idempotent
ALTER TABLE transactions
  ADD CONSTRAINT transactions_unique_per_tenant_period
  UNIQUE (tenant_id, periode_bulan, periode_tahun);
