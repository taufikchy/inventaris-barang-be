const { Kategori, Barang } = require('../models');
const { Op } = require('sequelize');

// Mendapatkan semua kategori
exports.dapatkanSemuaKategori = async (req, res) => {
  try {
    const { cari, halaman = 1, batas = 10 } = req.query;
    const offset = (halaman - 1) * batas;
    
    // Buat kondisi pencarian jika parameter cari ada
    const kondisi = cari
      ? { nama: { [Op.like]: `%${cari}%` } }
      : {};
    
    // Hitung total kategori
    const totalKategori = await Kategori.count({ where: kondisi });
    
    // Dapatkan kategori dengan pagination
    const kategori = await Kategori.findAll({
      where: kondisi,
      limit: parseInt(batas),
      offset: offset,
      order: [['nama', 'ASC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: kategori,
      pagination: {
        halaman: parseInt(halaman),
        batas: parseInt(batas),
        total: totalKategori,
        total_halaman: Math.ceil(totalKategori / batas)
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan kategori:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan semua kategori tanpa pagination (untuk dropdown)
exports.dapatkanSemuaKategoriDropdown = async (req, res) => {
  try {
    const kategori = await Kategori.findAll({
      order: [['nama', 'ASC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: kategori
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan kategori dropdown:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan kategori berdasarkan ID
exports.dapatkanKategoriById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kategori = await Kategori.findByPk(id);
    
    if (!kategori) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Kategori tidak ditemukan.'
      });
    }
    
    res.status(200).json({
      sukses: true,
      data: kategori
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan kategori:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Membuat kategori baru
exports.buatKategori = async (req, res) => {
  try {
    const { nama, deskripsi, tipe } = req.body;
    
    // Validasi input
    if (!nama) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama kategori diperlukan.'
      });
    }
    
    // Validasi tipe
    if (tipe && !['alat', 'bahan'].includes(tipe)) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Tipe kategori harus "alat" atau "bahan".'
      });
    }
    
    // Periksa apakah kategori dengan nama yang sama sudah ada
    const kategoriSudahAda = await Kategori.findOne({
      where: { nama }
    });
    
    if (kategoriSudahAda) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Kategori dengan nama tersebut sudah ada.'
      });
    }
    
    // Buat kategori baru
    const kategoriBaru = await Kategori.create({
      nama,
      deskripsi,
      tipe: tipe || 'alat'
    });
    
    res.status(201).json({
      sukses: true,
      pesan: 'Kategori berhasil dibuat.',
      data: kategoriBaru
    });
    
  } catch (error) {
    console.error('Kesalahan membuat kategori:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Memperbarui kategori
exports.perbaruiKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, tipe } = req.body;
    
    // Validasi input
    if (!nama) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama kategori diperlukan.'
      });
    }
    
    // Validasi tipe
    if (tipe && !['alat', 'bahan'].includes(tipe)) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Tipe kategori harus "alat" atau "bahan".'
      });
    }
    
    // Cari kategori yang akan diperbarui
    const kategori = await Kategori.findByPk(id);
    
    if (!kategori) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Kategori tidak ditemukan.'
      });
    }
    
    // Periksa apakah nama kategori sudah digunakan oleh kategori lain
    if (nama !== kategori.nama) {
      const kategoriSudahAda = await Kategori.findOne({
        where: {
          nama,
          id: { [Op.ne]: id }
        }
      });
      
      if (kategoriSudahAda) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Kategori dengan nama tersebut sudah ada.'
        });
      }
    }
    
    // Perbarui data kategori
    kategori.nama = nama;
    kategori.deskripsi = deskripsi;
    if (tipe) {
      kategori.tipe = tipe;
    }
    
    await kategori.save();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Kategori berhasil diperbarui.',
      data: kategori
    });
    
  } catch (error) {
    console.error('Kesalahan memperbarui kategori:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Menghapus kategori
exports.hapusKategori = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cari kategori yang akan dihapus
    const kategori = await Kategori.findByPk(id);
    
    if (!kategori) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Kategori tidak ditemukan.'
      });
    }
    
    // Periksa apakah kategori sedang digunakan oleh barang
    const barangDenganKategori = await Barang.count({
      where: { id_kategori: id }
    });
    
    if (barangDenganKategori > 0) {
      return res.status(400).json({
        sukses: false,
        pesan: `Kategori tidak dapat dihapus karena sedang digunakan oleh ${barangDenganKategori} barang.`
      });
    }
    
    // Hapus kategori
    await kategori.destroy();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Kategori berhasil dihapus.'
    });
    
  } catch (error) {
    console.error('Kesalahan menghapus kategori:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};