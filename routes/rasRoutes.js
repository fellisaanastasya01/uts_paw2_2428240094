// routes/rasRoutes.js
const express = require('express');
const router = express.Router();
const c = require('../controllers/rasControllers');
const cekApiKey = require('../middlewares/cekApiKey');

router.get('/', c.kirimDaftar);
router.get('/:id', c.kirimSatu);
router.post('/', cekApiKey, c.kirimBuat);

module.exports = router;
