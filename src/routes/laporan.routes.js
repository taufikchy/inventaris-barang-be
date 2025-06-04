const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporan.controller');
const { verifikasiToken, stafAtauAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan laporan inventaris
router.get('/inventaris', stafAtauAdmin, laporanController.getLaporanInventaris);

// Rute untuk mendapatkan laporan peminjaman
router.get('/peminjaman', stafAtauAdmin, laporanController.getLaporanPeminjaman);

// Rute untuk mendapatkan laporan kondisi barang
router.get('/kondisi', stafAtauAdmin, laporanController.getLaporanKondisi);

module.exports = router;