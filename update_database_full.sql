-- ========================================================================
-- SCRIPT PEMBARUAN DATABASE INVENTARIS BARANG TKJ
-- ========================================================================

USE inventaris_tkj;

-- ========================================================================
-- PEMBARUAN TABEL PEMINJAMAN
-- ========================================================================

-- Menambahkan kolom id_kepala_lab jika belum ada
ALTER TABLE peminjaman
ADD COLUMN IF NOT EXISTS id_kepala_lab INT NULL,
ADD CONSTRAINT IF NOT EXISTS fk_peminjaman_kepala_lab FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Menambahkan kolom tanggal_persetujuan jika belum ada
ALTER TABLE peminjaman
ADD COLUMN IF NOT EXISTS tanggal_persetujuan DATETIME NULL;

-- Menambahkan kolom catatan_persetujuan jika belum ada
ALTER TABLE peminjaman
ADD COLUMN IF NOT EXISTS catatan_persetujuan TEXT NULL;

-- Menambahkan kolom surat_peminjaman jika belum ada
ALTER TABLE peminjaman
ADD COLUMN IF NOT EXISTS surat_peminjaman VARCHAR(255) NULL COMMENT 'Path ke file surat peminjaman yang dicetak';

-- Memperbarui status enum untuk menambahkan status yang hilang
ALTER TABLE peminjaman
MODIFY COLUMN status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'menunggu_persetujuan';

-- ========================================================================
-- PEMBARUAN TABEL DETAIL_PEMINJAMAN
-- ========================================================================

-- Memastikan tabel detail_peminjaman memiliki struktur yang benar
ALTER TABLE detail_peminjaman
MODIFY COLUMN jumlah INT NOT NULL DEFAULT 1,
MODIFY COLUMN kondisi_sebelum ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
MODIFY COLUMN kondisi_sesudah ENUM('baik', 'rusak_ringan', 'rusak_berat') NULL;

-- ========================================================================
-- PEMBARUAN INDEKS UNTUK OPTIMASI QUERY
-- ========================================================================

-- Indeks untuk tabel peminjaman
CREATE INDEX IF NOT EXISTS idx_peminjaman_status ON peminjaman(status);
CREATE INDEX IF NOT EXISTS idx_peminjaman_tanggal ON peminjaman(tanggal_pinjam);
CREATE INDEX IF NOT EXISTS idx_peminjaman_pengguna ON peminjaman(id_pengguna);
CREATE INDEX IF NOT EXISTS idx_peminjaman_kepala_lab ON peminjaman(id_kepala_lab);

-- Indeks untuk tabel detail_peminjaman
CREATE INDEX IF NOT EXISTS idx_detail_peminjaman_peminjaman ON detail_peminjaman(id_peminjaman);
CREATE INDEX IF NOT EXISTS idx_detail_peminjaman_barang ON detail_peminjaman(id_barang);

-- ========================================================================
-- VERIFIKASI PERUBAHAN
-- ========================================================================

-- Verifikasi struktur tabel peminjaman
DESCRIBE peminjaman;

-- Verifikasi struktur tabel detail_peminjaman
DESCRIBE detail_peminjaman;

-- ========================================================================
-- SCRIPT PEMBUATAN TABEL DARI AWAL (JIKA DIPERLUKAN)
-- ========================================================================

/*
-- Membuat tabel peminjaman
CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_peminjam VARCHAR(255) NOT NULL,
  kontak_peminjam VARCHAR(255),
  kelas_peminjam VARCHAR(255),
  tanggal_pinjam DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_kembali_harapan DATETIME NOT NULL,
  tanggal_kembali_aktual DATETIME,
  status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'menunggu_persetujuan',
  catatan TEXT,
  id_pengguna INT NOT NULL,
  id_kepala_lab INT,
  tanggal_persetujuan DATETIME,
  catatan_persetujuan TEXT,
  surat_peminjaman VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Membuat tabel detail_peminjaman
CREATE TABLE IF NOT EXISTS detail_peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_peminjaman INT NOT NULL,
  id_barang INT NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  kondisi_sebelum ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
  kondisi_sesudah ENUM('baik', 'rusak_ringan', 'rusak_berat'),
  catatan TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_peminjaman) REFERENCES peminjaman(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_barang) REFERENCES barang(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
*/