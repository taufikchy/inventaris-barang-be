-- Script untuk membuat user baru
USE inventaris_tkj;

-- Membuat user baru dengan role sarana
INSERT INTO pengguna (nama, nama_pengguna, kata_sandi, peran, aktif, createdAt, updatedAt) 
VALUES ('User Baru', 'userbaru', '$2a$10$/lZTs5tarT9lx/oNSXQ9N.5VH9ZDrpe6pkfF54WqfFKBmEahOKgZi', 'sarana', 1, NOW(), NOW());

-- Menampilkan user yang baru dibuat
SELECT id, nama, nama_pengguna, peran, aktif, createdAt FROM pengguna WHERE nama_pengguna = 'userbaru';

-- Informasi login:
-- Username: userbaru
-- Password: admin123
-- Role: sarana