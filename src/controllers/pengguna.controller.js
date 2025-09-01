const { Pengguna, HistoriAktivitas, Peminjaman, Transaksi } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/basisdata');

// Mendapatkan semua pengguna
exports.dapatkanSemuaPengguna = async (req, res) => {
  try {
    const { cari, halaman = 1, batas = 10, peran } = req.query;
    const offset = (halaman - 1) * batas;
    
    // Buat kondisi pencarian dan filter peran
    const kondisi = {};

    if (cari) {
      kondisi[Op.or] = [
        { nama: { [Op.like]: `%${cari}%` } },
        { nama_pengguna: { [Op.like]: `%${cari}%` } }
      ];
    }

    if (peran) {
      kondisi.peran = peran;
    }
    
    // Hitung total pengguna
    const totalPengguna = await Pengguna.count({ where: kondisi });
    
    // Dapatkan pengguna dengan pagination
    const pengguna = await Pengguna.findAll({
      where: kondisi,
      attributes: { exclude: ['kata_sandi'] },
      limit: parseInt(batas),
      offset: offset,
      order: [['id', 'ASC']]
    });
    
    res.status(200).json({
      sukses: true,
      data: pengguna,
      pagination: {
        halaman: parseInt(halaman),
        batas: parseInt(batas),
        total: totalPengguna,
        total_halaman: Math.ceil(totalPengguna / batas)
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Mendapatkan pengguna berdasarkan ID
exports.dapatkanPenggunaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pengguna = await Pengguna.findByPk(id, {
      attributes: { exclude: ['kata_sandi'] }
    });
    
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    res.status(200).json({
      sukses: true,
      data: pengguna
    });
    
  } catch (error) {
    console.error('Kesalahan mendapatkan pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Membuat pengguna baru
exports.buatPengguna = async (req, res) => {
  try {
    const { nama, nama_pengguna, kata_sandi, peran = 'staf' } = req.body;
    
    // Validasi input
    if (!nama || !nama_pengguna || !kata_sandi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama, nama pengguna, dan kata sandi diperlukan.'
      });
    }
    
    // Periksa apakah nama pengguna sudah ada
    const penggunaSudahAda = await Pengguna.findOne({
      where: { nama_pengguna }
    });
    
    if (penggunaSudahAda) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Nama pengguna sudah digunakan.'
      });
    }
    
    // Buat pengguna baru
    const penggunaBaru = await Pengguna.create({
      nama,
      nama_pengguna,
      kata_sandi,
      peran,
      aktif: true
    });
    
    // Hapus kata sandi dari respons
    const respons = penggunaBaru.toJSON();
    delete respons.kata_sandi;
    
    res.status(201).json({
      sukses: true,
      pesan: 'Pengguna berhasil dibuat.',
      data: respons
    });
    
  } catch (error) {
    console.error('Kesalahan membuat pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Memperbarui pengguna
exports.perbaruiPengguna = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nama_pengguna, peran, aktif, kata_sandi } = req.body;
    
    // Cari pengguna yang akan diperbarui
    const pengguna = await Pengguna.findByPk(id);
    
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Periksa apakah nama pengguna sudah digunakan oleh pengguna lain
    if (nama_pengguna && nama_pengguna !== pengguna.nama_pengguna) {
      const penggunaSudahAda = await Pengguna.findOne({
        where: {
          nama_pengguna,
          id: { [Op.ne]: id }
        }
      });
      
      if (penggunaSudahAda) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Nama pengguna sudah digunakan.'
        });
      }
    }
    
    // Perbarui data pengguna
    if (nama) pengguna.nama = nama;
    if (nama_pengguna) pengguna.nama_pengguna = nama_pengguna;
    if (peran) pengguna.peran = peran;
    if (aktif !== undefined) pengguna.aktif = aktif;
    if (kata_sandi) pengguna.kata_sandi = kata_sandi; // Update password if provided
    
    await pengguna.save();
    
    // Hapus kata sandi dari respons
    const respons = pengguna.toJSON();
    delete respons.kata_sandi;
    
    res.status(200).json({
      sukses: true,
      pesan: 'Pengguna berhasil diperbarui.',
      data: respons
    });
    
  } catch (error) {
    console.error('Kesalahan memperbarui pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Reset kata sandi pengguna
exports.resetKataSandi = async (req, res) => {
  try {
    const { id } = req.params;
    const { kata_sandi_baru } = req.body;
    
    if (!kata_sandi_baru) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Kata sandi baru diperlukan.'
      });
    }
    
    // Cari pengguna yang akan diperbarui
    const pengguna = await Pengguna.findByPk(id);
    
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Reset kata sandi
    pengguna.kata_sandi = kata_sandi_baru;
    await pengguna.save();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Kata sandi pengguna berhasil direset.'
    });
    
  } catch (error) {
    console.error('Kesalahan reset kata sandi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Menghapus pengguna
exports.hapusPengguna = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Cari pengguna yang akan dihapus
    const pengguna = await Pengguna.findByPk(id, { transaction });
    
    if (!pengguna) {
      await transaction.rollback();
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Periksa apakah pengguna yang akan dihapus adalah admin terakhir
    if (pengguna.peran === 'admin') {
      const jumlahAdmin = await Pengguna.count({
        where: { peran: 'admin' },
        transaction
      });
      
      if (jumlahAdmin <= 1) {
        await transaction.rollback();
        return res.status(400).json({
          sukses: false,
          pesan: 'Tidak dapat menghapus admin terakhir.'
        });
      }
    }
    
    // Hapus data histori aktivitas yang terkait
    const jumlahHistori = await HistoriAktivitas.count({
      where: { id_pengguna: id },
      transaction
    });
    
    if (jumlahHistori > 0) {
      await HistoriAktivitas.destroy({
        where: { id_pengguna: id },
        transaction
      });
    }
    
    // Periksa apakah user memiliki data peminjaman
    const jumlahPeminjaman = await Peminjaman.count({
      where: {
        [Op.or]: [
          { id_pengguna: id },
          { id_kepala_lab: id }
        ]
      },
      transaction
    });
    
    if (jumlahPeminjaman > 0) {
      await transaction.rollback();
      return res.status(400).json({
        sukses: false,
        pesan: `Tidak dapat menghapus pengguna karena memiliki ${jumlahPeminjaman} data peminjaman. Silakan nonaktifkan pengguna atau hapus data peminjaman terlebih dahulu.`,
        detail: {
          jumlah_peminjaman: jumlahPeminjaman
        }
      });
    }
    
    // Periksa apakah user memiliki data transaksi
    const jumlahTransaksi = await Transaksi.count({
      where: { id_pengguna: id },
      transaction
    });
    
    if (jumlahTransaksi > 0) {
      await transaction.rollback();
      return res.status(400).json({
        sukses: false,
        pesan: `Tidak dapat menghapus pengguna karena memiliki ${jumlahTransaksi} data transaksi. Silakan nonaktifkan pengguna atau hapus data transaksi terlebih dahulu.`,
        detail: {
          jumlah_transaksi: jumlahTransaksi
        }
      });
    }
    
    // Hapus pengguna
    await pengguna.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    
    res.status(200).json({
      sukses: true,
      pesan: 'Pengguna berhasil dihapus beserta data terkait.',
      detail: {
        histori_dihapus: jumlahHistori
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Kesalahan menghapus pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.',
      error: error.message
    });
  }
};

// Mendapatkan semua pengguna untuk dropdown (hanya nama dan id)
exports.dapatkanSemuaPenggunaDropdown = async (req, res) => {
  try {
    const pengguna = await Pengguna.findAll({
      attributes: ['id', 'nama', 'nama_pengguna', 'peran'],
      where: {
        aktif: true
      },
      order: [['nama', 'ASC']]
    });

    res.status(200).json({
      sukses: true,
      data: pengguna
    });

  } catch (error) {
    console.error('Kesalahan mendapatkan dropdown pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.'
    });
  }
};

// Menonaktifkan pengguna (alternatif yang lebih aman daripada menghapus)
exports.nonaktifkanPengguna = async (req, res) => {
  try {
    const { id } = req.params;
    const penggunaLogin = req.pengguna; // Pengguna yang sedang login
    
    // Cari pengguna yang akan dinonaktifkan
    const pengguna = await Pengguna.findByPk(id);
    
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Periksa apakah pengguna mencoba menonaktifkan dirinya sendiri
    if (parseInt(id) === penggunaLogin.id) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Anda tidak dapat menonaktifkan akun Anda sendiri.'
      });
    }
    
    // Periksa apakah pengguna yang akan dinonaktifkan adalah admin terakhir
    if (pengguna.peran === 'admin') {
      const jumlahAdminAktif = await Pengguna.count({
        where: { 
          peran: 'admin',
          aktif: true
        }
      });
      
      if (jumlahAdminAktif <= 1) {
        return res.status(400).json({
          sukses: false,
          pesan: 'Tidak dapat menonaktifkan admin terakhir.'
        });
      }
    }
    
    // Nonaktifkan pengguna
    await pengguna.update({ aktif: false });
    
    res.status(200).json({
      sukses: true,
      pesan: `Pengguna ${pengguna.nama} berhasil dinonaktifkan.`,
      data: {
        id: pengguna.id,
        nama: pengguna.nama,
        nama_pengguna: pengguna.nama_pengguna,
        aktif: pengguna.aktif
      }
    });
    
  } catch (error) {
    console.error('Kesalahan menonaktifkan pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.',
      error: error.message
    });
  }
};

// Mengaktifkan kembali pengguna
exports.aktifkanPengguna = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cari pengguna yang akan diaktifkan
    const pengguna = await Pengguna.findByPk(id);
    
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Aktifkan pengguna
    await pengguna.update({ aktif: true });
    
    res.status(200).json({
      sukses: true,
      pesan: `Pengguna ${pengguna.nama} berhasil diaktifkan.`,
      data: {
        id: pengguna.id,
        nama: pengguna.nama,
        nama_pengguna: pengguna.nama_pengguna,
        aktif: pengguna.aktif
      }
    });
    
  } catch (error) {
    console.error('Kesalahan mengaktifkan pengguna:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.',
      error: error.message
    });
  }
};