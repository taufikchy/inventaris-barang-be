const { Sequelize } = require('sequelize');
require('dotenv').config();

// Buat koneksi ke database menggunakan konfigurasi dari .env
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: console.log
});

async function updateDatabase() {
  try {
    // Coba koneksi ke database
    await sequelize.authenticate();
    console.log('Koneksi ke database berhasil.');

    // Fungsi untuk menambahkan kolom jika belum ada
    async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
      try {
        // Cek apakah kolom sudah ada
        const [columns] = await sequelize.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
           AND TABLE_NAME = '${tableName}' 
           AND COLUMN_NAME = '${columnName}'`
        );

        // Jika kolom belum ada, tambahkan
        if (columns.length === 0) {
          await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
          console.log(`Kolom ${columnName} berhasil ditambahkan ke tabel ${tableName}`);
        } else {
          console.log(`Kolom ${columnName} sudah ada di tabel ${tableName}`);
        }
      } catch (error) {
        console.error(`Gagal menambahkan kolom ${columnName}:`, error);
      }
    }

    // 1. Tambahkan kolom id_kepala_lab
    await addColumnIfNotExists('peminjaman', 'id_kepala_lab', 'INT NULL');

    // 2. Tambahkan kolom tanggal_persetujuan
    await addColumnIfNotExists('peminjaman', 'tanggal_persetujuan', 'DATETIME NULL');

    // 3. Tambahkan kolom catatan_persetujuan
    await addColumnIfNotExists('peminjaman', 'catatan_persetujuan', 'TEXT NULL');

    // 4. Tambahkan kolom surat_peminjaman
    await addColumnIfNotExists('peminjaman', 'surat_peminjaman', 'VARCHAR(255) NULL');

    // 5. Tambahkan kolom jabatan_peminjam
    await addColumnIfNotExists('peminjaman', 'jabatan_peminjam', 'VARCHAR(255) NULL COMMENT "Jabatan peminjam (contoh: Siswa, Guru, Staff, dll)"');

    // 6. Modifikasi kolom status untuk menambahkan nilai enum baru
    try {
      await sequelize.query(
        `ALTER TABLE peminjaman MODIFY COLUMN status 
         ENUM('pending', 'disetujui', 'ditolak', 'dikembalikan', 'terlambat') 
         NOT NULL DEFAULT 'pending'`
      );
      console.log('Kolom status berhasil dimodifikasi');
    } catch (error) {
      console.error('Gagal memodifikasi kolom status:', error);
    }

    // 7. Tambahkan foreign key untuk id_kepala_lab jika belum ada
    try {
      // Cek apakah foreign key sudah ada
      const [foreignKeys] = await sequelize.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
         AND TABLE_NAME = 'peminjaman'
         AND COLUMN_NAME = 'id_kepala_lab'
         AND REFERENCED_TABLE_NAME = 'pengguna'`
      );

      if (foreignKeys.length === 0) {
        await sequelize.query(
          `ALTER TABLE peminjaman ADD CONSTRAINT fk_peminjaman_kepala_lab 
           FOREIGN KEY (id_kepala_lab) REFERENCES pengguna(id) 
           ON DELETE SET NULL ON UPDATE CASCADE`
        );
        console.log('Foreign key untuk id_kepala_lab berhasil ditambahkan');
      } else {
        console.log('Foreign key untuk id_kepala_lab sudah ada');
      }
    } catch (error) {
      console.error('Gagal menambahkan foreign key:', error);
    }

    console.log('Database berhasil diperbarui!');
  } catch (error) {
    console.error('Gagal memperbarui database:', error);
  } finally {
    // Tutup koneksi
    await sequelize.close();
  }
}

// Jalankan fungsi update
updateDatabase();