const { Barang, Kategori, Lokasi, Peminjaman, DetailPeminjaman } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Status barang sekarang dikelola otomatis melalui model dan controller peminjaman
// Tidak perlu fungsi update status manual yang menyebabkan performa lambat

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
    
    // Dapatkan semua barang dengan status yang sudah benar
    // Tidak perlu update status satu per satu karena status sudah dikelola otomatis
    const semuaBarang = await Barang.findAll({
      where: kondisiPencarian,
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ],
      order: [['kode', 'ASC']]
    });
    
    // Kelompokkan barang berdasarkan prefix kode (3 huruf pertama)
    const barangGrouped = {};
    
    semuaBarang.forEach(item => {
      const itemData = item.toJSON();
      // Konversi kondisi dan status ke format frontend
      const kondisiFrontendMapping = {
        'baik': 'Baik',
        'rusak_ringan': 'Rusak Ringan',
        'rusak_berat': 'Rusak Berat'
      };
      
      const statusFrontendMapping = {
        'tersedia': 'Tersedia',
        'dipinjam': 'Dipinjam',
        'perbaikan': 'Perbaikan',
        'dihapuskan': 'Dihapuskan'
      };
      
      itemData.kondisi = kondisiFrontendMapping[itemData.kondisi] || itemData.kondisi;
      itemData.status = statusFrontendMapping[itemData.status] || itemData.status;
      
      // Ambil prefix kode (3 huruf pertama sebelum tanda -)
      const prefix = itemData.kode.split('-')[0];
      
      // Inisialisasi grup jika belum ada
      if (!barangGrouped[prefix]) {
        barangGrouped[prefix] = {
          kode_grup: prefix,
          nama: itemData.nama,
          deskripsi: itemData.deskripsi,
          jumlah: 0,
          kondisi: itemData.kondisi,
          tanggal_perolehan: itemData.tanggal_perolehan,
          harga_perolehan: itemData.harga_perolehan,
          gambar: itemData.gambar,
          id_kategori: itemData.id_kategori,
          kategori: itemData.kategori,
          id_lokasi: itemData.id_lokasi,
          lokasi: itemData.lokasi,
          status: itemData.status,
          units: []
        };
      }
      
      // Tambahkan unit ke grup
      barangGrouped[prefix].units.push(itemData);
      
      // Update jumlah total di grup
      barangGrouped[prefix].jumlah += itemData.jumlah;
    });
    
    // Konversi objek grup ke array
    const barangGroupedArray = Object.values(barangGrouped);
    
    // Hitung total grup
    const totalGrup = barangGroupedArray.length;
    
    // Terapkan pagination pada array grup
    const barangPaginated = barangGroupedArray.slice(offset, offset + parseInt(batas));
    
    // Tambahkan jumlah_tersedia yang sama dengan jumlah
    barangPaginated.forEach(item => {
      item.jumlah_tersedia = item.jumlah;
    });
    
    res.status(200).json({
      sukses: true,
      data: barangPaginated,
      pagination: {
        halaman: parseInt(halaman),
        batas: parseInt(batas),
        total: totalGrup,
        total_halaman: Math.ceil(totalGrup / batas)
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
    const { tersedia, kategori, lokasi, kondisi } = req.query;
    
    let kondisiPencarian = {};
    
    // Jika parameter tersedia=true, hanya tampilkan barang yang tersedia
    if (tersedia === 'true') {
      kondisiPencarian.jumlah = { [Op.gt]: 0 };
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
    
    const barang = await Barang.findAll({
      where: kondisiPencarian,
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ],
      order: [['nama', 'ASC']]
    });
    
    // Konversi kondisi dan status ke format frontend
    const kondisiFrontendMapping = {
      'baik': 'Baik',
      'rusak_ringan': 'Rusak Ringan',
      'rusak_berat': 'Rusak Berat'
    };
    
    const statusFrontendMapping = {
      'tersedia': 'Tersedia',
      'dipinjam': 'Dipinjam',
      'perbaikan': 'Perbaikan',
      'dihapuskan': 'Dihapuskan'
    };
    
    const barangData = barang.map(item => {
      const itemData = item.toJSON();
      itemData.kondisi = kondisiFrontendMapping[itemData.kondisi] || itemData.kondisi;
      itemData.status = statusFrontendMapping[itemData.status] || itemData.status;
      // Tambahkan jumlah_tersedia yang sama dengan jumlah
      itemData.jumlah_tersedia = itemData.jumlah;
      return itemData;
    });
    
    res.status(200).json({
      sukses: true,
      data: barangData
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
    
    // Konversi kondisi dan status ke format frontend
    const kondisiFrontendMapping = {
      'baik': 'Baik',
      'rusak_ringan': 'Rusak Ringan',
      'rusak_berat': 'Rusak Berat'
    };
    
    const statusFrontendMapping = {
      'tersedia': 'Tersedia',
      'dipinjam': 'Dipinjam',
      'perbaikan': 'Perbaikan',
      'dihapuskan': 'Dihapuskan'
    };
    
    const barangData = barang.toJSON();
    barangData.kondisi = kondisiFrontendMapping[barangData.kondisi] || barangData.kondisi;
    barangData.status = statusFrontendMapping[barangData.status] || barangData.status;
    
    // Tambahkan jumlah_tersedia yang sama dengan jumlah
    barangData.jumlah_tersedia = barangData.jumlah;
    
    // Dapatkan prefix kode (3 huruf pertama sebelum tanda -)
    const prefix = barangData.kode.split('-')[0];
    
    // Cari semua barang dengan prefix yang sama
    const relatedUnits = await Barang.findAll({
      where: {
        kode: {
          [Op.like]: `${prefix}-%`
        },
        id: {
          [Op.ne]: id // Exclude current barang
        }
      },
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ]
    });
    
    // Konversi kondisi dan status untuk unit terkait
    const relatedUnitsData = relatedUnits.map(unit => {
      const unitData = unit.toJSON();
      unitData.kondisi = kondisiFrontendMapping[unitData.kondisi] || unitData.kondisi;
      unitData.status = statusFrontendMapping[unitData.status] || unitData.status;
      unitData.jumlah_tersedia = unitData.jumlah;
      return unitData;
    });
    
    // Tambahkan informasi grup dan unit terkait
    barangData.kode_grup = prefix;
    barangData.related_units = relatedUnitsData;
    barangData.total_units = relatedUnitsData.length + 1; // Include current barang
    
    res.status(200).json({
      sukses: true,
      data: barangData
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
    const { nama, deskripsi, jumlah, kondisi, tanggal_perolehan, harga_perolehan, id_kategori, id_lokasi } = req.body;
    
    // Validasi input
    if (!nama || !id_kategori || !id_lokasi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama, kategori, dan lokasi harus diisi.'
      });
    }
    
    // Generate kode barang otomatis: 3 huruf kapital dari nama barang + 6 digit angka berurutan
    // Ambil 3 huruf pertama dari nama barang dan ubah ke huruf kapital
    const prefix = nama.substring(0, 3).toUpperCase();
    
    // Cari kode barang dengan prefix yang sama dan ambil nomor urut tertinggi
    const existingCodes = await Barang.findAll({
      where: {
        kode: {
          [Op.like]: `${prefix}-%`
        }
      },
      order: [['kode', 'DESC']]
    });
    
    let nextNumber = 1;
    
    if (existingCodes.length > 0) {
      // Ambil kode terakhir dan ekstrak nomor urutnya
      const lastCode = existingCodes[0].kode;
      const lastNumber = parseInt(lastCode.split('-')[1]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Format nomor urut dengan leading zeros (6 digit)
    const formattedNumber = String(nextNumber).padStart(6, '0');
    
    // Buat kode barang final
    const kode = `${prefix}-${formattedNumber}`;
    
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
    
    // Konversi kondisi ke format database
    const kondisiMapping = {
      'Baik': 'baik',
      'Rusak Ringan': 'rusak_ringan',
      'Rusak Berat': 'rusak_berat'
    };
    
    const kondisiDatabase = kondisi ? kondisiMapping[kondisi] || kondisi.toLowerCase().replace(' ', '_') : 'baik';
    
    // Buat array untuk menyimpan semua barang yang dibuat
    const barangBaruArray = [];
    const jumlahBarang = parseInt(jumlah) || 1;
    
    // Buat barang dengan kode unik untuk setiap unit
    for (let i = 0; i < jumlahBarang; i++) {
      // Format nomor urut dengan leading zeros (6 digit)
      const currentNumber = nextNumber + i;
      const formattedNumber = String(currentNumber).padStart(6, '0');
      
      // Buat kode barang final untuk unit ini
      const kodeUnit = `${prefix}-${formattedNumber}`;
      
      // Buat barang baru dengan kode unik
      const barangBaru = await Barang.create({
        nama,
        kode: kodeUnit,
        deskripsi,
        jumlah: 1, // Setiap record mewakili 1 unit barang
        kondisi: kondisiDatabase,
        tanggal_perolehan,
        harga_perolehan,
        gambar: gambarPath,
        id_kategori,
        id_lokasi
      });
      
      barangBaruArray.push(barangBaru);
    }
    
    // Dapatkan data barang lengkap dengan relasi untuk barang pertama yang dibuat
    const barangDenganRelasi = await Barang.findByPk(barangBaruArray[0].id, {
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
        { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
      ]
    });
    
    // Konversi kondisi ke format frontend
    const kondisiFrontendMapping = {
      'baik': 'Baik',
      'rusak_ringan': 'Rusak Ringan',
      'rusak_berat': 'Rusak Berat'
    };
    
    const barangData = barangDenganRelasi.toJSON();
    barangData.kondisi = kondisiFrontendMapping[barangData.kondisi] || barangData.kondisi;
    // Tambahkan jumlah_tersedia yang sama dengan jumlah
    barangData.jumlah_tersedia = barangData.jumlah;
    
    // Buat daftar kode barang yang dibuat
    const kodeBarangList = barangBaruArray.map(item => item.kode);
    
    res.status(201).json({
      sukses: true,
      pesan: `${jumlahBarang} unit barang berhasil ditambahkan dengan kode ${kodeBarangList[0]}${jumlahBarang > 1 ? ` hingga ${kodeBarangList[kodeBarangList.length-1]}` : ''}.`,
      data: barangData,
      jumlah_dibuat: jumlahBarang,
      kode_barang: kodeBarangList
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
    const { nama, kode, deskripsi, jumlah, kondisi, status, tanggal_perolehan, harga_perolehan, id_kategori, id_lokasi } = req.body;
    
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
    
    // Konversi kondisi ke format database
    const kondisiMapping = {
      'Baik': 'baik',
      'Rusak Ringan': 'rusak_ringan',
      'Rusak Berat': 'rusak_berat'
    };
    
    // Konversi status ke format database
    const statusMapping = {
      'Tersedia': 'tersedia',
      'Dipinjam': 'dipinjam',
      'Perbaikan': 'perbaikan',
      'Rusak': 'perbaikan',
      'Dihapuskan': 'dihapuskan'
    };
    
    const kondisiDatabase = kondisi ? kondisiMapping[kondisi] || kondisi.toLowerCase().replace(' ', '_') : barang.kondisi;
    const statusDatabase = status ? statusMapping[status] || status.toLowerCase().replace(' ', '_') : barang.status;
    
    // Update barang
    await barang.update({
      nama: nama || barang.nama,
      kode: kode || barang.kode,
      deskripsi: deskripsi !== undefined ? deskripsi : barang.deskripsi,
      jumlah: jumlah !== undefined ? jumlah : barang.jumlah,
      kondisi: kondisiDatabase,
      status: statusDatabase,
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
    
    // Konversi kondisi dan status ke format frontend
    const kondisiFrontendMapping = {
      'baik': 'Baik',
      'rusak_ringan': 'Rusak Ringan',
      'rusak_berat': 'Rusak Berat'
    };
    
    const statusFrontendMapping = {
      'tersedia': 'Tersedia',
      'dipinjam': 'Dipinjam',
      'perbaikan': 'Perbaikan',
      'dihapuskan': 'Dihapuskan'
    };
    
    const barangData = barangUpdated.toJSON();
    barangData.kondisi = kondisiFrontendMapping[barangData.kondisi] || barangData.kondisi;
    barangData.status = statusFrontendMapping[barangData.status] || barangData.status;
    // Tambahkan jumlah_tersedia yang sama dengan jumlah
    barangData.jumlah_tersedia = barangData.jumlah;
    
    res.status(200).json({
      sukses: true,
      pesan: 'Barang berhasil diperbarui.',
      data: barangData
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