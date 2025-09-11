const { Barang, Kategori, Peminjaman, Pengguna, Transaksi, Lokasi, HistoriAktivitas, DetailPeminjaman } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Mendapatkan data statistik untuk dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Hitung total barang tersedia (kecualikan barang yang dihapuskan)
    // Untuk bahan, jangan hitung yang stoknya 0
    const totalBarangTersedia = await Barang.sum('jumlah', {
      where: {
        status: { [Op.ne]: 'dihapuskan' },
        [Op.or]: [
          // Untuk kategori alat, hitung semua
          { '$kategori.tipe$': 'alat' },
          // Untuk kategori bahan, hanya yang jumlahnya > 0
          {
            '$kategori.tipe$': 'bahan',
            jumlah: { [Op.gt]: 0 }
          }
        ]
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    // Hitung barang yang sedang dipinjam
    const peminjamanAktif = await Peminjaman.findAll({
      where: {
        status: 'dipinjam'
      },
      include: [{
        model: DetailPeminjaman,
        as: 'detail_peminjaman',
        include: [{ 
          model: Barang, 
          as: 'barang',
          where: {
            status: { [Op.ne]: 'dihapuskan' }
          }
        }]
      }]
    });
    
    const barangDipinjam = peminjamanAktif.reduce((total, peminjaman) => {
      return total + peminjaman.detail_peminjaman.reduce((subtotal, detail) => {
        return subtotal + (detail.jumlah || 0);
      }, 0);
    }, 0);
    
    // Total barang keseluruhan (tersedia + dipinjam) untuk konsistensi dengan laporan
    const totalBarang = totalBarangTersedia + barangDipinjam;
    
    // Hitung total kategori
    const totalKategori = await Kategori.count();
    
    // Hitung total peminjaman aktif
    const totalPeminjaman = await Peminjaman.count({
      where: {
        status: 'dipinjam'
      }
    });
    
    // Hitung barang berdasarkan kondisi (kecualikan barang yang dihapuskan)
    // Untuk bahan, jangan hitung yang stoknya 0
    let barangBaik = await Barang.sum('jumlah', {
      where: {
        kondisi: 'baik',
        status: { [Op.ne]: 'dihapuskan' },
        [Op.or]: [
          // Untuk kategori alat, hitung semua
          { '$kategori.tipe$': 'alat' },
          // Untuk kategori bahan, hanya yang jumlahnya > 0
          {
            '$kategori.tipe$': 'bahan',
            jumlah: { [Op.gt]: 0 }
          }
        ]
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    let barangRusakRingan = await Barang.sum('jumlah', {
      where: {
        kondisi: 'rusak_ringan',
        status: { [Op.ne]: 'dihapuskan' },
        [Op.or]: [
          // Untuk kategori alat, hitung semua
          { '$kategori.tipe$': 'alat' },
          // Untuk kategori bahan, hanya yang jumlahnya > 0
          {
            '$kategori.tipe$': 'bahan',
            jumlah: { [Op.gt]: 0 }
          }
        ]
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    let barangRusakBerat = await Barang.sum('jumlah', {
      where: {
        kondisi: 'rusak_berat',
        status: { [Op.ne]: 'dihapuskan' },
        [Op.or]: [
          // Untuk kategori alat, hitung semua
          { '$kategori.tipe$': 'alat' },
          // Untuk kategori bahan, hanya yang jumlahnya > 0
          {
            '$kategori.tipe$': 'bahan',
            jumlah: { [Op.gt]: 0 }
          }
        ]
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }]
    }) || 0;
    
    // Catatan: Barang yang sedang dipinjam tidak perlu ditambahkan lagi
    // karena stok sudah dikurangi dari database saat peminjaman disetujui
    
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
    // Untuk bahan, jangan hitung yang stoknya 0
    const distribusiPerKondisiRaw = await Barang.findAll({
      attributes: [
        'kondisi',
        [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'jumlah']
      ],
      where: {
        status: { [Op.ne]: 'dihapuskan' },
        [Op.or]: [
          // Untuk kategori alat, hitung semua
          { '$kategori.tipe$': 'alat' },
          // Untuk kategori bahan, hanya yang jumlahnya > 0
          {
            '$kategori.tipe$': 'bahan',
            jumlah: { [Op.gt]: 0 }
          }
        ]
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }],
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
    // Untuk bahan, jangan hitung yang stoknya 0
    const barangPerLokasiRaw = await Barang.findAll({
      attributes: [
        [Sequelize.col('lokasi.id'), 'id'],
        [Sequelize.col('lokasi.nama'), 'nama'],
        [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'jumlah']
      ],
      where: {
        status: { [Op.ne]: 'dihapuskan' },
        [Op.or]: [
          // Untuk kategori alat, hitung semua
          { '$kategori.tipe$': 'alat' },
          // Untuk kategori bahan, hanya yang jumlahnya > 0
          {
            '$kategori.tipe$': 'bahan',
            jumlah: { [Op.gt]: 0 }
          }
        ]
      },
      include: [{
        model: Lokasi,
        as: 'lokasi',
        attributes: []
      }, {
        model: Kategori,
        as: 'kategori',
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