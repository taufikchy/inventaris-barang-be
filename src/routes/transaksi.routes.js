const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi.controller');
const { verifikasiToken, hanyaAdmin } = require('../middleware/auth');

// Get all transactions with filters
router.get('/', verifikasiToken, transaksiController.getAllTransaksi);

// Get transaction statistics
router.get('/stats', verifikasiToken, transaksiController.getTransaksiStats);

// Get transaction by ID
router.get('/:id', verifikasiToken, transaksiController.getTransaksiById);

// Create new transaction
router.post('/', verifikasiToken, transaksiController.createTransaksi);

// Update transaction status (admin only)
router.patch('/:id/status', verifikasiToken, hanyaAdmin, transaksiController.updateTransaksiStatus);

// Delete transaction (admin only)
router.delete('/:id', verifikasiToken, hanyaAdmin, transaksiController.deleteTransaksi);

module.exports = router;