const { Barang, Kategori, Lokasi, Peminjaman, Pengguna } = require('../models');
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
    
    // Hitung total barang rusak (rusak ringan + rusak berat)
    const barangRusak = await Barang.sum('jumlah', {
      where: {
        kondisi: {
          [Op.in]: ['rusak_ringan', 'rusak_berat']
        }
      }
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
    
    // Dapatkan jumlah barang per kategori
    const barangPerKategoriRaw = await Barang.findAll({
      attributes: [
        [Sequelize.col('kategori.id'), 'id'],
        [Sequelize.col('kategori.nama'), 'nama'],
        [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'jumlah']
      ],
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: []
      }],
      group: ['kategori.id', 'kategori.nama'],
      raw: true
    });
    
    // Format data barang per kategori
    const barangPerKategori = barangPerKategoriRaw.map(item => ({
      nama: item.nama,
      jumlah: parseInt(item.jumlah)
    }));
    
    // Dapatkan jumlah barang per kondisi
    const kondisiBarangRaw = await Barang.findAll({
      attributes: [
        'kondisi',
        [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'jumlah']
      ],
      group: ['kondisi'],
      raw: true
    });
    
    // Format data kondisi barang
    const kondisiBarang = kondisiBarangRaw.map(item => ({
      kondisi: item.kondisi === 'baik' ? 'Baik' : 
               item.kondisi === 'rusak_ringan' ? 'Rusak Ringan' : 
               item.kondisi === 'rusak_berat' ? 'Rusak Berat' : 'Tidak Diketahui',
      jumlah: parseInt(item.jumlah)
    }));
    
    res.status(200).json({
      sukses: true,
      data: {
        stats: {
          totalBarang: totalBarang || 0,
          totalKategori,
          totalPeminjaman,
          barangRusak: barangRusak || 0
        },
        recentPeminjaman,
        barangPerKategori,
        kondisiBarang
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