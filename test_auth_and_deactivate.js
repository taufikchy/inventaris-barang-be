const axios = require('axios');

// Konfigurasi base URL
const baseURL = 'http://localhost:5000';

// Test login dan deaktivasi user
async function testAuthAndDeactivate() {
  try {
    console.log('=== Testing Authentication and User Deactivation ===\n');
    
    // 1. Test login sebagai kepala_lab
    console.log('1. Testing login as kepala_lab...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      nama_pengguna: 'kalab',
      kata_sandi: 'kalab'
    });
    
    if (loginResponse.data.sukses) {
      console.log('✅ Login successful');
      console.log('User data:', loginResponse.data.data.pengguna);
      
      const token = loginResponse.data.data.token;
      console.log('Token received:', token.substring(0, 20) + '...');
      
      // 2. Test get all users
      console.log('\n2. Testing get all users...');
      const usersResponse = await axios.get(`${baseURL}/api/pengguna`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.data.sukses) {
        console.log('✅ Get users successful');
        console.log('Response data structure:', JSON.stringify(usersResponse.data, null, 2));
        
        const users = usersResponse.data.data?.pengguna || usersResponse.data.data || [];
        console.log('Total users:', users.length);
        
        // Cari user yang bisa dideaktivasi (bukan kepala_lab dan bukan admin)
        const targetUser = users.find(user => 
          user.peran !== 'kepala_lab' && user.peran !== 'admin' && user.aktif === true
        );
        
        if (targetUser) {
          console.log('\n3. Testing user deactivation...');
          console.log('Target user:', targetUser.nama, '(ID:', targetUser.id, ')');
          
          // 3. Test deaktivasi user
          const deactivateResponse = await axios.patch(
            `${baseURL}/api/pengguna/${targetUser.id}/nonaktifkan`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (deactivateResponse.data.sukses) {
            console.log('✅ User deactivation successful');
            console.log('Response:', deactivateResponse.data.pesan);
            
            // 4. Test aktivasi kembali
            console.log('\n4. Testing user activation...');
            const activateResponse = await axios.patch(
              `${baseURL}/api/pengguna/${targetUser.id}/aktifkan`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (activateResponse.data.sukses) {
              console.log('✅ User activation successful');
              console.log('Response:', activateResponse.data.pesan);
            } else {
              console.log('❌ User activation failed:', activateResponse.data.pesan);
            }
          } else {
            console.log('❌ User deactivation failed:', deactivateResponse.data.pesan);
          }
        } else {
          console.log('⚠️ No suitable user found for deactivation test');
        }
      } else {
        console.log('❌ Get users failed:', usersResponse.data.pesan);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.pesan);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Jalankan test
testAuthAndDeactivate();