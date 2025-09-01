const sequelize = require('./src/config/basisdata');
const { QueryTypes } = require('sequelize');

async function addKodePeminjamanColumn() {
  try {
    console.log('Memulai proses penambahan kolom kode_peminjaman...');
    
    // Cek apakah kolom kode_peminjaman sudah ada
    const checkColumn = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'peminjaman' AND COLUMN_NAME = 'kode_peminjaman'",
      { type: QueryTypes.SELECT }
    );
    
    if (checkColumn.length === 0) {
      // Tambahkan kolom kode_peminjaman
      await sequelize.query(
        "ALTER TABLE peminjaman ADD COLUMN kode_peminjaman VARCHAR(255) NULL UNIQUE COMMENT 'Kode unik peminjaman (contoh: PJM-001)'"
      );
      console.log('✅ Kolom kode_peminjaman berhasil ditambahkan');
      
      // Update data peminjaman yang sudah ada dengan kode peminjaman
      const existingPeminjaman = await sequelize.query(
        "SELECT id FROM peminjaman WHERE kode_peminjaman IS NULL ORDER BY id",
        { type: QueryTypes.SELECT }
      );
      
      for (const peminjaman of existingPeminjaman) {
        const kodePeminjaman = `PJM-${peminjaman.id.toString().padStart(3, '0')}`;
        await sequelize.query(
          "UPDATE peminjaman SET kode_peminjaman = ? WHERE id = ?",
          {
            replacements: [kodePeminjaman, peminjaman.id],
            type: QueryTypes.UPDATE
          }
        );
      }
      
      console.log(`✅ ${existingPeminjaman.length} data peminjaman berhasil diupdate dengan kode peminjaman`);
    } else {
      console.log('ℹ️ Kolom kode_peminjaman sudah ada');
    }
    
    console.log('🎉 Proses selesai!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

// Jalankan fungsi
addKodePeminjamanColumn();