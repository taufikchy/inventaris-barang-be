const { HistoriAktivitas, Pengguna, HistoriAktivitasArchive } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/basisdata');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');
const ArchiveService = require('../services/archiveService');

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
      role_pengguna,
      search
    } = req.query;

    // Batasi limit maksimum untuk mencegah overload memory
    const maxLimit = 100;
    const actualLimit = Math.min(parseInt(limit), maxLimit);
    const offset = (page - 1) * actualLimit;
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

    // Filter by user role
    if (role_pengguna) {
      penggunaWhereClause.peran = role_pengguna;
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
          attributes: ['id', 'nama', 'nama_pengguna', 'peran'],
          where: Object.keys(penggunaWhereClause).length > 0 ? penggunaWhereClause : undefined
        }
      ],
      order: [['waktu_aktivitas', 'DESC']],
      limit: actualLimit,
      offset: parseInt(offset),
      distinct: true // Optimasi untuk count yang akurat dengan include
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: actualLimit,
        maxLimit: maxLimit,
        totalPages: Math.ceil(count / actualLimit)
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
          attributes: ['id', 'nama', 'nama_pengguna', 'peran']
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

// Export activity history to Excel/CSV
const eksporHistoriAktivitas = async (req, res) => {
  try {
    const {
      format = 'excel', // excel or csv
      jenis_aktivitas,
      modul,
      tanggal_mulai,
      tanggal_akhir,
      id_pengguna,
      role_pengguna,
      periode = 'semua' // hari_ini, minggu_ini, bulan_ini, semua
    } = req.query;

    const whereClause = {};
    const penggunaWhereClause = {};

    // Set date range based on periode
    const now = new Date();
    if (periode === 'hari_ini') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      whereClause.waktu_aktivitas = {
        [Op.between]: [startOfDay, endOfDay]
      };
    } else if (periode === 'minggu_ini') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      whereClause.waktu_aktivitas = {
        [Op.between]: [startOfWeek, endOfWeek]
      };
    } else if (periode === 'bulan_ini') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      whereClause.waktu_aktivitas = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    } else if (periode === 'custom' && tanggal_mulai && tanggal_akhir) {
      whereClause.waktu_aktivitas = {
        [Op.between]: [tanggal_mulai + ' 00:00:00', tanggal_akhir + ' 23:59:59']
      };
    } else if (tanggal_mulai && tanggal_akhir) {
      whereClause.waktu_aktivitas = {
        [Op.between]: [tanggal_mulai, tanggal_akhir]
      };
    }

    // Apply other filters
    if (jenis_aktivitas) {
      whereClause.jenis_aktivitas = jenis_aktivitas;
    }

    if (modul) {
      whereClause.modul = modul;
    }

    if (id_pengguna) {
      whereClause.id_pengguna = id_pengguna;
    }

    if (role_pengguna) {
      penggunaWhereClause.peran = role_pengguna;
    }

    // Get data
    const data = await HistoriAktivitas.findAll({
      where: whereClause,
      include: [
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama', 'nama_pengguna', 'peran'],
          where: Object.keys(penggunaWhereClause).length > 0 ? penggunaWhereClause : undefined
        }
      ],
      order: [['waktu_aktivitas', 'DESC']]
    });

    // Format data for export
    const exportData = data.map((item, index) => ({
      No: index + 1,
      Tanggal: new Date(item.waktu_aktivitas).toLocaleDateString('id-ID'),
      Waktu: new Date(item.waktu_aktivitas).toLocaleTimeString('id-ID'),
      Pengguna: item.pengguna ? item.pengguna.nama : 'N/A',
      'Nama Pengguna': item.pengguna ? item.pengguna.nama_pengguna : 'N/A',
      Role: item.pengguna ? item.pengguna.peran : 'N/A',
      'Jenis Aktivitas': item.jenis_aktivitas,
      Modul: item.modul,
      'Nama Objek': item.nama_objek || 'N/A',
      Deskripsi: item.deskripsi,
      'IP Address': item.ip_address || 'N/A',
      'User Agent': item.user_agent || 'N/A'
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `histori-aktivitas-${periode}-${timestamp}`;

    if (format === 'excel') {
      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Histori Aktivitas');
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(excelBuffer);
    } else if (format === 'csv') {
      // Create CSV file
      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../../temp', `${filename}.csv`),
        header: [
          { id: 'No', title: 'No' },
          { id: 'Tanggal', title: 'Tanggal' },
          { id: 'Waktu', title: 'Waktu' },
          { id: 'Pengguna', title: 'Pengguna' },
          { id: 'Nama Pengguna', title: 'Nama Pengguna' },
          { id: 'Role', title: 'Role' },
          { id: 'Jenis Aktivitas', title: 'Jenis Aktivitas' },
          { id: 'Modul', title: 'Modul' },
          { id: 'Nama Objek', title: 'Nama Objek' },
          { id: 'Deskripsi', title: 'Deskripsi' },
          { id: 'IP Address', title: 'IP Address' },
          { id: 'User Agent', title: 'User Agent' }
        ]
      });

      await csvWriter.writeRecords(exportData);
      
      const csvPath = path.join(__dirname, '../../temp', `${filename}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      const csvStream = fs.createReadStream(csvPath);
      csvStream.pipe(res);
      
      // Clean up temp file after sending
      csvStream.on('end', () => {
        fs.unlink(csvPath, (err) => {
          if (err) console.error('Error deleting temp CSV file:', err);
        });
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Format tidak didukung. Gunakan excel atau csv.'
      });
    }

  } catch (error) {
    console.error('Error exporting activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengekspor histori aktivitas',
      error: error.message
    });
  }
};

// Archive management functions
const archiveOldActivities = async (req, res) => {
  try {
    const { daysOld = 90, batchSize = 1000 } = req.body;
    
    // Hanya admin yang bisa melakukan archive
    if (req.pengguna.peran !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat melakukan archive data'
      });
    }
    
    const result = await ArchiveService.archiveOldActivities(daysOld, batchSize);
    
    res.json({
      success: true,
      message: `Berhasil mengarsipkan ${result.totalArchived} aktivitas`,
      data: result
    });
    
  } catch (error) {
    console.error('Error archiving activities:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengarsipkan data aktivitas',
      error: error.message
    });
  }
};

const getArchiveStats = async (req, res) => {
  try {
    const stats = await ArchiveService.getArchiveStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting archive stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik archive',
      error: error.message
    });
  }
};

const exportArchivedHistoriAktivitas = async (req, res) => {
  try {
    const { 
      format = 'xlsx', 
      pengguna_id, 
      start_date, 
      end_date, 
      search, 
      jenis_aktivitas, 
      modul, 
      role_pengguna, 
      tanggal_mulai, 
      tanggal_akhir,
      periode = 'semua'
    } = req.query;
    
    // Build where conditions
    const whereConditions = {};
    
    if (pengguna_id) {
      whereConditions.pengguna_id = pengguna_id;
    }
    
    // Set date range based on periode
    const now = new Date();
    if (periode === 'hari_ini') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      whereConditions.waktu_aktivitas = {
        [Op.between]: [startOfDay, endOfDay]
      };
    } else if (periode === 'minggu_ini') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      whereConditions.waktu_aktivitas = {
        [Op.between]: [startOfWeek, endOfWeek]
      };
    } else if (periode === 'bulan_ini') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      whereConditions.waktu_aktivitas = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    } else if (periode === 'custom' && tanggal_mulai && tanggal_akhir) {
      whereConditions.waktu_aktivitas = {
        [Op.between]: [tanggal_mulai + ' 00:00:00', tanggal_akhir + ' 23:59:59']
      };
    } else if (start_date && end_date) {
      whereConditions.waktu_aktivitas = {
        [Op.between]: [start_date, end_date]
      };
    } else if (tanggal_mulai && tanggal_akhir) {
      whereConditions.waktu_aktivitas = {
        [Op.between]: [tanggal_mulai + ' 00:00:00', tanggal_akhir + ' 23:59:59']
      };
    }
    
    if (jenis_aktivitas) {
      whereConditions.jenis_aktivitas = jenis_aktivitas;
    }
    
    if (modul) {
      whereConditions.modul = modul;
    }
    
    // Search conditions
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { deskripsi: { [Op.like]: `%${search}%` } },
        { jenis_aktivitas: { [Op.like]: `%${search}%` } },
        { modul: { [Op.like]: `%${search}%` } }
      );
    }
    
    // Include conditions for user role filter
     const includeConditions = {
       model: Pengguna,
       as: 'pengguna',
       attributes: ['nama', 'nama_pengguna', 'peran'],
       required: true
     };
     
     if (role_pengguna) {
       includeConditions.where = { peran: role_pengguna };
     }
    
    const finalWhereConditions = searchConditions.length > 0 
      ? { [Op.and]: [whereConditions, { [Op.or]: searchConditions }] }
      : whereConditions;
    
    // Fetch all archived data (no pagination for export)
    const archivedData = await HistoriAktivitasArchive.findAll({
      where: finalWhereConditions,
      include: [includeConditions],
      order: [['waktu_aktivitas', 'DESC']]
    });
    
    if (archivedData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada data arsip untuk diekspor'
      });
    }
    
    // Format data for export
    const exportData = archivedData.map((item, index) => ({
      'No': index + 1,
      'Nama Pengguna': item.pengguna?.nama || 'N/A',
      'Username': item.pengguna?.nama_pengguna || 'N/A',
      'Role': item.pengguna?.peran || 'N/A',
      'Jenis Aktivitas': item.jenis_aktivitas,
      'Modul': item.modul,
      'Deskripsi': item.deskripsi,
      'IP Address': item.ip_address,
      'User Agent': item.user_agent,
      'Waktu Aktivitas': new Date(item.waktu_aktivitas).toLocaleString('id-ID'),
      'Tanggal Diarsipkan': new Date(item.archived_at).toLocaleString('id-ID')
    }));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `histori-aktivitas-arsip-${periode}-${timestamp}`;
    
    if (format === 'xlsx' || format === 'excel') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Histori Aktivitas Arsip');
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // No
        { wch: 20 },  // Nama Pengguna
        { wch: 25 },  // Email
        { wch: 15 },  // Role
        { wch: 20 },  // Jenis Aktivitas
        { wch: 15 },  // Modul
        { wch: 40 },  // Deskripsi
        { wch: 15 },  // IP Address
        { wch: 30 },  // User Agent
        { wch: 20 },  // Waktu Aktivitas
        { wch: 20 }   // Tanggal Diarsipkan
      ];
      worksheet['!cols'] = colWidths;
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
      
    } else if (format === 'csv') {
      // Create CSV file
      const parser = new Parser();
      const csv = parser.parse(exportData);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send('\uFEFF' + csv); // Add BOM for proper UTF-8 encoding
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Format tidak didukung. Gunakan xlsx atau csv.'
      });
    }
    
  } catch (error) {
    console.error('Error exporting archived histori aktivitas:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengekspor data arsip',
      error: error.message
    });
  }
};

const cleanupOldArchive = async (req, res) => {
  try {
    const { daysOld = 365 } = req.body;
    
    // Hanya admin yang bisa melakukan cleanup
    if (req.pengguna.peran !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat melakukan cleanup archive'
      });
    }
    
    const result = await ArchiveService.cleanupOldArchive(daysOld);
    
    res.json({
      success: true,
      message: `Berhasil membersihkan ${result.deletedCount} data archive lama`,
      data: result
    });
    
  } catch (error) {
    console.error('Error cleaning up archive:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membersihkan data archive',
      error: error.message
    });
  }
};

// Get archived activity history with filters
const getArchivedHistoriAktivitas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      jenis_aktivitas,
      modul,
      tanggal_mulai,
      tanggal_akhir,
      id_pengguna,
      role_pengguna,
      search
    } = req.query;

    // Batasi limit maksimum untuk mencegah overload memory
    const maxLimit = 100;
    const actualLimit = Math.min(parseInt(limit), maxLimit);
    const offset = (page - 1) * actualLimit;
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

    // Filter by user role
    if (role_pengguna) {
      penggunaWhereClause.peran = role_pengguna;
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

    // Get archived data with pagination
    const { count, rows } = await HistoriAktivitasArchive.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama', 'nama_pengguna', 'peran'],
          where: Object.keys(penggunaWhereClause).length > 0 ? penggunaWhereClause : undefined
        }
      ],
      limit: actualLimit,
      offset: offset,
      order: [['waktu_aktivitas', 'DESC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / actualLimit);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: actualLimit,
        totalPages: totalPages,
        maxLimit: maxLimit
      }
    });

  } catch (error) {
    console.error('Error fetching archived activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data histori aktivitas yang diarsip',
      error: error.message
    });
  }
};

module.exports = {
  getAllHistoriAktivitas,
  getHistoriAktivitasById,
  getStatistikAktivitas,
  createHistoriAktivitas,
  eksporHistoriAktivitas,
  archiveOldActivities,
  getArchiveStats,
  cleanupOldArchive,
  getArchivedHistoriAktivitas,
  exportArchivedHistoriAktivitas
};