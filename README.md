# uts-paw2-2428240094

UTS Praktikum Pengembangan Aplikasi Web II (SI5B) — **Topik 26: Peternakan**
RESTful API Express.js + Mongoose, basis data **MongoDB Server lokal** (`uts_paw2`).

- Model utama: **Ternak** — endpoint `/ternak`
- Model pendukung: **Ras** — endpoint `/ras`

## Cara menjalankan

```bash
npm install
cp .env.example .env          # sesuaikan bila perlu
# pastikan MongoDB lokal sudah berjalan di 127.0.0.1:27017
npm run seed                  # mengisi 3 ras + 5 ternak
npm start                     # http://localhost:3001
```

## Daftar endpoint

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/` | Info API (nama, NIM, topik, daftar endpoint) |
| GET | `/ras` | Semua ras |
| POST | `/ras` | Tambah ras (`nama`, `asalDaerah`) |
| GET | `/ternak` | Semua ternak; mendukung `status`, `ras`, `minBerat`, `maxBerat`, `sort`, `fields`, `page`, `limit` |
| GET | `/ternak?status=sehat&sort=beratKG` | Filter status + urut berat menaik |
| GET | `/ternak/:id` | Satu ternak, field `ras` ter-populate (`nama`, `asalDaerah`) |
| POST | `/ternak` | Tambah ternak (201), memuat `kandang` (embed) dan `ras` (ref) |
| PUT | `/ternak/:id` | Ubah data ternak |
| DELETE | `/ternak/:id` | Hapus data ternak |

Status error: `400` validasi / id tidak valid, `404` data atau rute tidak ditemukan, `409` nilai unik ganda (`kodeTernak`, `nama` ras).

## Alasan desain data model

| Data | Pola | Alasan |
|---|---|---|
| `kandang` (kode, lokasi) | **Embedding** | Kandang selalu dibaca bersama dokumen ternak pada setiap `GET /ternak` dan tidak dipakai bersama dokumen lain, sehingga satu kali baca sudah lengkap tanpa `$lookup` tambahan. |
| `Ras` (koleksi terpisah) | **Referencing** | Data ras dipakai ulang oleh banyak ternak dan perlu diperbarui sekali untuk semua (mis. koreksi `asalDaerah`), sehingga disimpan sebagai rujukan `ObjectId` agar tidak terjadi duplikasi data. |

## Struktur

```
app.js                      # memasang middleware + router, start server
db.js                       # koneksi Mongoose
routes/rasRoutes.js         # router /ras
routes/ternakRoutes.js      # router /ternak
controllers/rasControllers.js    # logika request Ras
controllers/ternakControllers.js # logika request Ternak
models/rasModels.js         # skema Ras (model pendukung, referencing)
models/ternakModels.js      # skema Ternak (model utama, embed kandang + ref ras)
middlewares/logger.js       # log setiap request ke terminal
middlewares/cekApiKey.js    # proteksi POST/PUT/DELETE via x-api-key (aktif bila API_KEY di .env)
middlewares/errorHandler.js # asyncHandler, error handler terpusat, 404
data/seed.js                # data uji (NIM pada kodeTernak)
data/info.json              # metadata API untuk GET /
```

## Postman (Local Mode)

Project ini menyertakan koleksi Postman format v3 (git-native):

```
.postman/resources.yaml              # manifest workspace (local-only)
postman/collections/UTS PAW2 - Peternakan/
  info.request.yaml                  # GET /
  ras/    get all ras, get ras by :id, create ras
  ternak/ get all ternak, get ternak by :id, create ternak, update ternak, delete ternak
postman/environments/lokal.environment.yaml
postman/globals/workspace.globals.yaml
```

`ras_id`, `ternak_id`, `kode_ternak`, dan `hapus_id` diisi otomatis oleh test-script
saat koleksi dijalankan, jadi tidak perlu hardcode ObjectId:

```bash
postman workspace lint
postman collection run "postman/collections/UTS PAW2 - Peternakan" \
  -e postman/environments/lokal.environment.yaml
```

Hasil: 9 request, 0 gagal (200/201 sesuai endpoint).
