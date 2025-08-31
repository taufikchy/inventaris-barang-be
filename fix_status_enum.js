const sequelize = require('./src/config/basisdata');

async function fixStatusEnum() {
  try {
    console.log('Memperbaiki enum status...');
    
    await sequelize.query(
      "ALTER TABLE peminjaman MODIFY COLUMN status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'menunggu_persetujuan'"
    );
    
    console.log('Status enum berhasil diperbaiki!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixStatusEnum();