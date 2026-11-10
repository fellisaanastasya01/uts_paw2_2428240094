// middlewares/errorHandler.js
// Pembungkus async, error handler terpusat, dan 404 rute tidak dikenal.
const mongoose = require('mongoose');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function errorHandler(err, req, res, next) {
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
        return res.status(409).json({ status: 'error', message: `Data dengan ${field} tersebut sudah ada`, field, data: null });
    }
    console.error('[ERROR]', err);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server', data: null });
}

function notFound(req, res) {
    res.status(404).json({ status: 'error', message: `Rute ${req.originalUrl} tidak ditemukan`, data: null });
}

module.exports = { asyncHandler, errorHandler, notFound };
