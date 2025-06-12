-- ========================================================================
-- SCRIPT PENAMBAHAN TABEL HISTORI AKTIVITAS
-- ========================================================================

USE inventaris_tkj;

-- Membuat tabel histori_aktivitas
CREATE TABLE IF NOT EXISTS histori_aktivitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pengguna INT NOT NULL,
  jenis_aktivitas ENUM('create', 'update', 'delete', 'login', 'logout') NOT NULL,
  modul ENUM('barang', 'kategori', 'lokasi', 'pengguna', 'peminjaman', 'transaksi', 'auth') NOT NULL,
  id_objek INT NULL COMMENT 'ID dari objek yang dimodifikasi (barang, kategori, dll)',
  nama_objek VARCHAR(255) NULL COMMENT 'Nama objek yang dimodifikasi untuk referensi',
  deskripsi TEXT NOT NULL COMMENT 'Deskripsi detail aktivitas yang dilakukan',
  data_sebelum JSON NULL COMMENT 'Data sebelum perubahan (untuk update/delete)',
  data_sesudah JSON NULL COMMENT 'Data setelah perubahan (untuk create/update)',
  ip_address VARCHAR(45) NULL COMMENT 'IP address pengguna',
  user_agent TEXT NULL COMMENT 'User agent browser',
  waktu_aktivitas DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Membuat indeks untuk optimasi query
CREATE INDEX idx_histori_aktivitas_pengguna ON histori_aktivitas(id_pengguna);
CREATE INDEX idx_histori_aktivitas_jenis ON histori_aktivitas(jenis_aktivitas);
CREATE INDEX idx_histori_aktivitas_modul ON histori_aktivitas(modul);
CREATE INDEX idx_histori_aktivitas_waktu ON histori_aktivitas(waktu_aktivitas);
CREATE INDEX idx_histori_aktivitas_objek ON histori_aktivitas(modul, id_objek);

-- Menambahkan beberapa data contoh untuk testing
INSERT INTO histori_aktivitas (id_pengguna, jenis_aktivitas, modul, deskripsi, waktu_aktivitas) VALUES 
(1, 'login', 'auth', 'Administrator berhasil login ke sistem', NOW()),
(1, 'create', 'kategori', 'Menambahkan kategori baru: Komputer', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'create', 'lokasi', 'Menambahkan lokasi baru: Lab Komputer 1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'create', 'barang', 'Menambahkan barang baru: PC Desktop Dell', DATE_SUB(NOW(), INTERVAL 1 DAY));

SELECT 'Tabel histori_aktivitas berhasil dibuat dan data contoh telah ditambahkan' AS status;