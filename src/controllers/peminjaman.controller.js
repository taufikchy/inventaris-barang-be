const { Peminjaman, Barang, Pengguna, DetailPeminjaman, Lokasi } = require('../models');
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
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] },
        { model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang', include: [{ model: Lokasi, as: 'lokasi' }] }] }
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
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] },
        { model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang', include: [{ model: Lokasi, as: 'lokasi' }] }] }
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
      detail_peminjaman 
    } = req.body;
    
    // Validasi input
    if (!nama_peminjam || !kontak_peminjam || !detail_peminjaman || !tanggal_pinjam || !tanggal_kembali_harapan) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama peminjam, kontak, detail barang, tanggal pinjam, dan tanggal kembali harapan harus diisi.'
      });
    }
    
    // Validasi detail peminjaman
    if (!Array.isArray(detail_peminjaman) || detail_peminjaman.length === 0) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Detail peminjaman harus berisi minimal satu barang.'
      });
    }
    
    // Cek ketersediaan semua barang
    for (const detail of detail_peminjaman) {
      const barang = await Barang.findByPk(detail.id_barang);
      if (!barang) {
        return res.status(404).json({
          sukses: false,
          pesan: `Barang dengan ID ${detail.id_barang} tidak ditemukan.`
        });
      }
      
      if (barang.jumlah < detail.jumlah) {
        return res.status(400).json({
          sukses: false,
          pesan: `Barang ${barang.nama} tidak tersedia dalam jumlah yang diminta.`
        });
      }
    }
    
    // Buat peminjaman baru dengan status menunggu persetujuan
    const peminjamanBaru = await Peminjaman.create({
      nama_peminjam,
      kontak_peminjam,
      kelas_peminjam,
      tanggal_pinjam: new Date(tanggal_pinjam),
      tanggal_kembali_harapan: new Date(tanggal_kembali_harapan),
      status: 'menunggu_persetujuan', // Status awal adalah menunggu persetujuan
      catatan,
      id_pengguna: req.pengguna.id // Menggunakan req.pengguna.id sebagai gantinya req.userId
    });
    
    // Buat detail peminjaman untuk setiap barang
    for (const detail of detail_peminjaman) {
      await DetailPeminjaman.create({
        id_peminjaman: peminjamanBaru.id,
        id_barang: detail.id_barang,
        jumlah: detail.jumlah,
        kondisi_saat_pinjam: detail.kondisi_saat_pinjam || 'baik'
      });
    }
    
    // Dapatkan data peminjaman lengkap dengan relasi
    const peminjamanDenganRelasi = await Peminjaman.findByPk(peminjamanBaru.id, {
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] }
      ]
    });
    
    res.status(201).json({
      sukses: true,
      pesan: 'Peminjaman berhasil dibuat dan menunggu persetujuan Kepala Lab.',
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

// Upload surat peminjaman
exports.uploadSuratPeminjaman = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah peminjaman ada
    const peminjaman = await Peminjaman.findByPk(id);
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Cek apakah file surat peminjaman diupload
    if (!req.file) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Surat peminjaman harus diupload.'
      });
    }
    
    // Update path surat peminjaman
    const suratPath = `/uploads/surat_peminjaman/${req.file.filename}`;
    await peminjaman.update({ surat_peminjaman: suratPath });
    
    // Dapatkan data peminjaman yang sudah diupdate dengan relasi
    const peminjamanUpdated = await Peminjaman.findByPk(id, {
      include: [
        { model: Barang, as: 'barang' },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] }
      ]
    });
    
    res.status(200).json({
      sukses: true,
      pesan: 'Surat peminjaman berhasil diupload.',
      data: peminjamanUpdated
    });
    
  } catch (error) {
    console.error('Kesalahan upload surat peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Persetujuan peminjaman oleh Kepala Lab
exports.persetujuanPeminjaman = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan_persetujuan } = req.body;
    
    // Validasi input
    if (!status || !['disetujui', 'ditolak'].includes(status)) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Status persetujuan harus diisi dengan nilai "disetujui" atau "ditolak".'
      });
    }
    
    // Cek apakah peminjaman ada
    const peminjaman = await Peminjaman.findByPk(id, {
      include: [{ model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang' }] }]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Cek apakah status peminjaman adalah menunggu persetujuan
    if (peminjaman.status !== 'menunggu_persetujuan') {
      return res.status(400).json({
        sukses: false,
        pesan: `Peminjaman tidak dapat ${status === 'disetujui' ? 'disetujui' : 'ditolak'} karena status saat ini adalah ${peminjaman.status}.`
      });
    }
    
    // Update data peminjaman
    const updateData = {
      status: status,
      id_kepala_lab: req.pengguna.id, // ID Kepala Lab yang memberikan persetujuan
      tanggal_persetujuan: new Date(),
      catatan_persetujuan: catatan_persetujuan || null
    };
    
    // Jika disetujui, ubah status menjadi dipinjam dan kurangi jumlah barang
    if (status === 'disetujui') {
      // Cek ketersediaan semua barang dalam detail peminjaman
      for (const detail of peminjaman.detail_peminjaman) {
        const barang = detail.barang;
        if (barang.jumlah < detail.jumlah) {
          return res.status(400).json({
            sukses: false,
            pesan: `Barang ${barang.nama_barang} tidak tersedia dalam jumlah yang diminta.`
          });
        }
      }
      
      // Kurangi stok semua barang
      for (const detail of peminjaman.detail_peminjaman) {
        const barang = detail.barang;
        await barang.update({ jumlah: barang.jumlah - detail.jumlah });
      }
      
      // Update status menjadi dipinjam
      updateData.status = 'dipinjam';
    }
    
    // Update peminjaman
    await peminjaman.update(updateData);
    
    // Dapatkan data peminjaman yang sudah diupdate dengan relasi
    const peminjamanUpdated = await Peminjaman.findByPk(id, {
      include: [
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] },
        { model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang' }] }
      ]
    });
    
    res.status(200).json({
      sukses: true,
      pesan: `Peminjaman berhasil ${status === 'disetujui' ? 'disetujui dan status diubah menjadi dipinjam' : 'ditolak'}.`,
      data: peminjamanUpdated
    });
    
  } catch (error) {
    console.error('Kesalahan persetujuan peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mencetak surat peminjaman
exports.cetakSuratPeminjaman = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah peminjaman ada
    const peminjaman = await Peminjaman.findByPk(id, {
      include: [
        { model: Pengguna, attributes: ['id', 'nama', 'nama_pengguna', 'peran'] },
        { model: DetailPeminjaman, include: [{ model: Barang }] }
      ]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Kirim data untuk dicetak di frontend
    res.status(200).json({
      sukses: true,
      data: peminjaman
    });
    
  } catch (error) {
    console.error('Kesalahan mencetak surat peminjaman:', error);
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
      include: [{ model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang' }] }]
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
    
    // Kembalikan stok semua barang yang dipinjam
    for (const detail of peminjaman.detail_peminjaman) {
      const barang = detail.barang;
      await barang.update({ 
        jumlah: barang.jumlah + detail.jumlah,
        status: 'tersedia' // Update status barang menjadi tersedia setelah dikembalikan
      });
      
      // Update kondisi saat kembali di detail peminjaman
      await detail.update({
        kondisi_saat_kembali: kondisi_barang || detail.kondisi_saat_pinjam
      });
    }
    
    // Dapatkan data peminjaman yang sudah diupdate dengan relasi
    const peminjamanUpdated = await Peminjaman.findByPk(id, {
      include: [
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] },
        { model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang' }] }
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
      include: [{ model: DetailPeminjaman, include: [{ model: Barang }] }]
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
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] }
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
      include: [{ model: DetailPeminjaman, as: 'detail_peminjaman', include: [{ model: Barang, as: 'barang' }] }]
    });
    
    if (!peminjaman) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peminjaman tidak ditemukan.'
      });
    }
    
    // Jika status masih dipinjam, kembalikan jumlah barang
    if (peminjaman.status === 'dipinjam') {
      for (const detail of peminjaman.detail_peminjaman) {
        const barang = detail.barang;
        await barang.update({ 
          jumlah: barang.jumlah + detail.jumlah,
          status: 'tersedia'
        });
      }
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