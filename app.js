// Impor Express dan Mongoose model
const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./db');
const Merek = require('./models/Merek');
const Smartphone = require('./models/Smartphone');
const app = express();

// Middleware untuk membaca JSON dari body request
app.use(express.json());

// Middleware Logger (Untuk melihat proses di terminal)
app.use((req, res, next) => {
    console.log(`[LOG] Method: ${req.method} | Endpoint: ${req.originalUrl}`);
    next();
});

// Pembungkus async agar error dari query MongoDB tertangkap handler error
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Mengubah error Mongoose menjadi response JSON yang konsisten
function kirimError(res, err) {
    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            status: 'error',
            message: Object.values(err.errors).map((e) => e.message).join(', '),
            data: null
        });
    }
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ status: 'error', message: `Nilai ${err.value} tidak valid`, data: null });
    }
    if (err && err.code === 11000) {
        return res.status(400).json({
            status: 'error',
            message: `Data dengan ${Object.keys(err.keyValue).join(', ')} tersebut sudah ada`,
            data: null
        });
    }
    console.error('[ERROR]', err);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server', data: null });
}

// Objek ObjectId kosong -> tidak ada dokumen yang cocok -> 404
const adalahIdValid = (id) => mongoose.isValidObjectId(id);

// GET / -> Mengembalikan JSON info API
app.get('/', asyncHandler(async (req, res) => {
    const info = require('./data/info.json');
    res.status(200).json(info);
}));

// GET /merek -> semua merek (sorting + pagination + projection)
app.get('/merek', asyncHandler(async (req, res) => {
    const { sort, fields, page = 1, limit = 10 } = req.query;
    const urut = sort ? Object.fromEntries(sort.split(',').map((k) => [k.trim(), 1])) : { nama: 1 };
    const proyeksi = fields ? fields.split(',').map((f) => f.trim()).join(' ') : undefined;
    const lompat = (Number(page) - 1) * Number(limit);
    const data = await Merek.find({}, proyeksi).sort(urut).skip(lompat).limit(Number(limit));
    const total = await Merek.countDocuments();
    res.status(200).json({ total, page: Number(page), limit: Number(limit), data });
}));

// POST /merek -> tambah merek baru
app.post('/merek', asyncHandler(async (req, res) => {
    const { nama, negaraAsal } = req.body;
    if (!nama || !negaraAsal) {
        return res.status(400).json({
            status: 'error',
            message: 'Field nama dan negaraAsal wajib diisi',
            data: null
        });
    }
    const baru = await Merek.create({ nama, negaraAsal });
    res.status(201).json({ status: 'success', message: 'Data merek berhasil ditambahkan', data: baru });
}));

// GET /merek/:id/smartphone -> referencing: ambil merek, lalu smartphone miliknya
app.get('/merek/:id/smartphone', asyncHandler(async (req, res) => {
    if (!adalahIdValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: 'id merek tidak valid', data: null });
    }
    const merek = await Merek.findById(req.params.id);
    if (!merek) {
        return res.status(404).json({ status: 'error', message: `Merek ${req.params.id} tidak ditemukan`, data: null });
    }
    const smartphone = await Smartphone.find({ merek: merek._id }).select('-__v');
    res.status(200).json({ merek, smartphone });
}));

// GET /smartphones/:id/smartphone -> tidak dipakai, sengaja tidak ditambahkan agar route tetap datar

// GET /smartphones -> filter, sorting, pagination, projection
app.get('/smartphones', asyncHandler(async (req, res) => {
    const { merek, model, minHarga, maxHarga, sort, fields, page = 1, limit = 10 } = req.query;

    // Filter
    const filter = {};
    if (merek) {
        const dataMerek = await Merek.find({ nama: new RegExp(`^${merek}$`, 'i') }).select('_id');
        if (dataMerek.length === 0) {
            return res.status(200).json({ total: 0, page: Number(page), limit: Number(limit), data: [] });
        }
        filter.merek = { $in: dataMerek.map((m) => m._id) };
    }
    if (model) filter.model = new RegExp(model, 'i');
    if (minHarga || maxHarga) {
        filter.harga = {};
        if (minHarga) filter.harga.$gte = Number(minHarga);
        if (maxHarga) filter.harga.$lte = Number(maxHarga);
    }

    // Sorting: ?sort=model,-harga (tanda minus = menurun)
    const urut = sort
        ? Object.fromEntries(sort.split(',').map((k) => {
            const t = k.trim();
            return t.startsWith('-') ? [t.slice(1), -1] : [t, 1];
        }))
        : { _id: 1 };

    // Projection: ?fields=model,harga
    const proyeksi = fields ? fields.split(',').map((f) => f.trim()).join(' ') : undefined;

    // Pagination: ?page=1&limit=10
    const halaman = Math.max(1, Number(page));
    const batas = Math.min(100, Math.max(1, Number(limit)));

    const data = await Smartphone.find(filter, proyeksi)
        .populate('merek', 'nama negaraAsal')
        .sort(urut)
        .skip((halaman - 1) * batas)
        .limit(batas);

    res.status(200).json({
        filter,
        total: await Smartphone.countDocuments(filter),
        page: halaman,
        limit: batas,
        data
    });
}));

