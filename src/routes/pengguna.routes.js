const express = require('express');
const router = express.Router();
const penggunaController = require('../controllers/pengguna.controller');
const { verifikasiToken, hanyaKepalaLab, semuaPengguna, adminToolmanAtauKepalaLab } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan dropdown pengguna (semua user yang login)
router.get('/dropdown', semuaPengguna, penggunaController.dapatkanSemuaPenggunaDropdown);

// Rute untuk mendapatkan semua pengguna (hanya kepala lab)
router.get('/', adminToolmanAtauKepalaLab, penggunaController.dapatkanSemuaPengguna);

// Rute untuk mendapatkan pengguna berdasarkan ID (hanya kepala lab)
router.get('/:id', adminToolmanAtauKepalaLab, penggunaController.dapatkanPenggunaById);

// Rute untuk membuat pengguna baru (hanya kepala lab)
router.post('/', adminToolmanAtauKepalaLab, logActivity('create', 'pengguna'), penggunaController.buatPengguna);

// Rute untuk memperbarui pengguna (hanya kepala lab)
router.put('/:id', adminToolmanAtauKepalaLab, logActivity('update', 'pengguna'), penggunaController.perbaruiPengguna);

// Rute untuk reset kata sandi pengguna (hanya kepala lab)
router.post('/:id/reset-kata-sandi', adminToolmanAtauKepalaLab, logActivity('update', 'pengguna'), penggunaController.resetKataSandi);

// Rute untuk menghapus pengguna (hanya kepala lab)
router.delete('/:id', adminToolmanAtauKepalaLab, logActivity('delete', 'pengguna'), penggunaController.hapusPengguna);

// Rute untuk menonaktifkan pengguna (hanya kepala lab)
router.patch('/:id/nonaktifkan', adminToolmanAtauKepalaLab, logActivity('update', 'pengguna'), penggunaController.nonaktifkanPengguna);

// Rute untuk mengaktifkan pengguna (hanya kepala lab)
router.patch('/:id/aktifkan', adminToolmanAtauKepalaLab, logActivity('update', 'pengguna'), penggunaController.aktifkanPengguna);

module.exports = router;