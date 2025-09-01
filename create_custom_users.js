const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

// Data untuk 4 user baru sesuai permintaan
const customUsersData = [
  {
    nama: 'Kepala Lab',
    nama_pengguna: 'kalab',
    kata_sandi: 'kalab',
    peran: 'kepala_lab'
  },
  {
    nama: 'Administrator',
    nama_pengguna: 'admin',
    kata_sandi: 'admin',
    peran: 'admin'
  },
  {
    nama: 'Toolman',
    nama_pengguna: 'toolman',
    kata_sandi: 'toolman',
    peran: 'toolman'
  },
  {
    nama: 'Staff Sarana',
    nama_pengguna: 'sarana',
    kata_sandi: 'sarana',
    peran: 'sarana'
  }
];

async function createCustomUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil\n');

    console.log('🔄 Membuat 4 user baru sesuai permintaan...');
    console.log('=' .repeat(50));

    for (const userData of customUsersData) {
      try {
        // Cek apakah username sudah ada
        const existingUser = await Pengguna.findOne({
          where: { nama_pengguna: userData.nama_pengguna }
        });

        if (existingUser) {
          console.log(`⚠️  Username '${userData.nama_pengguna}' sudah ada, akan diupdate password...`);
          
          // Update password user yang sudah ada
          await existingUser.update({
            kata_sandi: userData.kata_sandi,
            aktif: true
          });
          
          console.log(`✅ Password user '${userData.nama_pengguna}' berhasil diupdate`);
          console.log(`   Username: ${userData.nama_pengguna}`);
          console.log(`   Password: ${userData.kata_sandi}`);
          console.log(`   Role: ${existingUser.peran}\n`);
          continue;
        }

        // Buat user baru
        const newUser = await Pengguna.create({
          ...userData,
          aktif: true
        });
        
        console.log(`✅ User baru berhasil dibuat:`);
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Nama: ${newUser.nama}`);
        console.log(`   Username: ${newUser.nama_pengguna}`);
        console.log(`   Password: ${userData.kata_sandi}`);
        console.log(`   Role: ${newUser.peran}\n`);

      } catch (userError) {
        console.error(`❌ Error membuat/update user '${userData.nama_pengguna}':`, userError.message);
      }
    }

    console.log('=' .repeat(50));
    console.log('📋 INFORMASI LOGIN UNTUK 4 USER:');
    console.log('=' .repeat(50));
    
    customUsersData.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.nama_pengguna} | Password: ${user.kata_sandi} | Role: ${user.peran}`);
    });
    
    console.log('\n🌐 URL Login: http://localhost:5001/');
    console.log('🔗 API Backend: http://localhost:5000/');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Koneksi database ditutup');
  }
}

// Jalankan script
createCustomUsers();