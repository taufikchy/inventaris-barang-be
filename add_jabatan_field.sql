-- Script SQL untuk menambahkan field jabatan_peminjam ke tabel peminjaman

USE inventaris_tkj;

-- Menambahkan kolom jabatan_peminjam
ALTER TABLE peminjaman
ADD COLUMN jabatan_peminjam VARCHAR(255) NULL COMMENT 'Jabatan peminjam (contoh: Siswa, Guru, Staff, dll)';

-- Verifikasi perubahan
DESCRIBE peminjaman;

-- Menampilkan struktur tabel untuk konfirmasi
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'inventaris_tkj' 
AND TABLE_NAME = 'peminjaman' 
AND COLUMN_NAME = 'jabatan_peminjam';