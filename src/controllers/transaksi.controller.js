const { Transaksi, Barang, Pengguna, Kategori } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/basisdata');

// Get all transactions with filters
const getAllTransaksi = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      jenis_transaksi,
      tanggal_mulai,
      tanggal_akhir,
      id_barang,
      status,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    const barangWhereClause = {};

    // Filter by transaction type
    if (jenis_transaksi) {
      whereClause.jenis_transaksi = jenis_transaksi;
    }

    // Filter by date range
    if (tanggal_mulai && tanggal_akhir) {
      whereClause.tanggal_transaksi = {
        [Op.between]: [tanggal_mulai, tanggal_akhir]
      };
    }

    // Filter by item
    if (id_barang) {
      whereClause.id_barang = id_barang;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Search in item name or transaction description
    if (search) {
      barangWhereClause.nama = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows } = await Transaksi.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Barang,
          as: 'barang',
          where: Object.keys(barangWhereClause).length > 0 ? barangWhereClause : undefined,
          attributes: ['id', 'nama', 'satuan', 'unit_per_set'],
          include: [
            {
              model: Kategori,
              as: 'kategori',
              attributes: ['id', 'nama', 'tipe']
            }
          ]
        },
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama'] // Hapus 'email' dari attributes
        }
      ],
      order: [['tanggal_transaksi', 'DESC']],
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
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi',
      error: error.message
    });
  }
};

// Get transaction by ID
const getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaksi = await Transaksi.findByPk(id, {
      include: [
        {
          model: Barang,
          as: 'barang',
          attributes: ['id', 'nama', 'satuan', 'unit_per_set'],
          include: [
            {
              model: Kategori,
              as: 'kategori',
              attributes: ['id', 'nama', 'tipe']
            }
          ]
        },
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama', 'nama_pengguna']
        }
      ]
    });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: transaksi
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi',
      error: error.message
    });
  }
};

