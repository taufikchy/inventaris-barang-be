-- ========================================================================
-- SCRIPT PEMBUATAN DATABASE INVENTARIS BARANG TKJ
-- ========================================================================

-- Membuat database inventaris_tkj
CREATE DATABASE IF NOT EXISTS inventaris_tkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventaris_tkj;

-- ========================================================================
-- PEMBUATAN TABEL
-- ========================================================================

-- Membuat tabel pengguna
CREATE TABLE IF NOT EXISTS pengguna (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nama_pengguna VARCHAR(255) NOT NULL UNIQUE,
  kata_sandi VARCHAR(255) NOT NULL,
  peran ENUM('admin', 'staf') DEFAULT 'staf',
  aktif BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Membuat tabel kategori
CREATE TABLE IF NOT EXISTS kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL UNIQUE,
  deskripsi TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Membuat tabel lokasi
CREATE TABLE IF NOT EXISTS lokasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL UNIQUE,
  deskripsi TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Membuat tabel barang
CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kode VARCHAR(255) NOT NULL UNIQUE,
  deskripsi TEXT,
  jumlah INT NOT NULL DEFAULT 0,
  kondisi ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
  tanggal_perolehan DATE,
  harga_perolehan DECIMAL(15, 2),
  gambar VARCHAR(255),
  id_kategori INT NOT NULL,
  id_lokasi INT NOT NULL,
  status ENUM('tersedia', 'dipinjam', 'perbaikan', 'dihapuskan') DEFAULT 'tersedia',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_kategori) REFERENCES kategori(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_lokasi) REFERENCES lokasi(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Membuat tabel peminjaman
CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_peminjam VARCHAR(255) NOT NULL,
  kontak_peminjam VARCHAR(255),
  kelas_peminjam VARCHAR(255),
  tanggal_pinjam DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_kembali_harapan DATETIME NOT NULL,
  tanggal_kembali_aktual DATETIME,
  status ENUM('dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'dipinjam',
  catatan TEXT,
  id_pengguna INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
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

-- ========================================================================
-- PEMBUATAN INDEKS UNTUK OPTIMASI QUERY
-- ========================================================================

-- Indeks untuk tabel barang
CREATE INDEX idx_barang_kategori ON barang(id_kategori);
CREATE INDEX idx_barang_lokasi ON barang(id_lokasi);
CREATE INDEX idx_barang_status ON barang(status);
CREATE INDEX idx_barang_kondisi ON barang(kondisi);

-- Indeks untuk tabel peminjaman
CREATE INDEX idx_peminjaman_status ON peminjaman(status);
CREATE INDEX idx_peminjaman_tanggal ON peminjaman(tanggal_pinjam);
CREATE INDEX idx_peminjaman_pengguna ON peminjaman(id_pengguna);

-- Indeks untuk tabel detail_peminjaman
CREATE INDEX idx_detail_peminjaman_barang ON detail_peminjaman(id_barang);

-- ========================================================================
-- DATA AWAL
-- ========================================================================

-- Membuat pengguna admin default
INSERT INTO pengguna (nama, nama_pengguna, kata_sandi, peran, aktif) VALUES 
('Administrator', 'admin', '$2a$10$UtbvO3XZ1ZzRYqBsUZo.UOvFjT3CDtNK3YvAZEHNAjN9XkjBZbeke', 'admin', TRUE);
-- Kata sandi default: admin123

-- Membuat pengguna staf default
INSERT INTO pengguna (nama, nama_pengguna, kata_sandi, peran, aktif) VALUES 
('Staf TKJ', 'staf', '$2a$10$UtbvO3XZ1ZzRYqBsUZo.UOvFjT3CDtNK3YvAZEHNAjN9XkjBZbeke', 'staf', TRUE);
-- Kata sandi default: admin123

-- Membuat beberapa kategori awal
INSERT INTO kategori (nama, deskripsi) VALUES 
('Komputer', 'Perangkat komputer dan aksesori'),
('Jaringan', 'Peralatan jaringan komputer'),
('Elektronik', 'Peralatan elektronik lainnya'),
('Periferal', 'Perangkat tambahan komputer'),
('Alat Ukur', 'Peralatan untuk pengukuran'),
('Media Pembelajaran', 'Media untuk kegiatan belajar mengajar');

-- Membuat beberapa lokasi awal
INSERT INTO lokasi (nama, deskripsi) VALUES 
('Lab Komputer 1', 'Laboratorium komputer lantai 1'),
('Lab Komputer 2', 'Laboratorium komputer lantai 2'),
('Ruang Server', 'Ruang server dan peralatan jaringan'),
('Ruang Guru TKJ', 'Ruang guru jurusan TKJ'),
('Gudang', 'Tempat penyimpanan barang');

-- ========================================================================
-- CONTOH DATA BARANG (OPSIONAL)
-- ========================================================================

-- Contoh data barang untuk kategori Komputer
INSERT INTO barang (nama, kode, deskripsi, jumlah, kondisi, tanggal_perolehan, harga_perolehan, id_kategori, id_lokasi) VALUES
('PC Desktop Dell OptiPlex', 'KOMP-001', 'PC Desktop Dell OptiPlex 3080 Core i5 Gen 10', 10, 'baik', '2023-01-15', 8500000, 1, 1),
('Laptop Lenovo ThinkPad', 'KOMP-002', 'Laptop Lenovo ThinkPad E14 Core i5 Gen 11', 5, 'baik', '2023-02-20', 9500000, 1, 2);

-- Contoh data barang untuk kategori Jaringan
INSERT INTO barang (nama, kode, deskripsi, jumlah, kondisi, tanggal_perolehan, harga_perolehan, id_kategori, id_lokasi) VALUES
('Router Cisco', 'NET-001', 'Router Cisco 1941 untuk praktikum jaringan', 3, 'baik', '2023-01-10', 5000000, 2, 3),
('Switch Cisco', 'NET-002', 'Switch Cisco Catalyst 2960 24 Port', 5, 'baik', '2023-01-10', 3500000, 2, 3);

-- ========================================================================
-- TRIGGER UNTUK MENJAGA INTEGRITAS DATA
-- ========================================================================

-- Trigger untuk mengupdate status barang saat dipinjam
DELIMITER //
CREATE TRIGGER after_detail_peminjaman_insert
AFTER INSERT ON detail_peminjaman
FOR EACH ROW
BEGIN
    -- Update status barang menjadi 'dipinjam'
    UPDATE barang SET status = 'dipinjam' WHERE id = NEW.id_barang;
END //
DELIMITER ;

-- Trigger untuk mengupdate status barang saat dikembalikan
DELIMITER //
CREATE TRIGGER after_peminjaman_update
AFTER UPDATE ON peminjaman
FOR EACH ROW
BEGIN
    IF NEW.status = 'dikembalikan' AND OLD.status != 'dikembalikan' THEN
        -- Update status barang yang terkait dengan peminjaman ini menjadi 'tersedia'
        UPDATE barang b
        INNER JOIN detail_peminjaman dp ON b.id = dp.id_barang
        WHERE dp.id_peminjaman = NEW.id
        SET b.status = 'tersedia';
    END IF;
END //
DELIMITER ;