const { HistoriAktivitas } = require('../models');

// Helper function untuk logging aktivitas login/logout
const logAuthActivity = async (jenis_aktivitas, pengguna, req) => {
  try {
    const ip_address = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null) || '127.0.0.1';
    const user_agent = req.get('User-Agent');
    
    let deskripsi = '';
    if (jenis_aktivitas === 'login') {
      deskripsi = `Pengguna ${pengguna.nama} (${pengguna.nama_pengguna}) berhasil login.`;
    } else if (jenis_aktivitas === 'logout') {
      deskripsi = `Pengguna ${pengguna.nama} (${pengguna.nama_pengguna}) berhasil logout.`;
    }
    
    await HistoriAktivitas.create({
      id_pengguna: pengguna.id,
      jenis_aktivitas,
      modul: 'auth',
      id_objek: pengguna.id,
      nama_objek: pengguna.nama,
      deskripsi,
      data_sebelum: null,
      data_sesudah: null,
      ip_address,
      user_agent,
    });
  } catch (error) {
    console.error('Gagal menyimpan histori aktivitas auth:', error);
  }
};

// Middleware untuk mencatat aktivitas CRUD
const logActivity = (jenis_aktivitas, modul) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.locals.activityInfo = {
      jenis_aktivitas,
      modul,
      ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null) || '127.0.0.1',
      user_agent: req.get('User-Agent'),
      id_pengguna: req.pengguna?.id,
    };

    res.json = function (data) {
      res.locals.responseData = data;
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      const { activityInfo, responseData, originalData } = res.locals;

      if (!activityInfo || !activityInfo.id_pengguna) {
        return;
      }

      let parsedResponse;
      try {
        parsedResponse =
          typeof responseData === 'string'
            ? JSON.parse(responseData)
            : responseData;
      } catch (e) {
        parsedResponse = responseData;
      }

      if (parsedResponse?.success || parsedResponse?.sukses) {
        const {
          jenis_aktivitas,
          modul,
          ip_address,
          user_agent,
          id_pengguna,
        } = activityInfo;

        let deskripsi = '';
        let id_objek = null;
        let nama_objek = null;
        let data_sebelum = null;
        let data_sesudah = null;

        const data = parsedResponse.data || parsedResponse.barang;

        switch (jenis_aktivitas) {
          case 'create':
            if (modul === 'peminjaman') {
              deskripsi = `Menambahkan ${modul} baru untuk ${data?.nama_peminjam || 'peminjam'}`;
              id_objek = data?.id;
              nama_objek = data?.kode_peminjaman || data?.nama_peminjam || `Peminjaman #${data?.id}`;
            } else if (modul === 'transaksi') {
              const jenisTransaksi = data?.jenis_transaksi || 'transaksi';
              const namaBarang = data?.barang?.nama || data?.nama_barang || 'barang';
              deskripsi = `Menambahkan transaksi ${jenisTransaksi} untuk barang: ${namaBarang}`;
              id_objek = data?.id;
              nama_objek = `Transaksi ${jenisTransaksi} - ${namaBarang}`;
            } else {
              deskripsi = `Menambahkan ${modul} baru: ${data?.nama || data?.kode || 'item baru'}`;
              id_objek = data?.id;
              nama_objek = data?.nama || data?.kode || `${modul} #${data?.id}`;
            }
            data_sesudah = JSON.stringify(data);
            break;
          case 'update':
            if (modul === 'peminjaman') {
              deskripsi = `Memperbarui ${modul} untuk ${data?.nama_peminjam || originalData?.nama_peminjam || 'peminjam'}`;
              id_objek = data?.id || originalData?.id;
              nama_objek = data?.kode_peminjaman || originalData?.kode_peminjaman || data?.nama_peminjam || originalData?.nama_peminjam || `Peminjaman #${data?.id || originalData?.id}`;
            } else if (modul === 'transaksi') {
              const jenisTransaksi = data?.jenis_transaksi || originalData?.jenis_transaksi || 'transaksi';
              const namaBarang = data?.barang?.nama || originalData?.barang?.nama || data?.nama_barang || originalData?.nama_barang || 'barang';
              deskripsi = `Memperbarui transaksi ${jenisTransaksi} untuk barang: ${namaBarang}`;
              id_objek = data?.id || originalData?.id;
              nama_objek = `Transaksi ${jenisTransaksi} - ${namaBarang}`;
            } else {
              deskripsi = `Memperbarui ${modul}: ${data?.nama || data?.kode || originalData?.nama || originalData?.kode || 'item'}`;
              id_objek = data?.id || originalData?.id;
              nama_objek = data?.nama || data?.kode || originalData?.nama || originalData?.kode || `${modul} #${data?.id || originalData?.id}`;
            }
            data_sebelum = originalData ? JSON.stringify(originalData) : null;
            data_sesudah = JSON.stringify(data);
            break;
          case 'delete':
            if (modul === 'peminjaman') {
              deskripsi = `Menghapus ${modul} untuk ${originalData?.nama_peminjam || 'peminjam'}`;
              id_objek = originalData?.id;
              nama_objek = originalData?.kode_peminjaman || originalData?.nama_peminjam || `Peminjaman #${originalData?.id}`;
            } else if (modul === 'transaksi') {
              const jenisTransaksi = originalData?.jenis_transaksi || 'transaksi';
              const namaBarang = originalData?.barang?.nama || originalData?.nama_barang || 'barang';
              deskripsi = `Menghapus transaksi ${jenisTransaksi} untuk barang: ${namaBarang}`;
              id_objek = originalData?.id;
              nama_objek = `Transaksi ${jenisTransaksi} - ${namaBarang}`;
            } else {
              deskripsi = `Menghapus ${modul}: ${originalData?.nama || originalData?.kode || 'item'}`;
              id_objek = originalData?.id;
              nama_objek = originalData?.nama || originalData?.kode || `${modul} #${originalData?.id}`;
            }
            data_sebelum = originalData ? JSON.stringify(originalData) : null;
            break;
          case 'login':
            deskripsi = `Pengguna ${
              req.pengguna.nama
            } (${req.pengguna.email}) berhasil login.`;
            id_objek = req.pengguna.id;
            nama_objek = req.pengguna.nama;
            break;
          case 'logout':
            deskripsi = `Pengguna ${
              req.pengguna.nama
            } (${req.pengguna.email}) berhasil logout.`;
            id_objek = req.pengguna.id;
            nama_objek = req.pengguna.nama;
            break;
        }

        try {
          await HistoriAktivitas.create({
            id_pengguna,
            jenis_aktivitas,
            modul,
            id_objek,
            nama_objek,
            deskripsi,
            data_sebelum,
            data_sesudah,
            ip_address,
            user_agent,
          });
        } catch (error) {
          console.error('Gagal menyimpan histori aktivitas:', error);
        }
      }
    });

    next();
  };
};

