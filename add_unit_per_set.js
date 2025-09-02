const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/basisdata');

async function addUnitPerSetColumns() {
  try {
    console.log('Menambahkan kolom unit_per_set dan satuan ke tabel barang...');
    
    // Tambahkan kolom satuan
    await sequelize.getQueryInterface().addColumn('barang', 'satuan', {
      type: DataTypes.STRING(50),
      allowNull: true,
      after: 'jumlah'
    });
    console.log('✓ Kolom satuan berhasil ditambahkan');
    
    // Tambahkan kolom unit_per_set
    await sequelize.getQueryInterface().addColumn('barang', 'unit_per_set', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Jumlah unit dalam 1 set (untuk kategori bahan dengan satuan set)',
      after: 'satuan'
    });
    console.log('✓ Kolom unit_per_set berhasil ditambahkan');
    
    // Update data existing untuk set default satuan
    await sequelize.query(
      "UPDATE barang SET satuan = 'unit' WHERE satuan IS NULL",
      { type: Sequelize.QueryTypes.UPDATE }
    );
    console.log('✓ Data existing berhasil diupdate dengan satuan default');
    
    console.log('\n🎉 Semua kolom berhasil ditambahkan ke tabel barang!');
    
  } catch (error) {
    console.error('❌ Error saat menambahkan kolom:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

// Jalankan script
addUnitPerSetColumns();