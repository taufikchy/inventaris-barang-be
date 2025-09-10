const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestBahan() {
  let connection;
  
  try {
    // Buat koneksi ke database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventaris_barang'
    });
    
    console.log('Terhubung ke database MySQL');
    
    // Cari kategori dengan tipe 'bahan'
    const [kategoriBahan] = await connection.execute(
      "SELECT * FROM kategori WHERE tipe = 'bahan' LIMIT 1"
    );
    
    if (kategoriBahan.length === 0) {
      console.log('Tidak ada kategori dengan tipe bahan, membuat kategori baru...');
      
      // Buat kategori bahan baru
      const [insertKategori] = await connection.execute(
        "INSERT INTO kategori (nama, deskripsi, tipe) VALUES (?, ?, ?)",
        ['Bahan Kimia', 'Kategori untuk bahan-bahan kimia laboratorium', 'bahan']
      );
      
      console.log('✓ Kategori bahan berhasil dibuat dengan ID:', insertKategori.insertId);
      
      // Gunakan kategori yang baru dibuat
      kategoriBahan.push({ id: insertKategori.insertId, nama: 'Bahan Kimia' });
    }
    
    const kategori = kategoriBahan[0];
    console.log(`✓ Menggunakan kategori: ${kategori.nama} (ID: ${kategori.id})`);
    
    // Cari lokasi untuk barang
    const [lokasi] = await connection.execute(
      "SELECT * FROM lokasi LIMIT 1"
    );
    
    if (lokasi.length === 0) {
      console.log('Tidak ada lokasi, membuat lokasi baru...');
      
      const [insertLokasi] = await connection.execute(
        "INSERT INTO lokasi (nama, deskripsi) VALUES (?, ?)",
        ['Lab Kimia', 'Laboratorium Kimia Dasar']
      );
      
      console.log('✓ Lokasi berhasil dibuat dengan ID:', insertLokasi.insertId);
      lokasi.push({ id: insertLokasi.insertId, nama: 'Lab Kimia' });
    }
    
    const lokasiBarang = lokasi[0];
    console.log(`✓ Menggunakan lokasi: ${lokasiBarang.nama} (ID: ${lokasiBarang.id})`);
    
    // Buat beberapa barang kategori bahan untuk testing
    const barangBahan = [
      {
        nama: 'Asam Sulfat H2SO4',
        deskripsi: 'Asam sulfat untuk praktikum kimia',
        jumlah: 5,
        satuan: 'botol',
        kondisi: 'baik'
      },
      {
        nama: 'Natrium Hidroksida NaOH',
        deskripsi: 'Natrium hidroksida untuk titrasi',
        jumlah: 3,
        satuan: 'botol',
        kondisi: 'baik'
      },
      {
        nama: 'Indikator Universal',
        deskripsi: 'Indikator pH universal',
        jumlah: 2,
        satuan: 'botol',
        kondisi: 'baik'
      }
    ];
    
    console.log('\nMembuat barang kategori bahan...');
    
    for (const barang of barangBahan) {
      // Cek apakah barang sudah ada
      const [existing] = await connection.execute(
        "SELECT * FROM barang WHERE nama = ?",
        [barang.nama]
      );
      
      if (existing.length === 0) {
        // Generate kode barang
        const kodeBarang = `BHN${Date.now().toString().slice(-6)}`;
        
        const [insertBarang] = await connection.execute(
          `INSERT INTO barang (kode, nama, deskripsi, id_kategori, id_lokasi, jumlah, satuan, kondisi, status, tahun_pengadaan) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tersedia', YEAR(CURDATE()))`,
          [
            kodeBarang,
            barang.nama,
            barang.deskripsi,
            kategori.id,
            lokasiBarang.id,
            barang.jumlah,
            barang.satuan,
            barang.kondisi
          ]
        );
        
        console.log(`✓ Barang "${barang.nama}" berhasil dibuat (ID: ${insertBarang.insertId}, Stok: ${barang.jumlah})`);
      } else {
        console.log(`- Barang "${barang.nama}" sudah ada (ID: ${existing[0].id}, Stok: ${existing[0].jumlah})`);
      }
    }
    
    console.log('\n🎉 Setup barang kategori bahan selesai!');
    console.log('Sekarang Anda dapat menjalankan test_habis_status.js untuk menguji fitur status "Habis"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nKoneksi database ditutup');
    }
  }
}

createTestBahan();