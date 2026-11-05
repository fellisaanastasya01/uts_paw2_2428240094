const dataAwal = [
  { nama: 'Austria', asalDaerah: 'Australia' },
    { nama: 'Japanese', asalDaerah: 'Japan' },
    { nama: 'Chinese', asalDaerah: 'China' },
];
let nextId = 4; 

function getAll() {
  return dataAwal;
}

function getById(id) {
  return dataAwal.find((d) => d.id === id) || null;
}

function filterByRas(ras) {
  if (!ras) return [...dataAwal];
  const kata = ras.toLowerCase();
  return dataAwal.filter((d) => d.ras.toLowerCase().includes(kata));
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

module.exports = { getAll, getById, filterByRas, buat, perbarui, hapus };
