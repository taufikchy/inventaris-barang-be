const { Pengguna } = require('./src/models');

async function checkUsers() {
  try {
    const users = await Pengguna.findAll({
      attributes: ['id', 'nama', 'nama_pengguna', 'peran', 'aktif']
    });
    
    console.log('Pengguna di database:');
    console.log('===================');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Nama: ${user.nama}, Username: ${user.nama_pengguna}, Role: ${user.peran}, Aktif: ${user.aktif}`);
    });
    
    console.log('\nRingkasan per role:');
    console.log('==================');
    const roleCount = {};
    users.forEach(user => {
      roleCount[user.peran] = (roleCount[user.peran] || 0) + 1;
    });
    
    Object.keys(roleCount).forEach(role => {
      console.log(`${role}: ${roleCount[role]} pengguna`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();