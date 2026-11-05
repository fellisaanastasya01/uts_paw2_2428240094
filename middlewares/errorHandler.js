// middlewares/errorHandler.js
// Error handler terpusat + 404 untuk rute tidak ditemukan.

function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message);
  const status = err.status || 500;
  const pesan = status === 500 ? "Kesalahan internal server" : err.message;
  res.status(status).json({ message: pesan });
}

function notFound(req, res) {
  res.status(404).json({ message: `Rute ${req.originalUrl} tidak ditemukan` });
}

module.exports = { errorHandler, notFound };
