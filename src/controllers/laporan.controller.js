const { Barang, Kategori, Lokasi, Peminjaman, Pengguna, DetailPeminjaman, SumberDana } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Mendapatkan laporan inventaris
exports.getLaporanInventaris = async (req, res) => {
  try {
    const { kategori, lokasi, kondisi, sumber_dana, tanggal_mulai, tanggal_akhir } = req.query;
    
    // Buat kondisi pencarian
    let kondisi_pencarian = {};
    
    // Default: exclude barang yang sudah dihapuskan (akan di-override jika ada filter status)
    if (!req.query.status) {
      kondisi_pencarian.status = { [Op.ne]: 'dihapuskan' };
    }
    
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
      // Mapping kondisi frontend ke database
      const kondisiDatabaseMapping = {
        'Baik': 'baik',
        'Rusak Ringan': 'rusak_ringan',
        'Rusak Berat': 'rusak_berat'
      };
      kondisi_pencarian.kondisi = kondisiDatabaseMapping[kondisi] || kondisi.toLowerCase().replace(' ', '_');
    }
    
    // Filter berdasarkan status barang
    // Catatan: Status 'Habis' akan ditangani setelah query karena dihitung berdasarkan jumlah
    if (req.query.status && req.query.status !== 'Habis') {
      // Mapping status frontend ke database
      const statusDatabaseMapping = {
        'Tersedia': 'tersedia',
        'Dipinjam': 'dipinjam',
        'Perbaikan': 'perbaikan',
        'Dihapuskan': 'dihapuskan'
      };
      kondisi_pencarian.status = statusDatabaseMapping[req.query.status] || req.query.status.toLowerCase();
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
    
    // Setup include untuk sumber dana dengan filter
    let sumberDanaInclude = { 
      model: SumberDana, 
      as: 'sumber_dana', 
      attributes: ['id', 'nama'], 
      required: false 
    };
    
    // Filter berdasarkan sumber dana
    if (sumber_dana) {
      sumberDanaInclude.where = {
        nama: sumber_dana
      };
      sumberDanaInclude.required = true;
    }
    
    // Dapatkan data inventaris
    const inventaris = await Barang.findAll({
      where: kondisi_pencarian,
      include: [
        { model: Kategori, as: 'kategori' },
        { model: Lokasi, as: 'lokasi' },
        sumberDanaInclude
      ],
      order: [['nama', 'ASC'], ['kode', 'ASC']]
    });

    // Konversi kondisi dan status ke format frontend dan update status untuk kategori bahan
    
    const statusFrontendMapping = {
      'tersedia': 'Tersedia',
      'dipinjam': 'Dipinjam',
      'perbaikan': 'Perbaikan',
      'dihapuskan': 'Dihapuskan',
      'habis': 'Habis'
    };
    
    const kondisiFrontendMapping = {
      'baik': 'Baik',
      'rusak_ringan': 'Rusak Ringan', 
      'rusak_berat': 'Rusak Berat'
    };

    // Update data inventaris dengan format frontend dan logika status
    let inventarisFormatted = inventaris.map(item => {
      const itemData = item.toJSON();
      itemData.kondisi = kondisiFrontendMapping[itemData.kondisi] || itemData.kondisi;
      itemData.status = statusFrontendMapping[itemData.status] || itemData.status;
      
      // Untuk kategori bahan, ubah status menjadi 'Habis' jika jumlah <= 0
      if (itemData.kategori && itemData.kategori.tipe === 'bahan') {
        if (itemData.jumlah <= 0 && itemData.status !== 'Dihapuskan') {
          itemData.status = 'Habis';
        }
      }
      
      return itemData;
    });
    
    // Filter berdasarkan status 'Habis' setelah status diupdate
    if (req.query.status === 'Habis') {
      inventarisFormatted = inventarisFormatted.filter(item => item.status === 'Habis');
    }
    
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
    
    // Hitung jumlah barang yang sedang dipinjam berdasarkan DetailPeminjaman aktif
    // Tapi hanya untuk barang yang sesuai dengan filter yang diterapkan
    let peminjamanFilterCondition = { status: 'dipinjam' };
    
    const peminjamanAktif = await Peminjaman.findAll({
      where: peminjamanFilterCondition,
      include: [{
        model: DetailPeminjaman,
        as: 'detail_peminjaman',
        include: [{ 
          model: Barang, 
          as: 'barang',
          where: kondisi_pencarian, // Gunakan kondisi filter yang sama
          include: [
            { model: Kategori, as: 'kategori' },
            { model: Lokasi, as: 'lokasi' },
            sumberDanaInclude
          ]
        }]
      }]
    });

    // Hitung jumlah barang per kondisi - termasuk barang yang sedang dipinjam
    const jumlahPerKondisi = {};
    inventaris.forEach(item => {
      const kondisi = item.kondisi || 'baik';
      // Gunakan format database untuk konsistensi
      if (!jumlahPerKondisi[kondisi]) {
        jumlahPerKondisi[kondisi] = 0;
      }
      jumlahPerKondisi[kondisi] += item.jumlah || 0;
    });
    
    // Tambahkan kondisi barang yang sedang dipinjam
    peminjamanAktif.forEach(peminjaman => {
      peminjaman.detail_peminjaman.forEach(detail => {
        if (detail.barang) {
          const kondisi = detail.barang.kondisi || 'baik';
          if (!jumlahPerKondisi[kondisi]) {
            jumlahPerKondisi[kondisi] = 0;
          }
          jumlahPerKondisi[kondisi] += detail.jumlah || 0;
        }
      });
    });
    
    const barangDipinjam = peminjamanAktif.reduce((total, peminjaman) => {
      return total + peminjaman.detail_peminjaman.reduce((subtotal, detail) => {
        return subtotal + (detail.jumlah || 0);
      }, 0);
    }, 0);
    
    // Tambahkan jumlah barang yang sedang dipinjam ke perhitungan kategori dan lokasi saja
    peminjamanAktif.forEach(peminjaman => {
      peminjaman.detail_peminjaman.forEach(detail => {
        if (detail.barang) {
          // Tambahkan ke perhitungan kategori
          const kategoriNama = detail.barang.kategori ? detail.barang.kategori.nama : 'Tidak ada kategori';
          if (!jumlahPerKategori[kategoriNama]) {
            jumlahPerKategori[kategoriNama] = 0;
          }
          jumlahPerKategori[kategoriNama] += detail.jumlah || 0;
          
          // Tambahkan ke perhitungan lokasi
          const lokasiNama = detail.barang.lokasi ? detail.barang.lokasi.nama : 'Tidak ada lokasi';
          if (!jumlahPerLokasi[lokasiNama]) {
            jumlahPerLokasi[lokasiNama] = 0;
          }
          jumlahPerLokasi[lokasiNama] += detail.jumlah || 0;
        }
      });
    });
    
    // Hitung total barang keseluruhan (tersedia + dipinjam) untuk konsistensi dengan dashboard
    const totalBarangKeseluruhan = inventarisFormatted.reduce((total, item) => total + (item.jumlah || 0), 0) + barangDipinjam;

    res.status(200).json({
      sukses: true,
      data: {
        inventaris: inventarisFormatted,
        ringkasan: {
          total_barang: totalBarangKeseluruhan,
          total_nilai: totalNilai,
          jumlah_per_kategori: jumlahPerKategori,
          jumlah_per_lokasi: jumlahPerLokasi,
          jumlah_per_kondisi: jumlahPerKondisi,
          barang_dipinjam: barangDipinjam
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