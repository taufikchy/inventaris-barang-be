-- Script untuk menambahkan kolom tipe pada tabel kategori
-- Untuk membedakan antara kategori alat dan bahan

USE inventaris_tkj;

-- Tambahkan kolom tipe pada tabel kategori
ALTER TABLE kategori 
ADD COLUMN tipe ENUM('alat', 'bahan') NOT NULL DEFAULT 'alat' 
AFTER deskripsi;

-- Update kategori yang sudah ada berdasarkan nama
-- Kategori yang kemungkinan bahan
UPDATE kategori SET tipe = 'bahan' 
WHERE nama LIKE '%bahan%' 
   OR nama LIKE '%material%' 
   OR nama LIKE '%consumable%'
   OR nama LIKE '%habis pakai%'
   OR nama LIKE '%kabel%'
   OR nama LIKE '%connector%'
   OR nama LIKE '%konektor%';

-- Tampilkan hasil update
SELECT id, nama, tipe FROM kategori ORDER BY tipe, nama;