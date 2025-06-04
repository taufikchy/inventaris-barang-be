const { Peminjaman, Barang, Pengguna } = require('../models');
const { Op } = require('sequelize');

// Mendapatkan semua peminjaman
exports.dapatkanSemuaPeminjaman = async (req, res) => {
  try {
    const { cari, status, tanggal_mulai, tanggal_akhir, halaman = 1, batas = 10 } = req.query;
    const offset = (halaman - 1) * batas;
    
    // Buat kondisi pencarian
    let kondisi = {};
    
    // Filter berdasarkan kata kunci pencarian
    if (cari) {
      kondisi = {
        ...kondisi,
        [Op.or]: [
          { nama_peminjam: { [Op.like]: `%${cari}%` } },
          { kontak_peminjam: { [Op.like]: `%${cari}%` } },
          { kelas_peminjam: { [Op.like]: `%${cari}%` } },
          { catatan: { [Op.like]: `%${cari}%` } }
        ]
      };
    }
    
    // Filter berdasarkan status
    if (status) {
      kondisi.status = status;
    }
    
    // Filter berdasarkan rentang tanggal
    if (tanggal_mulai && tanggal_akhir) {
      kondisi.tanggal_pinjam = {
        [Op.between]: [new Date(tanggal_mulai), new Date(tanggal_akhir)]
      };
    } else if (tanggal_mulai) {
      kondisi.tanggal_pinjam = {
        [Op.gte]: new Date(tanggal_mulai)
      };
    } else if (tanggal_akhir) {
      kondisi.tanggal_pinjam = {
        [Op.lte]: new Date(tanggal_akhir)
      };
    }
    
    // Hitung total peminjaman
    const totalPeminjaman = await Peminjaman.count({ where: kondisi });
    
    // Dapatkan peminjaman dengan pagination
    const peminjaman = await Peminjaman.findAll({
      where: kondisi,
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'email', 'role'] }
      ],
      limit: parseInt(batas),
      offset: offset,
      order: [['updatedAt', 'DESC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: peminjaman,
      pagination: {
        halaman: parseInt(halaman),
        batas: parseInt(batas),
        total: totalPeminjaman,
        total_halaman: Math.ceil(totalPeminjaman / batas)
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan peminjaman berdasarkan ID
exports.dapatkanPeminjamanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const peminjaman = await Peminjaman.findByPk(id, {
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'email', 'role'] }
      ]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    res.status(200).json({
      sukses: true,
      data: peminjaman
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan peminjaman by ID:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Membuat peminjaman baru
exports.buatPeminjaman = async (req, res) => {
  try {
    const { 
      nama_peminjam, 
      kontak_peminjam, 
      kelas_peminjam, 
      tanggal_pinjam, 
      tanggal_kembali_harapan, 
      catatan, 
      id_barang 
    } = req.body;
    
    // Validasi input
    if (!nama_peminjam || !kontak_peminjam || !id_barang || !tanggal_pinjam || !tanggal_kembali_harapan) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama peminjam, kontak, barang, tanggal pinjam, dan tanggal kembali harapan harus diisi.'
      });
    }
    
    // Cek apakah barang tersedia
    const barang = await Barang.findByPk(id_barang);
    if (!barang) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Barang tidak ditemukan.'
      });
    }
    
    if (barang.jumlah <= 0) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Barang tidak tersedia untuk dipinjam.'
      });
    }
    
    // Kurangi jumlah barang yang tersedia
    await barang.update({ jumlah: barang.jumlah - 1 });
    
    // Buat peminjaman baru
    const peminjamanBaru = await Peminjaman.create({
      nama_peminjam,
      kontak_peminjam,
      kelas_peminjam,
      tanggal_pinjam: new Date(tanggal_pinjam),
      tanggal_kembali_harapan: new Date(tanggal_kembali_harapan),
      status: 'dipinjam',
      catatan,
      id_barang,
      id_pengguna: req.userId // ID pengguna yang login
    });
    
    // Dapatkan data peminjaman lengkap dengan relasi
    const peminjamanDenganRelasi = await Peminjaman.findByPk(peminjamanBaru.id, {
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'email', 'role'] }
      ]
    });
    
    res.status(201).json({
      sukses: true,
      pesan: 'Peminjaman berhasil dibuat.',
      data: peminjamanDenganRelasi
    });
    
  } catch (error) {
    console.error('Kesalahan membuat peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mengupdate status peminjaman (mengembalikan barang)
exports.kembalikanBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const { kondisi_barang, catatan } = req.body;
    
    // Cek apakah peminjaman ada
    const peminjaman = await Peminjaman.findByPk(id, {
      include: [{ model: Barang, as: 'barang' }]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Cek apakah peminjaman sudah dikembalikan
    if (peminjaman.status === 'dikembalikan') {
      return res.status(400).json({
        sukses: false,
        pesan: 'Barang sudah dikembalikan sebelumnya.'
      });
    }
    
    // Update status peminjaman
    await peminjaman.update({
      status: 'dikembalikan',
      tanggal_kembali_aktual: new Date(),
      catatan: catatan ? `${peminjaman.catatan || ''} | Catatan pengembalian: ${catatan}` : peminjaman.catatan
    });
    
    // Update jumlah dan kondisi barang jika perlu
    const barang = peminjaman.barang;
    
    // Tambah jumlah barang yang tersedia
    await barang.update({ 
      jumlah: barang.jumlah + 1,
      kondisi: kondisi_barang || barang.kondisi
    });
    
    // Dapatkan data peminjaman yang sudah diupdate dengan relasi
    const peminjamanUpdated = await Peminjaman.findByPk(id, {
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'email', 'role'] }
      ]
    });
    
    res.status(200).json({
      sukses: true,
      pesan: 'Barang berhasil dikembalikan.',
      data: peminjamanUpdated
    });
    
  } catch (error) {
    console.error('Kesalahan mengembalikan barang:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mengupdate peminjaman
exports.updatePeminjaman = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nama_peminjam, 
      kontak_peminjam, 
      kelas_peminjam, 
      tanggal_pinjam, 
      tanggal_kembali_harapan, 
      tanggal_kembali_aktual, 
      status, 
      catatan, 
      id_barang 
    } = req.body;
    
    // Cek apakah peminjaman ada
    const peminjaman = await Peminjaman.findByPk(id, {
      include: [{ model: Barang, as: 'barang' }]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Jika mengubah barang yang dipinjam
    if (id_barang && id_barang !== peminjaman.id_barang) {
      // Cek apakah barang baru tersedia
      const barangBaru = await Barang.findByPk(id_barang);
      if (!barangBaru) {
        return res.status(404).json({
          sukses: false,
          pesan: 'Barang tidak ditemukan.'
        });
      }
      
      if (barangBaru.jumlah <= 0) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Barang tidak tersedia untuk dipinjam.'
        });
      }
      
      // Kembalikan jumlah barang lama
      const barangLama = peminjaman.barang;
      await barangLama.update({ jumlah: barangLama.jumlah + 1 });
      
      // Kurangi jumlah barang baru
      await barangBaru.update({ jumlah: barangBaru.jumlah - 1 });
    }
    
    // Jika mengubah status dari dipinjam ke dikembalikan
    if (status === 'dikembalikan' && peminjaman.status === 'dipinjam') {
      // Tambah jumlah barang yang tersedia
      const barang = await Barang.findByPk(peminjaman.id_barang);
      await barang.update({ jumlah: barang.jumlah + 1 });
    }
    // Jika mengubah status dari dikembalikan ke dipinjam
    else if (status === 'dipinjam' && peminjaman.status === 'dikembalikan') {
      // Kurangi jumlah barang yang tersedia
      const barang = await Barang.findByPk(peminjaman.id_barang);
      if (barang.jumlah <= 0) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Barang tidak tersedia untuk dipinjam.'
        });
      }
      await barang.update({ jumlah: barang.jumlah - 1 });
    }
    
    // Update peminjaman
    await peminjaman.update({
      nama_peminjam: nama_peminjam || peminjaman.nama_peminjam,
      kontak_peminjam: kontak_peminjam || peminjaman.kontak_peminjam,
      kelas_peminjam: kelas_peminjam !== undefined ? kelas_peminjam : peminjaman.kelas_peminjam,
      tanggal_pinjam: tanggal_pinjam ? new Date(tanggal_pinjam) : peminjaman.tanggal_pinjam,
      tanggal_kembali_harapan: tanggal_kembali_harapan ? new Date(tanggal_kembali_harapan) : peminjaman.tanggal_kembali_harapan,
      tanggal_kembali_aktual: tanggal_kembali_aktual ? new Date(tanggal_kembali_aktual) : peminjaman.tanggal_kembali_aktual,
      status: status || peminjaman.status,
      catatan: catatan !== undefined ? catatan : peminjaman.catatan,
      id_barang: id_barang || peminjaman.id_barang
    });
    
    // Dapatkan data peminjaman yang sudah diupdate dengan relasi
    const peminjamanUpdated = await Peminjaman.findByPk(id, {
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'email', 'role'] }
      ]
    });
    
    res.status(200).json({
      sukses: true,
      pesan: 'Peminjaman berhasil diperbarui.',
      data: peminjamanUpdated
    });
    
  } catch (error) {
    console.error('Kesalahan mengupdate peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Menghapus peminjaman
exports.hapusPeminjaman = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah peminjaman ada
    const peminjaman = await Peminjaman.findByPk(id, {
      include: [{ model: Barang, as: 'barang' }]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Jika status masih dipinjam, kembalikan jumlah barang
    if (peminjaman.status === 'dipinjam') {
      const barang = peminjaman.barang;
      await barang.update({ jumlah: barang.jumlah + 1 });
    }
    
    // Hapus peminjaman
    await peminjaman.destroy();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Peminjaman berhasil dihapus.'
    });
    
  } catch (error) {
    console.error('Kesalahan menghapus peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};