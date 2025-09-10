const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barang.controller');
const { verifikasiToken, semuaPengguna, adminAtauToolman, hanyaKepalaLab, adminToolmanAtauKepalaLab } = require('../middleware/auth');
const { logActivity, saveOriginalData } = require('../middleware/activityLogger');
const { Barang } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi penyimpanan untuk upload gambar biasa
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/barang');
    console.log('Unit storage - Destination path:', uploadPath);
    
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadPath)) {
      console.log('Unit storage - Creating directory:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    } else {
      console.log('Unit storage - Directory exists:', uploadPath);
    }
    
    console.log('Unit storage - Calling destination callback with:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Untuk upload gambar barang biasa
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'barang-' + uniqueSuffix + ext);
  }
});

// Konfigurasi penyimpanan khusus untuk upload gambar unit
const unitStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/barang');
    console.log('Unit storage - Destination path:', uploadPath);
    
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadPath)) {
      console.log('Unit storage - Creating directory:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    } else {
      console.log('Unit storage - Directory exists:', uploadPath);
    }
    
    console.log('Unit storage - Calling destination callback with:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
      const barangId = req.params.id;
      
      console.log('Unit storage - Processing file for barang ID:', barangId);
      
      // Validasi ID barang
      if (!barangId || isNaN(barangId)) {
        console.error('Unit storage - Invalid barang ID:', barangId);
        return cb(new Error('ID barang tidak valid'));
      }
      
      // Menggunakan promise untuk async operation
      Barang.findByPk(barangId)
        .then(barang => {
          if (barang && barang.kode) {
            // Sanitize kode barang untuk nama file (hapus karakter yang tidak diizinkan)
            const sanitizedKode = barang.kode.replace(/[^a-zA-Z0-9-_]/g, '_');
            const ext = path.extname(file.originalname).toLowerCase();
            
            console.log('Unit storage - Barang found:', barang.kode, 'Sanitized:', sanitizedKode, 'Extension:', ext);
            
            // Validasi ekstensi file
            if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
              console.error('Unit storage - Invalid file extension:', ext);
              return cb(new Error('Format file tidak didukung'));
            }
            
            const filename = `unit-${sanitizedKode}${ext}`;
            console.log('Unit storage - Final filename:', filename);
            console.log('Unit storage - Calling callback with filename:', filename);
            cb(null, filename);
          } else {
            console.error('Unit storage - Barang not found or no kode for ID:', barangId);
            return cb(new Error('Barang tidak ditemukan atau kode barang tidak tersedia'));
          }
        })
        .catch(error => {
          console.error('Unit storage - Error generating filename:', error);
          console.error('Unit storage - Error stack:', error.stack);
          return cb(error);
        });
    }
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif)$/i;
  const allowedMimeTypes = /^image\/(jpeg|png|gif)$/i;
  
  const extname = allowedExtensions.test(file.originalname);
  const mimetype = allowedMimeTypes.test(file.mimetype);
  
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

// Konfigurasi upload khusus untuk gambar unit
const unitUpload = multer({
  storage: unitStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function(req, file, cb) {
    console.log('Unit storage - File filter check:', {
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    
    // Validasi tipe file
    const allowedMimeTypes = /^image\/(jpeg|png|gif)$/i;
    const allowedExtensions = /\.(jpeg|jpg|png|gif)$/i;
    
    const mimetype = allowedMimeTypes.test(file.mimetype);
    const extname = allowedExtensions.test(file.originalname);
    
    console.log('Unit storage - Validation result:', { mimetype, extname });

    if (mimetype && extname) {
      console.log('Unit storage - File accepted');
      return cb(null, true);
    } else {
      console.log('Unit storage - File rejected');
      cb(new Error('Hanya file gambar yang diizinkan (JPEG, PNG, GIF)'));
    }
  }
});

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua barang (semua pengguna bisa melihat)
router.get('/', semuaPengguna, barangController.dapatkanSemuaBarang);

// Rute untuk mendapatkan semua barang untuk dropdown (tanpa pagination) (semua pengguna bisa melihat)
router.get('/dropdown', semuaPengguna, barangController.dapatkanSemuaBarangDropdown);

// Rute untuk mendapatkan barang berdasarkan ID (semua pengguna bisa melihat)
router.get('/:id', semuaPengguna, barangController.dapatkanBarangById);

// Rute untuk membuat barang baru (Admin, Toolman, dan Kepala Lab)
router.post('/', adminToolmanAtauKepalaLab, upload.single('gambar'), logActivity('create', 'barang'), barangController.buatBarang);

// Rute untuk mengupdate barang (Admin, Toolman, dan Kepala Lab)
router.put('/:id', adminToolmanAtauKepalaLab, upload.single('gambar'), saveOriginalData(Barang), logActivity('update', 'barang'), barangController.updateBarang);

// Rute untuk mengupload gambar unit (Admin, Toolman, dan Kepala Lab)
router.put('/:id/gambar', adminToolmanAtauKepalaLab, unitUpload.single('gambar'), saveOriginalData(Barang), logActivity('update', 'barang'), barangController.uploadGambarUnit);

// Rute untuk menghapus barang (hanya Kepala Lab)
router.delete('/:id', hanyaKepalaLab, saveOriginalData(Barang), logActivity('delete', 'barang'), barangController.hapusBarang);

module.exports = router;