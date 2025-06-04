const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifikasiToken } = require('../middleware/auth');

// Rute untuk login
router.post('/login', authController.login);

// Rute untuk verifikasi token
router.get('/verify', verifikasiToken, authController.verifyToken);

// Rute untuk mendapatkan profil pengguna (memerlukan autentikasi)
router.get('/profil', verifikasiToken, authController.getProfil);

// Rute untuk mengubah kata sandi (memerlukan autentikasi)
router.post('/ubah-kata-sandi', verifikasiToken, authController.ubahKataSandi);

module.exports = router;