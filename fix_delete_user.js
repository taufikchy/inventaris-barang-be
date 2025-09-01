const { Pengguna, HistoriAktivitas, Peminjaman, Transaksi } = require('./src/models');
const { Op } = require('sequelize');
const sequelize = require('./src/config/basisdata');

// Script untuk menghapus user dengan aman
// Menangani foreign key constraint dengan menghapus data terkait terlebih dahulu

async function hapusUserDenganAman(userId) {
  const transaction = await sequelize.transaction();
  
  try {
    console.log(`Memulai proses penghapusan user dengan ID: ${userId}`);
    
    // 1. Cari user yang akan dihapus
    const user = await Pengguna.findByPk(userId, { transaction });
    
    if (!user) {
      console.log('User tidak ditemukan!');
      await transaction.rollback();
      return { sukses: false, pesan: 'User tidak ditemukan' };
    }
    
    console.log(`User ditemukan: ${user.nama} (${user.nama_pengguna})`);
    
    // 2. Periksa apakah user adalah admin terakhir
    if (user.peran === 'admin') {
      const jumlahAdmin = await Pengguna.count({
        where: { peran: 'admin' },
        transaction
      });
      
      if (jumlahAdmin <= 1) {
        console.log('Tidak dapat menghapus admin terakhir!');
        await transaction.rollback();
        return { sukses: false, pesan: 'Tidak dapat menghapus admin terakhir' };
      }
    }
    
    // 3. Hapus data histori aktivitas yang terkait
    const jumlahHistori = await HistoriAktivitas.count({
      where: { id_pengguna: userId },
      transaction
    });
    
    if (jumlahHistori > 0) {
      console.log(`Menghapus ${jumlahHistori} record histori aktivitas...`);
      await HistoriAktivitas.destroy({
        where: { id_pengguna: userId },
        transaction
      });
      console.log('Histori aktivitas berhasil dihapus.');
    }
    
    // 4. Periksa dan tangani data peminjaman
    const jumlahPeminjaman = await Peminjaman.count({
      where: {
        [Op.or]: [
          { id_pengguna: userId },
          { id_kepala_lab: userId }
        ]
      },
      transaction
    });
    
    if (jumlahPeminjaman > 0) {
      console.log(`Ditemukan ${jumlahPeminjaman} record peminjaman terkait.`);
      console.log('PERINGATAN: User ini memiliki data peminjaman. Pertimbangkan untuk:');
      console.log('- Mengubah status user menjadi tidak aktif daripada menghapus');
      console.log('- Atau transfer peminjaman ke user lain');
      
      // Untuk saat ini, kita akan set foreign key ke null atau user pengganti
      // Anda bisa menyesuaikan logika ini sesuai kebutuhan
      await Peminjaman.update(
        { id_pengguna: null }, // atau ganti dengan ID user pengganti
        {
          where: { id_pengguna: userId },
          transaction
        }
      );
      
      await Peminjaman.update(
        { id_kepala_lab: null }, // atau ganti dengan ID kepala lab pengganti
        {
          where: { id_kepala_lab: userId },
          transaction
        }
      );
      
      console.log('Data peminjaman telah diupdate.');
    }
    
    // 5. Periksa dan tangani data transaksi
    const jumlahTransaksi = await Transaksi.count({
      where: { id_pengguna: userId },
      transaction
    });
    
    if (jumlahTransaksi > 0) {
      console.log(`Ditemukan ${jumlahTransaksi} record transaksi terkait.`);
      // Untuk transaksi, biasanya kita tidak menghapus karena penting untuk audit
      // Kita bisa set ke user pengganti atau biarkan dengan catatan
      await Transaksi.update(
        { id_pengguna: null }, // atau ganti dengan ID user pengganti
        {
          where: { id_pengguna: userId },
          transaction
        }
      );
      console.log('Data transaksi telah diupdate.');
    }
    
    // 6. Hapus user
    await user.destroy({ transaction });
    console.log(`User ${user.nama} berhasil dihapus.`);
    
    // Commit transaction
    await transaction.commit();
    
    return {
      sukses: true,
      pesan: `User ${user.nama} berhasil dihapus beserta data terkait`,
      detail: {
        histori_dihapus: jumlahHistori,
        peminjaman_diupdate: jumlahPeminjaman,
        transaksi_diupdate: jumlahTransaksi
      }
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error saat menghapus user:', error);
    return {
      sukses: false,
      pesan: 'Terjadi kesalahan saat menghapus user',
      error: error.message
    };
  }
}

// Fungsi untuk mengubah status user menjadi tidak aktif (alternatif yang lebih aman)
async function nonaktifkanUser(userId) {
  try {
    const user = await Pengguna.findByPk(userId);
    
    if (!user) {
      return { sukses: false, pesan: 'User tidak ditemukan' };
    }
    
    await user.update({ aktif: false });
    
    console.log(`User ${user.nama} berhasil dinonaktifkan.`);
    
    return {
      sukses: true,
      pesan: `User ${user.nama} berhasil dinonaktifkan`
    };
    
  } catch (error) {
    console.error('Error saat menonaktifkan user:', error);
    return {
      sukses: false,
      pesan: 'Terjadi kesalahan saat menonaktifkan user',
      error: error.message
    };
  }
}

// Contoh penggunaan
async function main() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    
    // Ganti dengan ID user yang ingin dihapus
    const userId = 9; // ID user yang error saat dihapus
    
    console.log('\n=== PILIHAN PENGHAPUSAN USER ===');
    console.log('1. Hapus user secara permanen (dengan menghapus data terkait)');
    console.log('2. Nonaktifkan user (lebih aman, data tetap ada)');
    console.log('\nMenjalankan opsi 1: Hapus user secara permanen...');
    
    const hasil = await hapusUserDenganAman(userId);
    
    console.log('\n=== HASIL ===');
    console.log('Sukses:', hasil.sukses);
    console.log('Pesan:', hasil.pesan);
    if (hasil.detail) {
      console.log('Detail:', hasil.detail);
    }
    if (hasil.error) {
      console.log('Error:', hasil.error);
    }
    
    // Jika ingin menggunakan opsi nonaktifkan, uncomment baris berikut:
    // const hasilNonaktif = await nonaktifkanUser(userId);
    // console.log('Hasil nonaktifkan:', hasilNonaktif);
    
  } catch (error) {
    console.error('Error koneksi database:', error);
  } finally {
    await sequelize.close();
    console.log('\nKoneksi database ditutup.');
  }
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  main();
}

module.exports = {
  hapusUserDenganAman,
  nonaktifkanUser
};