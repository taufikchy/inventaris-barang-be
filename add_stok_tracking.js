const sequelize = require('./src/config/basisdata');
const { QueryInterface, DataTypes } = require('sequelize');

async function addStokTrackingFields() {
  try {
    console.log('Menambahkan field stok tracking ke tabel transaksi...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Add stok_sebelum field
    await queryInterface.addColumn('transaksi', 'stok_sebelum', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Stok sebelum transaksi (untuk tracking bahan)'
    });
    
    // Add stok_sesudah field
    await queryInterface.addColumn('transaksi', 'stok_sesudah', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Stok sesudah transaksi (untuk tracking bahan)'
    });
    
    console.log('Field stok tracking berhasil ditambahkan!');
    
  } catch (error) {
    console.error('Error menambahkan field stok tracking:', error);
  } finally {
    await sequelize.close();
  }
}

addStokTrackingFields();