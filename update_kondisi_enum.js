const { Sequelize } = require('sequelize');
const sequelize = require('./src/config/basisdata');

const updateKondisiEnum = async () => {
  try {
    console.log('🔄 Memulai update enum kondisi di tabel detail_peminjaman...');
    
    // Update kolom kondisi_saat_pinjam
    console.log('📝 Mengupdate kolom kondisi_saat_pinjam...');
    await sequelize.query(`
      ALTER TABLE detail_peminjaman 
      MODIFY COLUMN kondisi_saat_pinjam ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik'
    `);
    console.log('✅ Kolom kondisi_saat_pinjam berhasil diupdate');
    
    // Update kolom kondisi_saat_kembali
    console.log('📝 Mengupdate kolom kondisi_saat_kembali...');
    await sequelize.query(`
      ALTER TABLE detail_peminjaman 
      MODIFY COLUMN kondisi_saat_kembali ENUM('baik', 'rusak_ringan', 'rusak_berat')
    `);
    console.log('✅ Kolom kondisi_saat_kembali berhasil diupdate');
    
    // Update data yang ada dari 'rusak' ke 'rusak_berat'
    console.log('📝 Mengupdate data kondisi_saat_pinjam dari "rusak" ke "rusak_berat"...');
    const [results1] = await sequelize.query(`
      UPDATE detail_peminjaman 
      SET kondisi_saat_pinjam = 'rusak_berat' 
      WHERE kondisi_saat_pinjam = 'rusak'
    `);
    console.log(`✅ ${results1.affectedRows || 0} baris kondisi_saat_pinjam berhasil diupdate`);
    
    console.log('📝 Mengupdate data kondisi_saat_kembali dari "rusak" ke "rusak_berat"...');
    const [results2] = await sequelize.query(`
      UPDATE detail_peminjaman 
      SET kondisi_saat_kembali = 'rusak_berat' 
      WHERE kondisi_saat_kembali = 'rusak'
    `);
    console.log(`✅ ${results2.affectedRows || 0} baris kondisi_saat_kembali berhasil diupdate`);
    
    console.log('🎉 Update enum kondisi berhasil!');
    
  } catch (error) {
    console.error('❌ Error saat mengupdate enum kondisi:', error.message);
    
    // Jika error karena enum sudah benar, abaikan
    if (error.message.includes('Unknown column') || 
        error.message.includes('Invalid default value') ||
        error.message.includes('Data truncated')) {
      console.log('ℹ️ Enum mungkin sudah dalam format yang benar, melanjutkan...');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  updateKondisiEnum()
    .then(() => {
      console.log('✅ Script selesai dijalankan');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script gagal:', error.message);
      process.exit(1);
    });
}

module.exports = updateKondisiEnum;