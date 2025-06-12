const express = require('express');
const router = express.Router();
const historiAktivitasController = require('../controllers/historiAktivitas.controller');
const { verifikasiToken } = require('../middleware/auth');

// Semua routes memerlukan autentikasi
router.use(verifikasiToken);

// GET /api/histori-aktivitas - Get all activity history with filters
router.get('/', historiAktivitasController.getAllHistoriAktivitas);

// GET /api/histori-aktivitas/statistik - Get activity statistics
router.get('/statistik', historiAktivitasController.getStatistikAktivitas);

// GET /api/histori-aktivitas/:id - Get activity history by ID
router.get('/:id', historiAktivitasController.getHistoriAktivitasById);

// POST /api/histori-aktivitas - Manual activity logging (for special cases)
router.post('/', historiAktivitasController.createHistoriAktivitas);

module.exports = router;