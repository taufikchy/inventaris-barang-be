const jwt = require('jsonwebtoken');
const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function checkCurrentUser() {
  try {
    console.log('=== Checking Current User Permissions ===\n');
    
    // Get all users and their roles
    const users = await Pengguna.findAll({
      attributes: ['id', 'nama', 'nama_pengguna', 'peran', 'aktif'],
      where: { aktif: true },
      order: [['id', 'ASC']]
    });
    
    console.log('Active users in database:');
    users.forEach(user => {
      const canDeleteBarang = user.peran === 'kepala_lab';
      const canDeleteTransaksi = user.peran === 'admin' || user.peran === 'toolman';
      
      console.log(`\n${user.nama} (${user.nama_pengguna})`);
      console.log(`  Role: ${user.peran}`);
      console.log(`  Can delete barang: ${canDeleteBarang ? '✅' : '❌'}`);
      console.log(`  Can delete transaksi: ${canDeleteTransaksi ? '✅' : '❌'}`);
    });
    
    console.log('\n=== Permission Summary ===');
    console.log('To delete barang: User must have role "kepala_lab"');
    console.log('To delete transaksi: User must have role "admin" or "toolman"');
    
    const kepalaLabUsers = users.filter(u => u.peran === 'kepala_lab');
    const adminToolmanUsers = users.filter(u => u.peran === 'admin' || u.peran === 'toolman');
    
    if (kepalaLabUsers.length === 0) {
      console.log('\n❌ No active kepala_lab users found! This explains the 400 error for barang deletion.');
    } else {
      console.log(`\n✅ Found ${kepalaLabUsers.length} active kepala_lab user(s) who can delete barang.`);
    }
    
    if (adminToolmanUsers.length === 0) {
      console.log('❌ No active admin/toolman users found! This explains the 403 error for transaksi deletion.');
    } else {
      console.log(`✅ Found ${adminToolmanUsers.length} active admin/toolman user(s) who can delete transaksi.`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCurrentUser();