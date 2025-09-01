const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');

const Transaksi = sequelize.define('Transaksi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_barang: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'barang',
      key: 'id'
    }
  },
  id_pengguna: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pengguna',
      key: 'id'
    }
  },
  jenis_transaksi: {
    type: DataTypes.ENUM('keluar', 'rusak', 'hilang'),
    allowNull: false
  },
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tanggal_transaksi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  stok_sebelum: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Stok sebelum transaksi (untuk tracking bahan)'
  },
  stok_sesudah: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Stok sesudah transaksi (untuk tracking bahan)'
  }
}, {
  tableName: 'transaksi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Transaksi;