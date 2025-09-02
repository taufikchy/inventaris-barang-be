const sequelize = require('./src/config/basisdata');
const { Transaksi, Barang, Kategori } = require('./src/models');

async function testMultipleTransactions() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    // Cari barang dengan kategori bahan
    const barang = await Barang.findOne({
      include: [{
        model: Kategori,
        as: 'kategori',
        where: { tipe: 'bahan' }
      }]
    });
    
    if (!barang) {
      console.log('Tidak ada barang dengan kategori bahan ditemukan');
      return;
    }
    
    console.log(`Testing dengan barang: ${barang.nama}`);
    console.log(`Stok awal: ${barang.jumlah}`);
    
    // Simulasi beberapa transaksi berturut-turut
    const transaksiData = [
      { jumlah: 2, jenis_transaksi: 'keluar' },
      { jumlah: 1, jenis_transaksi: 'rusak' },
      { jumlah: 3, jenis_transaksi: 'keluar' }
    ];
    
    for (let i = 0; i < transaksiData.length; i++) {
      const { jumlah, jenis_transaksi } = transaksiData[i];
      
      // Ambil stok terbaru sebelum transaksi
      await barang.reload();
      const stokSebelum = barang.jumlah;
      
      console.log(`\nTransaksi ${i + 1}: ${jenis_transaksi} ${jumlah} unit`);
      console.log(`Stok sebelum: ${stokSebelum}`);
      
      // Buat transaksi
      const transaksi = await Transaksi.create({
        id_barang: barang.id,
        id_pengguna: 1, // Asumsi ada user dengan ID 1
        jumlah: jumlah,
        jenis_transaksi: jenis_transaksi,
        stok_sebelum: stokSebelum,
        stok_sesudah: null, // akan diupdate nanti
        tanggal_transaksi: new Date(),
        keterangan: `Test transaksi ${i + 1}`
      });
      
      // Update stok barang
      const newStock = stokSebelum - jumlah;
      await barang.update({ jumlah: newStock });
      
      // Update stok_sesudah di transaksi
      await transaksi.update({ stok_sesudah: newStock });
      
      console.log(`Stok sesudah: ${newStock}`);
      
      // Verifikasi
      await barang.reload();
      console.log(`Stok aktual di database: ${barang.jumlah}`);
      console.log(`Stok sesudah di transaksi: ${transaksi.stok_sesudah}`);
      console.log(`Sesuai: ${barang.jumlah === transaksi.stok_sesudah ? 'Ya' : 'TIDAK'}`);
    }
    
    // Tampilkan semua transaksi untuk barang ini
    console.log('\n=== Semua Transaksi untuk Barang Ini ===');
    const allTransaksis = await Transaksi.findAll({
      where: { id_barang: barang.id },
      order: [['created_at', 'ASC']]
    });
    
    console.log('ID | Jenis | Jumlah | Stok Sebelum | Stok Sesudah');
    console.log('---|-------|--------|--------------|-------------');
    allTransaksis.forEach(t => {
      console.log(`${t.id} | ${t.jenis_transaksi} | ${t.jumlah} | ${t.stok_sebelum} | ${t.stok_sesudah}`);
    });
    
    await barang.reload();
    console.log(`\nStok akhir di menu barang: ${barang.jumlah}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testMultipleTransactions();