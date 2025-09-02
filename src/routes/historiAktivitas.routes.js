const express = require('express');
const router = express.Router();
const {
  getAllHistoriAktivitas,
  getHistoriAktivitasById,
  getStatistikAktivitas,
  createHistoriAktivitas,
  eksporHistoriAktivitas,
  archiveOldActivities,
  getArchiveStats,
  cleanupOldArchive,
  getArchivedHistoriAktivitas,
  exportArchivedHistoriAktivitas
} = require('../controllers/historiAktivitas.controller');
const { verifikasiToken } = require('../middleware/auth');

// Semua routes memerlukan autentikasi
router.use(verifikasiToken);

// GET /api/histori-aktivitas - Get all activity history with filters
router.get('/', getAllHistoriAktivitas);

// GET /api/histori-aktivitas/statistik - Get activity statistics
router.get('/statistik', getStatistikAktivitas);

// GET /api/histori-aktivitas/ekspor - Export activity history to Excel/CSV
router.get('/ekspor', eksporHistoriAktivitas);

// GET /api/histori-aktivitas/archive/stats - Get archive statistics
router.get('/archive/stats', getArchiveStats);

// GET /api/histori-aktivitas/archive/data - Get archived activity history
router.get('/archive/data', getArchivedHistoriAktivitas);

// GET /api/histori-aktivitas/archive/export - Export archived activity history
router.get('/archive/export', exportArchivedHistoriAktivitas);

// GET /api/histori-aktivitas/:id - Get activity history by ID
router.get('/:id', getHistoriAktivitasById);

// POST /api/histori-aktivitas - Manual activity logging (for special cases)
router.post('/', createHistoriAktivitas);

// POST /api/histori-aktivitas/archive - Archive old activities
router.post('/archive', archiveOldActivities);

// DELETE /api/histori-aktivitas/archive/cleanup - Cleanup old archive
router.delete('/archive/cleanup', cleanupOldArchive);

module.exports = router;