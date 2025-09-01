-- Script untuk mengupdate enum kondisi di tabel detail_peminjaman
-- Mengubah 'rusak' menjadi 'rusak_berat' untuk konsistensi

USE inventaris_barang;

-- Update kolom kondisi_saat_pinjam
ALTER TABLE detail_peminjaman 
MODIFY COLUMN kondisi_saat_pinjam ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik';

-- Update kolom kondisi_saat_kembali
ALTER TABLE detail_peminjaman 
MODIFY COLUMN kondisi_saat_kembali ENUM('baik', 'rusak_ringan', 'rusak_berat');

-- Update data yang ada dari 'rusak' ke 'rusak_berat'
UPDATE detail_peminjaman 
SET kondisi_saat_pinjam = 'rusak_berat' 
WHERE kondisi_saat_pinjam = 'rusak';

UPDATE detail_peminjaman 
SET kondisi_saat_kembali = 'rusak_berat' 
WHERE kondisi_saat_kembali = 'rusak';

SELECT 'Update enum kondisi berhasil!' as status;