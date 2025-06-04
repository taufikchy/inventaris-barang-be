const express = require('express');
const router = express.Router();
const peminjamanController = require('../controllers/peminjaman.controller');
const { verifikasiToken, stafAtauAdmin, hanyaAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan semua peminjaman
router.get('/', stafAtauAdmin, peminjamanController.dapatkanSemuaPeminjaman);

// Rute untuk mendapatkan peminjaman berdasarkan ID
router.get('/:id', stafAtauAdmin, peminjamanController.dapatkanPeminjamanById);

// Rute untuk membuat peminjaman baru
router.post('/', stafAtauAdmin, peminjamanController.buatPeminjaman);

// Rute untuk mengembalikan barang
router.put('/:id/kembalikan', stafAtauAdmin, peminjamanController.kembalikanBarang);

// Rute untuk mengupdate peminjaman (hanya admin)
router.put('/:id', hanyaAdmin, peminjamanController.updatePeminjaman);

// Rute untuk menghapus peminjaman (hanya admin)
router.delete('/:id', hanyaAdmin, peminjamanController.hapusPeminjaman);

module.exports = router;