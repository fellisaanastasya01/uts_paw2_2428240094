// routes/ternakRoutes.js
const express = require('express');
const router = express.Router();
const c = require('../controllers/ternakControllers');
const cekApiKey = require('../middlewares/cekApiKey');

router.get('/', c.kirimDaftar);
router.get('/:id', c.kirimSatu);
router.post('/', cekApiKey, c.kirimBuat);
router.put('/:id', cekApiKey, c.kirimPerbarui);
router.delete('/:id', cekApiKey, c.kirimHapus);

module.exports = router;
