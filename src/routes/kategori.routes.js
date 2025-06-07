const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const { verifikasiToken, semuaPengguna, adminAtauToolman, hanyaKepalaLab, adminToolmanAtauKepalaLab } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua kategori
router.get('/', semuaPengguna, kategoriController.dapatkanSemuaKategori);

// Rute untuk mendapatkan semua kategori untuk dropdown (tanpa pagination)
router.get('/dropdown', semuaPengguna, kategoriController.dapatkanSemuaKategoriDropdown);

// Rute untuk mendapatkan kategori berdasarkan ID
router.get('/:id', semuaPengguna, kategoriController.dapatkanKategoriById);

// Rute untuk membuat kategori baru
router.post('/', adminToolmanAtauKepalaLab, kategoriController.buatKategori);

// Rute untuk mengupdate kategori
router.put('/:id', adminToolmanAtauKepalaLab, kategoriController.perbaruiKategori);

// Rute untuk menghapus kategori
router.delete('/:id', hanyaKepalaLab, kategoriController.hapusKategori);

module.exports = router;