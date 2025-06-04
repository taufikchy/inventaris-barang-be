const { DataTypes } = require('sequelize');
const sequelize = require('../config/basisdata');
const Pengguna = require('./Pengguna');
const Barang = require('./Barang');

// Model untuk tabel peminjaman
const Peminjaman = sequelize.define('Peminjaman', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_peminjam: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kontak_peminjam: {
    type: DataTypes.STRING,
    allowNull: true
  },
  kelas_peminjam: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tanggal_pinjam: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tanggal_kembali_harapan: {
    type: DataTypes.DATE,
    allowNull: false
  },
  tanggal_kembali_aktual: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('dipinjam', 'dikembalikan', 'terlambat'),
    defaultValue: 'dipinjam'
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  id_pengguna: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pengguna,
      key: 'id'
    }
  }
}, {
  tableName: 'peminjaman',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Relasi didefinisikan di file index.js

// Model untuk tabel detail peminjaman (many-to-many relationship)
const DetailPeminjaman = sequelize.define('DetailPeminjaman', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_peminjaman: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Peminjaman,
      key: 'id'
    }
  },
  id_barang: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Barang,
      key: 'id'
    }
  },
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  kondisi_sebelum: {
    type: DataTypes.ENUM('baik', 'rusak_ringan', 'rusak_berat'),
    defaultValue: 'baik'
  },
  kondisi_sesudah: {
    type: DataTypes.ENUM('baik', 'rusak_ringan', 'rusak_berat'),
    allowNull: true
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'detail_peminjaman',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Relasi didefinisikan di file index.js

module.exports = { Peminjaman, DetailPeminjaman };