const { HistoriAktivitas, Pengguna } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/basisdata');

// Get all activity history with filters
const getAllHistoriAktivitas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      jenis_aktivitas,
      modul,
      tanggal_mulai,
      tanggal_akhir,
      id_pengguna,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    const penggunaWhereClause = {};

    // Filter by activity type
    if (jenis_aktivitas) {
      whereClause.jenis_aktivitas = jenis_aktivitas;
    }

    // Filter by module
    if (modul) {
      whereClause.modul = modul;
    }

    // Filter by date range
    if (tanggal_mulai && tanggal_akhir) {
      whereClause.waktu_aktivitas = {
        [Op.between]: [tanggal_mulai, tanggal_akhir]
      };
    }

    // Filter by user
    if (id_pengguna) {
      whereClause.id_pengguna = id_pengguna;
    }

    // Search in description or object name
    if (search) {
      whereClause[Op.or] = [
        {
          deskripsi: {
            [Op.like]: `%${search}%`
          }
        },
        {
          nama_objek: {
            [Op.like]: `%${search}%`
          }
        }
      ];
    }

    const { count, rows } = await HistoriAktivitas.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama', 'nama_pengguna'],
          where: Object.keys(penggunaWhereClause).length > 0 ? penggunaWhereClause : undefined
        }
      ],
      order: [['waktu_aktivitas', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data histori aktivitas',
      error: error.message
    });
  }
};

// Get activity history by ID
const getHistoriAktivitasById = async (req, res) => {
  try {
    const { id } = req.params;

    const histori = await HistoriAktivitas.findByPk(id, {
      include: [
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama', 'nama_pengguna']
        }
      ]
    });

    if (!histori) {
      return res.status(404).json({
        success: false,
        message: 'Histori aktivitas tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: histori
    });
  } catch (error) {
    console.error('Error getting activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data histori aktivitas',
      error: error.message
    });
  }
};

// Get activity statistics
const getStatistikAktivitas = async (req, res) => {
  try {
    const { tanggal_mulai, tanggal_akhir } = req.query;
    
    let whereClause = {};
    if (tanggal_mulai && tanggal_akhir) {
      whereClause.waktu_aktivitas = {
        [Op.between]: [tanggal_mulai, tanggal_akhir]
      };
    }

    // Statistik berdasarkan jenis aktivitas
    const statistikJenis = await HistoriAktivitas.findAll({
      attributes: [
        'jenis_aktivitas',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah']
      ],
      where: whereClause,
      group: ['jenis_aktivitas'],
      raw: true
    });

    // Statistik berdasarkan modul
    const statistikModul = await HistoriAktivitas.findAll({
      attributes: [
        'modul',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah']
      ],
      where: whereClause,
      group: ['modul'],
      raw: true
    });

    // Aktivitas terbaru
    const aktivitasTerbaru = await HistoriAktivitas.findAll({
      where: whereClause,
      include: [
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['nama']
        }
      ],
      order: [['waktu_aktivitas', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        statistik_jenis: statistikJenis,
        statistik_modul: statistikModul,
        aktivitas_terbaru: aktivitasTerbaru
      }
    });
  } catch (error) {
    console.error('Error getting activity statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik aktivitas',
      error: error.message
    });
  }
};

// Manual activity logging (for special cases)
const createHistoriAktivitas = async (req, res) => {
  try {
    const {
      jenis_aktivitas,
      modul,
      id_objek,
      nama_objek,
      deskripsi,
      data_sebelum,
      data_sesudah
    } = req.body;

    const id_pengguna = req.pengguna.id;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    const histori = await HistoriAktivitas.create({
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

    res.status(201).json({
      success: true,
      message: 'Histori aktivitas berhasil dicatat',
      data: histori
    });
  } catch (error) {
    console.error('Error creating activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mencatat histori aktivitas',
      error: error.message
    });
  }
};

module.exports = {
  getAllHistoriAktivitas,
  getHistoriAktivitasById,
  getStatistikAktivitas,
  createHistoriAktivitas
};