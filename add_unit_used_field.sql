-- Script untuk menambahkan kolom unit_used pada tabel barang
-- Tanggal: 2025-01-12

USE inventaris_barang;

-- Tambahkan kolom unit_used
ALTER TABLE barang 
ADD COLUMN unit_used INT NOT NULL DEFAULT 0 AFTER unit_per_set
COMMENT 'Jumlah unit yang sudah digunakan dari set (untuk kategori bahan dengan satuan set)';

SELECT 'Kolom unit_used berhasil ditambahkan ke tabel barang' AS status;