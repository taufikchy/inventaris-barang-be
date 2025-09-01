const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');

// Model untuk tabel kategori
const Kategori = sequelize.define('Kategori', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipe: {
    type: DataTypes.ENUM('alat', 'bahan'),
    allowNull: false,
    defaultValue: 'alat'
  }
}, {
  tableName: 'kategori',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Kategori;