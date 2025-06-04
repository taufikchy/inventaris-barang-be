const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/basisdata');

// Model untuk tabel pengguna
const Pengguna = sequelize.define('Pengguna', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nama_pengguna: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  kata_sandi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  peran: {
    type: DataTypes.ENUM('admin', 'staf'),
    defaultValue: 'staf'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pengguna',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  hooks: {
    // Hook sebelum membuat pengguna baru (enkripsi kata sandi)
    beforeCreate: async (pengguna) => {
      if (pengguna.kata_sandi) {
        const salt = await bcrypt.genSalt(10);
        pengguna.kata_sandi = await bcrypt.hash(pengguna.kata_sandi, salt);
      }
    },
    // Hook sebelum memperbarui pengguna (enkripsi kata sandi jika diubah)
    beforeUpdate: async (pengguna) => {
      if (pengguna.changed('kata_sandi')) {
        const salt = await bcrypt.genSalt(10);
        pengguna.kata_sandi = await bcrypt.hash(pengguna.kata_sandi, salt);
      }
    }
  }
});

// Metode untuk memeriksa kata sandi
Pengguna.prototype.periksaKataSandi = async function(kata_sandi) {
  return await bcrypt.compare(kata_sandi, this.kata_sandi);
};

module.exports = Pengguna;