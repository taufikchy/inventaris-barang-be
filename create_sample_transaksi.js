const { Transaksi, Barang, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function createSampleTransaksi() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Get sample barang and pengguna
    const barang = await Barang.findOne();
    const pengguna = await Pengguna.findOne();
    
    if (!barang) {
      console.log('Tidak ada data barang ditemukan. Silakan tambahkan barang terlebih dahulu.');
      return;
    }
    
    if (!pengguna) {
      console.log('Tidak ada data pengguna ditemukan. Silakan tambahkan pengguna terlebih dahulu.');
      return;
    }
    
    console.log(`Using barang: ${barang.nama} (ID: ${barang.id})`);
    console.log(`Using pengguna: ${pengguna.nama} (ID: ${pengguna.id})`);
    
    // Create sample transactions
    const sampleTransaksi = [
      {
        id_barang: barang.id,
        id_pengguna: pengguna.id,
        jenis_transaksi: 'masuk',
        jumlah: 10,
        stok_sebelum: barang.jumlah,
        stok_sesudah: barang.jumlah + 10,
        keterangan: 'Pembelian barang baru',
        harga_satuan: 50000,
        supplier: 'PT. Supplier ABC',
        nomor_faktur: 'INV-001',
        tanggal_transaksi: new Date(),
        status: 'approved'
      },
      {
        id_barang: barang.id,
        id_pengguna: pengguna.id,
        jenis_transaksi: 'keluar',
        jumlah: 3,
        stok_sebelum: barang.jumlah + 10,
        stok_sesudah: barang.jumlah + 7,
        keterangan: 'Penggunaan untuk proyek A',
        tanggal_transaksi: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: 'approved'
      },
      {
        id_barang: barang.id,
        id_pengguna: pengguna.id,
        jenis_transaksi: 'rusak',
        jumlah: 1,
        stok_sebelum: barang.jumlah + 7,
        stok_sesudah: barang.jumlah + 6,
        keterangan: 'Barang rusak saat penggunaan',
        tanggal_transaksi: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'approved'
      }
    ];
    
    for (const transaksi of sampleTransaksi) {
      const created = await Transaksi.create(transaksi);
      console.log(`Created transaksi: ${created.jenis_transaksi} - ${created.jumlah} items`);
    }
    
    console.log('Sample transaksi data created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

createSampleTransaksi();