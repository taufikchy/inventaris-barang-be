const { Barang, Kategori, Lokasi, Peminjaman, Pengguna, DetailPeminjaman } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Mendapatkan laporan inventaris
exports.getLaporanInventaris = async (req, res) => {
  try {
    const { kategori, lokasi, kondisi, tanggal_mulai, tanggal_akhir } = req.query;
    
    // Buat kondisi pencarian
    let kondisi_pencarian = {
      // Exclude barang yang sudah dihapuskan
      status: { [Op.ne]: 'dihapuskan' }
    };
    
    // Filter berdasarkan kategori
    if (kategori) {
      kondisi_pencarian.id_kategori = kategori;
    }
    
    // Filter berdasarkan lokasi
    if (lokasi) {
      kondisi_pencarian.id_lokasi = lokasi;
    }
    
    // Filter berdasarkan kondisi barang
    if (kondisi) {
      kondisi_pencarian.kondisi = kondisi;
    }
    
    // Filter berdasarkan rentang tanggal perolehan
    if (tanggal_mulai && tanggal_akhir) {
      kondisi_pencarian.tanggal_perolehan = {
        [Op.between]: [new Date(tanggal_mulai), new Date(tanggal_akhir)]
      };
    } else if (tanggal_mulai) {
      kondisi_pencarian.tanggal_perolehan = {
        [Op.gte]: new Date(tanggal_mulai)
      };
    } else if (tanggal_akhir) {
      kondisi_pencarian.tanggal_perolehan = {
        [Op.lte]: new Date(tanggal_akhir)
      };
    }
    
    // Dapatkan data inventaris
    const inventaris = await Barang.findAll({
      where: kondisi_pencarian,
      include: [
        { model: Kategori, as: 'kategori' },
        { model: Lokasi, as: 'lokasi' }
      ],
      order: [['updatedAt', 'DESC']]
    });
    
    // Hitung total nilai inventaris (tidak menggunakan harga karena field dihapus)
    const totalNilai = 0;
    
    // Hitung jumlah barang per kategori
    const jumlahPerKategori = {};
    inventaris.forEach(item => {
      const kategoriNama = item.kategori ? item.kategori.nama : 'Tidak ada kategori';
      if (!jumlahPerKategori[kategoriNama]) {
        jumlahPerKategori[kategoriNama] = 0;
      }
      jumlahPerKategori[kategoriNama] += item.jumlah || 0;
    });
    
    // Hitung jumlah barang per lokasi
    const jumlahPerLokasi = {};
    inventaris.forEach(item => {
      const lokasiNama = item.lokasi ? item.lokasi.nama : 'Tidak ada lokasi';
      if (!jumlahPerLokasi[lokasiNama]) {
        jumlahPerLokasi[lokasiNama] = 0;
      }
      jumlahPerLokasi[lokasiNama] += item.jumlah || 0;
    });
    
    // Hitung jumlah barang per kondisi
    const jumlahPerKondisi = {};
    inventaris.forEach(item => {
      const kondisi = item.kondisi || 'Tidak ada kondisi';
      if (!jumlahPerKondisi[kondisi]) {
        jumlahPerKondisi[kondisi] = 0;
      }
      jumlahPerKondisi[kondisi] += item.jumlah || 0;
    });
    
    res.status(200).json({
      sukses: true,
      data: {
        inventaris,
        ringkasan: {
          total_barang: inventaris.reduce((total, item) => total + (item.jumlah || 0), 0),
          total_nilai: totalNilai,
          jumlah_per_kategori: jumlahPerKategori,
          jumlah_per_lokasi: jumlahPerLokasi,
          jumlah_per_kondisi: jumlahPerKondisi
        }
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan laporan inventaris:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan laporan peminjaman
exports.getLaporanPeminjaman = async (req, res) => {
  try {
    const { status, tanggal_mulai, tanggal_akhir } = req.query;
    
    // Buat kondisi pencarian
    let kondisi = {};
    
    // Filter berdasarkan status
    if (status) {
      kondisi.status = status;
    }
    
    // Filter berdasarkan rentang tanggal peminjaman
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
    
    // Dapatkan data peminjaman
    const peminjaman = await Peminjaman.findAll({
      where: kondisi,
      include: [
        { model: Barang, as: 'barang', include: [{ model: Kategori, as: 'kategori' }] },
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama', 'nama_pengguna', 'peran'] },
        { model: DetailPeminjaman, as: 'detail_peminjaman' }
      ],
      order: [['tanggal_pinjam', 'DESC']]
    });
    
    // Hitung jumlah peminjaman per status
    const jumlahPerStatus = {};
    peminjaman.forEach(item => {
      const status = item.status || 'Tidak ada status';
      if (!jumlahPerStatus[status]) {
        jumlahPerStatus[status] = 0;
      }
      jumlahPerStatus[status]++;
    });
    
    // Hitung jumlah peminjaman per bulan (untuk 6 bulan terakhir)
    const jumlahPerBulan = {};
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      jumlahPerBulan[monthYear] = 0;
    }
    
    peminjaman.forEach(item => {
      const date = new Date(item.tanggal_pinjam);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (jumlahPerBulan[monthYear] !== undefined) {
        jumlahPerBulan[monthYear]++;
      }
    });
    
    // Hitung jumlah peminjaman per kategori barang
    const jumlahPerKategori = {};
    peminjaman.forEach(item => {
      if (item.barang && item.barang.kategori) {
        const kategoriNama = item.barang.kategori.nama;
        if (!jumlahPerKategori[kategoriNama]) {
          jumlahPerKategori[kategoriNama] = 0;
        }
        jumlahPerKategori[kategoriNama]++;
      }
    });
    
    res.status(200).json({
      sukses: true,
      data: {
        peminjaman,
        ringkasan: {
          total_peminjaman: peminjaman.length,
          jumlah_per_status: jumlahPerStatus,
          jumlah_per_bulan: jumlahPerBulan,
          jumlah_per_kategori: jumlahPerKategori
        }
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan laporan peminjaman:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan laporan kondisi barang
exports.getLaporanKondisi = async (req, res) => {
  try {
    // Dapatkan semua barang dengan kondisinya (exclude yang dihapuskan)
    const barang = await Barang.findAll({
      where: {
        status: { [Op.ne]: 'dihapuskan' }
      },
      include: [
        { model: Kategori, as: 'kategori' },
        { model: Lokasi, as: 'lokasi' }
      ],
      order: [['kondisi', 'ASC']]
    });
    
    // Hitung jumlah barang per kondisi
    const jumlahPerKondisi = {};
    barang.forEach(item => {
      const kondisi = item.kondisi || 'Tidak ada kondisi';
      if (!jumlahPerKondisi[kondisi]) {
        jumlahPerKondisi[kondisi] = 0;
      }
      jumlahPerKondisi[kondisi] += item.jumlah || 0;
    });
    
    // Hitung jumlah barang per kondisi per kategori
    const kondisiPerKategori = {};
    barang.forEach(item => {
      if (item.kategori) {
        const kategoriNama = item.kategori.nama;
        if (!kondisiPerKategori[kategoriNama]) {
          kondisiPerKategori[kategoriNama] = {};
        }
        
        const kondisi = item.kondisi || 'Tidak ada kondisi';
        if (!kondisiPerKategori[kategoriNama][kondisi]) {
          kondisiPerKategori[kategoriNama][kondisi] = 0;
        }
        
        kondisiPerKategori[kategoriNama][kondisi] += item.jumlah || 0;
      }
    });
    
    // Hitung jumlah barang per kondisi per lokasi
    const kondisiPerLokasi = {};
    barang.forEach(item => {
      if (item.lokasi) {
        const lokasiNama = item.lokasi.nama;
        if (!kondisiPerLokasi[lokasiNama]) {
          kondisiPerLokasi[lokasiNama] = {};
        }
        
        const kondisi = item.kondisi || 'Tidak ada kondisi';
        if (!kondisiPerLokasi[lokasiNama][kondisi]) {
          kondisiPerLokasi[lokasiNama][kondisi] = 0;
        }
        
        kondisiPerLokasi[lokasiNama][kondisi] += item.jumlah || 0;
      }
    });
    
    res.status(200).json({
      sukses: true,
      data: {
        barang,
        ringkasan: {
          jumlah_per_kondisi: jumlahPerKondisi,
          kondisi_per_kategori: kondisiPerKategori,
          kondisi_per_lokasi: kondisiPerLokasi
        }
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan laporan kondisi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};