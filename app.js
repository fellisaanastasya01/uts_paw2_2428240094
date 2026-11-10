const express = require('express');
const { connectDB } = require('./db');
const logger = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const rasRoutes = require('./routes/rasRoutes');
const ternakRoutes = require('./routes/ternakRoutes');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[LOG] ${req.method} ${req.originalUrl}`);
    next();
});

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function kirimError(res, err) {
    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validasi gagal: ' + Object.values(err.errors).map((e) => e.message).join(', '),
            errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
            data: null
        });
    }
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ status: 'error', message: `Nilai ${err.value} tidak valid untuk ${err.path}`, data: null });
    }
    if (err && err.code === 11000) {
        const field = Object.keys(err.keyValue || {}).join(', ');
        return res.status(409).json({
            status: 'error',
            message: `Data dengan ${field} tersebut sudah ada`,
            field,
            data: null
        });
    }
    console.error('[ERROR]', err);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server', data: null });
}

const idValid = (id) => mongoose.isValidObjectId(id);
app.use(logger);

// GET / -> info API
app.get('/', (req, res) => res.status(200).json(require('./data/info.json')));

app.get('/ras', asyncHandler(async (req, res) => {
    const data = await Ras.find().sort({ nama: 1 });
    res.status(200).json(data);
}));

app.post('/ras', asyncHandler(async (req, res) => {
    const { nama, asalDaerah } = req.body;
    if (!nama || !asalDaerah) {
        return res.status(400).json({
            status: 'error',
            message: 'Field nama dan asalDaerah wajib diisi',
            data: null
        });
    }
    const baru = await Ras.create({ nama, asalDaerah });
    res.status(201).json({ status: 'success', message: 'Data ras berhasil ditambahkan', data: baru });
}));

app.get('/ternak', asyncHandler(async (req, res) => {
    const { status, ras, minBerat, maxBerat, sort, fields, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = String(status).toLowerCase();
    if (minBerat || maxBerat) {
        filter.beratKG = {};
        if (minBerat) filter.beratKG.$gte = Number(minBerat);
        if (maxBerat) filter.beratKG.$lte = Number(maxBerat);
    }
    if (ras) {
        const daftarRas = await Ras.find({ nama: new RegExp(`^${ras}$`, 'i') }).select('_id');
        if (daftarRas.length === 0) return res.status(200).json([]);
        filter.ras = { $in: daftarRas.map((r) => r._id) };
    }

    // sort=beratKG (menaik), sort=-beratKG (menurun), sort=beratKG,-nama
    const urut = sort
        ? Object.fromEntries(
              sort.split(',').map((k) => {
                  const t = k.trim();
                  return t.startsWith('-') ? [t.slice(1), -1] : [t, 1];
              })
          )
        : { kodeTernak: 1 };

    const proyeksi = fields ? fields.split(',').map((f) => f.trim()).join(' ') : undefined;
    const halaman = Math.max(1, Number(page));
    const batas = Math.min(100, Math.max(1, Number(limit)));

    const data = await Ternak.find(filter, proyeksi)
        .populate('ras', 'nama asalDaerah')
        .sort(urut)
        .skip((halaman - 1) * batas)
        .limit(batas);

    res.status(200).json(data);
}));

// GET /ternak/:id -> satu dokumen, field ras ter-populate (nama & asalDaerah)
app.get('/ternak/:id', asyncHandler(async (req, res) => {
    if (!idValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const data = await Ternak.findById(req.params.id).populate('ras', 'nama asalDaerah');
    if (!data) {
        return res.status(404).json({
            status: 'error',
            message: `Data dengan id ${req.params.id} tidak ditemukan`,
            data: null
        });
    }
    res.status(200).json({ status: 'success', data });
}));

// POST /ternak -> 201, dokumen memuat kandang (embed) dan ras (ref ter-populate)
app.post('/ternak', asyncHandler(async (req, res) => {
    const { kodeTernak, nama, beratKG, status, kandang, ras } = req.body;

    const kosong = ['kodeTernak', 'nama', 'beratKG', 'kandang', 'ras'].filter(
        (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );
    if (kosong.length) {
        return res.status(400).json({
            status: 'error',
            message: `Field ${kosong.join(', ')} wajib diisi`,
            errors: kosong.map((f) => ({ field: f, message: `${f} wajib diisi` })),
            data: null
        });
    }
    if (!idValid(ras)) {
        return res.status(400).json({ status: 'error', message: 'ras harus berupa ObjectId dokumen Ras', data: null });
    }
    const dokRas = await Ras.findById(ras);
    if (!dokRas) {
        return res.status(404).json({ status: 'error', message: `Ras ${ras} tidak ditemukan`, data: null });
    }

    const baru = await Ternak.create({ kodeTernak, nama, beratKG, status, kandang, ras: dokRas._id });
    const terisi = await baru.populate('ras', 'nama asalDaerah');
    res.status(201).json({
        status: 'success',
        message: 'Data ternak berhasil ditambahkan',
        data: terisi
    });
}));

// PUT /ternak/:id -> ubah seluruh field
app.put('/ternak/:id', asyncHandler(async (req, res) => {
    if (!idValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    if (req.body.ras && !idValid(req.body.ras)) {
        return res.status(400).json({ status: 'error', message: 'ras harus berupa ObjectId dokumen Ras', data: null });
    }
    const data = await Ternak.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    }).populate('ras', 'nama asalDaerah');
    if (!data) {
        return res.status(404).json({
            status: 'error',
            message: `Data dengan id ${req.params.id} tidak ditemukan`,
            data: null
        });
    }
    res.status(200).json({ status: 'success', message: 'Data berhasil diubah', data });
}));

// DELETE /ternak/:id
app.delete('/ternak/:id', asyncHandler(async (req, res) => {
    if (!idValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const data = await Ternak.findByIdAndDelete(req.params.id);
    if (!data) {
        return res.status(404).json({
            status: 'error',
            message: `Data dengan id ${req.params.id} tidak ditemukan`,
            data: null
        });
    }
    res.status(200).json({ status: 'success', message: `Data ternak dengan id ${data._id} berhasil dihapus`, data: null });
}));

// 404 rute tidak dikenal
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: `Rute ${req.originalUrl} tidak ditemukan`, data: null });
});

// Error handler terakhir
app.use((err, req, res, next) => kirimError(res, err));
// Kumpulan rute
app.use('/ras', rasRoutes);
app.use('/ternak', ternakRoutes);

// 404 rute tidak dikenal + error handler terakhir
app.use(notFound);
app.use(errorHandler);
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
