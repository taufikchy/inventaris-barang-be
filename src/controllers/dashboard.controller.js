const { Barang, Kategori, Peminjaman, Pengguna, Transaksi, Lokasi } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Mendapatkan data statistik untuk dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Hitung total barang
    const totalBarang = await Barang.sum('jumlah');
    
    // Hitung total kategori
    const totalKategori = await Kategori.count();
    
    // Hitung total peminjaman aktif
    const totalPeminjaman = await Peminjaman.count({
      where: {
        status: 'dipinjam'
      }
    });
    
    // Hitung barang berdasarkan kondisi
    const barangBaik = await Barang.sum('jumlah', {
      where: {
        kondisi: 'baik'
      }
    }) || 0;
    
    const barangRusakRingan = await Barang.sum('jumlah', {
      where: {
        kondisi: 'rusak_ringan'
      }
    }) || 0;
    
    const barangRusakBerat = await Barang.sum('jumlah', {
      where: {
        kondisi: 'rusak_berat'
      }
    }) || 0;
    
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
    
    // Dapatkan peminjaman terbaru (5 terakhir)
    const recentPeminjaman = await Peminjaman.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
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
    
    // Dapatkan transaksi terbaru (5 terakhir)
    const recentTransaksi = await Transaksi.findAll({
      limit: 5,
      order: [['tanggal_transaksi', 'DESC']],
      include: [
        {
          model: Barang,
          as: 'barang',
          attributes: ['nama', 'kode']
        },
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
        recentTransaksi,
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