// GET /smartphones/:id -> ambil satu dokumen beserta data merek (referencing)
app.get('/smartphones/:id', asyncHandler(async (req, res) => {
    if (!adalahIdValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const data = await Smartphone.findById(req.params.id).populate('merek', 'nama negaraAsal');
    if (!data) {
        return res.status(404).json({
            status: 'error',
            message: `Data dengan id ${req.params.id} tidak ditemukan`,
            data: null
        });
    }
    res.status(200).json(data);
}));

// POST /smartphones -> tambah smartphone; merek harus sudah ada (referencing)
app.post('/smartphones', asyncHandler(async (req, res) => {
    const { merek, model, ramGb, penyimpananGb, harga, spesifikasi } = req.body;
    if (!merek || !model || !ramGb || !penyimpananGb || !harga) {
        return res.status(400).json({
            status: 'error',
            message: 'Field merek, model, ramGb, penyimpananGb, dan harga wajib diisi',
            data: null
        });
    }
    if (!spesifikasi || !spesifikasi.layarInci || !spesifikasi.bateraiMah || !spesifikasi.jaringan) {
        return res.status(400).json({
            status: 'error',
            message: 'Field spesifikasi.layarInci, spesifikasi.bateraiMah, dan spesifikasi.jaringan wajib diisi',
            data: null
        });
    }
    if (!adalahIdValid(merek)) {
        return res.status(400).json({ status: 'error', message: 'merek harus berupa ObjectId dokumen Merek', data: null });
    }
    const dataMerek = await Merek.findById(merek);
    if (!dataMerek) {
        return res.status(404).json({ status: 'error', message: `Merek ${merek} tidak ditemukan`, data: null });
    }

    const baru = await Smartphone.create({ merek: dataMerek._id, model, ramGb, penyimpananGb, harga, spesifikasi });
    res.status(201).json({
        status: 'success',
        message: 'Data berhasil ditambahkan',
        data: await baru.populate('merek', 'nama negaraAsal')
    });
}));

// PUT /smartphones/:id -> ubah seluruh field (replace)
app.put('/smartphones/:id', asyncHandler(async (req, res) => {
    if (!adalahIdValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const { merek, model, ramGb, penyimpananGb, harga, spesifikasi } = req.body;
    if (!merek || !model || !ramGb || !penyimpananGb || !harga) {
        return res.status(400).json({
            status: 'error',
            message: 'Field merek, model, ramGb, penyimpananGb, dan harga wajib diisi',
            data: null
        });
    }
    if (!adalahIdValid(merek)) {
        return res.status(400).json({ status: 'error', message: 'merek harus berupa ObjectId dokumen Merek', data: null });
    }
    const data = await Smartphone.findByIdAndUpdate(
        req.params.id,
        { merek, model, ramGb, penyimpananGb, harga, spesifikasi },
        { new: true, runValidators: true, overwriteDiscriminatorKey: false }
    ).populate('merek', 'nama negaraAsal');

    if (!data) {
        return res.status(404).json({
            status: 'error',
            message: `Data dengan id ${req.params.id} tidak ditemukan`,
            data: null
        });
    }
    res.status(200).json({ status: 'success', message: 'Data berhasil diubah', data });
}));

// DELETE /smartphones/:id -> hapus dokumen
app.delete('/smartphones/:id', asyncHandler(async (req, res) => {
    if (!adalahIdValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const data = await Smartphone.findByIdAndDelete(req.params.id);
    if (!data) {
        return res.status(404).json({
            status: 'error',
            message: `Data dengan id ${req.params.id} tidak ditemukan`,
            data: null
        });
    }
    res.status(200).json({
        status: 'success',
        message: `Data smartphone dengan id ${data._id} berhasil dihapus`,
        data: null
    });
}));

// Middleware catch-all 404 (Untuk route tidak dikenal)
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint tidak ditemukan', data: null });
});

// Handler error terakhir: seluruh error Mongoose/validasi jadi JSON
app.use((err, req, res, next) => kirimError(res, err));

// Menjalankan server (Hanya lokal + ekspor untuk Vercel)
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    connectDB()
        .then(() => app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`)))
        .catch((err) => {
            console.error('[DB] Gagal terhubung ke MongoDB:', err.message);
            process.exit(1);
        });
}

module.exports = app;
