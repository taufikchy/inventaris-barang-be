const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barang.controller');
const { verifikasiToken, stafAtauAdmin, hanyaAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi penyimpanan untuk upload gambar
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/barang');
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'barang-' + uniqueSuffix + ext);
  }
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran file 5MB
});

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua barang
router.get('/', stafAtauAdmin, barangController.dapatkanSemuaBarang);

// Rute untuk mendapatkan semua barang untuk dropdown (tanpa pagination)
router.get('/dropdown', stafAtauAdmin, barangController.dapatkanSemuaBarangDropdown);

// Rute untuk mendapatkan barang berdasarkan ID
router.get('/:id', stafAtauAdmin, barangController.dapatkanBarangById);

// Rute untuk membuat barang baru (hanya admin)
router.post('/', hanyaAdmin, upload.single('gambar'), barangController.buatBarang);

// Rute untuk mengupdate barang (hanya admin)
router.put('/:id', hanyaAdmin, upload.single('gambar'), barangController.updateBarang);

// Rute untuk menghapus barang (hanya admin)
router.delete('/:id', hanyaAdmin, barangController.hapusBarang);

module.exports = router;