// File indeks untuk mengekspor semua model
const Pengguna = require('./Pengguna');
const Kategori = require('./Kategori');
const Lokasi = require('./Lokasi');
const Barang = require('./Barang');
const { Peminjaman, DetailPeminjaman } = require('./Peminjaman');

// Definisi relasi antar model

// Relasi Barang dengan Kategori dan Lokasi
Barang.belongsTo(Kategori, { foreignKey: 'id_kategori', as: 'kategori' });
Kategori.hasMany(Barang, { foreignKey: 'id_kategori', as: 'barang' });

Barang.belongsTo(Lokasi, { foreignKey: 'id_lokasi', as: 'lokasi' });
Lokasi.hasMany(Barang, { foreignKey: 'id_lokasi', as: 'barang' });

// Relasi Peminjaman dengan Pengguna
Peminjaman.belongsTo(Pengguna, { foreignKey: 'id_pengguna', as: 'pengguna' });
Pengguna.hasMany(Peminjaman, { foreignKey: 'id_pengguna', as: 'peminjaman' });

// Relasi many-to-many Peminjaman dengan Barang melalui DetailPeminjaman
Peminjaman.belongsToMany(Barang, { through: DetailPeminjaman, foreignKey: 'id_peminjaman', as: 'barang' });
Barang.belongsToMany(Peminjaman, { through: DetailPeminjaman, foreignKey: 'id_barang', as: 'peminjaman' });

// Relasi tambahan untuk memudahkan query
Peminjaman.hasMany(DetailPeminjaman, { foreignKey: 'id_peminjaman', as: 'detail_peminjaman' });
DetailPeminjaman.belongsTo(Peminjaman, { foreignKey: 'id_peminjaman' });
DetailPeminjaman.belongsTo(Barang, { foreignKey: 'id_barang', as: 'barang' });

module.exports = {
  Pengguna,
  Kategori,
  Lokasi,
  Barang,
  Peminjaman,
  DetailPeminjaman
};