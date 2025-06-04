const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const { verifikasiToken, stafAtauAdmin, hanyaAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua kategori
router.get('/', stafAtauAdmin, kategoriController.dapatkanSemuaKategori);

// Rute untuk mendapatkan semua kategori untuk dropdown (tanpa pagination)
router.get('/dropdown', stafAtauAdmin, kategoriController.dapatkanSemuaKategoriDropdown);

// Rute untuk mendapatkan kategori berdasarkan ID
router.get('/:id', stafAtauAdmin, kategoriController.dapatkanKategoriById);

// Rute untuk membuat kategori baru (hanya admin)
router.post('/', hanyaAdmin, kategoriController.buatKategori);

// Rute untuk memperbarui kategori (hanya admin)
router.put('/:id', hanyaAdmin, kategoriController.perbaruiKategori);

// Rute untuk menghapus kategori (hanya admin)
router.delete('/:id', hanyaAdmin, kategoriController.hapusKategori);

module.exports = router;