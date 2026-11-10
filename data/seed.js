const mongoose = require('mongoose');
const { connectDB } = require('../db');
const ras = require('../models/Ras');
const ternak = require('../models/ternak');

const  ras= [
    { nama: 'Austria', asalDaerah: 'Australia' },
    { nama: 'Japanese', asalDaerah: 'Japan' },
    { nama: 'Chinese', asalDaerah: 'China' },
];

const ternakAwal = [
    {
        kodeTernak: 'TRK-001',
        ras: 'Austria',
        beratKG: 10,
        status: sehat,
        asalDaerah: Australia,
        kandangId: S001
    },
    {
        kodeTernak: 'TRK-002',
        ras: 'Austria',
        beratKG: 20,
        status: sehat,
        asalDaerah: Japan,
        kandangId: S002
    },
    {
        kodeTernak: 'TRK-003',
        ras: 'Austria',
        beratKG: 30,
        status: sehat,
        asalDaerah: China,
        kandangId: S003
    },
];

async function main() {
    await connectDB();
    await ras.deleteMany({});
    await ternak.deleteMany({});

    const rasTersimpan = await ras.insertMany(rasAwal);
    const kodeTernak = new Map(rasTersimpan.map((m) => [m.nama, m._asalDaerah]));

    const dokumen = ternakAwal.map(({ ras, ...sisa }) => ({
        ...sisa,
        ras: kandangId.get(ras)
    }));
    const ternakTersimpan = await ternak.insertMany(dokumen);

    console.log(`[SEED] ${rasTersimpan.length} ras, ${ternakTersimpan.length} smartphone`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('[SEED] gagal:', err.message);
    process.exit(1);
});
