const jwt = require('jsonwebtoken');
const { Pengguna } = require('../models');

// Middleware untuk memeriksa token JWT
exports.verifikasiToken = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Akses ditolak. Token tidak tersedia.'
      });
    }
    
    // Ekstrak token dari header
    const token = authHeader.split(' ')[1];
    
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cari pengguna berdasarkan ID dari token
    const pengguna = await Pengguna.findByPk(decoded.id);
    
    if (!pengguna) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    if (!pengguna.aktif) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Akun pengguna tidak aktif.'
      });
    }
    
    // Tambahkan informasi pengguna ke objek request
    req.pengguna = pengguna;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        sukses: false,
        pesan: 'Token tidak valid.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        sukses: false,
        pesan: 'Token telah kedaluwarsa.'
      });
    }
    
    console.error('Kesalahan verifikasi token:', error);
    return res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Middleware untuk memeriksa peran Kepala Lab (full akses)
exports.hanyaKepalaLab = (req, res, next) => {
  if (req.pengguna && req.pengguna.peran === 'kepala_lab') {
    next();
  } else {
    return res.status(403).json({
      sukses: false,
      pesan: 'Akses ditolak. Hanya Kepala Lab yang diizinkan.'
    });
  }
};

// Middleware untuk memeriksa peran Admin
exports.hanyaAdmin = (req, res, next) => {
  if (req.pengguna && req.pengguna.peran === 'admin') {
    next();
  } else {
    return res.status(403).json({
      sukses: false,
      pesan: 'Akses ditolak. Hanya Admin yang diizinkan.'
    });
  }
};

// Middleware untuk memeriksa peran Toolman
exports.hanyaToolman = (req, res, next) => {
  if (req.pengguna && req.pengguna.peran === 'toolman') {
    next();
  } else {
    return res.status(403).json({
      sukses: false,
      pesan: 'Akses ditolak. Hanya Toolman yang diizinkan.'
    });
  }
};

// Middleware untuk memeriksa peran Admin atau Toolman (keduanya memiliki akses yang sama)
exports.adminAtauToolman = (req, res, next) => {
  if (req.pengguna && (req.pengguna.peran === 'admin' || req.pengguna.peran === 'toolman')) {
    next();
  } else {
    return res.status(403).json({
      sukses: false,
      pesan: 'Akses ditolak. Hanya Admin atau Toolman yang diizinkan.'
    });
  }
};

// Middleware untuk memeriksa peran Admin, Toolman, atau Kepala Lab
exports.adminToolmanAtauKepalaLab = (req, res, next) => {
  if (req.pengguna && (req.pengguna.peran === 'admin' || req.pengguna.peran === 'toolman' || req.pengguna.peran === 'kepala_lab')) {
    next();
  } else {
    return res.status(403).json({
      sukses: false,
      pesan: 'Akses ditolak. Hanya Admin, Toolman, atau Kepala Lab yang diizinkan.'
    });
  }
};

// Middleware untuk semua pengguna yang sudah login (termasuk Sarana yang hanya bisa melihat)
exports.semuaPengguna = (req, res, next) => {
  if (req.pengguna) {
    next();
  } else {
    return res.status(403).json({
      sukses: false,
      pesan: 'Akses ditolak. Anda harus login terlebih dahulu.'
    });
  }
};