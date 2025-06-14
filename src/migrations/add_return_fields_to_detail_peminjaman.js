const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');

const addReturnFieldsToDetailPeminjaman = async () => {
  try {
    console.log('Menambahkan kolom untuk pengembalian barang ke tabel detail_peminjaman...');
    
    // Tambahkan kolom kondisi_saat_pinjam
    await sequelize.getQueryInterface().addColumn('detail_peminjaman', 'kondisi_saat_pinjam', {
      type: DataTypes.ENUM('baik', 'rusak_ringan', 'rusak'),
      defaultValue: 'baik',
      allowNull: false
    });
    console.log('✓ Kolom kondisi_saat_pinjam berhasil ditambahkan');
    
    // Tambahkan kolom kondisi_saat_kembali
    await sequelize.getQueryInterface().addColumn('detail_peminjaman', 'kondisi_saat_kembali', {
      type: DataTypes.ENUM('baik', 'rusak_ringan', 'rusak'),
      allowNull: true
    });
    console.log('✓ Kolom kondisi_saat_kembali berhasil ditambahkan');
    
    // Tambahkan kolom catatan_kondisi
    await sequelize.getQueryInterface().addColumn('detail_peminjaman', 'catatan_kondisi', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Catatan kondisi barang saat pengembalian'
    });
    console.log('✓ Kolom catatan_kondisi berhasil ditambahkan');
    
    console.log('✅ Semua kolom pengembalian berhasil ditambahkan ke tabel detail_peminjaman');
    
  } catch (error) {
    console.error('❌ Error menambahkan kolom pengembalian:', error.message);
    
    // Jika error karena kolom sudah ada, abaikan
    if (error.message.includes('Duplicate column name') || 
        error.message.includes('column already exists')) {
      console.log('ℹ️ Kolom sudah ada, melanjutkan...');
    } else {
      throw error;
    }
  }
};

// Jalankan migrasi jika file ini dijalankan langsung
if (require.main === module) {
  addReturnFieldsToDetailPeminjaman()
    .then(() => {
      console.log('Migrasi selesai');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migrasi gagal:', error);
      process.exit(1);
    });
}

module.exports = addReturnFieldsToDetailPeminjaman;