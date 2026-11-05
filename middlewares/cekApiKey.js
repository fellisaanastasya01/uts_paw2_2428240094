// middlewares/cekApiKey.js
// API Key middleware: melindungi rute POST, PUT, DELETE.
// Key valid dibaca dari proses.env.API_KEY.

function cekApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ message: "API key tidak valid" });
  }
  next();
}

module.exports = cekApiKey;
