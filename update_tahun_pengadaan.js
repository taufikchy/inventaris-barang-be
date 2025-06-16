const sequelize = require('./src/config/basisdata');

async function updateTahunPengadaan() {
  try {
    console.log('Memulai proses update tahun_pengadaan untuk semua barang...');
    
    // Update semua barang yang tahun_pengadaan-nya masih NULL dengan tahun 2022
    const [results] = await sequelize.query(
      "UPDATE barang SET tahun_pengadaan = 2022 WHERE tahun_pengadaan IS NULL"
    );
    
    console.log(`Berhasil mengupdate ${results.affectedRows} barang dengan tahun_pengadaan = 2022`);
    
    // Tampilkan jumlah total barang yang sudah memiliki tahun_pengadaan
    const [countResults] = await sequelize.query(
      "SELECT COUNT(*) as total FROM barang WHERE tahun_pengadaan IS NOT NULL"
    );
    
    console.log(`Total barang yang memiliki tahun_pengadaan: ${countResults[0].total}`);
    
    console.log('Proses update selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTahunPengadaan();