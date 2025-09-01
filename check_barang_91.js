const { Barang, Kategori, Lokasi, DetailPeminjaman } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function checkBarang91() {
  try {
    console.log('=== Checking Barang ID 91 ===\n');
    
    // Get barang with ID 91
    const barang = await Barang.findByPk(91, {
      include: [
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['id', 'nama', 'tipe']
        },
        {
          model: Lokasi,
          as: 'lokasi',
          attributes: ['id', 'nama']
        }
      ]
    });
    
    if (!barang) {
      console.log('❌ Barang dengan ID 91 tidak ditemukan!');
      console.log('Ini menjelaskan mengapa terjadi error 400 Bad Request.');
      return;
    }
    
    console.log('✅ Barang ditemukan:');
    console.log(`ID: ${barang.id}`);
    console.log(`Nama: ${barang.nama}`);
    console.log(`Kategori: ${barang.kategori?.nama || 'N/A'}`);
    console.log(`Lokasi: ${barang.lokasi?.nama || 'N/A'}`);
    console.log(`Status: ${barang.status}`);
    console.log(`Kondisi: ${barang.kondisi}`);
    
    // Check if barang has peminjaman history
    const peminjamanHistory = await DetailPeminjaman.findAll({
      where: { id_barang: 91 },
      limit: 5
    });
    
    console.log(`\n=== Riwayat Peminjaman ===`);
    if (peminjamanHistory.length > 0) {
      console.log(`❌ Barang memiliki ${peminjamanHistory.length} riwayat peminjaman`);
      console.log('Ini adalah alasan mengapa barang tidak bisa dihapus.');
      peminjamanHistory.forEach((detail, index) => {
        console.log(`${index + 1}. Detail Peminjaman ID: ${detail.id}`);
      });
    } else {
      console.log('✅ Barang tidak memiliki riwayat peminjaman');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkBarang91();