// Create new transaction
const createTransaksi = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      id_barang,
      jenis_transaksi,
      jumlah,
      keterangan
    } = req.body;

    const id_pengguna = req.pengguna.id;

    // Validate required fields
    if (!id_barang || !jenis_transaksi || !jumlah) {
      return res.status(400).json({
        success: false,
        message: 'ID barang, jenis transaksi, dan jumlah harus diisi'
      });
    }

    // Get item data with category
    const barang = await Barang.findByPk(id_barang, { 
      include: [{
        model: Kategori,
        as: 'kategori',
        attributes: ['id', 'nama', 'tipe']
      }],
      transaction 
    });
    if (!barang) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Validate that only 'bahan' category items can have inventory transactions
    if (!barang.kategori || barang.kategori.tipe !== 'bahan') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Transaksi inventaris hanya dapat dilakukan untuk barang kategori bahan. Untuk kategori alat, gunakan sistem peminjaman.'
      });
    }

    // Validate transaction type - only allow outgoing transactions
    if (!['keluar', 'rusak', 'hilang'].includes(jenis_transaksi)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Jenis transaksi tidak valid. Hanya transaksi keluar, rusak, dan hilang yang diizinkan.'
      });
    }

    // Handle unit tracking for set items
    let jumlahTransaksi = parseInt(jumlah);
    let jumlahStok = jumlahTransaksi;
    let newUnitUsed = barang.unit_used || 0;
    
    // For 'set' items, track unit usage instead of converting to sets
    if (barang.satuan === 'set' && barang.unit_per_set && barang.unit_per_set > 0) {
      // jumlahTransaksi remains in units for transaction record
      // For stock calculation, only reduce set count when a full set is consumed
      newUnitUsed += jumlahTransaksi;
      // Calculate how many complete sets are consumed
      const setsConsumed = Math.floor(newUnitUsed / barang.unit_per_set);
      const currentSetsConsumed = Math.floor(barang.unit_used / barang.unit_per_set);
      jumlahStok = setsConsumed - currentSetsConsumed; // Only reduce by newly consumed sets
      newUnitUsed = newUnitUsed % barang.unit_per_set; // Keep remainder for next usage
    }

    // Validate stock for outgoing transactions
    if (['keluar', 'rusak', 'hilang'].includes(jenis_transaksi)) {
      // For 'set' items, validate against available units including unused units in current sets
      let availableUnits = barang.jumlah;
      if (barang.satuan === 'set' && barang.unit_per_set && barang.unit_per_set > 0) {
        const totalUnits = barang.jumlah * barang.unit_per_set;
        const usedUnits = barang.unit_used || 0;
        availableUnits = totalUnits - usedUnits;
      }
      
      if (availableUnits < jumlahTransaksi) {
        await transaction.rollback();
        const stockMessage = barang.satuan === 'set' && barang.unit_per_set 
          ? `${availableUnits} unit tersisa (${barang.jumlah} set, ${barang.unit_used || 0} unit terpakai)`
          : `${barang.jumlah}`;
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi. Stok tersedia: ${stockMessage}`
        });
      }
      
      // Special handling for 'bahan' category - allow partial usage
      if (barang.kategori && barang.kategori.tipe === 'bahan' && jenis_transaksi === 'keluar') {
        // For materials, we allow partial usage and track remaining stock
        // This is already handled by the stock update logic below
      }
    }

    // Store stock before transaction for tracking
    let stokSebelum = barang.jumlah;
    let stokSesudah = barang.jumlah;
    
    // For 'set' items, calculate stock in terms of remaining units in current set
    if (barang.satuan === 'set' && barang.unit_per_set && barang.unit_per_set > 0) {
      const currentUnitUsed = barang.unit_used || 0;
      const totalUnits = barang.jumlah * barang.unit_per_set;
      const availableUnits = totalUnits - currentUnitUsed;
      
      // Stok sebelum: unit yang tersedia sebelum transaksi
      stokSebelum = availableUnits;
      
      // Stok sesudah: unit yang tersisa setelah transaksi
      stokSesudah = availableUnits - jumlahTransaksi;
    }
    
    // Create transaction record (store in units for transaction history)
    const transaksi = await Transaksi.create({
      id_barang,
      id_pengguna,
      jenis_transaksi,
      jumlah: jumlahTransaksi, // Store in units
      keterangan,
      tanggal_transaksi: new Date(),
      stok_sebelum: stokSebelum,
      status: 'approved' // Transaksi inventaris bahan langsung disetujui
    }, { transaction });

    // Update item stock and unit_used (use converted amount for set items)
    let newStock = barang.jumlah;
    let updateData = {};
    
    // Only handle outgoing transactions
    newStock -= jumlahStok;
    updateData.jumlah = newStock;
    // Update unit_used for set items
    if (barang.satuan === 'set' && barang.unit_per_set && barang.unit_per_set > 0) {
      updateData.unit_used = newUnitUsed;
      // Recalculate stok_sesudah after update
      const newTotalUnits = newStock * barang.unit_per_set;
      const newAvailableUnits = newTotalUnits - newUnitUsed;
      stokSesudah = newAvailableUnits;
    } else {
      // For non-set items, stok_sesudah is just the new stock
      stokSesudah = newStock;
    }

    await barang.update(updateData, { transaction });
    
    // Update transaction record with stock after transaction
    await transaksi.update({ stok_sesudah: stokSesudah }, { transaction });

    // Removed auto-delete logic for 'bahan' category items with 0 stock
    // Items will remain in the system even when stock reaches 0
    let isItemDeleted = false;

    await transaction.commit();

    // Get the created transaction with relations
    const createdTransaksi = await Transaksi.findByPk(transaksi.id, {
      include: [
        {
          model: Barang,
          as: 'barang',
          include: [
            {
              model: Kategori,
              as: 'kategori',
              attributes: ['id', 'nama']
            }
          ]
        },
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['id', 'nama', 'nama_pengguna']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dibuat',
      data: createdTransaksi
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi',
      error: error.message
    });
  }
};

// Update transaction
const updateTransaksi = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      id_barang,
      jenis_transaksi,
      jumlah,
      keterangan,
      status
    } = req.body;

    // Find existing transaction
    const existingTransaksi = await Transaksi.findByPk(id, {
      include: [{ model: Barang }],
      transaction
    });

    if (!existingTransaksi) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    // Get item info
    const barang = await Barang.findByPk(id_barang, { transaction });
    if (!barang) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Calculate stock changes
    const oldJumlah = existingTransaksi.jumlah;
    const oldJenis = existingTransaksi.jenis_transaksi;
    const newJumlah = parseInt(jumlah);
    const newJenis = jenis_transaksi;

    // Reverse old transaction effect on stock
    let stockAdjustment = 0;
    if (oldJenis === 'masuk') {
      stockAdjustment -= oldJumlah; // Remove previous addition
    } else if (['keluar', 'rusak', 'hilang'].includes(oldJenis)) {
      stockAdjustment += oldJumlah; // Remove previous subtraction
    }

    // Apply new transaction effect on stock
    if (newJenis === 'masuk') {
      stockAdjustment += newJumlah;
    } else if (['keluar', 'rusak', 'hilang'].includes(newJenis)) {
      stockAdjustment -= newJumlah;
    }

    const newStok = barang.stok + stockAdjustment;

    // Validate stock
    if (newStok < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Stok tersedia: ${barang.stok}`
      });
    }

    // Update item stock
    await barang.update({ stok: newStok }, { transaction });

    // Update transaction
    const updatedTransaksi = await existingTransaksi.update({
      id_barang,
      jenis_transaksi: newJenis,
      jumlah: newJumlah,
      keterangan,
      status: status || 'approved',
      stok_sebelum: barang.stok - stockAdjustment,
      stok_sesudah: newStok
    }, { transaction });

    await transaction.commit();

    // Fetch updated transaction with relations
    const result = await Transaksi.findByPk(updatedTransaksi.id, {
      include: [
        {
          model: Barang,
          include: [{ model: Kategori }]
        },
        { model: Pengguna }
      ]
    });

    res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui',
      data: result
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui transaksi',
      error: error.message
    });
  }
};

