const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifikasiToken, semuaPengguna } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan autentikasi
router.use(verifikasiToken);

// Rute untuk mendapatkan statistik dashboard
router.get('/stats', semuaPengguna, dashboardController.getDashboardStats);

module.exports = router;