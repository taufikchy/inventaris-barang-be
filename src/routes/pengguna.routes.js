const express = require('express');
const router = express.Router();
const penggunaController = require('../controllers/pengguna.controller');
const { verifikasiToken, hanyaKepalaLab, semuaPengguna } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan dropdown pengguna (semua user yang login)
router.get('/dropdown', semuaPengguna, penggunaController.dapatkanSemuaPenggunaDropdown);

// Rute untuk mendapatkan semua pengguna (hanya kepala lab)
router.get('/', hanyaKepalaLab, penggunaController.dapatkanSemuaPengguna);

// Rute untuk mendapatkan pengguna berdasarkan ID (hanya kepala lab)
router.get('/:id', hanyaKepalaLab, penggunaController.dapatkanPenggunaById);

// Rute untuk membuat pengguna baru (hanya kepala lab)
router.post('/', hanyaKepalaLab, penggunaController.buatPengguna);

// Rute untuk memperbarui pengguna (hanya kepala lab)
router.put('/:id', hanyaKepalaLab, penggunaController.perbaruiPengguna);

// Rute untuk reset kata sandi pengguna (hanya kepala lab)
router.post('/:id/reset-kata-sandi', hanyaKepalaLab, penggunaController.resetKataSandi);

// Rute untuk menghapus pengguna (hanya kepala lab)
router.delete('/:id', hanyaKepalaLab, penggunaController.hapusPengguna);

module.exports = router;