// File indeks untuk mengekspor semua model
const Pengguna = require('./Pengguna');
const Kategori = require('./Kategori');
const Lokasi = require('./Lokasi');
const Barang = require('./Barang');
const { Peminjaman, DetailPeminjaman } = require('./Peminjaman');
const Transaksi = require('./Transaksi');
const HistoriAktivitas = require('./HistoriAktivitas');

// Definisi relasi antar model

// Relasi Barang dengan Kategori dan Lokasi
Barang.belongsTo(Kategori, { foreignKey: 'id_kategori', as: 'kategori' });
Kategori.hasMany(Barang, { foreignKey: 'id_kategori', as: 'barang' });

Barang.belongsTo(Lokasi, { foreignKey: 'id_lokasi', as: 'lokasi' });
Lokasi.hasMany(Barang, { foreignKey: 'id_lokasi', as: 'barang' });

// Relasi Peminjaman dengan Pengguna (pembuat peminjaman)
Peminjaman.belongsTo(Pengguna, { foreignKey: 'id_pengguna', as: 'pengguna' });
Pengguna.hasMany(Peminjaman, { foreignKey: 'id_pengguna', as: 'peminjaman' });

// Relasi Peminjaman dengan Pengguna (kepala lab yang menyetujui)
Peminjaman.belongsTo(Pengguna, { foreignKey: 'id_kepala_lab', as: 'kepala_lab' });
Pengguna.hasMany(Peminjaman, { foreignKey: 'id_kepala_lab', as: 'peminjaman_disetujui' });

// Relasi many-to-many Peminjaman dengan Barang melalui DetailPeminjaman
Peminjaman.belongsToMany(Barang, { through: DetailPeminjaman, foreignKey: 'id_peminjaman', as: 'barang' });
Barang.belongsToMany(Peminjaman, { through: DetailPeminjaman, foreignKey: 'id_barang', as: 'peminjaman' });

// Relasi tambahan untuk memudahkan query
Peminjaman.hasMany(DetailPeminjaman, { foreignKey: 'id_peminjaman', as: 'detail_peminjaman' });
DetailPeminjaman.belongsTo(Peminjaman, { foreignKey: 'id_peminjaman' });
DetailPeminjaman.belongsTo(Barang, { foreignKey: 'id_barang', as: 'barang' });

// Relasi Transaksi dengan Barang dan Pengguna
Transaksi.belongsTo(Barang, { foreignKey: 'id_barang', as: 'barang' });
Barang.hasMany(Transaksi, { foreignKey: 'id_barang', as: 'transaksi' });

Transaksi.belongsTo(Pengguna, { foreignKey: 'id_pengguna', as: 'pengguna' });
Pengguna.hasMany(Transaksi, { foreignKey: 'id_pengguna', as: 'transaksi' });

// Relasi HistoriAktivitas dengan Pengguna
HistoriAktivitas.belongsTo(Pengguna, { foreignKey: 'id_pengguna', as: 'pengguna' });
Pengguna.hasMany(HistoriAktivitas, { foreignKey: 'id_pengguna', as: 'histori_aktivitas' });

module.exports = {
  Pengguna,
  Kategori,
  Lokasi,
  Barang,
  Peminjaman,
  DetailPeminjaman,
  Transaksi,
  HistoriAktivitas
};