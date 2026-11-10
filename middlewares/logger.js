function logger(req, res, next) {
    console.log(`[LOG] ${req.method} ${req.originalUrl}`);
    next();
}

module.exports = logger;
