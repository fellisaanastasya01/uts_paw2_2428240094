const mongoose = require('mongoose');

const rasSchema = new mongoose.Schema(
    { ras: 'Austria', asalDaerah: 'Australia' },
    { ras: 'Japanese', asalDaerah: 'Japan' },
    { ras: 'Chinese', asalDaerah: 'China' },
    { _id: false }
);

const ternakSchema = new mongoose.Schema(
    { ras: 'Austria', asalDaerah: 'Australia' },
    { ras: 'Japanese', asalDaerah: 'Japan' },
    { ras: 'Chinese', asalDaerah: 'China' },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('ternak', ternakSchema, 'ternak');
