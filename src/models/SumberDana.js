const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');

// Model untuk tabel sumber_dana
const SumberDana = sequelize.define('SumberDana', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Nama sumber dana tidak boleh kosong'
      },
      len: {
        args: [3, 255],
        msg: 'Nama sumber dana harus antara 3-255 karakter'
      }
    }
  }
}, {
  tableName: 'sumber_dana',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = SumberDana;