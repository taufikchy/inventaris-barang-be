const sequelize = require('./src/config/basisdata');
const { Transaksi, Barang } = require('./src/models');

async function checkStockDiscrepancy() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    const transaksis = await Transaksi.findAll({
      include: [{
        model: Barang,
        as: 'barang',
        attributes: ['id', 'nama', 'jumlah']
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log('Recent transactions:');
    console.log('ID | Barang | Stok Sebelum | Stok Sesudah | Stok Saat Ini | Sesuai?');
    console.log('---|--------|--------------|--------------|---------------|--------');
    
    transaksis.forEach(t => {
      const stokSesuai = t.stok_sesudah === t.barang?.jumlah ? 'Ya' : 'TIDAK';
      console.log(`${t.id} | ${t.barang?.nama || 'N/A'} | ${t.stok_sebelum || 'N/A'} | ${t.stok_sesudah || 'N/A'} | ${t.barang?.jumlah || 'N/A'} | ${stokSesuai}`);
    });
    
    // Cek apakah ada ketidaksesuaian
    const ketidaksesuaian = transaksis.filter(t => t.stok_sesudah !== t.barang?.jumlah);
    
    if (ketidaksesuaian.length > 0) {
      console.log('\n⚠️  Ditemukan ketidaksesuaian stok pada transaksi:');
      ketidaksesuaian.forEach(t => {
        console.log(`- Transaksi ID ${t.id}: Stok sesudah = ${t.stok_sesudah}, Stok saat ini = ${t.barang?.jumlah}`);
      });
    } else {
      console.log('\n✅ Semua stok sesuai!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkStockDiscrepancy();