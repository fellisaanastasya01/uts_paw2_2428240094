const mongoose = require('mongoose');

const rasSchema = new mongoose.Schema(
    { nama: 'Austria', asalDaerah: 'Australia' },
    { nama: 'Japanese', asalDaerah: 'Japan' },
    { nama: 'Chinese', asalDaerah: 'China' },
    { _id: false }
);

const ternakSchema = new mongoose.Schema(
    { nama: 'Austria', asalDaerah: 'Australia' },
    { nama: 'Japanese', asalDaerah: 'Japan' },
    { nama: 'Chinese', asalDaerah: 'China' },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('ternak', ternakSchema, 'ternak');
