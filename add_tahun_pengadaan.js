const sequelize = require('./src/config/basisdata');

async function addTahunPengadaanColumn() {
  try {
    console.log('Memulai proses penambahan kolom tahun_pengadaan...');
    
    // Cek apakah kolom sudah ada
    const [results] = await sequelize.query(
      "SHOW COLUMNS FROM barang LIKE 'tahun_pengadaan'"
    );
    
    if (results.length === 0) {
      // Tambahkan kolom tahun_pengadaan setelah tanggal_perolehan
      await sequelize.query(
        "ALTER TABLE barang ADD COLUMN tahun_pengadaan INT NULL AFTER tanggal_perolehan"
      );
      console.log('Kolom tahun_pengadaan berhasil ditambahkan!');
    } else {
      console.log('Kolom tahun_pengadaan sudah ada');
    }
    
    console.log('Proses selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTahunPengadaanColumn();