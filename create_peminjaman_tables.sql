-- ========================================================================
-- SCRIPT PEMBUATAN TABEL PEMINJAMAN DAN DETAIL_PEMINJAMAN
-- ========================================================================

USE inventaris_tkj;

-- ========================================================================
-- PEMBUATAN TABEL PEMINJAMAN
-- ========================================================================

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
  surat_peminjaman VARCHAR(255) COMMENT 'Path ke file surat peminjaman yang dicetak',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================================
-- PEMBUATAN TABEL DETAIL_PEMINJAMAN
-- ========================================================================

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

-- Indeks untuk tabel peminjaman
CREATE INDEX idx_peminjaman_status ON peminjaman(status);
CREATE INDEX idx_peminjaman_tanggal ON peminjaman(tanggal_pinjam);
CREATE INDEX idx_peminjaman_pengguna ON peminjaman(id_pengguna);
CREATE INDEX idx_peminjaman_kepala_lab ON peminjaman(id_kepala_lab);

-- Indeks untuk tabel detail_peminjaman
CREATE INDEX idx_detail_peminjaman_peminjaman ON detail_peminjaman(id_peminjaman);
CREATE INDEX idx_detail_peminjaman_barang ON detail_peminjaman(id_barang);

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

-- ========================================================================
-- VERIFIKASI PEMBUATAN TABEL
-- ========================================================================

-- Verifikasi struktur tabel peminjaman
DESCRIBE peminjaman;

-- Verifikasi struktur tabel detail_peminjaman
DESCRIBE detail_peminjaman;