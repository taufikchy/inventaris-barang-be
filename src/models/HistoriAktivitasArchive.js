const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');

const HistoriAktivitasArchive = sequelize.define('HistoriAktivitasArchive', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  original_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID asli dari tabel histori_aktivitas'
  },
  id_pengguna: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID pengguna yang melakukan aktivitas'
  },
  jenis_aktivitas: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout'),
    allowNull: false,
    comment: 'Jenis aktivitas yang dilakukan'
  },
  modul: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Modul/fitur yang diakses'
  },
  id_objek: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID objek yang dimanipulasi (jika ada)'
  },
  nama_objek: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama objek yang dimanipulasi'
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Deskripsi detail aktivitas'
  },
  data_sebelum: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Data sebelum perubahan (untuk update/delete)'
  },
  data_sesudah: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Data sesudah perubahan (untuk create/update)'
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
    comment: 'Waktu aktivitas dilakukan'
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Waktu data diarsipkan'
  }
}, {
  tableName: 'histori_aktivitas_archive',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['waktu_aktivitas']
    },
    {
      fields: ['archived_at']
    },
    {
      fields: ['id_pengguna']
    },
    {
      fields: ['modul']
    }
  ]
});

module.exports = HistoriAktivitasArchive;