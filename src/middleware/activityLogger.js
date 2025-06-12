const { HistoriAktivitas } = require('../models');

// Middleware untuk mencatat aktivitas CRUD
const logActivity = (jenis_aktivitas, modul) => {
  return async (req, res, next) => {
    // Simpan data original untuk perbandingan
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override res.send dan res.json untuk menangkap response
    res.send = function(data) {
      res.locals.responseData = data;
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      res.locals.responseData = data;
      return originalJson.call(this, data);
    };
    
    // Simpan informasi request
    res.locals.activityInfo = {
      jenis_aktivitas,
      modul,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      id_pengguna: req.pengguna?.id
    };
    
    next();
  };
};

// Fungsi untuk mencatat aktivitas setelah operasi berhasil
const recordActivity = async (req, res, next) => {
  try {
    const { activityInfo, responseData } = res.locals;
    
    console.log('=== ACTIVITY LOGGER DEBUG ===');
    console.log('Activity Info:', activityInfo);
    console.log('Response Data:', responseData);
    
    if (!activityInfo || !activityInfo.id_pengguna) {
      console.log('No activity info or user ID, skipping...');
      return next();
    }
    
    // Parse response data jika berupa string
    let parsedResponse;
    try {
      parsedResponse = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    } catch (e) {
      parsedResponse = responseData;
    }
    
    console.log('Parsed Response:', parsedResponse);
    
    // Hanya catat jika operasi berhasil (support both 'success' and 'sukses')
    if (parsedResponse?.success || parsedResponse?.sukses) {
      console.log('Operation successful, recording activity...');
      const {
        jenis_aktivitas,
        modul,
        ip_address,
        user_agent,
        id_pengguna
      } = activityInfo;
      
      let deskripsi = '';
      let id_objek = null;
      let nama_objek = null;
      let data_sebelum = null;
      let data_sesudah = null;
      
      // Generate deskripsi berdasarkan jenis aktivitas dan modul
      switch (jenis_aktivitas) {
        case 'create':
          if (parsedResponse.data) {
            id_objek = parsedResponse.data.id;
            nama_objek = parsedResponse.data.nama || parsedResponse.data.nama_barang || parsedResponse.data.nama_peminjam || 'Item baru';
            data_sesudah = parsedResponse.data;
          }
          deskripsi = `Menambahkan ${modul} baru: ${nama_objek}`;
          break;
          
        case 'update':
          if (req.params.id) {
            id_objek = req.params.id;
          }
          if (req.body) {
            nama_objek = req.body.nama || req.body.nama_barang || req.body.nama_peminjam || `${modul} ID ${id_objek}`;
            data_sesudah = req.body;
          }
          if (res.locals.originalData) {
            data_sebelum = res.locals.originalData;
          }
          deskripsi = `Mengubah data ${modul}: ${nama_objek}`;
          break;
          
        case 'delete':
          if (req.params.id) {
            id_objek = req.params.id;
          }
          if (res.locals.originalData) {
            data_sebelum = res.locals.originalData;
            nama_objek = res.locals.originalData.nama || res.locals.originalData.nama_barang || res.locals.originalData.nama_peminjam || `${modul} ID ${id_objek}`;
          }
          deskripsi = `Menghapus ${modul}: ${nama_objek}`;
          break;
          
        case 'login':
          deskripsi = `Pengguna berhasil login ke sistem`;
          break;
          
        case 'logout':
          deskripsi = `Pengguna logout dari sistem`;
          break;
      }
      
      // Simpan ke database
      const newActivity = await HistoriAktivitas.create({
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
        waktu_aktivitas: new Date()
      });
      
      console.log('Activity successfully recorded:', newActivity.toJSON());
    } else {
      console.log('Operation not successful, skipping activity recording...');
      console.log('Success field:', parsedResponse?.success);
      console.log('Sukses field:', parsedResponse?.sukses);
    }
  } catch (error) {
    console.error('Error recording activity:', error);
    // Jangan mengganggu flow utama jika logging gagal
  }
  
  next();
};

// Middleware untuk menyimpan data original sebelum update/delete
const saveOriginalData = (model) => {
  return async (req, res, next) => {
    try {
      if (req.params.id) {
        const originalData = await model.findByPk(req.params.id);
        if (originalData) {
          res.locals.originalData = originalData.toJSON();
        }
      }
    } catch (error) {
      console.error('Error saving original data:', error);
    }
    next();
  };
};

module.exports = {
  logActivity,
  recordActivity,
  saveOriginalData
};