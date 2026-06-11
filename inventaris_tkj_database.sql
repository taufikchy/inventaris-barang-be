-- ========================================================================
-- DATABASE INVENTARIS BARANG TKJ
-- Dibuat: 2026-06-11
-- Cocok untuk: Laragon / MySQL
-- ========================================================================

-- Membuat database
CREATE DATABASE IF NOT EXISTS inventaris_tkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventaris_tkj;

-- ========================================================================
-- TABEL PENGGUNA
-- ========================================================================
CREATE TABLE IF NOT EXISTS pengguna (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nama_pengguna VARCHAR(255) NOT NULL UNIQUE,
  kata_sandi VARCHAR(255) NOT NULL,
  peran ENUM('admin', 'kepala_lab', 'toolman', 'sarana') DEFAULT 'sarana',
  aktif BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL KATEGORI
-- ========================================================================
CREATE TABLE IF NOT EXISTS kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL UNIQUE,
  deskripsi TEXT,
  tipe ENUM('alat', 'bahan') DEFAULT 'alat',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL LOKASI
-- ========================================================================
CREATE TABLE IF NOT EXISTS lokasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL UNIQUE,
  deskripsi TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL BARANG
-- ========================================================================
CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kode VARCHAR(255) NOT NULL UNIQUE,
  deskripsi TEXT,
  jumlah INT NOT NULL DEFAULT 0,
  satuan VARCHAR(50),
  unit_per_set INT COMMENT 'Jumlah unit dalam 1 set (untuk kategori bahan dengan satuan set)',
  unit_used INT NOT NULL DEFAULT 0 COMMENT 'Jumlah unit yang sudah digunakan dari set',
  kondisi ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
  tanggal_perolehan DATE,
  tahun_pengadaan INT,
  gambar VARCHAR(255),
  id_kategori INT NOT NULL,
  id_lokasi INT NOT NULL,
  status ENUM('tersedia', 'dipinjam', 'perbaikan', 'dihapuskan') DEFAULT 'tersedia',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_kategori) REFERENCES kategori(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_lokasi) REFERENCES lokasi(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL PEMINJAMAN
-- ========================================================================
CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_peminjaman VARCHAR(50) UNIQUE COMMENT 'Kode unik peminjaman (contoh: PJM-001)',
  nama_peminjam VARCHAR(255) NOT NULL,
  kontak_peminjam VARCHAR(255),
  kelas_peminjam VARCHAR(255),
  jabatan_peminjam VARCHAR(255) COMMENT 'Jabatan peminjam (contoh: Siswa, Guru, Staff)',
  tanggal_pinjam DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_kembali_harapan DATE NOT NULL,
  tanggal_kembali_aktual DATETIME,
  status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'menunggu_persetujuan',
  catatan TEXT,
  id_pengguna INT NOT NULL,
  id_kepala_lab INT,
  tanggal_persetujuan DATETIME,
  catatan_persetujuan TEXT,
  surat_peminjaman VARCHAR(255) COMMENT 'Path ke file surat peminjaman',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL DETAIL PEMINJAMAN
-- ========================================================================
CREATE TABLE IF NOT EXISTS detail_peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_peminjaman INT NOT NULL,
  id_barang INT NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  kondisi_sebelum ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
  kondisi_saat_pinjam ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
  kondisi_sesudah ENUM('baik', 'rusak_ringan', 'rusak_berat'),
  kondisi_saat_kembali ENUM('baik', 'rusak_ringan', 'rusak_berat'),
  catatan TEXT,
  catatan_kondisi TEXT COMMENT 'Catatan kondisi barang saat pengembalian',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_peminjaman) REFERENCES peminjaman(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_barang) REFERENCES barang(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL TRANSAKSI
-- ========================================================================
CREATE TABLE IF NOT EXISTS transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_barang INT NOT NULL,
  id_pengguna INT NOT NULL,
  jenis_transaksi ENUM('keluar', 'rusak', 'hilang') NOT NULL,
  jumlah INT NOT NULL,
  keterangan TEXT,
  tanggal_transaksi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  stok_sebelum INT COMMENT 'Stok sebelum transaksi',
  stok_sesudah INT COMMENT 'Stok sesudah transaksi',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_barang) REFERENCES barang(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL HISTORI AKTIVITAS
-- ========================================================================
CREATE TABLE IF NOT EXISTS histori_aktivitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pengguna INT NOT NULL,
  jenis_aktivitas ENUM('create', 'update', 'delete', 'login', 'logout') NOT NULL,
  modul ENUM('barang', 'kategori', 'lokasi', 'pengguna', 'peminjaman', 'transaksi', 'auth') NOT NULL,
  id_objek INT COMMENT 'ID objek yang dimodifikasi',
  nama_objek VARCHAR(255) COMMENT 'Nama objek yang dimodifikasi',
  deskripsi TEXT NOT NULL,
  data_sebelum JSON COMMENT 'Data sebelum perubahan',
  data_sesudah JSON COMMENT 'Data setelah perubahan',
  ip_address VARCHAR(45),
  user_agent TEXT,
  waktu_aktivitas DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- TABEL HISTORI AKTIVITAS ARCHIVE
-- ========================================================================
CREATE TABLE IF NOT EXISTS histori_aktivitas_archive (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_id INT NOT NULL COMMENT 'ID asli dari histori_aktivitas',
  id_pengguna INT NOT NULL,
  jenis_aktivitas ENUM('create', 'update', 'delete', 'login', 'logout') NOT NULL,
  modul VARCHAR(50) NOT NULL,
  id_objek INT,
  nama_objek VARCHAR(255),
  deskripsi TEXT NOT NULL,
  data_sebelum JSON,
  data_sesudah JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  waktu_aktivitas DATETIME NOT NULL,
  archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- INDEKS UNTUK OPTIMASI QUERY
-- ========================================================================
CREATE INDEX idx_barang_kategori ON barang(id_kategori);
CREATE INDEX idx_barang_lokasi ON barang(id_lokasi);
CREATE INDEX idx_barang_status ON barang(status);
CREATE INDEX idx_barang_kondisi ON barang(kondisi);

CREATE INDEX idx_peminjaman_status ON peminjaman(status);
CREATE INDEX idx_peminjaman_tanggal ON peminjaman(tanggal_pinjam);
CREATE INDEX idx_peminjaman_pengguna ON peminjaman(id_pengguna);
CREATE INDEX idx_peminjaman_kepala_lab ON peminjaman(id_kepala_lab);
CREATE INDEX idx_peminjaman_kode ON peminjaman(kode_peminjaman);

CREATE INDEX idx_detail_peminjaman_peminjaman ON detail_peminjaman(id_peminjaman);
CREATE INDEX idx_detail_peminjaman_barang ON detail_peminjaman(id_barang);

CREATE INDEX idx_transaksi_barang ON transaksi(id_barang);
CREATE INDEX idx_transaksi_pengguna ON transaksi(id_pengguna);
CREATE INDEX idx_transaksi_jenis ON transaksi(jenis_transaksi);

CREATE INDEX idx_histori_pengguna ON histori_aktivitas(id_pengguna);
CREATE INDEX idx_histori_modul ON histori_aktivitas(modul);
CREATE INDEX idx_histori_waktu ON histori_aktivitas(waktu_aktivitas);

CREATE INDEX idx_archive_waktu ON histori_aktivitas_archive(waktu_aktivitas);
CREATE INDEX idx_archive_archived ON histori_aktivitas_archive(archived_at);

-- ========================================================================
-- DATA AWAL - PENGGUNA
-- ========================================================================
-- Password default: admin123 (bcrypt hash)
INSERT INTO pengguna (nama, nama_pengguna, kata_sandi, peran, aktif) VALUES
('Administrator', 'admin', '$2a$10$PAvWw0L8cC4p.fJpkN/CYOBrrlxKqZa.lNsG3FIljVw0j99ZyS256', 'admin', TRUE),
('Kepala Lab TKJ', 'kepala_lab', '$2a$10$PAvWw0L8cC4p.fJpkN/CYOBrrlxKqZa.lNsG3FIljVw0j99ZyS256', 'kepala_lab', TRUE),
('Toolman', 'toolman', '$2a$10$PAvWw0L8cC4p.fJpkN/CYOBrrlxKqZa.lNsG3FIljVw0j99ZyS256', 'toolman', TRUE),
('Sarana', 'sarana', '$2a$10$PAvWw0L8cC4p.fJpkN/CYOBrrlxKqZa.lNsG3FIljVw0j99ZyS256', 'sarana', TRUE);

-- ========================================================================
-- DATA AWAL - KATEGORI
-- ========================================================================
INSERT INTO kategori (nama, deskripsi, tipe) VALUES
('Komputer', 'Perangkat komputer dan aksesori', 'alat'),
('Jaringan', 'Peralatan jaringan komputer', 'alat'),
('Elektronik', 'Peralatan elektronik lainnya', 'alat'),
('Periferal', 'Perangkat tambahan komputer', 'alat'),
('Alat Ukur', 'Peralatan untuk pengukuran', 'alat'),
('Media Pembelajaran', 'Media untuk kegiatan belajar mengajar', 'alat'),
('Kabel & Connector', 'Kabel dan konektor berbagai jenis', 'alat'),
('Solder & Perlengkapan', 'Peralatan soldering dan bantu', 'alat');

-- ========================================================================
-- DATA AWAL - LOKASI
-- ========================================================================
INSERT INTO lokasi (nama, deskripsi) VALUES
('Lab Komputer 1', 'Laboratorium komputer lantai 1'),
('Lab Komputer 2', 'Laboratorium komputer lantai 2'),
('Ruang Server', 'Ruang server dan peralatan jaringan'),
('Ruang Guru TKJ', 'Ruang guru jurusan TKJ'),
('Gudang', 'Tempat penyimpanan barang'),
('Ruang Toolman', 'Ruang kerja toolman');

-- ========================================================================
-- DATA AWAL - BARANG
-- ========================================================================
INSERT INTO barang (nama, kode, deskripsi, jumlah, satuan, kondisi, tanggal_perolehan, tahun_pengadaan, id_kategori, id_lokasi, status) VALUES
('PC Desktop Dell OptiPlex', 'KOMP-001', 'PC Desktop Dell OptiPlex 3080 Core i5 Gen 10', 10, 'unit', 'baik', '2023-01-15', 2023, 1, 1, 'tersedia'),
('Laptop Lenovo ThinkPad', 'KOMP-002', 'Laptop Lenovo ThinkPad E14 Core i5 Gen 11', 5, 'unit', 'baik', '2023-02-20', 2023, 1, 2, 'tersedia'),
('Monitor LED 24 inch', 'KOMP-003', 'Monitor LED 24 inch Samsung', 15, 'unit', 'baik', '2023-01-15', 2023, 1, 1, 'tersedia'),
('Router Cisco 1941', 'NET-001', 'Router Cisco 1941 untuk praktikum jaringan', 3, 'unit', 'baik', '2023-01-10', 2023, 2, 3, 'tersedia'),
('Switch Cisco Catalyst 2960', 'NET-002', 'Switch Cisco Catalyst 2960 24 Port', 5, 'unit', 'baik', '2023-01-10', 2023, 2, 3, 'tersedia'),
('Kabel LAN Cat 6', 'KABEL-001', 'Kabel LAN UTP Cat 6 100meter', 10, 'roll', 'baik', '2023-03-01', 2023, 7, 5, 'tersedia'),
('Konektor RJ45', 'KONEK-001', 'Konektor RJ45 untuk kabel LAN', 100, 'pcs', 'baik', '2023-03-01', 2023, 7, 5, 'tersedia'),
('Multimeter Digital', 'UKUR-001', 'Multimeter Digital DT-830D', 10, 'unit', 'baik', '2023-02-15', 2023, 5, 6, 'tersedia'),
('Solusi Timah', 'SOLD-001', 'Solusi timah untuk soldering', 20, 'pcs', 'baik', '2023-04-01', 2023, 8, 6, 'tersedia'),
('Projector EPSON', 'ELEK-001', 'Projector EPSON EB-X51', 3, 'unit', 'baik', '2023-01-20', 2023, 3, 1, 'tersedia');

-- ========================================================================
-- TRIGGER UNTUK INTEGRITAS DATA
-- ========================================================================
DELIMITER //

-- Trigger: Update status barang saat dipinjam
CREATE TRIGGER after_detail_peminjaman_insert
AFTER INSERT ON detail_peminjaman
FOR EACH ROW
BEGIN
  UPDATE barang SET status = 'dipinjam' WHERE id = NEW.id_barang;
END//

-- Trigger: Update status barang saat dikembalikan
CREATE TRIGGER after_peminjaman_update
AFTER UPDATE ON peminjaman
FOR EACH ROW
BEGIN
  IF NEW.status = 'dikembalikan' AND OLD.status != 'dikembalikan' THEN
    UPDATE barang b
    INNER JOIN detail_peminjaman dp ON b.id = dp.id_barang
    WHERE dp.id_peminjaman = NEW.id
    SET b.status = 'tersedia';
  END IF;
END//

DELIMITER ;

-- ========================================================================
-- SELESAI
-- ========================================================================
