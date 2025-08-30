const { HistoriAktivitas, Pengguna } = require('./src/models');

async function checkAuthActivities() {
  try {
    const authActivities = await HistoriAktivitas.findAll({
      where: {
        modul: 'auth',
        jenis_aktivitas: ['login', 'logout']
      },
      include: [{
        model: Pengguna,
        as: 'pengguna',
        attributes: ['id', 'nama', 'nama_pengguna', 'peran']
      }],
      order: [['waktu_aktivitas', 'DESC']],
      limit: 20
    });
    
    console.log('Aktivitas Login/Logout Terbaru:');
    console.log('================================');
    
    if (authActivities.length === 0) {
      console.log('Tidak ada aktivitas login/logout yang tercatat.');
    } else {
      authActivities.forEach(activity => {
        const user = activity.pengguna;
        console.log(`${activity.waktu_aktivitas} - ${activity.jenis_aktivitas.toUpperCase()} - ${user.nama} (${user.peran}) - ${activity.deskripsi}`);
      });
    }
    
    console.log('\nRingkasan aktivitas per role:');
    console.log('=============================');
    
    const roleActivityCount = {};
    authActivities.forEach(activity => {
      const role = activity.pengguna.peran;
      if (!roleActivityCount[role]) {
        roleActivityCount[role] = { login: 0, logout: 0 };
      }
      roleActivityCount[role][activity.jenis_aktivitas]++;
    });
    
    Object.keys(roleActivityCount).forEach(role => {
      const counts = roleActivityCount[role];
      console.log(`${role}: ${counts.login} login, ${counts.logout} logout`);
    });
    
    // Cek role yang tidak memiliki aktivitas
    const allRoles = ['admin', 'kepala_lab', 'toolman', 'sarana'];
    const rolesWithActivity = Object.keys(roleActivityCount);
    const rolesWithoutActivity = allRoles.filter(role => !rolesWithActivity.includes(role));
    
    if (rolesWithoutActivity.length > 0) {
      console.log('\nRole tanpa aktivitas login/logout:');
      console.log('==================================');
      rolesWithoutActivity.forEach(role => {
        console.log(`- ${role}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAuthActivities();