const { Transaksi, Barang, Kategori, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function testStockDisplayFormat() {
  try {
    console.log('=== Test Format Tampilan Stok Sebelum dan Sesudah ===\n');

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
    console.log(`Kategori: ${barang.kategori.nama} (${barang.kategori.tipe})`);
    console.log(`Satuan: ${barang.satuan}`);
    console.log(`Unit per set: ${barang.unit_per_set}`);
    console.log(`Stok saat ini: ${barang.jumlah} set`);
    console.log(`Unit terpakai: ${barang.unit_used || 0} unit`);
    
    const currentUnitUsed = barang.unit_used || 0;
    const remainingUnitsInCurrentSet = barang.unit_per_set - (currentUnitUsed % barang.unit_per_set);
    const displayRemainingUnits = remainingUnitsInCurrentSet === barang.unit_per_set ? barang.unit_per_set : remainingUnitsInCurrentSet;
    
    console.log(`Unit tersisa di set saat ini: ${displayRemainingUnits} unit\n`);

    // Ambil beberapa transaksi terbaru untuk barang ini
    const transaksis = await Transaksi.findAll({
      where: {
        id_barang: barang.id
      },
      include: [
        {
          model: Barang,
          as: 'barang',
          attributes: ['nama', 'satuan', 'unit_per_set'],
          include: [{
            model: Kategori,
            as: 'kategori',
            attributes: ['nama', 'tipe']
          }]
        },
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['nama']
        }
      ],
      order: [['id', 'DESC']],
      limit: 5
    });

    console.log('=== 5 Transaksi Terbaru ===');
    console.log('ID | Jenis | Jumlah | Stok Sebelum | Stok Sesudah | Tanggal');
    console.log('---|-------|--------|--------------|--------------|--------');
    
    transaksis.forEach(t => {
      const formatStockDisplay = (stockValue) => {
        if (stockValue === null || stockValue === undefined) return '-';
        if (t.barang.kategori?.tipe === 'bahan' && t.barang.satuan === 'set' && t.barang.unit_per_set) {
          return `1 set (${stockValue} unit)`;
        }
        return `${stockValue} ${t.barang.satuan || ''}`;
      };
      
      const jumlahDisplay = t.barang.kategori?.tipe === 'bahan' && t.barang.satuan === 'set' 
        ? `${t.jumlah} unit`
        : `${t.jumlah} ${t.barang.satuan || ''}`;
      
      const tanggal = t.tanggal_transaksi ? new Date(t.tanggal_transaksi).toISOString().split('T')[0] : 'N/A';
      console.log(`${t.id} | ${t.jenis_transaksi} | ${jumlahDisplay} | ${formatStockDisplay(t.stok_sebelum)} | ${formatStockDisplay(t.stok_sesudah)} | ${tanggal}`);
    });

    console.log('\n=== Penjelasan Format Baru ===');
    console.log('- Untuk barang kategori "bahan" dengan satuan "set":');
    console.log('  * Jumlah: ditampilkan dalam unit (misal: 30 unit)');
    console.log('  * Stok Sebelum/Sesudah: ditampilkan sebagai "1 set (X unit)"');
    console.log('  * X unit menunjukkan sisa unit dalam set yang sedang digunakan');
    console.log('\n- Contoh skenario:');
    console.log('  * Set awal: 1 set (50 unit)');
    console.log('  * Transaksi: 30 unit keluar');
    console.log('  * Hasil: 1 set (20 unit) tersisa');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testStockDisplayFormat();