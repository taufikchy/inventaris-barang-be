const { Transaksi, Barang, Kategori, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function createTestTransaction() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('=== Membuat Transaksi Test untuk Verifikasi ===\n');

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
    console.log(`Stok awal: ${barang.jumlah} set`);
    console.log(`Unit per set: ${barang.unit_per_set}`);
    console.log(`Total unit: ${barang.jumlah * barang.unit_per_set}`);
    console.log(`Unit terpakai: ${barang.unit_used || 0}\n`);

    // Cari user untuk transaksi
    const pengguna = await Pengguna.findOne();
    if (!pengguna) {
      console.log('Tidak ada pengguna untuk melakukan transaksi');
      return;
    }

    // Buat transaksi keluar 30 unit
    const jumlahTransaksi = 30;
    const currentUnitUsed = barang.unit_used || 0;
    const totalUnits = barang.jumlah * barang.unit_per_set;
    const availableUnits = totalUnits - currentUnitUsed;
    
    console.log(`=== Membuat Transaksi Keluar ${jumlahTransaksi} unit ===`);
    console.log(`Stok sebelum transaksi: ${availableUnits} unit`);
    
    // Hitung stok sebelum
    const stokSebelum = availableUnits;
    
    // Update unit_used
    const newUnitUsed = currentUnitUsed + jumlahTransaksi;
    
    // Hitung berapa set yang dikonsumsi
    const setsConsumed = Math.floor(newUnitUsed / barang.unit_per_set);
    const currentSetsConsumed = Math.floor(currentUnitUsed / barang.unit_per_set);
    const jumlahStok = setsConsumed - currentSetsConsumed;
    const finalUnitUsed = newUnitUsed % barang.unit_per_set;
    
    // Update stok barang
    const newStock = barang.jumlah - jumlahStok;
    
    // Hitung stok sesudah
    const newTotalUnits = newStock * barang.unit_per_set;
    const stokSesudah = newTotalUnits - finalUnitUsed;
    
    console.log(`Stok sesudah transaksi: ${stokSesudah} unit\n`);
    
    // Buat transaksi
    const transaksi = await Transaksi.create({
      id_barang: barang.id,
      id_pengguna: pengguna.id,
      jenis_transaksi: 'keluar',
      jumlah: jumlahTransaksi,
      keterangan: 'Test transaksi untuk verifikasi stok',
      tanggal_transaksi: new Date(),
      stok_sebelum: stokSebelum,
      stok_sesudah: stokSesudah
    }, { transaction });
    
    // Update barang
    await barang.update({
      jumlah: newStock,
      unit_used: finalUnitUsed
    }, { transaction });
    
    await transaction.commit();
    
    console.log('=== Transaksi Berhasil Dibuat ===');
    console.log(`ID Transaksi: ${transaksi.id}`);
    console.log(`Stok Sebelum: ${transaksi.stok_sebelum} unit`);
    console.log(`Stok Sesudah: ${transaksi.stok_sesudah} unit`);
    console.log(`Jumlah: ${transaksi.jumlah} unit\n`);
    
    // Format display
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
    
    console.log('=== Format Tampilan ===');
    console.log(`Stok Sebelum: ${formatStockDisplay(transaksi.stok_sebelum)}`);
    console.log(`Stok Sesudah: ${formatStockDisplay(transaksi.stok_sesudah)}`);
    console.log(`Jumlah: ${transaksi.jumlah} unit`);
    
  } catch (error) {
    console.error('Error:', error);
    await transaction.rollback();
  } finally {
    await sequelize.close();
  }
}

createTestTransaction();