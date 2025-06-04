const jwt = require('jsonwebtoken');
const { Pengguna } = require('../models');

// Controller untuk login pengguna
exports.login = async (req, res) => {
  try {
    const { nama_pengguna, kata_sandi } = req.body;
    
    // Validasi input
    if (!nama_pengguna || !kata_sandi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama pengguna dan kata sandi diperlukan.'
      });
    }
    
    // Cari pengguna berdasarkan nama pengguna
    const pengguna = await Pengguna.findOne({ where: { nama_pengguna } });
    
    if (!pengguna) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Nama pengguna atau kata sandi salah.'
      });
    }
    
    // Periksa status aktif pengguna
    if (!pengguna.aktif) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Akun pengguna tidak aktif. Silakan hubungi administrator.'
      });
    }
    
    // Verifikasi kata sandi
    const kataSandiValid = await pengguna.periksaKataSandi(kata_sandi);
    
    if (!kataSandiValid) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Nama pengguna atau kata sandi salah.'
      });
    }
    
    // Buat token JWT
    const token = jwt.sign(
      { id: pengguna.id, peran: pengguna.peran },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Kirim respons dengan token dan data pengguna
    res.status(200).json({
      sukses: true,
      pesan: 'Login berhasil',
      data: {
        token,
        pengguna: {
          id: pengguna.id,
          nama: pengguna.nama,
          nama_pengguna: pengguna.nama_pengguna,
          peran: pengguna.peran
        }
      }
    });
    
  } catch (error) {
    console.error('Kesalahan login:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Controller untuk mendapatkan profil pengguna yang sedang login
exports.getProfil = async (req, res) => {
  try {
    const pengguna = req.pengguna;
    
    res.status(200).json({
      sukses: true,
      data: {
        id: pengguna.id,
        nama: pengguna.nama,
        nama_pengguna: pengguna.nama_pengguna,
        peran: pengguna.peran,
        created_at: pengguna.createdAt,
        updated_at: pengguna.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan profil:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Controller untuk mengubah kata sandi
exports.ubahKataSandi = async (req, res) => {
  try {
    const { kata_sandi_lama, kata_sandi_baru, konfirmasi_kata_sandi } = req.body;
    const pengguna = req.pengguna;
    
    // Validasi input
    if (!kata_sandi_lama || !kata_sandi_baru || !konfirmasi_kata_sandi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Semua field diperlukan.'
      });
    }
    
    // Periksa apakah kata sandi baru dan konfirmasi sama
    if (kata_sandi_baru !== konfirmasi_kata_sandi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Kata sandi baru dan konfirmasi kata sandi tidak cocok.'
      });
    }
    
    // Verifikasi kata sandi lama
    const kataSandiValid = await pengguna.periksaKataSandi(kata_sandi_lama);
    
    if (!kataSandiValid) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Kata sandi lama salah.'
      });
    }
    
    // Update kata sandi
    pengguna.kata_sandi = kata_sandi_baru;
    await pengguna.save();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Kata sandi berhasil diubah.'
    });
    
  } catch (error) {
    console.error('Kesalahan mengubah kata sandi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Controller untuk verifikasi token
exports.verifyToken = async (req, res) => {
  try {
    // Jika middleware verifikasiToken berhasil, berarti token valid
    // dan req.pengguna sudah berisi informasi pengguna
    res.status(200).json({
      sukses: true,
      pesan: 'Token valid',
      data: {
        id: req.pengguna.id,
        nama: req.pengguna.nama,
        nama_pengguna: req.pengguna.nama_pengguna,
        peran: req.pengguna.peran
      }
    });
  } catch (error) {
    console.error('Kesalahan verifikasi token:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};