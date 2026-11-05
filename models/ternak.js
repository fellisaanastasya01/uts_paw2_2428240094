// Schema Smartphone.
// - EMBEDDING: `spesifikasi` (ramGb, penyimpananGb, layar, baterai, jaringan) disimpan
//   di dalam dokumen karena selalu dibaca bersama smartphone dan tidak dipakai entitas lain.
// - REFERENCING: `merek` menyimpan ObjectId dokumen Merek; data merek diambil lewat populate().
const mongoose = require('mongoose');

const spesifikasiSchema = new mongoose.Schema(
    {
        ramGb: { type: Number, required: true, min: 1 },
        penyimpananGb: { type: Number, required: true, min: 1 },
        layarInci: { type: Number, required: true, min: 1 },
        bateraiMah: { type: Number, required: true, min: 1 },
        jaringan: { type: String, required: true, enum: ['4G', '5G'], trim: true }
    },
    { _id: false }
);

const smartphoneSchema = new mongoose.Schema(
    {
        model: { type: String, required: true, trim: true },
        merek: { type: mongoose.Schema.Types.ObjectId, ref: 'Merek', required: true, index: true },
        ramGb: { type: Number, required: true, min: 1 },
        penyimpananGb: { type: Number, required: true, min: 1 },
        harga: { type: Number, required: true, min: 0 },
        spesifikasi: { type: spesifikasiSchema, required: true }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Smartphone', smartphoneSchema, 'smartphone');
