const express = require('express');
const router = express.Router();
const lokasiController = require('../controllers/lokasi.controller');
const { verifikasiToken, semuaPengguna, adminAtauToolman, hanyaKepalaLab, adminToolmanAtauKepalaLab } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua lokasi
router.get('/', semuaPengguna, lokasiController.dapatkanSemuaLokasi);

// Rute untuk mendapatkan semua lokasi untuk dropdown (tanpa pagination)
router.get('/dropdown', semuaPengguna, lokasiController.dapatkanSemuaLokasiDropdown);

// Rute untuk mendapatkan lokasi berdasarkan ID
router.get('/:id', semuaPengguna, lokasiController.dapatkanLokasiById);

// Rute untuk membuat lokasi baru
router.post('/', adminToolmanAtauKepalaLab, lokasiController.buatLokasi);

// Rute untuk memperbarui lokasi
router.put('/:id', adminToolmanAtauKepalaLab, lokasiController.updateLokasi);

// Rute untuk menghapus lokasi
router.delete('/:id', hanyaKepalaLab, lokasiController.hapusLokasi);

module.exports = router;