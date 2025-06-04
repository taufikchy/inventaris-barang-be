const express = require('express');
const router = express.Router();
const lokasiController = require('../controllers/lokasi.controller');
const { verifikasiToken, stafAtauAdmin, hanyaAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua lokasi
router.get('/', stafAtauAdmin, lokasiController.dapatkanSemuaLokasi);

// Rute untuk mendapatkan semua lokasi untuk dropdown (tanpa pagination)
router.get('/dropdown', stafAtauAdmin, lokasiController.dapatkanSemuaLokasiDropdown);

// Rute untuk mendapatkan lokasi berdasarkan ID
router.get('/:id', stafAtauAdmin, lokasiController.dapatkanLokasiById);

// Rute untuk membuat lokasi baru (hanya admin)
router.post('/', hanyaAdmin, lokasiController.buatLokasi);

// Rute untuk mengupdate lokasi (hanya admin)
router.put('/:id', hanyaAdmin, lokasiController.updateLokasi);

// Rute untuk menghapus lokasi (hanya admin)
router.delete('/:id', hanyaAdmin, lokasiController.hapusLokasi);

module.exports = router;