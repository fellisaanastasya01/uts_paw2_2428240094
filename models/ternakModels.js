// models/ternakModels.js
// Model utama: Ternak. kandang di-embed, ras direferensikan.
const mongoose = require('mongoose');

// Sub-dokumen yang di-embed ke dalam dokumen Ternak (embedding)
const kandangSchema = new mongoose.Schema(
    {
        kode: { type: String, required: [true, 'kandang.kode wajib diisi'], trim: true },
        lokasi: { type: String, required: [true, 'kandang.lokasi wajib diisi'], trim: true }
    },
    { _id: false }
);

const ternakSchema = new mongoose.Schema(
    {
        kodeTernak: { type: String, required: [true, 'kodeTernak wajib diisi'], unique: true, trim: true },
        nama: { type: String, required: [true, 'nama wajib diisi'], trim: true },
        beratKG: { type: Number, required: [true, 'beratKG wajib diisi'], min: [1, 'beratKG minimal 1 kg'] },
        status: {
            type: String,
            required: [true, 'status wajib diisi'],
            enum: { values: ['sehat', 'dirawat', 'sakit'], message: 'status harus salah satu dari: sehat, dirawat, sakit' },
            default: 'sehat'
        },
        kandang: { type: kandangSchema, required: [true, 'kandang wajib diisi'] },
        // Referencing: rujukan ke collection ras
        ras: { type: mongoose.Schema.Types.ObjectId, ref: 'Ras', required: [true, 'ras wajib diisi'] }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Ternak', ternakSchema, 'ternak');
