const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');
const Kategori = require('./Kategori');
const Lokasi = require('./Lokasi');
const SumberDana = require('./SumberDana');

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
  satuan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  unit_per_set: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Jumlah unit dalam 1 set (untuk kategori bahan dengan satuan set)'
  },
  unit_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Jumlah unit yang sudah digunakan dari set (untuk kategori bahan dengan satuan set)'
  },
  kondisi: {
    type: DataTypes.ENUM('baik', 'rusak_ringan', 'rusak_berat'),
    defaultValue: 'baik'
  },
  tanggal_perolehan: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  tahun_pengadaan: {
    type: DataTypes.INTEGER,
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
    type: DataTypes.ENUM('tersedia', 'dipinjam', 'perbaikan', 'dihapuskan'),
    defaultValue: 'tersedia'
  },
  id_sumber_dana: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: SumberDana,
      key: 'id'
    },
    comment: 'ID sumber dana barang'
  }
}, {
  tableName: 'barang',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Relasi didefinisikan di file index.js

module.exports = Barang;