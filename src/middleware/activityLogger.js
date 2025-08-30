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
            deskripsi = `menambahkan ${modul} baru: ${
              data?.nama || data?.kode
            }`;
            id_objek = data?.id;
            nama_objek = data?.nama || data?.kode;
            data_sesudah = JSON.stringify(data);
            break;
          case 'update':
            deskripsi = `memperbarui ${modul}: ${
              data?.nama || data?.kode
            }`;
            id_objek = data?.id;
            nama_objek = data?.nama || data?.kode;
            data_sebelum = originalData
              ? JSON.stringify(originalData)
              : null;
            data_sesudah = JSON.stringify(data);
            break;
          case 'delete':
            deskripsi = `menghapus ${modul}: ${
              originalData?.nama || originalData?.kode
            }`;
            id_objek = originalData?.id;
            nama_objek = originalData?.nama || originalData?.kode;
            data_sebelum = originalData
              ? JSON.stringify(originalData)
              : null;
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
      const instance = await Model.findByPk(req.params.id);
      if (instance) {
        res.locals.originalData = instance.get({ plain: true });
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