// Update transaction status
const updateTransaksiStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const transaksi = await Transaksi.findByPk(id);
    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    await transaksi.update({ status });

    res.json({
      success: true,
      message: 'Status transaksi berhasil diperbarui',
      data: transaksi
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status transaksi',
      error: error.message
    });
  }
};

// Delete transaction
const deleteTransaksi = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const transaksi = await Transaksi.findByPk(id, {
      include: [{ 
        model: Barang, 
        as: 'barang',
        include: [{
          model: Kategori,
          as: 'kategori',
          attributes: ['id', 'nama', 'tipe']
        }]
      }],
      transaction
    });

    if (!transaksi) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    // Only allow deletion of 'bahan' category transactions
    if (!transaksi.barang.kategori || transaksi.barang.kategori.tipe !== 'bahan') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Hanya transaksi kategori bahan yang dapat dihapus'
      });
    }

    // Reverse the stock changes
    const barang = transaksi.barang;
    let updateData = {};
    
    // Only handle outgoing transactions (masuk transactions are not allowed in current system)
    if (['keluar', 'rusak', 'hilang'].includes(transaksi.jenis_transaksi)) {
      if (barang.satuan === 'set' && barang.unit_per_set && barang.unit_per_set > 0) {
        // For set items, reverse unit_used changes
        const currentUnitUsed = barang.unit_used || 0;
        const newUnitUsed = currentUnitUsed - transaksi.jumlah;
        
        // Calculate how many sets to add back
        const currentSetsConsumed = Math.floor(currentUnitUsed / barang.unit_per_set);
        const newSetsConsumed = Math.floor(Math.max(0, newUnitUsed) / barang.unit_per_set);
        const setsToAddBack = currentSetsConsumed - newSetsConsumed;
        
        updateData.jumlah = barang.jumlah + setsToAddBack;
        updateData.unit_used = Math.max(0, newUnitUsed) % barang.unit_per_set;
      } else {
        // For non-set items, simply add back the quantity
        updateData.jumlah = barang.jumlah + transaksi.jumlah;
      }
    }

    // Validate that stock won't go negative
    if (updateData.jumlah < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus transaksi karena akan menyebabkan stok negatif'
      });
    }

    await barang.update(updateData, { transaction });
    await transaksi.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi',
      error: error.message
    });
  }
};

// Get transaction statistics
const getTransaksiStats = async (req, res) => {
  try {
    const { tanggal_mulai, tanggal_akhir } = req.query;
    
    const whereClause = {};
    if (tanggal_mulai && tanggal_akhir) {
      whereClause.tanggal_transaksi = {
        [Op.between]: [tanggal_mulai, tanggal_akhir]
      };
    }

    // Total transactions by type
    const transaksiByType = await Transaksi.findAll({
      where: whereClause,
      attributes: [
        'jenis_transaksi',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('jumlah')), 'total_jumlah']
      ],
      group: ['jenis_transaksi']
    });

    // Monthly transaction trends
    const monthlyTrends = await Transaksi.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('tanggal_transaksi'), '%Y-%m'), 'bulan'],
        'jenis_transaksi',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('jumlah')), 'total_jumlah']
      ],
      group: ['bulan', 'jenis_transaksi'],
      order: [['bulan', 'DESC']]
    });

    // Recent transactions
    const recentTransaksi = await Transaksi.findAll({
      include: [
        {
          model: Barang,
          as: 'barang',
          attributes: ['nama', 'kode']
        },
        {
          model: Pengguna,
          as: 'pengguna',
          attributes: ['nama']
        }
      ],
      order: [['tanggal_transaksi', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        transaksiByType,
        monthlyTrends,
        recentTransaksi
      }
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik transaksi',
      error: error.message
    });
  }
};

module.exports = {
  getAllTransaksi,
  getTransaksiById,
  createTransaksi,
  updateTransaksi,
  updateTransaksiStatus,
  deleteTransaksi,
  getTransaksiStats
};