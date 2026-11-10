const mongoose = require('mongoose');

const rasSchema = new mongoose.Schema(
    {
        nama: { type: String, required: true, unique: true, trim: true },
        asalDaerah: { type: String, required: true, trim: true }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Ras', rasSchema, 'ras');
