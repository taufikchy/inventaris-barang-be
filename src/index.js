require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/basisdata');

// Import rute-rute
const ruteAuth = require('./routes/auth.routes');
const rutePengguna = require('./routes/pengguna.routes');
const ruteBarang = require('./routes/barang.routes');
const ruteKategori = require('./routes/kategori.routes');
const ruteLokasi = require('./routes/lokasi.routes');
const rutePeminjaman = require('./routes/peminjaman.routes');
const ruteTransaksi = require('./routes/transaksi.routes');
const ruteHistoriAktivitas = require('./routes/historiAktivitas.routes');
const ruteLaporan = require('./routes/laporan.routes');
const ruteDashboard = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5001; // Changed port

// Trust proxy untuk mendapatkan IP address yang benar
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: ['http://localhost:5001', 'http://localhost:5002', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from the public directory
app.use(express.static('public'));
console.log('Serving static files from:', require('path').resolve('public'));

// Koneksi database
sequelize.authenticate()
  .then(() => console.log('Database MySQL berhasil terhubung'))
  .catch(err => console.error('Kesalahan koneksi database MySQL:', err));

// Sinkronisasi model dengan database
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: false }) // Ubah dari alter: true menjadi alter: false
    .then(() => console.log('Database berhasil disinkronisasi'))
    .catch(err => console.error('Kesalahan sinkronisasi database:', err));
}

// Rute-rute API
app.use('/api/auth', ruteAuth);
app.use('/api/pengguna', rutePengguna);
app.use('/api/barang', ruteBarang);
app.use('/api/kategori', ruteKategori);
app.use('/api/lokasi', ruteLokasi);
app.use('/api/peminjaman', rutePeminjaman);
app.use('/api/transaksi', ruteTransaksi);
app.use('/api/histori-aktivitas', ruteHistoriAktivitas);
app.use('/api/laporan', ruteLaporan);
app.use('/api/dashboard', ruteDashboard);

// Endpoint status
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'Server sedang berjalan', waktu: new Date() });
});

// Middleware penanganan kesalahan
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    sukses: false,
    pesan: 'Terjadi kesalahan pada server',
    kesalahan: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Mulai server
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
}); // Updated for status fix