// Middleware untuk menyimpan data asli sebelum update/delete
const saveOriginalData = (Model) => {
  return async (req, res, next) => {
    try {
      // Tentukan include berdasarkan model
      let includeOptions = [];
      
      if (Model.name === 'Barang') {
        const { Kategori, Lokasi } = require('../models');
        includeOptions = [
          { model: Kategori, as: 'kategori', attributes: ['id', 'nama'] },
          { model: Lokasi, as: 'lokasi', attributes: ['id', 'nama'] }
        ];
      } else if (Model.name === 'Peminjaman') {
        const { Pengguna, DetailPeminjaman, Barang } = require('../models');
        includeOptions = [
          { model: Pengguna, as: 'pengguna', attributes: ['id', 'nama'] },
          { 
            model: DetailPeminjaman, 
            as: 'detail_peminjaman',
            include: [{ model: Barang, as: 'barang', attributes: ['id', 'nama'] }]
          }
        ];
      }
      
      const instance = await Model.findByPk(req.params.id, {
        include: includeOptions
      });
      
      if (instance) {
        const originalData = instance.get({ plain: true });
        
        // Tambahkan nama kategori dan lokasi untuk model Barang
        if (Model.name === 'Barang') {
          if (originalData.kategori) {
            originalData.nama_kategori = originalData.kategori.nama;
          }
          if (originalData.lokasi) {
            originalData.nama_lokasi = originalData.lokasi.nama;
          }
          
          // Konversi kondisi dan status ke format frontend untuk konsistensi
          const kondisiFrontendMapping = {
            'baik': 'Baik',
            'rusak_ringan': 'Rusak Ringan',
            'rusak_berat': 'Rusak Berat'
          };
          
          const statusFrontendMapping = {
            'tersedia': 'Tersedia',
            'dipinjam': 'Dipinjam',
            'perbaikan': 'Perbaikan',
            'dihapuskan': 'Dihapuskan'
          };
          
          if (originalData.kondisi) {
            originalData.kondisi = kondisiFrontendMapping[originalData.kondisi] || originalData.kondisi;
          }
          if (originalData.status) {
            originalData.status = statusFrontendMapping[originalData.status] || originalData.status;
          }
        }
        
        res.locals.originalData = originalData;
      }
    } catch (error) {
      console.error('Gagal menyimpan data asli:', error);
    }
    next();
  };
};

module.exports = {
  logActivity,
  saveOriginalData,
  logAuthActivity,
};