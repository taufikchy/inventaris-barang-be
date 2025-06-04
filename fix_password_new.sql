-- Script SQL untuk memperbaiki kata sandi admin
-- Kata sandi: admin123 (hash baru yang dihasilkan)

USE inventaris_tkj;

-- Update kata sandi untuk pengguna admin
UPDATE pengguna 
SET kata_sandi = '$2a$10$8nNfeUM8Cn6ADdFHzg7lTOjHgUwQTtx4EwK.gYlEfJnnxhDV8CZne' 
WHERE nama_pengguna = 'admin';

-- Update kata sandi untuk pengguna admin2 jika ada
UPDATE pengguna 
SET kata_sandi = '$2a$10$8nNfeUM8Cn6ADdFHzg7lTOjHgUwQTtx4EwK.gYlEfJnnxhDV8CZne' 
WHERE nama_pengguna = 'admin2';

-- Verifikasi perubahan
SELECT id, nama, nama_pengguna, LEFT(kata_sandi, 20) AS kata_sandi_partial, peran, aktif 
FROM pengguna 
WHERE nama_pengguna IN ('admin', 'admin2');