const http = require('http');

// Helper function untuk HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ data: jsonData, status: res.statusCode });
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test login untuk berbagai role
async function testLogin() {
  const testUsers = [
    { username: 'kalab', password: 'admin123', role: 'kepala_lab' },
    { username: 'kalab', password: 'kalab123', role: 'kepala_lab' },
    { username: 'kalab', password: 'password', role: 'kepala_lab' },
    { username: 'toolman', password: 'admin123', role: 'toolman' },
    { username: 'toolman', password: 'toolman123', role: 'toolman' },
    { username: 'sarana', password: 'admin123', role: 'sarana' },
    { username: 'sarana', password: 'sarana123', role: 'sarana' },
    { username: 'sarana', password: 'password', role: 'sarana' }
  ];

  console.log('Testing login untuk berbagai role...');
  console.log('=====================================');

  for (const testUser of testUsers) {
    try {
      console.log(`\nTesting login untuk ${testUser.role} (${testUser.username})...`);
      
      const loginOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await makeRequest(loginOptions, {
        nama_pengguna: testUser.username,
        kata_sandi: testUser.password
      });

      if (response.data.sukses) {
        console.log(`✅ Login berhasil untuk ${testUser.role}`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
        console.log(`   User: ${response.data.data.pengguna.nama}`);
        
        // Test logout
        try {
          const logoutOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/logout',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.data.data.token}`
            }
          };
          
          const logoutResponse = await makeRequest(logoutOptions);
          
          if (logoutResponse.data.sukses) {
            console.log(`✅ Logout berhasil untuk ${testUser.role}`);
          } else {
            console.log(`❌ Logout gagal untuk ${testUser.role}: ${logoutResponse.data.pesan}`);
          }
        } catch (logoutError) {
          console.log(`❌ Error logout untuk ${testUser.role}: ${logoutError.message}`);
        }
      } else {
        console.log(`❌ Login gagal untuk ${testUser.role}: ${response.data.pesan}`);
      }
    } catch (error) {
      console.log(`❌ Error login untuk ${testUser.role}: ${error.message}`);
    }
  }
  
  console.log('\nTest selesai. Silakan cek histori aktivitas untuk melihat apakah login/logout tercatat.');
}

testLogin();