const { Barang, Kategori, Lokasi } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Mendapatkan semua barang
exports.dapatkanSemuaBarang = async (req, res) => {
  try {
    const { cari, kategori, lokasi, kondisi, halaman = 1, batas = 10 } = req.query;
    const offset = (halaman - 1) * batas;
    
    // Buat kondisi pencarian
    let kondisiPencarian = {};
    
    // Filter berdasarkan kata kunci pencarian
    if (cari) {
      kondisiPencarian = {
        ...kondisiPencarian,
        [Op.or]: [
          { nama: { [Op.like]: `%${cari}%` } },
          { kode: { [Op.like]: `%${cari}%` } },
          { deskripsi: { [Op.like]: `%${cari}%` } }
        ]
      };
    }
    
    // Filter berdasarkan kategori
    if (kategori) {
      kondisiPencarian.id_kategori = kategori;
    }
    
    // Filter berdasarkan lokasi
    if (lokasi) {
      kondisiPencarian.id_lokasi = lokasi;
    }
    
    // Filter berdasarkan kondisi
    if (kondisi) {
      kondisiPencarian.kondisi = kondisi;
    }
    
    // Hitung total barang
    const totalBarang = await Barang.count({ where: kondisiPencarian });
    
    // Dapatkan barang dengan pagination
    const barang = await Barang.findAll({
      where: kondisiPencarian,
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ],
      limit: parseInt(batas),
      offset: offset,
      order: [['updatedAt', 'DESC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: barang,
      pagination: {
        halaman: parseInt(halaman),
        batas: parseInt(batas),
        total: totalBarang,
        total_halaman: Math.ceil(totalBarang / batas)
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan barang:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan semua barang tanpa pagination (untuk dropdown)
exports.dapatkanSemuaBarangDropdown = async (req, res) => {
  try {
    const { tersedia } = req.query;
    
    let kondisi = {};
    
    // Jika parameter tersedia=true, hanya tampilkan barang yang tersedia
    if (tersedia === 'true') {
      kondisi.jumlah = { [Op.gt]: 0 };
    }
    
    const barang = await Barang.findAll({
      where: kondisi,
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ],
      order: [['nama', 'ASC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: barang
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan barang dropdown:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan barang berdasarkan ID
exports.dapatkanBarangById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const barang = await Barang.findByPk(id, {
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ]
    });
    
    if (!barang) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Barang tidak ditemukan.'
      });
    }
    
    res.status(200).json({
      sukses: true,
      data: barang
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan barang by ID:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Membuat barang baru
exports.buatBarang = async (req, res) => {
  try {
    const { nama, kode, deskripsi, jumlah, kondisi, tanggal_perolehan, harga_perolehan, id_kategori, id_lokasi } = req.body;
    
    // Validasi input
    if (!nama || !kode || !id_kategori || !id_lokasi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama, kode, kategori, dan lokasi harus diisi.'
      });
    }
    
    // Cek apakah kode sudah digunakan
    const kodeExists = await Barang.findOne({ where: { kode } });
    if (kodeExists) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Kode barang sudah digunakan.'
      });
    }
    
    // Cek apakah kategori dan lokasi valid
    const kategori = await Kategori.findByPk(id_kategori);
    const lokasi = await Lokasi.findByPk(id_lokasi);
    
    if (!kategori) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Kategori tidak valid.'
      });
    }
    
    if (!lokasi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Lokasi tidak valid.'
      });
    }
    
    // Simpan data gambar jika ada
    let gambarPath = null;
    if (req.file) {
      gambarPath = `/uploads/barang/${req.file.filename}`;
    }
    
    // Buat barang baru
    const barangBaru = await Barang.create({
      nama,
      kode,
      deskripsi,
      jumlah: jumlah || 1,
      kondisi: kondisi || 'baik',
      tanggal_perolehan,
      harga_perolehan,
      gambar: gambarPath,
      id_kategori,
      id_lokasi
    });
    
    // Dapatkan data barang lengkap dengan relasi
    const barangDenganRelasi = await Barang.findByPk(barangBaru.id, {
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ]
    });
    
    res.status(201).json({
      sukses: true,
      pesan: 'Barang berhasil ditambahkan.',
      data: barangDenganRelasi
    });
    
  } catch (error) {
    console.error('Kesalahan membuat barang:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mengupdate barang
exports.updateBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kode, deskripsi, jumlah, kondisi, tanggal_perolehan, harga_perolehan, id_kategori, id_lokasi } = req.body;
    
    // Cek apakah barang ada
    const barang = await Barang.findByPk(id);
    if (!barang) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Barang tidak ditemukan.'
      });
    }
    
    // Cek apakah kode sudah digunakan oleh barang lain
    if (kode && kode !== barang.kode) {
      const kodeExists = await Barang.findOne({ where: { kode, id: { [Op.ne]: id } } });
      if (kodeExists) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Kode barang sudah digunakan.'
        });
      }
    }
    
    // Cek apakah kategori dan lokasi valid
    if (id_kategori) {
      const kategori = await Kategori.findByPk(id_kategori);
      if (!kategori) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Kategori tidak valid.'
        });
      }
    }
    
    if (id_lokasi) {
      const lokasi = await Lokasi.findByPk(id_lokasi);
      if (!lokasi) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Lokasi tidak valid.'
        });
      }
    }
    
    // Simpan data gambar jika ada
    let gambarPath = barang.gambar;
    if (req.file) {
      // Hapus gambar lama jika ada
      if (barang.gambar) {
        const oldImagePath = path.join(__dirname, '..', '..', 'public', barang.gambar);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      gambarPath = `/uploads/barang/${req.file.filename}`;
    }
    
    // Update barang
    await barang.update({
      nama: nama || barang.nama,
      kode: kode || barang.kode,
      deskripsi: deskripsi !== undefined ? deskripsi : barang.deskripsi,
      jumlah: jumlah !== undefined ? jumlah : barang.jumlah,
      kondisi: kondisi || barang.kondisi,
      tanggal_perolehan: tanggal_perolehan || barang.tanggal_perolehan,
      harga_perolehan: harga_perolehan !== undefined ? harga_perolehan : barang.harga_perolehan,
      gambar: gambarPath,
      id_kategori: id_kategori || barang.id_kategori,
      id_lokasi: id_lokasi || barang.id_lokasi
    });
    
    // Dapatkan data barang yang sudah diupdate dengan relasi
    const barangUpdated = await Barang.findByPk(id, {
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ]
    });
    
    res.status(200).json({
      sukses: true,
      pesan: 'Barang berhasil diperbarui.',
      data: barangUpdated
    });
    
  } catch (error) {
    console.error('Kesalahan mengupdate barang:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Menghapus barang
exports.hapusBarang = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah barang ada
    const barang = await Barang.findByPk(id);
    if (!barang) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Barang tidak ditemukan.'
      });
    }
    
    // Hapus gambar jika ada
    if (barang.gambar) {
      const imagePath = path.join(__dirname, '..', '..', 'public', barang.gambar);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Hapus barang
    await barang.destroy();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Barang berhasil dihapus.'
    });
    
  } catch (error) {
    console.error('Kesalahan menghapus barang:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};