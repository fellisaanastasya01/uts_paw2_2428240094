// models/smartphoneModel.js
// Model: menyimpan data dan fungsi pengolahannya.
// TIDAK memakai req maupun res — murni logika data.

const dataAwal = [
  { id: 1, merek: "Xiaomi",  model: "Redmi Note 14", ramGb: 8, penyimpananGb: 256, harga: 3299000 },
  { id: 2, merek: "Samsung", model: "Galaxy A54", ramGb: 8, penyimpananGb: 256, harga: 5999000 },
    { id: 3, merek: "Apple", model: "iPhone 13", ramGb: 4, penyimpananGb: 128, harga: 9999000 },
    { id: 4, merek: "Infinix", model: "Note 40 Pro", ramGb: 8, penyimpananGb: 130, harga: 3999000 }
];
let nextId = 5; 

function getAll() {
  return dataAwal;
}

function getById(id) {
  return dataAwal.find((d) => d.id === id) || null;
}

function filterByMerek(merek) {
  if (!merek) return [...dataAwal];
  const kata = merek.toLowerCase();
  return dataAwal.filter((d) => d.merek.toLowerCase().includes(kata));
}

function buat(data) {
  const baru = { id: nextId++, ...data };
  dataAwal.push(baru);
  return baru;
}

function perbarui(id, data) {
  const idx = dataAwal.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  dataAwal[idx] = { id, ...data };
  return dataAwal[idx];
}

function hapus(id) {
  const idx = dataAwal.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  return dataAwal.splice(idx, 1)[0];
}

module.exports = { getAll, getById, filterByMerek, buat, perbarui, hapus };
