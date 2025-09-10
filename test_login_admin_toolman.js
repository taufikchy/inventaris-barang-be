const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test login untuk admin dan toolman dengan berbagai password
async function testLoginAdminToolman() {
  console.log('=== Testing Login Admin dan Toolman ===\n');
  
  const testCombinations = [
    // Admin
    { username: 'admin', passwords: ['admin'], role: 'admin' },
    // Toolman
    { username: 'toolman', passwords: ['toolman'], role: 'toolman' },
    // Sarana
    { username: 'sarana', passwords: ['sarana'], role: 'sarana' }
  ];
  
  for (const user of testCombinations) {
    console.log(`\n--- Testing untuk ${user.role.toUpperCase()} (${user.username}) ---`);
    
    let loginSuccess = false;
    
    for (const password of user.passwords) {
      try {
        console.log(`Mencoba password: ${password}`);
        
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          nama_pengguna: user.username,
          kata_sandi: password
        });
        
        if (loginResponse.data.success) {
          console.log(`✅ Login berhasil dengan password: ${password}`);
          console.log(`   User: ${loginResponse.data.data.pengguna.nama}`);
          console.log(`   Role: ${loginResponse.data.data.pengguna.role}`);
          loginSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Password ${password} gagal:`, error.response?.data?.message || error.message || 'Unknown error');
        if (error.response?.data) {
          console.log('   Full response:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }
    
    if (!loginSuccess) {
      console.log(`❌ Semua password gagal untuk ${user.username}`);
    }
  }
  
  console.log('\n=== Testing Selesai ===');
}

testLoginAdminToolman();