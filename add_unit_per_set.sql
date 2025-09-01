-- Script untuk menambahkan kolom unit_per_set dan satuan pada tabel barang
-- Tanggal: 2025-01-12

USE inventaris_barang;

-- Tambahkan kolom satuan
ALTER TABLE barang 
ADD COLUMN satuan VARCHAR(50) NULL AFTER jumlah;

-- Tambahkan kolom unit_per_set
ALTER TABLE barang 
ADD COLUMN unit_per_set INT NULL AFTER satuan
COMMENT 'Jumlah unit dalam 1 set (untuk kategori bahan dengan satuan set)';

-- Update data existing untuk set default satuan
UPDATE barang SET satuan = 'unit' WHERE satuan IS NULL;

SELECT 'Kolom unit_per_set dan satuan berhasil ditambahkan ke tabel barang' AS status;