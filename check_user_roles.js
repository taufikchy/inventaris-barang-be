const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function checkUserRoles() {
  try {
    console.log('=== Checking User Roles ===\n');
    
    // Get all users
    const users = await Pengguna.findAll({
      attributes: ['id', 'nama', 'nama_pengguna', 'peran', 'aktif'],
      order: [['id', 'ASC']]
    });
    
    console.log('Total users:', users.length);
    console.log('\nUser details:');
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Nama: ${user.nama}`);
      console.log(`Username: ${user.nama_pengguna}`);
      console.log(`Peran: ${user.peran}`);
      console.log(`Aktif: ${user.aktif}`);
      console.log('---');
    });
    
    // Check which users can delete transactions
    console.log('\n=== Users who can delete transactions (admin or toolman) ===');
    const canDeleteUsers = users.filter(user => 
      user.aktif && (user.peran === 'admin' || user.peran === 'toolman')
    );
    
    if (canDeleteUsers.length === 0) {
      console.log('❌ No active admin or toolman users found!');
      console.log('This explains the 403 Forbidden error.');
    } else {
      console.log('✅ Users who can delete transactions:');
      canDeleteUsers.forEach(user => {
        console.log(`- ${user.nama} (${user.nama_pengguna}) - ${user.peran}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUserRoles();