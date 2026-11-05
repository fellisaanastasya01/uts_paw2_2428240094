// routes/smartphoneRoutes.js
// Route: memetakan alamat ke fungsi Controller.
// GET tanpa API key; POST/PUT/DELETE dilindungi cekApiKey.

const express = require("express");
const router = express.Router();
const c = require("../controllers/smartphoneController");
const cekApiKey = require("../middlewares/cekApiKey");

router.get("/", c.kirimDaftar);
router.get("/:id", c.kirimSatu);
router.post("/", cekApiKey, c.kirimBuat);
router.put("/:id", cekApiKey, c.kirimPerbarui);
router.delete("/:id", cekApiKey, c.kirimHapus);

module.exports = router;
