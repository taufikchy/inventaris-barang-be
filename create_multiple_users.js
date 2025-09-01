const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

// Data untuk beberapa user baru dengan role berbeda
const usersData = [
  {
    nama: 'Staff Sarana 1',
    nama_pengguna: 'staff_sarana1',
    kata_sandi: 'admin123',
    peran: 'sarana'
  },
  {
    nama: 'Toolman Baru',
    nama_pengguna: 'toolman_baru',
    kata_sandi: 'admin123',
    peran: 'toolman'
  },
  {
    nama: 'Admin Baru',
    nama_pengguna: 'admin_baru',
    kata_sandi: 'admin123',
    peran: 'admin'
  }
];

async function createMultipleUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil\n');

    for (const userData of usersData) {
      try {
        // Cek apakah username sudah ada
        const existingUser = await Pengguna.findOne({
          where: { nama_pengguna: userData.nama_pengguna }
        });

        if (existingUser) {
          console.log(`⚠️  Username '${userData.nama_pengguna}' sudah digunakan, dilewati.`);
          continue;
        }

        // Buat user baru
        const newUser = await Pengguna.create({
          ...userData,
          aktif: true
        });
        
        console.log(`✅ User berhasil dibuat:`);
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Nama: ${newUser.nama}`);
        console.log(`   Username: ${newUser.nama_pengguna}`);
        console.log(`   Role: ${newUser.peran}`);
        console.log(`   Password: admin123\n`);

      } catch (userError) {
        console.error(`❌ Error membuat user '${userData.nama_pengguna}':`, userError.message);
      }
    }

    // Tampilkan semua user yang ada
    console.log('📋 Daftar semua user di database:');
    const allUsers = await Pengguna.findAll({
      attributes: ['id', 'nama', 'nama_pengguna', 'peran', 'aktif'],
      order: [['id', 'ASC']]
    });

    allUsers.forEach(user => {
      console.log(`   ${user.id}. ${user.nama} (${user.nama_pengguna}) - ${user.peran} - ${user.aktif ? 'Aktif' : 'Tidak Aktif'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Koneksi database ditutup');
  }
}

// Jalankan script
createMultipleUsers();