const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function createNewUser() {
  try {
    // Test koneksi database
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil');

    // Data user baru
    const userData = {
      nama: 'User Baru',
      nama_pengguna: 'userbaru',
      kata_sandi: 'admin123', // akan di-hash otomatis oleh hook
      peran: 'sarana',
      aktif: true
    };

    // Cek apakah username sudah ada
    const existingUser = await Pengguna.findOne({
      where: { nama_pengguna: userData.nama_pengguna }
    });

    if (existingUser) {
      console.log('❌ Username sudah digunakan:', userData.nama_pengguna);
      return;
    }

    // Buat user baru
    const newUser = await Pengguna.create(userData);
    
    console.log('✅ User baru berhasil dibuat:');
    console.log('ID:', newUser.id);
    console.log('Nama:', newUser.nama);
    console.log('Username:', newUser.nama_pengguna);
    console.log('Role:', newUser.peran);
    console.log('Status:', newUser.aktif ? 'Aktif' : 'Tidak Aktif');
    console.log('');
    console.log('📋 Informasi Login:');
    console.log('Username: userbaru');
    console.log('Password: admin123');
    console.log('Role: sarana');

  } catch (error) {
    console.error('❌ Error membuat user:', error.message);
    if (error.name === 'SequelizeValidationError') {
      error.errors.forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
  } finally {
    await sequelize.close();
    console.log('🔌 Koneksi database ditutup');
  }
}

// Jalankan script
createNewUser();