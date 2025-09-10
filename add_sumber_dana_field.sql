-- Menambahkan kolom sumber_dana ke tabel barang
ALTER TABLE barang ADD COLUMN sumber_dana VARCHAR(255) NULL COMMENT 'Sumber dana barang (contoh: BOS, BOP, dll)';

-- Verifikasi struktur tabel
DESCRIBE barang;