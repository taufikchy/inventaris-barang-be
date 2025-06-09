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
          attributes: ['id', 'nama', 'email']
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
      keterangan,
      harga_satuan,
      supplier,
      nomor_faktur
    } = req.body;

    const id_pengguna = req.pengguna.id;

    // Validate required fields
    if (!id_barang || !jenis_transaksi || !jumlah) {
      return res.status(400).json({
        success: false,
        message: 'ID barang, jenis transaksi, dan jumlah harus diisi'
      });
    }

    // Get item data
    const barang = await Barang.findByPk(id_barang, { transaction });
    if (!barang) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Validate stock for outgoing transactions
    if (['keluar', 'rusak', 'hilang'].includes(jenis_transaksi)) {
      if (barang.jumlah < jumlah) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi. Stok tersedia: ${barang.jumlah}`
        });
      }
    }

    // Calculate total price
    const total_harga = harga_satuan ? harga_satuan * jumlah : null;

    // Create transaction record
    const transaksi = await Transaksi.create({
      id_barang,
      id_pengguna,
      jenis_transaksi,
      jumlah,
      keterangan,
      harga_satuan,
      total_harga,
      supplier,
      nomor_faktur,
      tanggal_transaksi: new Date()
    }, { transaction });

    // Update item stock
    let newStock = barang.jumlah;
    if (jenis_transaksi === 'masuk') {
      newStock += parseInt(jumlah);
    } else if (['keluar', 'rusak', 'hilang'].includes(jenis_transaksi)) {
      newStock -= parseInt(jumlah);
    }

    await barang.update({ jumlah: newStock }, { transaction });

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
          attributes: ['id', 'nama', 'email']
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
      include: [{ model: Barang, as: 'barang' }],
      transaction
    });

    if (!transaksi) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    // Reverse the stock changes
    const barang = transaksi.barang;
    let newStock = barang.jumlah;
    
    if (transaksi.jenis_transaksi === 'masuk') {
      newStock -= transaksi.jumlah;
    } else if (['keluar', 'rusak', 'hilang'].includes(transaksi.jenis_transaksi)) {
      newStock += transaksi.jumlah;
    }

    // Validate that stock won't go negative
    if (newStock < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus transaksi karena akan menyebabkan stok negatif'
      });
    }

    await barang.update({ jumlah: newStock }, { transaction });
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
  updateTransaksiStatus,
  deleteTransaksi,
  getTransaksiStats
};