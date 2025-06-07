const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');
const Kategori = require('./Kategori');
const Lokasi = require('./Lokasi');

// Model untuk tabel barang
const Barang = sequelize.define('Barang', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  kondisi: {
    type: DataTypes.ENUM('Baik', 'Rusak Ringan', 'Rusak Berat'),
    defaultValue: 'Baik'
  },
  tanggal_perolehan: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  harga_perolehan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  gambar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  id_kategori: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Kategori,
      key: 'id'
    }
  },
  id_lokasi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Lokasi,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Tersedia', 'Dipinjam', 'Perbaikan', 'Rusak'),
    defaultValue: 'Tersedia'
  }
}, {
  tableName: 'barang',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Relasi didefinisikan di file index.js

module.exports = Barang;