// Schema Merek (referenced): satu dokumen per merek.
// Smartphone menyimpan _id dokumen ini pada field `merek`, bukan salinan teks nama merek.
const mongoose = require('mongoose');

const merekSchema = new mongoose.Schema(
    {
        nama: { type: String, required: true, unique: true, trim: true },
        negaraAsal: { type: String, required: true, trim: true }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Merek', merekSchema, 'merek');
