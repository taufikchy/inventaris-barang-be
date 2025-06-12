const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');

const HistoriAktivitas = sequelize.define('HistoriAktivitas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_pengguna: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pengguna',
      key: 'id'
    }
  },
  jenis_aktivitas: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout'),
    allowNull: false
  },
  modul: {
    type: DataTypes.ENUM('barang', 'kategori', 'lokasi', 'pengguna', 'peminjaman', 'transaksi', 'auth'),
    allowNull: false
  },
  id_objek: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID dari objek yang dimodifikasi (barang, kategori, dll)'
  },
  nama_objek: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama objek yang dimodifikasi untuk referensi'
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Deskripsi detail aktivitas yang dilakukan'
  },
  data_sebelum: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Data sebelum perubahan (untuk update/delete)'
  },
  data_sesudah: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Data setelah perubahan (untuk create/update)'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address pengguna'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent browser'
  },
  waktu_aktivitas: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'histori_aktivitas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = HistoriAktivitas;