const sequelize = require('./src/config/basisdata');
const { Transaksi, Barang, Kategori } = require('./src/models');

async function demonstrateStockIssue() {
  try {
    await sequelize.authenticate();
    console.log('=== DEMONSTRASI MASALAH STOK ===\n');
    
    // Ambil barang dengan transaksi
    const barang = await Barang.findOne({
      where: { nama: 'Konektor Kabel RJ45' },
      include: [{
        model: Kategori,
        as: 'kategori'
      }]
    });
    
    if (!barang) {
      console.log('Barang tidak ditemukan');
      return;
    }
    
    console.log(`Barang: ${barang.nama}`);
    console.log(`Stok SAAT INI di menu barang: ${barang.jumlah}`);
    console.log();
    
    // Ambil transaksi terbaru
    const transaksiTerbaru = await Transaksi.findAll({
      where: { id_barang: barang.id },
      order: [['id', 'DESC']],
      limit: 5
    });
    
    console.log('=== TRANSAKSI TERBARU (yang dilihat user di menu transaksi) ===');
    console.log('ID | Tanggal | Jenis | Jumlah | Stok Sebelum | Stok Sesudah');
    console.log('---|---------|-------|--------|--------------|-------------');
    
    transaksiTerbaru.forEach(t => {
      const tanggal = new Date(t.created_at).toLocaleDateString('id-ID');
      console.log(`${t.id} | ${tanggal} | ${t.jenis_transaksi} | ${t.jumlah} | ${t.stok_sebelum} | ${t.stok_sesudah}`);
    });
    
    console.log();
    console.log('=== ANALISIS MASALAH ===');
    console.log(`1. Stok AKTUAL di menu barang: ${barang.jumlah}`);
    
    if (transaksiTerbaru.length > 0) {
      const transaksiTerakhir = transaksiTerbaru[0];
      console.log(`2. Stok sesudah di transaksi terakhir: ${transaksiTerakhir.stok_sesudah}`);
      
      if (barang.jumlah === transaksiTerakhir.stok_sesudah) {
        console.log('✅ Stok konsisten - tidak ada masalah');
      } else {
        console.log('❌ MASALAH: Stok tidak konsisten!');
        console.log(`   Selisih: ${barang.jumlah - transaksiTerakhir.stok_sesudah}`);
      }
    }
    
    console.log();
    console.log('=== PENJELASAN UNTUK USER ===');
    console.log('Kolom "Stok Sebelum" dan "Stok Sesudah" di menu transaksi menunjukkan:');
    console.log('- Stok Sebelum: Jumlah stok SEBELUM transaksi tersebut dilakukan');
    console.log('- Stok Sesudah: Jumlah stok SESUDAH transaksi tersebut dilakukan');
    console.log();
    console.log('Ini adalah data HISTORIS dari saat transaksi terjadi.');
    console.log('Stok yang ditampilkan di menu barang adalah stok SAAT INI (real-time).');
    console.log();
    console.log('Jika ada perbedaan, kemungkinan penyebabnya:');
    console.log('1. Ada transaksi lain yang terjadi setelah transaksi yang dilihat');
    console.log('2. Ada perubahan stok manual di database');
    console.log('3. Ada bug dalam sistem pencatatan transaksi');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

demonstrateStockIssue();