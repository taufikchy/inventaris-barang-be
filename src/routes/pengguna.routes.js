const express = require('express');
const router = express.Router();
const penggunaController = require('../controllers/pengguna.controller');
const { verifikasiToken, hanyaAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua pengguna (hanya admin)
router.get('/', hanyaAdmin, penggunaController.dapatkanSemuaPengguna);

// Rute untuk mendapatkan pengguna berdasarkan ID (hanya admin)
router.get('/:id', hanyaAdmin, penggunaController.dapatkanPenggunaById);

// Rute untuk membuat pengguna baru (hanya admin)
router.post('/', hanyaAdmin, penggunaController.buatPengguna);

// Rute untuk memperbarui pengguna (hanya admin)
router.put('/:id', hanyaAdmin, penggunaController.perbaruiPengguna);

// Rute untuk reset kata sandi pengguna (hanya admin)
router.post('/:id/reset-kata-sandi', hanyaAdmin, penggunaController.resetKataSandi);

// Rute untuk menghapus pengguna (hanya admin)
router.delete('/:id', hanyaAdmin, penggunaController.hapusPengguna);

module.exports = router;