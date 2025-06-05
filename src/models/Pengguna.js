const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');
const bcrypt = require('bcryptjs');

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
    type: DataTypes.ENUM('admin', 'kepala_lab', 'toolman', 'sarana'),
    defaultValue: 'sarana'
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
    beforeCreate: async (pengguna) => {
      if (pengguna.kata_sandi) {
        pengguna.kata_sandi = await bcrypt.hash(pengguna.kata_sandi, 10);
      }
    },
    beforeUpdate: async (pengguna) => {
      if (pengguna.changed('kata_sandi')) {
        pengguna.kata_sandi = await bcrypt.hash(pengguna.kata_sandi, 10);
      }
    }
  }
});

// Metode untuk memeriksa kata sandi
Pengguna.prototype.periksaKataSandi = async function(kata_sandi) {
  return await bcrypt.compare(kata_sandi, this.kata_sandi);
};

module.exports = Pengguna;