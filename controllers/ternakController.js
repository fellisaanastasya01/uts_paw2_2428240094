// controllers/smartphoneController.js
// Controller: menangani request, validasi, dan response.
// TIDAK mengakses data langsung — memanggil model.

const model = require("../models/smartphoneModel");

const FIELD_WAJIB = ["merek", "model", "ramGb", "penyimpananGb", "harga"];

function fieldKosong(body) {
  return FIELD_WAJIB.filter((f) => !(f in body) || body[f] === "" || body[f] === null || body[f] === undefined);
}

function kirimDaftar(req, res) {
  const filter = req.query.merek;
  const data = model.filterByMerek(filter);
  res.json(data);
}

function kirimSatu(req, res) {
  const d = model.getById(Number(req.params.id));
  if (!d) return res.status(404).json({ message: `Data dengan id ${req.params.id} tidak ditemukan` });
  res.json(d);
}

function kirimBuat(req, res) {
  const kosong = fieldKosong(req.body);
  if (kosong.length) {
    return res.status(400).json({ message: `Field ${kosong.join(", ")} wajib diisi` });
  }
  const baru = model.buat(req.body);
  res.status(201).json(baru);
}

function kirimPerbarui(req, res) {
  const kosong = fieldKosong(req.body);
  if (kosong.length) {
    return res.status(400).json({ message: `Field ${kosong.join(", ")} wajib diisi` });
  }
  const id = Number(req.params.id);
  if (!model.getById(id)) {
    return res.status(404).json({ message: `Data dengan id ${id} tidak ditemukan` });
  }
  const diperbarui = model.perbarui(id, req.body);
  res.json({ message: "Data berhasil diubah", data: diperbarui });
}

function kirimHapus(req, res) {
  const id = Number(req.params.id);
  const hapus = model.hapus(id);
  if (!hapus) return res.status(404).json({ message: `Data dengan id ${id} tidak ditemukan` });
  res.json({ message: `Data smartphone dengan id ${id} berhasil dihapus`, data: hapus });
}

module.exports = { kirimDaftar, kirimSatu, kirimBuat, kirimPerbarui, kirimHapus };
