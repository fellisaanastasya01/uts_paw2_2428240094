// controllers/rasControllers.js
const Ras = require('../models/rasModels');
const { asyncHandler } = require('../middlewares/errorHandler');

const kirimDaftar = asyncHandler(async (req, res) => {
    const data = await Ras.find().sort({ nama: 1 });
    res.status(200).json(data);
});

const kirimSatu = asyncHandler(async (req, res) => {
    const data = await Ras.findById(req.params.id);
    if (!data) return res.status(404).json({ status: 'error', message: `Ras ${req.params.id} tidak ditemukan`, data: null });
    res.status(200).json({ status: 'success', data });
});

const kirimBuat = asyncHandler(async (req, res) => {
    const { nama, asalDaerah } = req.body;
    if (!nama || !asalDaerah) {
        return res.status(400).json({
            status: 'error',
            message: 'Field nama dan asalDaerah wajib diisi',
            errors: [{ field: 'nama', message: 'nama wajib diisi' }, { field: 'asalDaerah', message: 'asalDaerah wajib diisi' }],
            data: null
        });
    }
    const baru = await Ras.create({ nama, asalDaerah });
    res.status(201).json({ status: 'success', message: 'Data ras berhasil ditambahkan', data: baru });
});

module.exports = { kirimDaftar, kirimSatu, kirimBuat };
