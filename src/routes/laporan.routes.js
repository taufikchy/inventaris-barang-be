const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporan.controller');
const { verifikasiToken, adminToolmanAtauKepalaLab } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan laporan inventaris
router.get('/inventaris', adminToolmanAtauKepalaLab, laporanController.getLaporanInventaris);

// Rute untuk mendapatkan laporan peminjaman
router.get('/peminjaman', adminToolmanAtauKepalaLab, laporanController.getLaporanPeminjaman);

// Rute untuk mendapatkan laporan kondisi barang
router.get('/kondisi', adminToolmanAtauKepalaLab, laporanController.getLaporanKondisi);

module.exports = router;