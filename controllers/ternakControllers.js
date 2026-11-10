const mongoose = require('mongoose');
const Ternak = require('../models/ternakModels');
const Ras = require('../models/rasModels');
const { asyncHandler } = require('../middlewares/errorHandler');

const idValid = (id) => mongoose.isValidObjectId(id);

const kirimDaftar = asyncHandler(async (req, res) => {
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
});

const kirimSatu = asyncHandler(async (req, res) => {
    if (!idValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const data = await Ternak.findById(req.params.id).populate('ras', 'nama asalDaerah');
    if (!data) {
        return res.status(404).json({ status: 'error', message: `Data dengan id ${req.params.id} tidak ditemukan`, data: null });
    }
    res.status(200).json({ status: 'success', data });
});

const kirimBuat = asyncHandler(async (req, res) => {
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
    res.status(201).json({ status: 'success', message: 'Data ternak berhasil ditambahkan', data: terisi });
});

const kirimPerbarui = asyncHandler(async (req, res) => {
    if (!idValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    if (req.body.ras && !idValid(req.body.ras)) {
        return res.status(400).json({ status: 'error', message: 'ras harus berupa ObjectId dokumen Ras', data: null });
    }
    const data = await Ternak.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .populate('ras', 'nama asalDaerah');
    if (!data) {
        return res.status(404).json({ status: 'error', message: `Data dengan id ${req.params.id} tidak ditemukan`, data: null });
    }
    res.status(200).json({ status: 'success', message: 'Data berhasil diubah', data });
});

const kirimHapus = asyncHandler(async (req, res) => {
    if (!idValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: `id ${req.params.id} tidak valid`, data: null });
    }
    const data = await Ternak.findByIdAndDelete(req.params.id);
    if (!data) {
        return res.status(404).json({ status: 'error', message: `Data dengan id ${req.params.id} tidak ditemukan`, data: null });
    }
    res.status(200).json({ status: 'success', message: `Data ternak dengan id ${data._id} berhasil dihapus`, data: null });
});

module.exports = { kirimDaftar, kirimSatu, kirimBuat, kirimPerbarui, kirimHapus };
