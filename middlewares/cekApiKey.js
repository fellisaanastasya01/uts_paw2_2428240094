function cekApiKey(req, res, next) {
    if (!process.env.API_KEY) return next();
    const key = req.headers["x-api-key"];
    if (!key || key !== process.env.API_KEY) {
        return res.status(401).json({ status: "error", message: "API key tidak valid", data: null });
    }
    next();
}

module.exports = cekApiKey;
