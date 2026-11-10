// Seed data uji: 3 ras + 5 ternak (NIM 2428240094 dipakai pada nilai unik kodeTernak)
const mongoose = require('mongoose');
const { connectDB } = require('../db');
const Ras = require('../models/ras');
const Ternak = require('../models/ternak');

const rasAwal = [
    { nama: 'Austria', asalDaerah: 'Australia' },
    { nama: 'Japanese', asalDaerah: 'Japan' },
    { nama: 'Chinese', asalDaerah: 'China' }
];

const ternakAwal = [
    { kodeTernak: 'TRK-2428240094-001', nama: 'Sapi Perah Andini', beratKG: 120, status: 'sehat', kandang: { kode: 'K-01', lokasi: 'Blok A Palembang' }, ras: 'Austria' },
    { kodeTernak: 'TRK-2428240094-002', nama: 'Sapi Potong Bima', beratKG: 90, status: 'sehat', kandang: { kode: 'K-02', lokasi: 'Blok B Palembang' }, ras: 'Japanese' },
    { kodeTernak: 'TRK-2428240094-003', nama: 'Sapi Perah Citra', beratKG: 150, status: 'dirawat', kandang: { kode: 'K-01', lokasi: 'Blok A Palembang' }, ras: 'Austria' },
    { kodeTernak: 'TRK-2428240094-004', nama: 'Sapi Potong Darma', beratKG: 75, status: 'sehat', kandang: { kode: 'K-03', lokasi: 'Blok C Indralaya' }, ras: 'Chinese' },
    { kodeTernak: 'TRK-2428240094-005', nama: 'Sapi Perah Elok', beratKG: 200, status: 'sakit', kandang: { kode: 'K-02', lokasi: 'Blok B Palembang' }, ras: 'Japanese' }
];

async function main() {
    await connectDB();
    await Promise.all([Ras.deleteMany({}), Ternak.deleteMany({})]);

    const rasTersimpan = await Ras.insertMany(rasAwal);
    const idRas = new Map(rasTersimpan.map((r) => [r.nama, r._id]));

    const dokumen = ternakAwal.map(({ ras, ...sisa }) => ({ ...sisa, ras: idRas.get(ras) }));
    const ternakTersimpan = await Ternak.insertMany(dokumen);

    console.log(`[SEED] ${rasTersimpan.length} ras, ${ternakTersimpan.length} ternak`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('[SEED] gagal:', err.message);
    process.exit(1);
});
