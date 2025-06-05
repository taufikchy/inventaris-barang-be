-- Script SQL untuk menambahkan kolom yang hilang pada tabel peminjaman

USE inventaris_tkj;

-- Menambahkan kolom id_kepala_lab
ALTER TABLE peminjaman
ADD COLUMN id_kepala_lab INT NULL,
ADD CONSTRAINT fk_peminjaman_kepala_lab FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Menambahkan kolom tanggal_persetujuan
ALTER TABLE peminjaman
ADD COLUMN tanggal_persetujuan DATETIME NULL;

-- Menambahkan kolom catatan_persetujuan
ALTER TABLE peminjaman
ADD COLUMN catatan_persetujuan TEXT NULL;

-- Menambahkan kolom surat_peminjaman
ALTER TABLE peminjaman
ADD COLUMN surat_peminjaman VARCHAR(255) NULL COMMENT 'Path ke file surat peminjaman yang dicetak';

-- Memperbarui status enum untuk menambahkan status yang hilang
ALTER TABLE peminjaman
MODIFY COLUMN status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'menunggu_persetujuan';

-- Verifikasi perubahan
DESCRIBE peminjaman;