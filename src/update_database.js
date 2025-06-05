// Script untuk menambahkan kolom yang hilang pada tabel peminjaman menggunakan Sequelize
const sequelize = require('./config/basisdata');
const { QueryTypes } = require('sequelize');

async function updatePeminjamanTable() {
  try {
    console.log('Memulai proses update tabel peminjaman...');
    
    // Cek apakah kolom id_kepala_lab sudah ada
    const checkColumn = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'inventaris_tkj' AND TABLE_NAME = 'peminjaman' AND COLUMN_NAME = 'id_kepala_lab'",
      { type: QueryTypes.SELECT }
    );
    
    if (checkColumn.length === 0) {
      // Tambahkan kolom id_kepala_lab
      await sequelize.query(
        "ALTER TABLE peminjaman ADD COLUMN id_kepala_lab INT NULL, ADD CONSTRAINT fk_peminjaman_kepala_lab FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE"
      );
      console.log('Kolom id_kepala_lab berhasil ditambahkan');
    } else {
      console.log('Kolom id_kepala_lab sudah ada');
    }
    
    // Cek apakah kolom tanggal_persetujuan sudah ada
    const checkTanggalPersetujuan = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'inventaris_tkj' AND TABLE_NAME = 'peminjaman' AND COLUMN_NAME = 'tanggal_persetujuan'",
      { type: QueryTypes.SELECT }
    );
    
    if (checkTanggalPersetujuan.length === 0) {
      // Tambahkan kolom tanggal_persetujuan
      await sequelize.query(
        "ALTER TABLE peminjaman ADD COLUMN tanggal_persetujuan DATETIME NULL"
      );
      console.log('Kolom tanggal_persetujuan berhasil ditambahkan');
    } else {
      console.log('Kolom tanggal_persetujuan sudah ada');
    }
    
    // Cek apakah kolom catatan_persetujuan sudah ada
    const checkCatatanPersetujuan = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'inventaris_tkj' AND TABLE_NAME = 'peminjaman' AND COLUMN_NAME = 'catatan_persetujuan'",
      { type: QueryTypes.SELECT }
    );
    
    if (checkCatatanPersetujuan.length === 0) {
      // Tambahkan kolom catatan_persetujuan
      await sequelize.query(
        "ALTER TABLE peminjaman ADD COLUMN catatan_persetujuan TEXT NULL"
      );
      console.log('Kolom catatan_persetujuan berhasil ditambahkan');
    } else {
      console.log('Kolom catatan_persetujuan sudah ada');
    }
    
    // Cek apakah kolom surat_peminjaman sudah ada
    const checkSuratPeminjaman = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'inventaris_tkj' AND TABLE_NAME = 'peminjaman' AND COLUMN_NAME = 'surat_peminjaman'",
      { type: QueryTypes.SELECT }
    );
    
    if (checkSuratPeminjaman.length === 0) {
      // Tambahkan kolom surat_peminjaman
      await sequelize.query(
        "ALTER TABLE peminjaman ADD COLUMN surat_peminjaman VARCHAR(255) NULL COMMENT 'Path ke file surat peminjaman yang dicetak'"
      );
      console.log('Kolom surat_peminjaman berhasil ditambahkan');
    } else {
      console.log('Kolom surat_peminjaman sudah ada');
    }
    
    // Cek apakah status enum sudah lengkap
    const checkStatusEnum = await sequelize.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'inventaris_tkj' AND TABLE_NAME = 'peminjaman' AND COLUMN_NAME = 'status'",
      { type: QueryTypes.SELECT }
    );
    
    if (checkStatusEnum.length > 0) {
      const statusType = checkStatusEnum[0].COLUMN_TYPE;
      if (!statusType.includes('menunggu_persetujuan') || !statusType.includes('disetujui') || !statusType.includes('ditolak')) {
        // Update status enum
        await sequelize.query(
          "ALTER TABLE peminjaman MODIFY COLUMN status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat') DEFAULT 'menunggu_persetujuan'"
        );
        console.log('Enum status berhasil diperbarui');
      } else {
        console.log('Enum status sudah lengkap');
      }
    }
    
    console.log('Proses update tabel peminjaman selesai!');
  } catch (error) {
    console.error('Terjadi kesalahan saat memperbarui tabel peminjaman:', error);
  } finally {
    // Tutup koneksi database
    await sequelize.close();
  }
}

// Jalankan fungsi update
updatePeminjamanTable();