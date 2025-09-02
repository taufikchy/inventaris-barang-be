const { Transaksi, Barang, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function checkTransaksi() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    const count = await Transaksi.count();
    console.log(`Total transaksi: ${count}`);
    
    if (count > 0) {
      const transaksis = await Transaksi.findAll({
        limit: 5,
        include: [
          {
            model: Barang,
            as: 'barang',
            attributes: ['id', 'nama']
          },
          {
            model: Pengguna,
            as: 'pengguna',
            attributes: ['id', 'nama']
          }
        ],
        order: [['tanggal_transaksi', 'DESC']]
      });
      
      console.log('Sample transaksi data:');
      transaksis.forEach((t, index) => {
        console.log(`${index + 1}. ID: ${t.id}, Jenis: ${t.jenis_transaksi}, Barang: ${t.barang?.nama || 'N/A'}, Tanggal: ${t.tanggal_transaksi}`);
      });
    } else {
      console.log('Tidak ada data transaksi ditemukan');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTransaksi();