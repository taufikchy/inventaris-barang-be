const axios = require('axios');

// Test API response untuk melihat struktur data
async function testApiResponse() {
  try {
    console.log('Testing API response...');
    
    // Try different passwords for admin
    const passwords = ['admin123', 'password', 'admin', '123456'];
    let token = null;
    
    for (const password of passwords) {
      try {
        console.log(`Trying password: ${password}`);
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          nama_pengguna: 'admin',
          kata_sandi: password
        });
        
        if (loginResponse.data.sukses) {
          token = loginResponse.data.token || loginResponse.data.data?.token;
          console.log('Login successful with password:', password);
          break;
        }
      } catch (err) {
        console.log(`Failed with password: ${password}`);
      }
    }
    
    if (!token) {
      console.error('All login attempts failed');
      return;
    }
    
    console.log('Login successful, token received');
    
    // Test barang API with token
    const barangResponse = await axios.get('http://localhost:5000/api/barang?batas=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (barangResponse.data.sukses) {
      console.log('\n=== API Response Structure ===');
      console.log('Total items:', barangResponse.data.data.length);
      
      // Show first item structure
      if (barangResponse.data.data.length > 0) {
        const firstItem = barangResponse.data.data[0];
        console.log('\nFirst item structure:');
        console.log('ID:', firstItem.id);
        console.log('Kode:', firstItem.kode);
        console.log('Nama:', firstItem.nama);
        console.log('ID Sumber Dana:', firstItem.id_sumber_dana);
        console.log('Sumber Dana Object:', firstItem.sumber_dana);
        
        if (firstItem.sumber_dana) {
          console.log('Sumber Dana Nama:', firstItem.sumber_dana.nama);
        } else {
          console.log('Sumber Dana: NULL/undefined');
        }
        
        console.log('\nFull first item:');
        console.log(JSON.stringify(firstItem, null, 2));
      }
    } else {
      console.error('API Error:', barangResponse.data.pesan);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testApiResponse();