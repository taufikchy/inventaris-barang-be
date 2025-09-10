-- Menambahkan status 'habis' ke enum status di tabel barang
ALTER TABLE barang MODIFY COLUMN status ENUM('tersedia', 'dipinjam', 'perbaikan', 'dihapuskan', 'habis') DEFAULT 'tersedia';

-- Verifikasi perubahan
SHOW COLUMNS FROM barang LIKE 'status';