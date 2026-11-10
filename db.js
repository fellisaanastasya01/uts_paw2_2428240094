const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uts_paw2_2428240094';

async function connectDB() {
    await mongoose.connect(MONGO_URI);
    console.log(`[DB] Terhubung ke MongoDB: ${mongoose.connection.name}`);
    return mongoose.connection;
}

module.exports = { connectDB, MONGO_URI };
