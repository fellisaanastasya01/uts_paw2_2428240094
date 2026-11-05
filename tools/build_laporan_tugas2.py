"""Isi Templat_Laporan_Tugas2_Postman_Automation.docx -> Laporan_Tugas2_2428240094_FellisaAnastasya.docx.

Sekali pakai. Jalankan dari root project:
    .tools/python/python.exe tools/build_laporan_tugas2.py
"""
import copy
import json
import os
import re

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Cm, Pt
from docx.table import Table

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(ROOT, "Templat_Laporan_Tugas2_Postman_Automation.docx")
OUTPUT = os.path.join(ROOT, "Laporan_Tugas2_2428240094_FellisaAnastasya.docx")
SHOTS = os.path.join(ROOT, "postman", "screenshots")
COLLECTION = os.path.join(ROOT, "postman", "Tugas2-Smartphone-2428240094.postman_collection.json")

JAM_RUNNER = "22 Oktober 2026, 01.05 WIB"


def norm(text):
    return re.sub(r"\s+", " ", text).strip()


def drop(element):
    element.getparent().remove(element)


def set_cell(cell, text, size=10, mono=False):
    """Ganti isi sel dengan satu paragraf, ukuran/format mengikuti template."""
    for extra in cell.paragraphs[1:]:
        drop(extra._p)
    p = cell.paragraphs[0]
    for run in list(p.runs):
        drop(run._r)
    run = p.add_run(text)
    run.font.size = Pt(size)
    if mono:
        run.font.name = "Consolas"


def clone_row(table, times=1):
    for _ in range(times):
        tr = copy.deepcopy(table.rows[-1]._tr)
        table._tbl.append(tr)


def set_col_widths(table, widths_cm):
    """Samakan lebar grid dan sel agar kolom tidak melipat berlebihan."""
    total = sum(widths_cm)
    for i, width in enumerate(widths_cm):
        table.columns[i].width = Cm(width)
        for cell in table.columns[i].cells:
            cell.width = Cm(width)
    return total


def set_explanation(table, text):
    """Sel 'Penjelasan:' - ganti paragraf instruksi dengan isi laporan."""
    cell = table.rows[0].cells[0]
    for extra in cell.paragraphs[2:]:
        drop(extra._p)
    p = cell.paragraphs[1]
    for run in list(p.runs):
        drop(run._r)
    run = p.add_run(text)
    run.font.size = Pt(9)


def set_code(table, code):
    cell = table.rows[0].cells[0]
    for extra in cell.paragraphs[1:]:
        drop(extra._p)
    first = cell.paragraphs[0]
    for run in list(first.runs):
        drop(run._r)
    lines = code.rstrip("\n").split("\n")
    run = first.add_run(lines[0])
    run.font.name = "Consolas"
    run.font.size = Pt(8)
    for line in lines[1:]:
        p = cell.add_paragraph()
        run = p.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(8)


def put_picture(table, path, width_cm=15.2, height_cm=None):
    cell = table.rows[0].cells[0]
    caption = cell.paragraphs[1]
    placeholder = cell.paragraphs[0]
    assert "Tempel screenshot" in placeholder.text, placeholder.text
    drop(placeholder._p)
    p = caption.insert_paragraph_before()
    p.alignment = 1  # CENTER
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run()
    if height_cm:
        run.add_picture(path, height=Cm(height_cm))
    else:
        run.add_picture(path, width=Cm(width_cm))


