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
    type: DataTypes.ENUM('masuk', 'keluar', 'rusak', 'hilang'),
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
  harga_satuan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  total_harga: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  supplier: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  nomor_faktur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'transaksi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Transaksi;