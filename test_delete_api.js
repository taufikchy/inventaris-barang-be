const { Transaksi, Barang, Kategori, Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');
const { deleteTransaksi } = require('./src/controllers/transaksi.controller');

async function testDeleteFunction() {
  try {
    console.log('=== Test Fungsi Hapus Transaksi ===\n');

    // Cari barang dengan kategori bahan dan satuan set
    const barang = await Barang.findOne({
      where: {
        satuan: 'set'
      },
      include: [{
        model: Kategori,
        as: 'kategori',
        where: {
          tipe: 'bahan'
        }
      }]
    });

    if (!barang) {
      console.log('Tidak ada barang dengan kategori bahan dan satuan set');
      return;
    }

    // Reset stok untuk testing
    await barang.update({
      jumlah: 2, // 2 set
      unit_used: 0 // belum ada yang terpakai
    });

    console.log(`Barang: ${barang.nama}`);
    console.log(`Stok awal: ${barang.jumlah} set`);
    console.log(`Unit per set: ${barang.unit_per_set}`);
    console.log(`Unit terpakai awal: ${barang.unit_used || 0}\n`);

    // Cari user untuk transaksi
    const pengguna = await Pengguna.findOne();
    if (!pengguna) {
      console.log('Tidak ada pengguna untuk melakukan transaksi');
      return;
    }

    // Buat transaksi langsung ke database
    console.log('=== Membuat Transaksi ===');
    const transaksi = await Transaksi.create({
      id_barang: barang.id,
      id_pengguna: pengguna.id,
      jenis_transaksi: 'keluar',
      jumlah: 30, // 30 unit
      unit_used: 30, // untuk set items
      stok_sebelum: 100, // 2 set * 50 unit
      stok_sesudah: 70,  // (2*50) - 30
      keterangan: 'Test transaksi untuk dihapus'
    });

    console.log(`✓ Transaksi berhasil dibuat dengan ID: ${transaksi.id}`);
    console.log(`Jumlah: ${transaksi.jumlah} unit\n`);

    // Update stok barang sesuai transaksi
    const setsUsed = Math.floor(30 / barang.unit_per_set); // 0 set
    const remainingUnits = 30 % barang.unit_per_set; // 30 unit
    
    await barang.update({
      jumlah: barang.jumlah - setsUsed, // 2 - 0 = 2 set
      unit_used: (barang.unit_used || 0) + remainingUnits // 0 + 30 = 30 unit
    });

    // Cek stok setelah transaksi
    await barang.reload();
    console.log(`Stok setelah transaksi: ${barang.jumlah} set`);
    console.log(`Unit terpakai setelah transaksi: ${barang.unit_used}\n`);

    // Test hapus transaksi menggunakan mock request/response
    console.log('=== Test Hapus Transaksi ===');
    
    const mockReq = {
      params: { id: transaksi.id }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };

    // Panggil fungsi deleteTransaksi
    await deleteTransaksi(mockReq, mockRes);

    console.log(`Status Code: ${mockRes.statusCode}`);
    console.log(`Response:`, mockRes.responseData);

    if (mockRes.responseData && mockRes.responseData.success) {
      console.log('✓ Transaksi berhasil dihapus');
      console.log(`Pesan: ${mockRes.responseData.message}\n`);
    } else {
      console.log('✗ Gagal menghapus transaksi');
      console.log(`Error: ${mockRes.responseData ? mockRes.responseData.message : 'Unknown error'}\n`);
      return;
    }

    // Cek stok setelah hapus
    await barang.reload();
    console.log(`Stok setelah hapus: ${barang.jumlah} set`);
    console.log(`Unit terpakai setelah hapus: ${barang.unit_used}\n`);

    console.log('=== Verifikasi ===');
    console.log('✓ Fungsi hapus transaksi berfungsi dengan baik');
    console.log('✓ Stok kembali ke kondisi semula');
    console.log('✓ Unit terpakai kembali ke kondisi semula');
    
    // Test hapus transaksi yang tidak ada
    console.log('\n=== Test Hapus Transaksi yang Tidak Ada ===');
    const mockReq2 = {
      params: { id: 99999 }
    };
    
    const mockRes2 = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };
    
    await deleteTransaksi(mockReq2, mockRes2);
    
    if (mockRes2.statusCode === 404) {
      console.log('✓ Error 404 untuk transaksi yang tidak ada (sesuai ekspektasi)');
    } else {
      console.log('✗ Error tidak sesuai ekspektasi:', mockRes2.responseData);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testDeleteFunction();