def main():
    doc = Document(TEMPLATE)

    # Simpan referensi sebelum ada penghapusan: indeks doc.tables bergeser.
    t = list(doc.tables)

    # --- 8.1 hapus seluruh bagian "Petunjuk Pengisian" -------------------
    body = doc.element.body
    start_el = end_el = None
    for p in doc.paragraphs:
        text = norm(p.text)
        if start_el is None and text == "Petunjuk Pengisian":
            start_el = p._p
        if text.startswith("Bab 1 Identitas API dan Daftar Endpoint"):
            end_el = p._p
            break
    assert start_el is not None and end_el is not None, (start_el, end_el)
    children = list(body)
    start, end = children.index(start_el), children.index(end_el)
    assert end > start, (start, end)
    for el in children[start:end]:
        body.remove(el)

    # --- 8.2 hapus paragraf instruksi ------------------------------------
    instructions = [
        'Tuliskan seluruh endpoint API Anda. Kolom "API key" diisi Ya bila rute dilindungi cekApiKey atau mekanisme serupa.',
        "Tuliskan variabel yang Anda simpan di Environment. Jangan menuliskan nilai rahasia sungguhan.",
        "Harus terlihat pada screenshot: nama Collection dan seluruh request di dalam folder. Buka semua folder.",
        "Salin daftar request pada gambar di atas ke tabel berikut. Setiap endpoint pada Bab 1 harus punya minimal satu request.",
        "Tempel test script satu request GET pilihan Anda.",
        "Tempel test script request POST (atau request lain yang menyimpan variabel ke Environment).",
        "Harus terlihat pada screenshot: nama Collection, Environment, jumlah request, jumlah test lulus dan gagal. Seluruh test harus lulus.",
        'Catat kegagalan yang pernah muncul sebelum akhirnya lulus. Bagian ini menunjukkan bahwa pengujian benar-benar membantu menemukan masalah. Bila tidak ada, tulis "tidak ada kegagalan".',
        "Harus terlihat pada screenshot: perintah newman run ..., daftar hasil, dan tabel executed dan failed.",
        "Jawablah dengan kalimat Anda sendiri, dua sampai tiga kalimat, dan kaitkan dengan pengalaman Anda mengerjakan tugas ini.",
    ]
    wanted = {norm(x) for x in instructions}
    removed = 0
    for p in list(doc.paragraphs):
        if norm(p.text) in wanted:
            drop(p._p)
            removed += 1
    assert removed == len(instructions), removed

    # Template menaruh caption gambar dua kali: paragraf body dan paragraf di dalam
    # sel placeholder. Pertahankan yang di dalam sel (menyatu dengan kotak bukti).
    duplicates = 0
    for p in list(doc.paragraphs):
        if re.match(r"^Gambar [123]\. ", norm(p.text)):
            drop(p._p)
            duplicates += 1
    assert duplicates == 3, duplicates

    # --- 8.3 cover --------------------------------------------------------
    for p in doc.paragraphs:
        if norm(p.text) == "TEMPLAT LAPORAN":
            p.runs[0].text = "LAPORAN PRAKTIKUM"
            for run in p.runs[1:]:
                run.text = ""
    cover = t[0]
    for row, value in zip(
        cover.rows,
        [
            "Fellisa Anastasya / 2428240094",
            "SI5B",
            "RESTful API Toko Gadget: Smartphone (Topik 26)",
            "https://github.com/fellisaanastasya01/tugas1-restful-2428240094",
            None,
            "22 Oktober 2026",
        ],
    ):
        if value is not None:
            set_cell(row.cells[1], value, size=11)

    # --- 8.4 Bab 1 --------------------------------------------------------
    set_explanation(
        t[4],
        "API yang diuji adalah RESTful API Toko Gadget: Smartphone (Topik 26) milik Fellisa Anastasya "
        "(NIM 2428240094). Entitas utamanya adalah smartphone dengan field merek, model, ramGb, "
        "penyimpananGb, dan harga, sedangkan id dibuat otomatis oleh server. API dibangun dengan "
        "Express.js 4.19.2 pada satu berkas app.js dengan route langsung pada objek app, menyimpan data "
        "pada array di memori, dan di-deploy ke Vercel.",
    )

    endpoints = [
        ("GET", "/smartphones", "200", "Ambil seluruh data smartphone"),
        ("GET", "/smartphones/:id", "200", "Ambil satu smartphone berdasarkan id"),
        ("POST", "/smartphones", "201", "Tambah smartphone baru"),
        ("PUT", "/smartphones/:id", "200", "Ganti seluruh data smartphone"),
        ("DELETE", "/smartphones/:id", "200", "Hapus smartphone"),
        ("GET", "/smartphones?merek=Xiaomi", "200", "Filter data berdasarkan merek"),
        ("GET", "/", "200", "Informasi API dan daftar endpoint"),
        ("ANY", "/endpoint-tidak-ada", "404", "Catch-all endpoint tidak ditemukan"),
    ]
    table = t[5]
    assert len(table.rows) == 9, len(table.rows)
    for i, (method, addr, status, fungsi) in enumerate(endpoints, start=1):
        cells = table.rows[i].cells
        set_cell(cells[0], str(i))
        set_cell(cells[1], method)
        set_cell(cells[2], addr)
        set_cell(cells[3], "Tidak")
        set_cell(cells[4], status)
        set_cell(cells[5], fungsi)

    env = t[6]
    assert len(env.rows) == 5
    for row in [env.rows[4], env.rows[3]]:
        drop(row._tr)
    for i, (name, value, fungsi) in enumerate(
        [
            ("base_url", "http://localhost:3000", "Alamat server lokal"),
            ("smartphoneId", "(kosong, diisi script POST)", "ID smartphone hasil POST untuk GET/PUT/DELETE"),
        ],
        start=1,
    ):
        cells = env.rows[i].cells
        set_cell(cells[0], str(i))
        set_cell(cells[1], name)
        set_cell(cells[2], value)
        set_cell(cells[3], fungsi)

    # --- 8.5 Bab 2 --------------------------------------------------------
    put_picture(t[7], os.path.join(SHOTS, "01-collection.png"))
    set_explanation(
        t[8],
        "Request dikelompokkan menjadi empat folder sesuai alur pengujian: 01 - Tambah Data, "
        "02 - Baca Data, 03 - Ubah dan Hapus, serta 04 - Skenario Gagal. Folder 01 diletakkan paling awal "
        "karena request POST Tambah Smartphone menyimpan id hasil respons ke variabel environment "
        "smartphoneId yang dipakai oleh request GET, PUT, dan DELETE berikutnya. Skenario gagal diletakkan "
        "paling akhir agar tidak mengubah data yang dipakai skenario utama, dan seluruh request memakai "
        "{{base_url}} agar mudah dipindahkan dari localhost ke URL Vercel.",
    )

    requests = [
        ("POST Tambah Smartphone", "POST", "{{base_url}}/smartphones", "01 - Tambah Data"),
        ("GET Info API", "GET", "{{base_url}}/", "02 - Baca Data"),
        ("GET Semua Smartphone", "GET", "{{base_url}}/smartphones", "02 - Baca Data"),
        ("GET Filter Merek Xiaomi", "GET", "{{base_url}}/smartphones?merek=Xiaomi", "02 - Baca Data"),
        ("GET Smartphone Berdasarkan ID", "GET", "{{base_url}}/smartphones/{{smartphoneId}}", "02 - Baca Data"),
        ("PUT Ubah Smartphone", "PUT", "{{base_url}}/smartphones/{{smartphoneId}}", "03 - Ubah dan Hapus"),
        ("DELETE Hapus Smartphone", "DELETE", "{{base_url}}/smartphones/{{smartphoneId}}", "03 - Ubah dan Hapus"),
        ("GET ID Tidak Ditemukan", "GET", "{{base_url}}/smartphones/9999", "04 - Skenario Gagal"),
        ("POST Field Wajib Kosong", "POST", "{{base_url}}/smartphones", "04 - Skenario Gagal"),
        ("PUT ID Tidak Ditemukan", "PUT", "{{base_url}}/smartphones/9999", "04 - Skenario Gagal"),
        ("DELETE ID Tidak Ditemukan", "DELETE", "{{base_url}}/smartphones/9999", "04 - Skenario Gagal"),
        ("GET Endpoint Tidak Dikenal", "GET", "{{base_url}}/endpoint-tidak-ada", "04 - Skenario Gagal"),
    ]
    table = t[9]
    assert len(table.rows) == 11
    clone_row(table, 2)
    set_col_widths(table, [0.9, 3.4, 1.9, 6.9, 3.1])
    for cell in table.rows[0].cells:
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.size = Pt(9)
    trPr = table.rows[0]._tr.get_or_add_trPr()
    trPr.append(trPr.makeelement(qn("w:tblHeader"), {}))
    for p in doc.paragraphs:
        if norm(p.text) == "2.2 Tabel request":
            p.paragraph_format.page_break_before = True
            break
    for i, (name, method, url, folder) in enumerate(requests, start=1):
        cells = table.rows[i].cells
        set_cell(cells[0], str(i))
        set_cell(cells[1], name, size=9)
        set_cell(cells[2], method, size=9)
        set_cell(cells[3], url, size=9)
        set_cell(cells[4], folder, size=9)

    # --- 8.6 Bab 3 --------------------------------------------------------
    assertions = [
        ("POST Tambah Smartphone", "201 Created", "status “success”, message “Data berhasil ditambahkan”, data memuat id + lima field"),
        ("GET Info API", "200 OK", "nama, nim, topik 26, endpoints array berisi 6 item"),
        ("GET Semua Smartphone", "200 OK", "array minimal 4 item, setiap item memuat enam field"),
        ("GET Filter Merek Xiaomi", "200 OK", "array tidak kosong, semua merek “Xiaomi”"),
        ("GET Smartphone Berdasarkan ID", "200 OK", "id sama dengan “smartphoneId”, enam field lengkap"),
        ("PUT Ubah Smartphone", "200 OK", "status “success”, model “Redmi Note 14 Pro”, ramGb 12"),
        ("DELETE Hapus Smartphone", "200 OK", "message memuat id, data “null”"),
        ("GET ID Tidak Ditemukan", "404", "status “error”, message memuat “9999”, data “null”"),
        ("POST Field Wajib Kosong", "400", "status “error”, message memuat “wajib diisi”, data “null”"),
        ("PUT ID Tidak Ditemukan", "404", "status “error”, message memuat “9999”, data “null”"),
        ("DELETE ID Tidak Ditemukan", "404", "status “error”, message memuat “9999”, data “null”"),
        ("GET Endpoint Tidak Dikenal", "404", "message “Endpoint tidak ditemukan”, data “null”"),
    ]
    table = t[10]
    assert len(table.rows) == 11
    clone_row(table, 2)
    set_col_widths(table, [0.9, 4.4, 2.5, 8.2])
    trPr = table.rows[0]._tr.get_or_add_trPr()
    trPr.append(trPr.makeelement(qn("w:tblHeader"), {}))
    for i, (name, status, content) in enumerate(assertions, start=1):
        cells = table.rows[i].cells
        set_cell(cells[0], str(i))
        set_cell(cells[1], name)
        set_cell(cells[2], status)
        set_cell(cells[3], content)

    collection = json.load(open(COLLECTION, encoding="utf8"))
    scripts = {}
    for folder in collection["item"]:
        for item in folder["item"]:
            scripts[item["name"]] = "\n".join(item["event"][0]["script"]["exec"])

    set_code(t[11], scripts["GET Semua Smartphone"])
    set_explanation(
        t[12],
        "pm.test pertama memeriksa status 200 agar GET Semua Smartphone benar-benar berhasil. pm.test kedua "
        "memeriksa bahwa respons berupa array dan setiap objek memuat keenam field smartphone, sehingga "
        "perubahan struktur data langsung terdeteksi. Pemeriksaan panjang array minimal empat memastikan data "
        "awal tidak hilang, sedangkan pemeriksaan id bertipe number menjaga id tetap dapat dipakai pada URL "
        "/smartphones/:id.",
    )
    set_code(t[13], scripts["POST Tambah Smartphone"])
    set_explanation(
        t[14],
        "Request POST Tambah Smartphone membaca body.data.id dari respons, memeriksa bahwa nilainya number, "
        "lalu menyimpannya ke environment smartphoneId melalui pm.environment.set. Variabel itu dipakai oleh "
        "GET Smartphone Berdasarkan ID, PUT Ubah Smartphone, dan DELETE Hapus Smartphone. Jika urutan request "
        "ditukar sehingga GET, PUT, atau DELETE berjalan sebelum POST, nilai smartphoneId masih kosong, URL "
        "menjadi /smartphones/ dan request mengenai route daftar, sehingga assertion status dan isi data gagal.",
    )

    # --- 8.7 Bab 4 --------------------------------------------------------
    put_picture(t[15], os.path.join(SHOTS, "02-runner.png"))
    set_explanation(
        t[16],
        "Collection dijalankan dengan Environment Tugas 2 - Smartphone Local setelah server lokal dinyalakan "
        "ulang agar data kembali ke empat data awal. Runner menjalankan 12 request dan 29 test; seluruh test "
        "lulus dengan 0 gagal. Sebelum run final, satu assertion DELETE sempat gagal karena masih mengharapkan "
        "status 204, lalu diperbaiki menjadi 200 sesuai respons API.",
    )

    recap = t[17]
    assert len(recap.rows) == 6
    for row, value in zip(
        recap.rows,
        [
            "Tugas 2 - Smartphone API 2428240094",
            "Tugas 2 - Smartphone Local",
            "12",
            "29",
            "0",
            JAM_RUNNER,
        ],
    ):
        set_cell(row.cells[1], value)

    findings = t[18]
    assert len(findings.rows) == 3
    drop(findings.rows[2]._tr)
    cells = findings.rows[1].cells
    for cell, value in zip(
        cells,
        [
            "1",
            "DELETE Hapus Smartphone",
            "expected response to have status code 204 but got 200",
            "Assertion awal memakai status 204, sedangkan app.js mengirim 200 pada DELETE yang berhasil.",
            "Assertion diubah menjadi 200 dan ditambah pemeriksaan data bernilai null.",
        ],
    ):
        set_cell(cell, value)

    # --- 8.8 Bab 5 --------------------------------------------------------
    callout = t[19]
    intro = doc.add_paragraph(
        "Pengujian juga dijalankan dengan Newman agar hasil Collection dapat diverifikasi dari terminal, "
        "bukan hanya dari tampilan Postman."
    )
    intro.paragraph_format.space_after = Pt(6)
    callout._tbl.addnext(intro._p)
    drop(callout._tbl)

    put_picture(t[20], os.path.join(SHOTS, "03-newman.png"), height_cm=12.0)
    set_explanation(
        t[21],
        "Collection dijalankan dengan perintah npx --yes newman@6.2.1 run "
        "postman/Tugas2-Smartphone-2428240094.postman_collection.json -e "
        "postman/Tugas2-Smartphone-Local.postman_environment.json --reporters cli "
        "--reporter-cli-no-assertions. Newman menampilkan daftar request dan ringkasan executed serta failed; "
        "pada pengujian ini tidak ada assertion yang gagal. Exit code 0 berarti seluruh test lulus, sedangkan "
        "exit code 1 akan muncul bila ada assertion atau request yang gagal.",
    )

    # --- 8.9 Bab 6 --------------------------------------------------------
    files = t[22]
    assert len(files.rows) == 5
    for row, value in zip(
        files.rows,
        [
            "https://github.com/fellisaanastasya01/tugas1-restful-2428240094",
            "postman/Tugas2-Smartphone-2428240094.postman_collection.json",
            "postman/Tugas2-Smartphone-Local.postman_environment.json",
            "Ya",
            "Ya",
        ],
    ):
        set_cell(row.cells[1], value)

    # --- 8.10 Bab 7 -------------------------------------------------------
    set_explanation(
        t[23],
        "Assertion yang paling berguna adalah pemeriksaan struktur respons GET Semua Smartphone, karena "
        "assertion itu langsung menunjukkan bahwa API mengembalikan array dengan field yang lengkap, bukan "
        "objek terbungkus status dan message. Pemeriksaan ini membuat perbedaan kontrak antara response GET "
        "dan response POST/PUT/DELETE terlihat jelas saat test dijalankan.",
    )
    set_explanation(
        t[24],
        "Menguji manual terasa cepat untuk satu request, tetapi Collection Runner menjalankan seluruh skenario "
        "dengan urutan dan data yang sama sehingga hasilnya dapat diulang. Bagian tersulit adalah menulis "
        "assertion yang sesuai dengan bentuk respons yang berbeda-beda; saya mengatasinya dengan membaca ulang "
        "app.js dan menyesuaikan assertion GET, POST, dan error sebelum menjalankan Runner.",
    )

    # --- 8.11 Lampiran A --------------------------------------------------
    checklist = t[25]
    for row in checklist.rows[1:]:
        set_cell(row.cells[2], "Ya")

    doc.save(OUTPUT)
    print("saved", OUTPUT)


if __name__ == "__main__":
    main()
