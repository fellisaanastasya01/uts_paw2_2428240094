// Koneksi database MongoDB untuk seluruh aplikasi.
// URI diambil dari environment agar bisa dipindah ke MongoDB Atlas tanpa mengubah kode.
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toko_gadget';

async function connectDB() {
    await mongoose.connect(MONGO_URI);
    console.log(`[DB] Terhubung ke MongoDB: ${mongoose.connection.name}`);
    return mongoose.connection;
}

module.exports = { connectDB, MONGO_URI };
