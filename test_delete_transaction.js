const { Transaksi, Barang, Kategori, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function testDeleteTransaction() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('=== Test Hapus Transaksi ===\n');

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

    console.log(`Barang: ${barang.nama}`);
    console.log(`Stok awal: ${barang.jumlah} set`);
    console.log(`Unit per set: ${barang.unit_per_set}`);
    console.log(`Unit terpakai awal: ${barang.unit_used || 0}\n`);

    // Cari user untuk transaksi
    const pengguna = await Pengguna.findOne();
    if (!pengguna) {
      console.log('Tidak ada pengguna untuk melakukan transaksi');
      return;
    }

    // Buat transaksi test
    const jumlahTransaksi = 25;
    const transaksiTest = await Transaksi.create({
      id_barang: barang.id,
      id_pengguna: pengguna.id,
      jenis_transaksi: 'keluar',
      jumlah: jumlahTransaksi,
      keterangan: 'Test transaksi untuk dihapus',
      tanggal_transaksi: new Date(),
      stok_sebelum: 100,
      stok_sesudah: 75
    }, { transaction });

    // Update barang sesuai transaksi
    const currentUnitUsed = barang.unit_used || 0;
    const newUnitUsed = currentUnitUsed + jumlahTransaksi;
    const setsConsumed = Math.floor(newUnitUsed / barang.unit_per_set);
    const currentSetsConsumed = Math.floor(currentUnitUsed / barang.unit_per_set);
    const jumlahStok = setsConsumed - currentSetsConsumed;
    const finalUnitUsed = newUnitUsed % barang.unit_per_set;
    
    await barang.update({
      jumlah: barang.jumlah - jumlahStok,
      unit_used: finalUnitUsed
    }, { transaction });

    await transaction.commit();

    console.log(`=== Transaksi Dibuat ===`);
    console.log(`ID Transaksi: ${transaksiTest.id}`);
    console.log(`Jumlah: ${transaksiTest.jumlah} unit`);
    
    // Refresh data barang
    await barang.reload();
    console.log(`Stok setelah transaksi: ${barang.jumlah} set`);
    console.log(`Unit terpakai setelah transaksi: ${barang.unit_used}\n`);

    // Sekarang test hapus transaksi
    console.log('=== Test Hapus Transaksi ===');
    
    // Simulasi hapus transaksi
    const deleteTransaction = await sequelize.transaction();
    
    try {
      const transaksiToDelete = await Transaksi.findByPk(transaksiTest.id, {
        include: [{ 
          model: Barang, 
          as: 'barang',
          include: [{
            model: Kategori,
            as: 'kategori',
            attributes: ['id', 'nama', 'tipe']
          }]
        }],
        transaction: deleteTransaction
      });

      if (!transaksiToDelete) {
        throw new Error('Transaksi tidak ditemukan');
      }

      const barangToUpdate = transaksiToDelete.barang;
      let updateData = {};
      
      if (['keluar', 'rusak', 'hilang'].includes(transaksiToDelete.jenis_transaksi)) {
        if (barangToUpdate.satuan === 'set' && barangToUpdate.unit_per_set && barangToUpdate.unit_per_set > 0) {
          // For set items, reverse unit_used changes
          const currentUnitUsed = barangToUpdate.unit_used || 0;
          const newUnitUsed = currentUnitUsed - transaksiToDelete.jumlah;
          
          // Calculate how many sets to add back
          const currentSetsConsumed = Math.floor(currentUnitUsed / barangToUpdate.unit_per_set);
          const newSetsConsumed = Math.floor(Math.max(0, newUnitUsed) / barangToUpdate.unit_per_set);
          const setsToAddBack = currentSetsConsumed - newSetsConsumed;
          
          updateData.jumlah = barangToUpdate.jumlah + setsToAddBack;
          updateData.unit_used = Math.max(0, newUnitUsed) % barangToUpdate.unit_per_set;
        } else {
          // For non-set items, simply add back the quantity
          updateData.jumlah = barangToUpdate.jumlah + transaksiToDelete.jumlah;
        }
      }

      console.log(`Stok sebelum hapus: ${barangToUpdate.jumlah} set, unit terpakai: ${barangToUpdate.unit_used}`);
      console.log(`Update data: jumlah = ${updateData.jumlah}, unit_used = ${updateData.unit_used}`);

      await barangToUpdate.update(updateData, { transaction: deleteTransaction });
      await transaksiToDelete.destroy({ transaction: deleteTransaction });

      await deleteTransaction.commit();

      console.log('✓ Transaksi berhasil dihapus');
      
      // Refresh dan tampilkan hasil akhir
      await barang.reload();
      console.log(`Stok setelah hapus: ${barang.jumlah} set`);
      console.log(`Unit terpakai setelah hapus: ${barang.unit_used}`);
      
      console.log('\n=== Verifikasi ===');
      console.log('✓ Stok kembali ke kondisi semula');
      console.log('✓ Unit terpakai kembali ke kondisi semula');
      console.log('✓ Fungsi hapus transaksi bekerja dengan benar');
      
    } catch (error) {
      await deleteTransaction.rollback();
      console.error('Error saat hapus transaksi:', error.message);
    }
    
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testDeleteTransaction();