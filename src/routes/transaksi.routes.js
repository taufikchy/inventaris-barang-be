const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi.controller');
const { verifikasiToken, hanyaAdmin, adminAtauToolman, adminToolmanAtauKepalaLab } = require('../middleware/auth');
const { logActivity, saveOriginalData } = require('../middleware/activityLogger');
const { Transaksi } = require('../models');

// Get all transactions with filters
router.get('/', verifikasiToken, transaksiController.getAllTransaksi);

// Get transaction statistics
router.get('/stats', verifikasiToken, transaksiController.getTransaksiStats);

// Get transaction by ID
router.get('/:id', verifikasiToken, transaksiController.getTransaksiById);

// Create new transaction
router.post('/', verifikasiToken, logActivity('create', 'transaksi'), transaksiController.createTransaksi);

// Update transaction
router.put('/:id', verifikasiToken, saveOriginalData(Transaksi), logActivity('update', 'transaksi'), transaksiController.updateTransaksi);

// Update transaction status (admin only)
router.patch('/:id/status', verifikasiToken, hanyaAdmin, saveOriginalData(Transaksi), logActivity('update', 'transaksi'), transaksiController.updateTransaksiStatus);

// Delete transaction (admin, toolman, or kepala lab)
router.delete('/:id', verifikasiToken, adminToolmanAtauKepalaLab, saveOriginalData(Transaksi), logActivity('delete', 'transaksi'), transaksiController.deleteTransaksi);

module.exports = router;