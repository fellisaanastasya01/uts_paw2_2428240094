// Bukti uji Tugas 3 - satu grup per pemanggilan.
// Pemakaian: node tools/uji.js <nama-grup>
const mongoose = require('mongoose');

const BASE = 'http://localhost:3000';
const MONGO = 'mongodb://127.0.0.1:27017/toko_gadget';

const garis = (judul) => console.log(`\n=== ${judul} ===`);

async function panggil(method, path, body) {
    const res = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });
    const teks = await res.text();
    let data;
    try { data = JSON.parse(teks); } catch { data = teks; }
    console.log(`> ${method} ${path}`);
    if (body) console.log(`  body   : ${JSON.stringify(body)}`);
    console.log(`  status : ${res.status}`);
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
        console.log(`  total  : ${data.total} | page: ${data.page} | limit: ${data.limit}`);
        console.log('  data   : ' + JSON.stringify(data.data, null, 2).split('\n').join('\n           '));
    } else {
        console.log('  hasil  : ' + JSON.stringify(data, null, 2).split('\n').join('\n           '));
    }
    return { status: res.status, data };
}

async function denganDb(fn) {
    await mongoose.connect(MONGO);
    try { await fn(); } finally { await mongoose.disconnect(); }
}

const grup = {
    async '01-struktur'() {
        await denganDb(async () => {
            const db = mongoose.connection.db;
            garis('Database toko_gadget');
            const cols = await db.listCollections().toArray();
            console.log('collection : ' + cols.map((c) => c.name).join(', '));
            console.log('\n--- dokumen merek (referenced) ---');
            console.log(JSON.stringify(await db.collection('merek').findOne(), null, 2));
            console.log('\n--- dokumen smartphone ---');
            console.log('spesifikasi tersimpan DI DALAM dokumen (embedding)');
            console.log('merek tersimpan sebagai ObjectId (referencing)');
            console.log(JSON.stringify(await db.collection('smartphone').findOne(), null, 2));
        });
    },

    async '02-schema'() {
        garis('models/Merek.js - schema referenced');
        console.log(require('fs').readFileSync('models/Merek.js', 'utf8').split('\n').slice(2).join('\n'));
        garis('models/Smartphone.js - embedding + referencing');
        console.log(require('fs').readFileSync('models/Smartphone.js', 'utf8').split('\n').slice(2).join('\n'));
    },

    async '03-filtering'() {
        garis('Filter merek + rentang harga');
        await panggil('GET', '/smartphones?merek=Xiaomi&minHarga=3000000&maxHarga=9000000&fields=model,harga');
        garis('Filter potongan model (regex, abaikan besar-kecil huruf)');
        await panggil('GET', '/smartphones?model=note&fields=model,harga');
        garis('Filter merek yang tidak ada');
        await panggil('GET', '/smartphones?merek=Nokia&fields=model,harga');
    },

    async '04-sorting'() {
        garis('Urut harga menurun');
        await panggil('GET', '/smartphones?sort=-harga&fields=model,harga');
        garis('Urut harga menaik');
        await panggil('GET', '/smartphones?sort=harga&fields=model,harga');
        garis('Urut dua kolom: merek lalu harga menurun');
        await panggil('GET', '/smartphones?sort=merek,-harga&fields=model,harga');
    },

    async '05-pagination'() {
        garis('Halaman 1, 2 data per halaman');
        await panggil('GET', '/smartphones?page=1&limit=2&sort=model&fields=model,harga');
        garis('Halaman 2, 2 data per halaman');
        await panggil('GET', '/smartphones?page=2&limit=2&sort=model&fields=model,harga');
        garis('Halaman 3, 2 data per halaman');
        await panggil('GET', '/smartphones?page=3&limit=2&sort=model&fields=model,harga');
    },

    async '06-projection'() {
        garis('Projection: hanya model dan harga');
        await panggil('GET', '/smartphones?fields=model,harga&limit=2');
        garis('Projection: model, spesifikasi.layarInci, spesifikasi.jaringan');
        await panggil('GET', '/smartphones?fields=model,spesifikasi.layarInci,spesifikasi.jaringan&limit=2');
        garis('Tanpa projection: seluruh field dikirim');
        await panggil('GET', '/smartphones?limit=1');
    },

    async '07-referencing'() {
        garis('Daftar merek beserta _id');
        const { data } = await panggil('GET', '/merek?fields=nama,negaraAsal');
        const xiaomi = data.data.find((m) => m.nama === 'Xiaomi');
        garis('Smartphone milik merek Xiaomi (diambil lewat _id merek)');
        await panggil('GET', `/merek/${xiaomi._id}/smartphone`);
    },

    async '08-create'() {
        const { data } = await panggil('GET', '/merek?fields=nama');
        const xiaomi = data.data.find((m) => m.nama === 'Xiaomi');
        garis('POST smartphone baru dengan merek ObjectId Xiaomi');
        const dibuat = await panggil('POST', '/smartphones', {
            merek: xiaomi._id,
            model: '14T Pro',
            ramGb: 12,
            penyimpananGb: 512,
            harga: 7999000,
            spesifikasi: { ramGb: 12, penyimpananGb: 512, layarInci: 6.7, bateraiMah: 5000, jaringan: '5G' }
        });
        garis('GET dokumen yang baru dibuat (data merek ikut terisi)');
        await panggil('GET', `/smartphones/${dibuat.data.data._id}`);
        garis('DELETE dokumen uji agar data kembali seperti semula');
        await panggil('DELETE', `/smartphones/${dibuat.data.data._id}`);
    },

    async '09-validasi'() {
        garis('id bukan ObjectId');
        await panggil('GET', '/smartphones/123');
        garis('merek tidak ditemukan');
        await panggil('POST', '/smartphones', {
            merek: '6ae89161852d6becab22bfff',
            model: 'Uji',
            ramGb: 8,
            penyimpananGb: 128,
            harga: 1000000,
            spesifikasi: { ramGb: 8, penyimpananGb: 128, layarInci: 6, bateraiMah: 4000, jaringan: '4G' }
        });
        garis('field wajib kosong');
        await panggil('POST', '/smartphones', { model: 'Uji' });
        garis('endpoint tidak dikenal');
        await panggil('GET', '/endpoint-tidak-ada');
    }
};

const nama = process.argv[2];
if (!grup[nama]) {
    console.error('grup tidak dikenal:', nama);
    console.error('pilihan:', Object.keys(grup).join(', '));
    process.exit(2);
}
grup[nama]().catch((err) => {
    console.error('gagal:', err.message);
    process.exit(1);
});
