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

    // Helper function to format date consistently
    const formatTanggal = (date) => {
      return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    };

    const formatWaktu = (date) => {
      return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // Get period description for metadata
    const getPeriodeDescription = () => {
      switch(periode) {
        case 'hari_ini': return 'Hari Ini';
        case 'minggu_ini': return 'Minggu Ini';
        case 'bulan_ini': return 'Bulan Ini';
        case 'custom': return `Custom (${tanggal_mulai} - ${tanggal_akhir})`;
        default: return 'Semua Data';
      }
    };

    // Format data for export
    const exportData = data.map((item, index) => ({
      'No.': index + 1,
      'Tanggal': formatTanggal(item.waktu_aktivitas),
      'Waktu': formatWaktu(item.waktu_aktivitas),
      'Nama Lengkap': item.pengguna ? item.pengguna.nama : 'Tidak Diketahui',
      'Username': item.pengguna ? item.pengguna.nama_pengguna : 'Tidak Diketahui',
      'Role/Peran': item.pengguna ? item.pengguna.peran.toUpperCase() : 'Tidak Diketahui',
      'Jenis Aktivitas': item.jenis_aktivitas.toUpperCase(),
      'Modul Sistem': item.modul.charAt(0).toUpperCase() + item.modul.slice(1),
      'Nama Objek': item.nama_objek || 'Tidak Ada',
      'Deskripsi Aktivitas': item.deskripsi,
      'Alamat IP': item.ip_address || 'Tidak Tercatat',
      'User Agent': item.user_agent ? item.user_agent.substring(0, 100) + (item.user_agent.length > 100 ? '...' : '') : 'Tidak Tercatat'
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `histori-aktivitas-${periode}-${timestamp}`;

    if (format === 'excel') {
      // Create Excel file with enhanced formatting
      const wb = XLSX.utils.book_new();
      
      // Create metadata section
      const metadata = [
        ['LAPORAN HISTORI AKTIVITAS SISTEM'],
        [''],
        ['Tanggal Ekspor:', formatDateTime(new Date())],
        ['Periode Data:', getPeriodeDescription()],
        ['Total Data:', data.length + ' aktivitas'],
        ['Diekspor Oleh:', req.pengguna ? req.pengguna.nama : 'Sistem'],
        [''],
        [''] // Empty row before data
      ];
      
      // Create worksheet starting with metadata
      const ws = XLSX.utils.aoa_to_sheet(metadata);
      
      // Add data starting from row 9 (after metadata)
      XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A9', skipHeader: false });
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 5 },   // No.
        { wch: 12 },  // Tanggal
        { wch: 10 },  // Waktu
        { wch: 25 },  // Nama Lengkap
        { wch: 20 },  // Username
        { wch: 12 },  // Role/Peran
        { wch: 18 },  // Jenis Aktivitas
        { wch: 15 },  // Modul Sistem
        { wch: 20 },  // Nama Objek
        { wch: 40 },  // Deskripsi Aktivitas
        { wch: 15 },  // Alamat IP
        { wch: 30 }   // User Agent
      ];
      ws['!cols'] = colWidths;
      
      // Style the title (A1)
      if (!ws['A1']) ws['A1'] = {};
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: "1F4E79" } },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: "E7F3FF" } }
      };
      
      // Style metadata labels (column A, rows 3-6)
      ['A3', 'A4', 'A5', 'A6'].forEach(cell => {
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = {
          font: { bold: true, color: { rgb: "2F5597" } }
        };
      });
      
      // Style header row (row 9)
      const headerRow = 9;
      const headerCells = ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9'];
      headerCells.forEach(cell => {
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2F5597" } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      });
      
      // Add borders to data cells
      const dataStartRow = 10;
      const dataEndRow = dataStartRow + exportData.length - 1;
      for (let row = dataStartRow; row <= dataEndRow; row++) {
        for (let col = 0; col < 12; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
          if (!ws[cellRef]) ws[cellRef] = {};
          ws[cellRef].s = {
            border: {
              top: { style: 'thin', color: { rgb: "CCCCCC" } },
              bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
              left: { style: 'thin', color: { rgb: "CCCCCC" } },
              right: { style: 'thin', color: { rgb: "CCCCCC" } }
            },
            alignment: { vertical: 'top', wrapText: true }
          };
        }
      }
      
      // Merge title cell across all columns
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Histori Aktivitas');
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(excelBuffer);
    } else if (format === 'csv') {
      // Create CSV file with proper formatting
      const csvHeader = [
        'LAPORAN HISTORI AKTIVITAS SISTEM',
        '',
        `Tanggal Ekspor: ${formatDateTime(new Date())}`,
        `Periode Data: ${getPeriodeDescription()}`,
        `Total Data: ${data.length} aktivitas`,
        `Diekspor Oleh: ${req.pengguna ? req.pengguna.nama : 'Sistem'}`,
        '',
        ''
      ];
      
      // Convert export data to CSV format with proper headers
      const csvData = exportData.map(row => {
        return {
          'No.': row['No.'],
          'Tanggal': row['Tanggal'],
          'Waktu': row['Waktu'],
          'Nama Lengkap': row['Nama Lengkap'],
          'Username': row['Username'],
          'Role/Peran': row['Role/Peran'],
          'Jenis Aktivitas': row['Jenis Aktivitas'],
          'Modul Sistem': row['Modul Sistem'],
          'Nama Objek': row['Nama Objek'],
          'Deskripsi Aktivitas': row['Deskripsi Aktivitas'],
          'Alamat IP': row['Alamat IP'],
          'User Agent': row['User Agent']
        };
      });
      
      // Use json2csv for better CSV formatting
      const parser = new Parser({
        fields: [
          { label: 'No.', value: 'No.' },
          { label: 'Tanggal', value: 'Tanggal' },
          { label: 'Waktu', value: 'Waktu' },
          { label: 'Nama Lengkap', value: 'Nama Lengkap' },
          { label: 'Username', value: 'Username' },
          { label: 'Role/Peran', value: 'Role/Peran' },
          { label: 'Jenis Aktivitas', value: 'Jenis Aktivitas' },
          { label: 'Modul Sistem', value: 'Modul Sistem' },
          { label: 'Nama Objek', value: 'Nama Objek' },
          { label: 'Deskripsi Aktivitas', value: 'Deskripsi Aktivitas' },
          { label: 'Alamat IP', value: 'Alamat IP' },
          { label: 'User Agent', value: 'User Agent' }
        ],
        delimiter: ',',
        quote: '"',
        escape: '"'
      });
      
      const csvContent = parser.parse(csvData);
      
      // Combine header and data
      const finalCsv = csvHeader.join('\n') + '\n' + csvContent;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      // Add BOM for proper UTF-8 encoding in Excel
      res.send('\uFEFF' + finalCsv);
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
    
    // Helper functions for consistent formatting (same as regular export)
    const formatTanggalArsip = (date) => {
      return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    };

    const formatWaktuArsip = (date) => {
      return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const formatDateTimeArsip = (date) => {
      return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // Get period description for metadata
    const getPeriodeDescriptionArsip = () => {
      switch(periode) {
        case 'hari_ini': return 'Hari Ini';
        case 'minggu_ini': return 'Minggu Ini';
        case 'bulan_ini': return 'Bulan Ini';
        case 'custom': return `Custom (${tanggal_mulai} - ${tanggal_akhir})`;
        default: return 'Semua Data';
      }
    };

    // Format data for export with enhanced structure
    const exportData = archivedData.map((item, index) => ({
      'No.': index + 1,
      'Tanggal Aktivitas': formatTanggalArsip(item.waktu_aktivitas),
      'Waktu Aktivitas': formatWaktuArsip(item.waktu_aktivitas),
      'Nama Lengkap': item.pengguna?.nama || 'Tidak Diketahui',
      'Username': item.pengguna?.nama_pengguna || 'Tidak Diketahui',
      'Role/Peran': item.pengguna?.peran ? item.pengguna.peran.toUpperCase() : 'Tidak Diketahui',
      'Jenis Aktivitas': item.jenis_aktivitas.toUpperCase(),
      'Modul Sistem': item.modul.charAt(0).toUpperCase() + item.modul.slice(1),
      'Deskripsi Aktivitas': item.deskripsi,
      'Alamat IP': item.ip_address || 'Tidak Tercatat',
      'User Agent': item.user_agent ? item.user_agent.substring(0, 100) + (item.user_agent.length > 100 ? '...' : '') : 'Tidak Tercatat',
      'Tanggal Diarsipkan': formatTanggalArsip(item.archived_at),
      'Waktu Diarsipkan': formatWaktuArsip(item.archived_at)
    }));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `histori-aktivitas-arsip-${periode}-${timestamp}`;
    
    if (format === 'xlsx' || format === 'excel') {
      // Create Excel file with enhanced formatting
      const wb = XLSX.utils.book_new();
      
      // Create metadata section
      const metadata = [
        ['LAPORAN HISTORI AKTIVITAS ARSIP SISTEM'],
        [''],
        ['Tanggal Ekspor:', formatDateTimeArsip(new Date())],
        ['Periode Data:', getPeriodeDescriptionArsip()],
        ['Total Data:', archivedData.length + ' aktivitas arsip'],
        ['Diekspor Oleh:', req.pengguna ? req.pengguna.nama : 'Sistem'],
        [''],
        [''] // Empty row before data
      ];
      
      // Create worksheet starting with metadata
      const ws = XLSX.utils.aoa_to_sheet(metadata);
      
      // Add data starting from row 9 (after metadata)
      XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A9', skipHeader: false });
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 5 },   // No.
        { wch: 12 },  // Tanggal Aktivitas
        { wch: 10 },  // Waktu Aktivitas
        { wch: 25 },  // Nama Lengkap
        { wch: 20 },  // Username
        { wch: 12 },  // Role/Peran
        { wch: 18 },  // Jenis Aktivitas
        { wch: 15 },  // Modul Sistem
        { wch: 40 },  // Deskripsi Aktivitas
        { wch: 15 },  // Alamat IP
        { wch: 30 },  // User Agent
        { wch: 12 },  // Tanggal Diarsipkan
        { wch: 10 }   // Waktu Diarsipkan
      ];
      ws['!cols'] = colWidths;
      
      // Style the title (A1)
      if (!ws['A1']) ws['A1'] = {};
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: "1F4E79" } },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: "E7F3FF" } }
      };
      
      // Style metadata labels (column A, rows 3-6)
      ['A3', 'A4', 'A5', 'A6'].forEach(cell => {
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = {
          font: { bold: true, color: { rgb: "2F5597" } }
        };
      });
      
      // Style header row (row 9)
      const headerCells = ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9'];
      headerCells.forEach(cell => {
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2F5597" } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      });
      
      // Add borders to data cells
      const dataStartRow = 10;
      const dataEndRow = dataStartRow + exportData.length - 1;
      for (let row = dataStartRow; row <= dataEndRow; row++) {
        for (let col = 0; col < 13; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
          if (!ws[cellRef]) ws[cellRef] = {};
          ws[cellRef].s = {
            border: {
              top: { style: 'thin', color: { rgb: "CCCCCC" } },
              bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
              left: { style: 'thin', color: { rgb: "CCCCCC" } },
              right: { style: 'thin', color: { rgb: "CCCCCC" } }
            },
            alignment: { vertical: 'top', wrapText: true }
          };
        }
      }
      
      // Merge title cell across all columns
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Histori Aktivitas Arsip');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
      
    } else if (format === 'csv') {
      // Create CSV file with enhanced formatting and metadata
      const csvHeader = [
        'LAPORAN HISTORI AKTIVITAS ARSIP SISTEM',
        '',
        `Tanggal Ekspor: ${formatDateTimeArsip(new Date())}`,
        `Periode Data: ${getPeriodeDescriptionArsip()}`,
        `Total Data: ${archivedData.length} aktivitas arsip`,
        `Diekspor Oleh: ${req.pengguna ? req.pengguna.nama : 'Sistem'}`,
        '',
        ''
      ];
      
      // Convert export data to CSV format with proper headers
      const csvData = exportData.map(row => {
        return {
          'No.': row['No.'],
          'Tanggal Aktivitas': row['Tanggal Aktivitas'],
          'Waktu Aktivitas': row['Waktu Aktivitas'],
          'Nama Lengkap': row['Nama Lengkap'],
          'Username': row['Username'],
          'Role/Peran': row['Role/Peran'],
          'Jenis Aktivitas': row['Jenis Aktivitas'],
          'Modul Sistem': row['Modul Sistem'],
          'Deskripsi Aktivitas': row['Deskripsi Aktivitas'],
          'Alamat IP': row['Alamat IP'],
          'User Agent': row['User Agent'],
          'Tanggal Diarsipkan': row['Tanggal Diarsipkan'],
          'Waktu Diarsipkan': row['Waktu Diarsipkan']
        };
      });
      
      // Use json2csv for better CSV formatting
      const parser = new Parser({
        fields: [
          { label: 'No.', value: 'No.' },
          { label: 'Tanggal Aktivitas', value: 'Tanggal Aktivitas' },
          { label: 'Waktu Aktivitas', value: 'Waktu Aktivitas' },
          { label: 'Nama Lengkap', value: 'Nama Lengkap' },
          { label: 'Username', value: 'Username' },
          { label: 'Role/Peran', value: 'Role/Peran' },
          { label: 'Jenis Aktivitas', value: 'Jenis Aktivitas' },
          { label: 'Modul Sistem', value: 'Modul Sistem' },
          { label: 'Deskripsi Aktivitas', value: 'Deskripsi Aktivitas' },
          { label: 'Alamat IP', value: 'Alamat IP' },
          { label: 'User Agent', value: 'User Agent' },
          { label: 'Tanggal Diarsipkan', value: 'Tanggal Diarsipkan' },
          { label: 'Waktu Diarsipkan', value: 'Waktu Diarsipkan' }
        ],
        delimiter: ',',
        quote: '"',
        escape: '"'
      });
      
      const csvContent = parser.parse(csvData);
      
      // Combine header and data
      const finalCsv = csvHeader.join('\n') + '\n' + csvContent;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      // Add BOM for proper UTF-8 encoding in Excel
      res.send('\uFEFF' + finalCsv);
      
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