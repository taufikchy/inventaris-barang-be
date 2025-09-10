const { SumberDana } = require('../models');
const { validationResult } = require('express-validator');

// Mendapatkan semua sumber dana
exports.dapatkanSemuaSumberDana = async (req, res) => {
  try {
    const sumberDana = await SumberDana.findAll({
      order: [['nama', 'ASC']]
    });

    res.json({
      success: true,
      data: sumberDana
    });
  } catch (error) {
    console.error('Kesalahan mendapatkan sumber dana:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data sumber dana'
    });
  }
};

// Mendapatkan sumber dana berdasarkan ID
exports.dapatkanSumberDanaById = async (req, res) => {
  try {
    const { id } = req.params;
    const sumberDana = await SumberDana.findByPk(id);

    if (!sumberDana) {
      return res.status(404).json({
        success: false,
        message: 'Sumber dana tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: sumberDana
    });
  } catch (error) {
    console.error('Kesalahan mendapatkan sumber dana:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data sumber dana'
    });
  }
};

// Membuat sumber dana baru (hanya kepala lab)
exports.buatSumberDana = async (req, res) => {
  try {
    // Cek role user
    if (req.pengguna.peran !== 'kepala_lab') {
      return res.status(403).json({
        success: false,
        message: 'Hanya kepala lab yang dapat menambahkan sumber dana baru'
      });
    }

    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: errors.array()
      });
    }

    const { nama } = req.body;

    // Cek apakah nama sumber dana sudah ada
    const existingSumberDana = await SumberDana.findOne({
      where: { nama }
    });

    if (existingSumberDana) {
      return res.status(400).json({
        success: false,
        message: 'Sumber dana dengan nama tersebut sudah ada'
      });
    }

    const sumberDana = await SumberDana.create({ nama });

    res.status(201).json({
      success: true,
      message: 'Sumber dana berhasil ditambahkan',
      data: sumberDana
    });
  } catch (error) {
    console.error('Kesalahan membuat sumber dana:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan sumber dana'
    });
  }
};

// Mengupdate sumber dana (hanya kepala lab)
exports.updateSumberDana = async (req, res) => {
  try {
    // Cek role user
    if (req.pengguna.peran !== 'kepala_lab') {
      return res.status(403).json({
        success: false,
        message: 'Hanya kepala lab yang dapat mengupdate sumber dana'
      });
    }

    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { nama } = req.body;

    const sumberDana = await SumberDana.findByPk(id);
    if (!sumberDana) {
      return res.status(404).json({
        success: false,
        message: 'Sumber dana tidak ditemukan'
      });
    }

    // Cek apakah nama baru sudah ada (kecuali untuk record yang sedang diupdate)
    const existingSumberDana = await SumberDana.findOne({
      where: { 
        nama,
        id: { [require('sequelize').Op.ne]: id }
      }
    });

    if (existingSumberDana) {
      return res.status(400).json({
        success: false,
        message: 'Sumber dana dengan nama tersebut sudah ada'
      });
    }

    await sumberDana.update({ nama });

    res.json({
      success: true,
      message: 'Sumber dana berhasil diupdate',
      data: sumberDana
    });
  } catch (error) {
    console.error('Kesalahan mengupdate sumber dana:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate sumber dana'
    });
  }
};

// Menghapus sumber dana (hanya kepala lab)
exports.hapusSumberDana = async (req, res) => {
  try {
    // Cek role user
    if (req.pengguna.peran !== 'kepala_lab') {
      return res.status(403).json({
        success: false,
        message: 'Hanya kepala lab yang dapat menghapus sumber dana'
      });
    }

    const { id } = req.params;

    const sumberDana = await SumberDana.findByPk(id);
    if (!sumberDana) {
      return res.status(404).json({
        success: false,
        message: 'Sumber dana tidak ditemukan'
      });
    }

    // Cek apakah sumber dana sedang digunakan oleh barang
    const { Barang } = require('../models');
    const barangCount = await Barang.count({
      where: { id_sumber_dana: id }
    });

    if (barangCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus sumber dana karena sedang digunakan oleh ${barangCount} barang`
      });
    }

    await sumberDana.destroy();

    res.json({
      success: true,
      message: 'Sumber dana berhasil dihapus'
    });
  } catch (error) {
    console.error('Kesalahan menghapus sumber dana:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus sumber dana'
    });
  }
};