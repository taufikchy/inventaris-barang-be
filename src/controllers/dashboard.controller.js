const { Barang, Kategori, Peminjaman, Pengguna, Transaksi, Lokasi, HistoriAktivitas } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Mendapatkan data statistik untuk dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Hitung total barang (kecualikan barang kategori bahan dengan stok 0)
    const totalBarangAlat = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'alat'
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const totalBarangBahan = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'bahan',
        status: { [Op.ne]: 'habis' }
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const totalBarang = totalBarangAlat + totalBarangBahan;
    
    // Hitung total kategori
    const totalKategori = await Kategori.count();
    
    // Hitung total peminjaman aktif
    const totalPeminjaman = await Peminjaman.count({
      where: {
        status: 'dipinjam'
      }
    });
    
    // Hitung barang berdasarkan kondisi (kecualikan barang kategori bahan dengan stok 0)
    const barangBaikAlat = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'alat',
        kondisi: 'baik'
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const barangBaikBahan = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'bahan',
        kondisi: 'baik',
        status: { [Op.ne]: 'habis' }
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const barangBaik = barangBaikAlat + barangBaikBahan;
    
    const barangRusakRinganAlat = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'alat',
        kondisi: 'rusak_ringan'
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const barangRusakRinganBahan = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'bahan',
        kondisi: 'rusak_ringan',
        status: { [Op.ne]: 'habis' }
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const barangRusakRingan = barangRusakRinganAlat + barangRusakRinganBahan;
    
    const barangRusakBeratAlat = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'alat',
        kondisi: 'rusak_berat'
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const barangRusakBeratBahan = await Barang.sum('jumlah', {
      where: {
        '$kategori.tipe$': 'bahan',
        kondisi: 'rusak_berat',
        status: { [Op.ne]: 'habis' }
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    const barangRusakBerat = barangRusakBeratAlat + barangRusakBeratBahan;
    
    // Total barang rusak (rusak ringan + rusak berat)
    const barangRusak = barangRusakRingan + barangRusakBerat;
    
    // Hitung total transaksi hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const totalTransaksiHariIni = await Transaksi.count({
      where: {
        tanggal_transaksi: {
          [Op.between]: [today, tomorrow]
        }
      }
    });
    
    // Hitung transaksi per jenis dalam 30 hari terakhir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transaksiPerJenis = await Transaksi.findAll({
      attributes: [
        'jenis_transaksi',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: {
        tanggal_transaksi: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: ['jenis_transaksi'],
      raw: true
    });
    
    // Dapatkan peminjaman aktif (status dipinjam)
    const recentPeminjaman = await Peminjaman.findAll({
      limit: 5,
      where: {
        status: 'dipinjam'
      },
      order: [['tanggal_pinjam', 'DESC']],
      attributes: [
        'id', 'nama_peminjam', 'kontak_peminjam', 'kelas_peminjam', 
        'tanggal_pinjam', 'tanggal_kembali_harapan', 'tanggal_kembali_aktual', 
        'status', 'catatan', 'id_pengguna', 'createdAt', 'updatedAt'
        // id_kepala_lab dihapus dari daftar atribut untuk menghindari error
      ],
      include: [
        { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama'] }
      ]
    });
    
    // Dapatkan aktivitas terbaru (5 terakhir)
    const recentAktivitas = await HistoriAktivitas.findAll({
      limit: 5,
      order: [['waktu_aktivitas', 'DESC']],
      include: [
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['nama']
        }
      ]
    });
    
    // Dapatkan distribusi barang per kondisi (untuk chart bar)
    const distribusiPerKondisiRaw = await Barang.findAll({
      attributes: [
        'kondisi',
        [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'jumlah']
      ],
      group: ['kondisi'],
      raw: true
    });
    
    // Format data distribusi per kondisi
    const distribusiPerKondisi = distribusiPerKondisiRaw.map(item => ({
      nama: item.kondisi === 'baik' ? 'Baik' : 
            item.kondisi === 'rusak_ringan' ? 'Rusak Ringan' : 
            item.kondisi === 'rusak_berat' ? 'Rusak Berat' : 'Tidak Diketahui',
      jumlah: parseInt(item.jumlah)
    }));
    
    // Dapatkan distribusi barang per lokasi/ruangan (untuk chart pie)
    const barangPerLokasiRaw = await Barang.findAll({
      attributes: [
        [Sequelize.col('lokasi.id'), 'id'],
        [Sequelize.col('lokasi.nama'), 'nama'],
        [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'jumlah']
      ],
      include: [{
        model: Lokasi,
        as: 'lokasi',
        attributes: []
      }],
      group: ['lokasi.id', 'lokasi.nama'],
      raw: true
    });
    
    // Format data barang per lokasi
    const barangPerLokasi = barangPerLokasiRaw.map(item => ({
      nama: item.nama,
      jumlah: parseInt(item.jumlah)
    }));
    

    
    res.status(200).json({
      sukses: true,
      data: {
        stats: {
          totalBarang: totalBarang || 0,
          totalKategori,
          totalPeminjaman,
          barangRusak: barangRusak || 0,
          barangBaik: barangBaik,
          barangRusakRingan: barangRusakRingan,
          barangRusakBerat: barangRusakBerat,
          totalTransaksiHariIni
        },
        recentPeminjaman,
        recentAktivitas,
        distribusiPerKondisi,
        barangPerLokasi,
        transaksiPerJenis
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan statistik dashboard:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};