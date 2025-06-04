const { Lokasi, Barang } = require('../models');
const { Op } = require('sequelize');

// Mendapatkan semua lokasi
exports.dapatkanSemuaLokasi = async (req, res) => {
  try {
    const { cari, halaman = 1, batas = 10 } = req.query;
    const offset = (halaman - 1) * batas;
    
    // Buat kondisi pencarian jika parameter cari ada
    const kondisi = cari
      ? { nama: { [Op.like]: `%${cari}%` } }
      : {};
    
    // Hitung total lokasi
    const totalLokasi = await Lokasi.count({ where: kondisi });
    
    // Dapatkan lokasi dengan pagination
    const lokasi = await Lokasi.findAll({
      where: kondisi,
      limit: parseInt(batas),
      offset: offset,
      order: [['nama', 'ASC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: lokasi,
      pagination: {
        halaman: parseInt(halaman),
        batas: parseInt(batas),
        total: totalLokasi,
        total_halaman: Math.ceil(totalLokasi / batas)
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan lokasi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan semua lokasi tanpa pagination (untuk dropdown)
exports.dapatkanSemuaLokasiDropdown = async (req, res) => {
  try {
    const lokasi = await Lokasi.findAll({
      order: [['nama', 'ASC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: lokasi
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan lokasi dropdown:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan lokasi berdasarkan ID
exports.dapatkanLokasiById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lokasi = await Lokasi.findByPk(id);
    
    if (!lokasi) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Lokasi tidak ditemukan.'
      });
    }
    
    res.status(200).json({
      sukses: true,
      data: lokasi
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan lokasi by ID:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Membuat lokasi baru
exports.buatLokasi = async (req, res) => {
  try {
    const { nama, deskripsi } = req.body;
    
    // Validasi input
    if (!nama) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama lokasi harus diisi.'
      });
    }
    
    // Cek apakah nama lokasi sudah ada
    const lokasiExists = await Lokasi.findOne({ where: { nama } });
    if (lokasiExists) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama lokasi sudah digunakan.'
      });
    }
    
    // Buat lokasi baru
    const lokasiBaru = await Lokasi.create({
      nama,
      deskripsi
    });
    
    res.status(201).json({
      sukses: true,
      pesan: 'Lokasi berhasil ditambahkan.',
      data: lokasiBaru
    });
    
  } catch (error) {
    console.error('Kesalahan membuat lokasi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mengupdate lokasi
exports.updateLokasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi } = req.body;
    
    // Cek apakah lokasi ada
    const lokasi = await Lokasi.findByPk(id);
    if (!lokasi) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Lokasi tidak ditemukan.'
      });
    }
    
    // Cek apakah nama lokasi sudah digunakan oleh lokasi lain
    if (nama && nama !== lokasi.nama) {
      const namaExists = await Lokasi.findOne({ where: { nama, id: { [Op.ne]: id } } });
      if (namaExists) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Nama lokasi sudah digunakan.'
        });
      }
    }
    
    // Update lokasi
    await lokasi.update({
      nama: nama || lokasi.nama,
      deskripsi: deskripsi !== undefined ? deskripsi : lokasi.deskripsi
    });
    
    res.status(200).json({
      sukses: true,
      pesan: 'Lokasi berhasil diperbarui.',
      data: lokasi
    });
    
  } catch (error) {
    console.error('Kesalahan mengupdate lokasi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Menghapus lokasi
exports.hapusLokasi = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah lokasi ada
    const lokasi = await Lokasi.findByPk(id);
    if (!lokasi) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Lokasi tidak ditemukan.'
      });
    }
    
    // Cek apakah lokasi sedang digunakan oleh barang
    const barangCount = await Barang.count({ where: { id_lokasi: id } });
    if (barangCount > 0) {
      return res.status(400).json({
        sukses: false,
        pesan: `Lokasi tidak dapat dihapus karena sedang digunakan oleh ${barangCount} barang.`
      });
    }
    
    // Hapus lokasi
    await lokasi.destroy();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Lokasi berhasil dihapus.'
    });
    
  } catch (error) {
    console.error('Kesalahan menghapus lokasi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};