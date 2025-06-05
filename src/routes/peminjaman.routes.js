const express = require('express');
const router = express.Router();
const peminjamanController = require('../controllers/peminjaman.controller');
const { verifikasiToken, semuaPengguna, adminAtauToolman, hanyaKepalaLab, adminToolmanAtauKepalaLab } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi penyimpanan untuk upload surat peminjaman
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/surat_peminjaman');
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'surat-peminjaman-' + uniqueSuffix + ext);
  }
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar atau PDF yang diizinkan (jpeg, jpg, png, pdf)'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran file 5MB
});

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua peminjaman (semua pengguna bisa melihat)
router.get('/', semuaPengguna, peminjamanController.dapatkanSemuaPeminjaman);

// Rute untuk mendapatkan peminjaman berdasarkan ID (semua pengguna bisa melihat)
router.get('/:id', semuaPengguna, peminjamanController.dapatkanPeminjamanById);

// Rute untuk membuat peminjaman baru (Admin dan Toolman)
router.post('/', adminAtauToolman, peminjamanController.buatPeminjaman);

// Rute untuk upload surat peminjaman (Admin dan Toolman)
router.post('/:id/upload-surat', adminAtauToolman, upload.single('surat_peminjaman'), peminjamanController.uploadSuratPeminjaman);

// Rute untuk menyetujui/menolak peminjaman (hanya Kepala Lab)
router.put('/:id/persetujuan', hanyaKepalaLab, peminjamanController.persetujuanPeminjaman);

// Rute untuk mengembalikan barang (Admin, Toolman, dan Kepala Lab)
router.put('/:id/kembalikan', adminToolmanAtauKepalaLab, peminjamanController.kembalikanBarang);

// Rute untuk mengupdate peminjaman (Admin, Toolman, dan Kepala Lab)
router.put('/:id', adminToolmanAtauKepalaLab, peminjamanController.updatePeminjaman);

// Rute untuk menghapus peminjaman (hanya Kepala Lab)
router.delete('/:id', hanyaKepalaLab, peminjamanController.hapusPeminjaman);

// Rute untuk mencetak surat peminjaman (Admin dan Toolman)
router.get('/:id/cetak-surat', adminAtauToolman, peminjamanController.cetakSuratPeminjaman);

module.exports = router;