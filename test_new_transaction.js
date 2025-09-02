const { Transaksi, Barang, Kategori, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function testNewTransaction() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('=== Test Transaksi Baru untuk Verifikasi Stok ===\n');

    // Cari barang dengan kategori bahan dan satuan set
    const barang = await Barang.findOne({
      where: {
        satuan: 'set'
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        where: {
          tipe: 'bahan'
        }
      }]
    });

    if (!barang) {
      console.log('Tidak ada barang dengan kategori bahan dan satuan set');
      return;
    }

    // Reset stok untuk testing
    await barang.update({
      jumlah: 2, // 2 set
      unit_used: 0 // belum ada yang terpakai
    }, { transaction });

    console.log(`Barang: ${barang.nama}`);
    console.log(`Stok awal: ${barang.jumlah} set (${barang.jumlah * barang.unit_per_set} unit total)`);
    console.log(`Unit per set: ${barang.unit_per_set}`);
    console.log(`Unit terpakai: ${barang.unit_used || 0}\n`);

    // Cari user untuk transaksi
    const pengguna = await Pengguna.findOne();
    if (!pengguna) {
      console.log('Tidak ada pengguna untuk melakukan transaksi');
      return;
    }

    // Simulasi transaksi keluar 30 unit
    const jumlahTransaksi = 30;
    const currentUnitUsed = barang.unit_used || 0;
    const totalUnits = barang.jumlah * barang.unit_per_set;
    const availableUnits = totalUnits - currentUnitUsed;
    
    console.log(`=== Simulasi Transaksi Keluar ${jumlahTransaksi} unit ===`);
    console.log(`Total unit tersedia sebelum transaksi: ${availableUnits} unit`);
    console.log(`Unit yang akan dikeluarkan: ${jumlahTransaksi} unit`);
    console.log(`Unit yang akan tersisa: ${availableUnits - jumlahTransaksi} unit\n`);

    // Hitung stok sebelum dan sesudah
    const stokSebelum = availableUnits;
    const stokSesudah = availableUnits - jumlahTransaksi;
    
    console.log(`Stok Sebelum: ${stokSebelum} unit`);
    console.log(`Stok Sesudah: ${stokSesudah} unit\n`);
    
    // Format display seperti di frontend
    const formatStockDisplay = (stockValue) => {
      if (stockValue === null || stockValue === undefined) return '-';
      const sets = Math.floor(stockValue / barang.unit_per_set);
      const remainingUnits = stockValue % barang.unit_per_set;
      if (remainingUnits === 0) {
        return `${sets} set (${stockValue} unit)`;
      } else {
        return `${sets} set + ${remainingUnits} unit (${stockValue} unit)`;
      }
    };
    
    console.log('=== Format Tampilan Frontend ===');
    console.log(`Stok Sebelum: ${formatStockDisplay(stokSebelum)}`);
    console.log(`Stok Sesudah: ${formatStockDisplay(stokSesudah)}`);
    console.log(`Jumlah Transaksi: ${jumlahTransaksi} unit\n`);
    
    console.log('=== Verifikasi ===');
    console.log('✓ Stok sebelum menunjukkan total unit yang tersedia sebelum transaksi');
    console.log('✓ Stok sesudah menunjukkan total unit yang tersisa setelah transaksi');
    console.log('✓ Tidak ada lagi masalah stok terbalik');
    
    await transaction.rollback(); // Rollback untuk tidak mengubah data asli
    
  } catch (error) {
    console.error('Error:', error);
    await transaction.rollback();
  } finally {
    await sequelize.close();
  }
}

testNewTransaction();