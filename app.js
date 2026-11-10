// RESTful API UTS PAW II - Topik 26: Peternakan
// Model utama: Ternak (/ternak) | Model pendukung: Ras (/ras)
const express = require('express');
const { connectDB } = require('./db');
const logger = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const rasRoutes = require('./routes/rasRoutes');
const ternakRoutes = require('./routes/ternakRoutes');

const app = express();
app.use(express.json());
app.use(logger);

// GET / -> info API
app.get('/', (req, res) => res.status(200).json(require('./data/info.json')));

// Kumpulan rute
app.use('/ras', rasRoutes);
app.use('/ternak', ternakRoutes);

// 404 rute tidak dikenal + error handler terakhir
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    connectDB()
        .then(() => app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`)))
        .catch((err) => {
            console.error('[DB] Gagal terhubung ke MongoDB:', err.message);
            process.exit(1);
        });
}

module.exports = app;
