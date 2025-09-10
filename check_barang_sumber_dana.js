const { Barang, SumberDana } = require('./src/models');

async function checkBarangSumberDana() {
  try {
    console.log('=== Checking Barang with Sumber Dana ===');
    
    // Get first 10 barang with sumber_dana relation
    const barangWithSumberDana = await Barang.findAll({
      limit: 10,
      include: [{
        model: SumberDana,
        as: 'sumber_dana',
        attributes: ['id', 'nama'],
        required: false
      }],
      attributes: ['id', 'kode', 'nama', 'id_sumber_dana']
    });
    
    console.log('\nFirst 10 Barang with Sumber Dana relation:');
    barangWithSumberDana.forEach(barang => {
      console.log(`ID: ${barang.id}, Kode: ${barang.kode}, Nama: ${barang.nama}`);
      console.log(`ID Sumber Dana: ${barang.id_sumber_dana}`);
      console.log(`Sumber Dana: ${barang.sumber_dana ? barang.sumber_dana.nama : 'NULL'}`);
      console.log('---');
    });
    
    // Count barang with and without sumber_dana
    const totalBarang = await Barang.count();
    const barangWithSumberDanaCount = await Barang.count({
      where: {
        id_sumber_dana: { [require('sequelize').Op.ne]: null }
      }
    });
    const barangWithoutSumberDanaCount = totalBarang - barangWithSumberDanaCount;
    
    console.log(`\n=== Statistics ===`);
    console.log(`Total Barang: ${totalBarang}`);
    console.log(`Barang with Sumber Dana: ${barangWithSumberDanaCount}`);
    console.log(`Barang without Sumber Dana: ${barangWithoutSumberDanaCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBarangSumberDana();