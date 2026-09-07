# LAPORAN MASUKAN & USULAN PERBAIKAN (REVISI SISTEM FINAL)
## DNP MONITOR — ALUR KERJA RIKSA UJI
### Tahap 1 — Perspektif Marketing & Analisa Sistem

| Field | Isi |
|---|---|
| **Dokumen** | Laporan Masukan & Usulan Perbaikan DNP Monitor |
| **Perspektif** | Marketing & System Analyst |
| **Tahap** | Tahap 1 — Initial Feedback & System Flow Optimization |
| **Status** | Draft / Bahan Evaluasi & Pembahasan Lanjutan |

> **Catatan penting:** Dokumen ini merupakan masukan awal dari perspektif Marketing dan belum dimaksudkan sebagai final business requirement.

---

## 1. Latar Belakang & Tujuan

DNP Monitor merupakan rancangan alur kerja untuk memonitor proses Riksa Uji mulai dari penerimaan PO/SPK hingga pekerjaan dinyatakan selesai (Closed). Berdasarkan pembahasan awal dan catatan user dari sisi Marketing, terdapat beberapa area yang perlu disesuaikan agar alur pada sistem lebih mencerminkan proses operasional dan kebutuhan monitoring di lapangan.

Tujuan dokumen ini adalah:
- Mendokumentasikan masukan awal.
- Mengidentifikasi bagian alur yang perlu diperbaiki.
- Memberikan dasar pembahasan requirement.
- Menghindari perubahan sepihak sebelum seluruh role memberikan masukan.

## 2. Ruang Lingkup Tahap 1

Ruang lingkup laporan ini adalah alur **Stage 1 sampai Stage 12** sebagaimana terdapat pada rancangan DNP Monitor, dengan fokus pada masukan yang tercatat dari Marketing.

- **Stage 4b** (Aktualisasi Unit) dan **Stage 11b** (Pembayaran/Pelunasan) merupakan tahap kondisional pada rancangan awal.
- **Stage 11c** (Verifikasi Pembayaran) merupakan tahap baru hasil update lanjutan, kini ditempatkan tepat setelah Stage 11 (Penagihan) dan sebelum gerbang keputusan `Status Lunas?`, dengan PIC Finance. Jika hasil verifikasi Partial/Pending, Job loop kembali ke Stage 11.

## 3. Matriks Masukan & Usulan Perbaikan per Stage (Integrasi Best Practice Sistem)

### Stage 1 — PO / SPK
**PIC:** Marketing

| Aspek | Detail |
|---|---|
| Masukan User | Marketing membuat Job baru, melakukan input, upload dokumen. Dokumen PO sudah diedit bagian "harga". Tidak ada no seri kecuali Listrik dan kebakaran. |
| Usulan Penyesuaian | Tambahkan field wajib untuk opsi "Termin Pembayaran" (DP atau Full Akhir) untuk memicu alur Finance secara otomatis. |

### Stage 2 — Verifikasi Dokumen
**PIC:** Admin

| Aspek | Detail |
|---|---|
| Masukan User | Admin tidak diperbolehkan melihat informasi harga pada PO/SPK. Tambahkan dokumen "Sertifikat Bahan", khususnya untuk PAA serta escalator dan elevator. |
| Usulan Penyesuaian | Surat bahan. |

### Stage 3 — Penjadwalan & Surat Tugas
**PIC:** Admin

| Aspek | Detail |
|---|---|
| Masukan User | Diperlukan fitur penjadwalan ulang (reschedule), misalnya ketika terdapat unit yang rusak sehingga pemeriksaan tidak dapat dilakukan sesuai jadwal. |
| Usulan Penyesuaian | Sediakan button Reschedule beserta log alasan perubahan. **(Hard-Gate):** Surat tugas tidak bisa diterbitkan jika DP belum lunas (jika memilih Termin DP). |

### Stage 4 — Pelaksanaan RU
**PIC:** INS

| Aspek | Detail |
|---|---|
| Masukan User | Tidak terdapat perubahan khusus pada catatan Marketing. |
| Usulan Penyesuaian | Konfirmasi: apakah perlu fitur pembuatan surat tugas otomatis? |

### Stage 4b — Aktualisasi Unit *(kondisional)*
**PIC:** Marketing

| Aspek | Detail |
|---|---|
| Masukan User | Tahap kondisional; belum dijelaskan rinci kapan aktualisasi unit harus dilakukan. |
| Usulan Penyesuaian | Sistem akan membuat fungsi bypass jika tahap ini tidak diperlukan untuk Job tertentu. |

### Stage 4C — Penjadwalan Ulang
**PIC:** Admin

| Aspek | Detail |
|---|---|
| Masukan User | Melakukan penjadwalan ulang jika ada unit yang harus ditunda ketika RU. |
| Usulan Penyesuaian | Dibuatkan fitur penjadwalan ulang. |

### Stage 4d — Riksa Uji Ulang
**PIC:** Ahli / Petugas

| Aspek | Detail |
|---|---|
| Masukan User | Riksa uji ulang karena ada tambahan unit yang dilakukan oleh Tim Ahli dan Petugas lapangan. |
| Usulan Penyesuaian | Dibuatkan stage riksa uji ulang. |

### Stage 5 — Penyusunan LHPP / BAP
**PIC:** Admin

| Aspek | Detail |
|---|---|
| Masukan User | Terdapat kebutuhan review dokumen oleh Admin serta kemungkinan alur tertentu untuk langsung diteruskan/bypass ke Manager. Terdapat case khusus yang perlu dicek kembali. |
| Usulan Penyesuaian | Sediakan Decision Gateway di sistem: jika memenuhi kriteria tertentu, dokumen langsung masuk ke antrean (Swimlane) Manager. **Catatan:** apakah ada jenis RU selain kebakaran yang harus melalui manager? |
| **Update Tracking (Kanban Board)** | Stage ini memiliki **multiple status update** yang tampil pada Kanban Board, masing-masing disertai tanggal update sebagai data tracking due date, yaitu: (1) **Data teknis diserahkan oleh petugas tanggal** — dicatat saat Admin menerima data teknis dari petugas lapangan; (2) **Pengerjaan laporan mulai tanggal** — dicatat saat Admin mulai menyusun LHPP/BAP; (3) **Laporan selesai tanggal** — dicatat saat LHPP/BAP selesai disusun dan siap diteruskan ke Stage 6. Ketiga tanggal ini digunakan sistem untuk menghitung durasi/lead time di setiap sub-fase pada Stage 5 dan ditampilkan pada Kanban Board agar progres penyusunan laporan dapat dimonitor secara detail, bukan hanya status tunggal "In Progress/Done". |
| **✅ Terkonfirmasi (lihat Bagian 8.4–8.5)** | **LHPP diterbitkan per Unit/Alat**, sedangkan **BAP diterbitkan per sesi/kunjungan inspeksi** (satu BAP dapat mencakup banyak Unit). Ketiga tanggal tracking di atas karenanya di-scope ke level **LHPP (per Unit)**, bukan ke level Job — lihat spesifikasi entitas `LHPP` dan `BAP` di Bagian 8.5 untuk detail model data. |

### Stage 6 — Review Laporan Teknis
**PIC:** Management

| Aspek | Detail |
|---|---|
| Masukan User | Mengarah pada review oleh Management/Manager. |
| Usulan Penyesuaian | Buat Approval Workflow (Approve / Reject to Revise) agar laporan dapat dikembalikan jika tidak sesuai. |

### Stage 7 — Verifikasi ke Dinas
**PIC:** Admin *(catatan: sudah dirubah dari PIC-nya Manager)*

| Aspek | Detail |
|---|---|
| Masukan User | Proses seharusnya dilakukan oleh Admin, bukan Manager. |
| Usulan Penyesuaian | **Revisi Swimlane:** Pindahkan PIC/Task ini secara penuh ke dalam Swimlane Admin. |

### Stage 8 — Proses Disnaker
**PIC:** Admin

| Aspek | Detail |
|---|---|
| Masukan User | Perlu ada status yang menunjukkan proses sedang berjalan, mengalami delay, atau memiliki kendala di Dinas/Disnaker. |
| Usulan Penyesuaian | Tambahkan fitur "Status Tagging" (On Track, Delayed, Issue) yang bisa di-update Admin agar termonitor di Dashboard Marketing. **Catatan:** masukan untuk notifikasi pada kanban board. |

### Stage 9 — Pengurusan SUKET
**PIC:** Admin

| Aspek | Detail |
|---|---|
| Masukan User | Tahap dinyatakan selesai/done tanpa perubahan khusus. |
| Usulan Penyesuaian | Menjadi trigger otomatis ke Finance untuk menerbitkan tagihan akhir. |
| **Update Tracking (Tanggal Input)** | Tambahkan field **input tanggal SUKET** (tanggal SUKET mulai diproses/diinput ke sistem oleh Admin) sebagai titik awal pencatatan waktu pada tahap ini. |
| **Update Tracking (Durasi Proses)** | Sistem menghitung dan menampilkan **durasi proses SUKET**, yaitu selisih waktu dari **input tanggal SUKET** hingga SUKET dinyatakan **selesai/done**. Durasi ini ditampilkan pada Kanban Board/Dashboard sebagai indikator kecepatan pengurusan SUKET per Job. |
| **⚠️ Catatan Kritis (lihat Bagian 8)** | Tracking di atas masih berasumsi 1 Job = 1 proses SUKET tunggal. Pada skenario **Split Job / Partial Delivery** (Job dengan banyak Alat, sebagian tertunda), field tanggal input & durasi ini **wajib di-scope ulang ke level Batch/Unit**, bukan ke level Job — lihat Bagian 8 untuk detail dan alasan. |

### Stage 10 — Penagihan
**PIC:** Finance *(catatan: masuk nama menjadi "pembuatan invoice")*

| Aspek | Detail |
|---|---|
| Masukan User | Finance membuat Invoice & Kwitansi. Catatan: tidak input bukti TF dan tidak input status proses pembayaran. |
| Usulan Penyesuaian | Alur dipecah berdasarkan pilihan di Stage 1 — ada 2 kondisi (Invoice Pelunasan DP atau Invoice Full). |

### Stage 11 — Penagihan / Pembayaran
**PIC:** Marketing *(catatan: PIC awal adalah Finance)*

| Aspek | Detail |
|---|---|
| Masukan User | Pembayaran harus dilakukan terlebih dahulu dan dikonfirmasi sebelum SUKET dikirim kepada klien. |
| Usulan Penyesuaian | Marketing melakukan penagihan dan follow-up pelunasan ke klien. Jika hasil Verifikasi Pembayaran Finance pada Stage 11c menyatakan **Partial/Pending**, Job dikembalikan (loop) ke tahap ini agar Marketing menagih ulang. |

### Stage 11c — Verifikasi Pembayaran *(baru — kini ditempatkan tepat setelah Stage 11, bukan setelah Stage 11b)*
**PIC:** Finance

| Aspek | Detail |
|---|---|
| Masukan User | Diperlukan tahap tambahan bagi Finance untuk memverifikasi status pembayaran/pelunasan hasil penagihan Marketing pada Stage 11 (mis. mencocokkan bukti transfer, memastikan dana telah diterima secara penuh) **sebelum** SUKET dikirim ke klien — bukan setelahnya. |
| Usulan Penyesuaian | Tambahkan stage baru **"Verifikasi Pembayaran"** dengan PIC Finance, ditempatkan **langsung setelah Stage 11 (Penagihan/Pembayaran)** dan sebelum gerbang keputusan `Status Lunas?`. Finance memverifikasi kelengkapan bukti pembayaran sebagai dasar keputusan gerbang berikutnya. |

### Gateway — Status Lunas? *(direvisi: keputusan berbasis hasil Stage 11c, loop balik bukan self-loop)*
**PIC:** Finance

| Aspek | Detail |
|---|---|
| Masukan User | Gerbang keputusan status lunas harus mencerminkan hasil Verifikasi Pembayaran Finance (Stage 11c), dan jika belum lunas, harus kembali ke proses penagihan — bukan berhenti diam di gerbang tanpa tindak lanjut. |
| Usulan Penyesuaian | Gerbang keputusan berbasis hasil Stage 11c: **Lunas** → buka akses ke Stage 11b (Kirim SUKET ke Klien) → lanjut ke Stage 12 (Closed). **Partial / Pending** → Job **loop kembali ke Stage 11 (Penagihan)** untuk ditagih ulang oleh Marketing. |

### Stage 11b — Pengiriman SUKET ke Klien *(kondisional)*
**PIC:** Marketing

| Aspek | Detail |
|---|---|
| Masukan User | SUKET seharusnya dikirim setelah pembayaran/pelunasan dikonfirmasi. |
| Usulan Penyesuaian | Sistem mengunci akses cetak/kirim SUKET jika gerbang `Status Lunas?` belum menyatakan Lunas. |
| **⚠️ Catatan Kritis (lihat Bagian 8)** | Pada skenario **Split Job / Partial Delivery**, pengiriman SUKET tidak terjadi satu kali per Job, melainkan **bertahap per Batch** (mis. 10–20 Alat per pengiriman). Stage 11b perlu mendukung **multiple record pengiriman (Batch) dalam satu Job**, masing-masing dengan status dan tanggal kirim sendiri — lihat Bagian 8. |

### Stage 12 — Selesai / Closed
| Aspek | Detail |
|---|---|
| Masukan User | Tidak ada masukan perubahan khusus. |
| Usulan Penyesuaian | Sistem otomatis mengubah status menjadi Closed setelah Stage 11b (Pengiriman SUKET) selesai, **dengan syarat** gerbang `Status Lunas?` sebelumnya telah menyatakan **Lunas** berdasarkan Stage 11c. Selama status masih Partial/Pending, Job tidak pernah mencapai Stage 12 karena tertahan pada siklus Stage 11 ⇄ 11c ⇄ Gateway. |

> **Ringkasan urutan PIC per stage:** Marketing (1, 4b, 11, 11b) → Admin (2, 3, 4C, 5, 7, 8, 9) → INS (4) → Ahli/Petugas (4d) → Management (6) → Finance (10, 11c, Gateway Status Lunas).

## 4. Perubahan Alur yang Paling Signifikan (Flowchart & Swimlane Update)

Berdasarkan masukan Tahap 1 dan revisi lanjutan, rancangan flowchart harus diubah secara fundamental pada beberapa titik percabangan (Decision):

1. **Percabangan Finansial — Urutan Direvisi (Stage 1, 10, 11, 11c, Gateway, 11b, 12):** Stage 11c (Verifikasi Pembayaran) kini ditempatkan **segera setelah Stage 11 (Penagihan)**, bukan setelah pengiriman SUKET seperti draf sebelumnya. Finance memverifikasi hasil tagihan Marketing, lalu gerbang `Status Lunas?` memutuskan kelanjutan alur. Sistem memaksa urutan:
   **Invoice (10) → Penagihan (11) → Verifikasi Pembayaran oleh Finance (11c) → Gateway "Status Lunas?" → [Lunas] Kirim SUKET (11b) → Closed (12)**
   Jika gerbang menghasilkan **Partial/Pending**, Job **tidak masuk ke Stage 11b**, melainkan **loop kembali ke Stage 11** untuk ditagih ulang oleh Marketing — bukan berhenti diam di gerbang (self-loop) seperti rancangan sebelumnya. Siklus Stage 11 ⇄ 11c ⇄ Gateway dapat berulang sampai Finance memverifikasi status Lunas.
2. **Perubahan PIC (Stage 7):** Pengalihan task Verifikasi ke Dinas dari Manager menjadi tanggung jawab Admin.
3. **Alur Review Dokumen (Stage 5 & 6):** Diperlukan dua titik krusial pada alur dokumen:
   - Fitur bypass dari Admin ke Manager pada Stage 5.
   - Looping revisi laporan teknis pada Stage 6 jika Manager menolak draf tersebut.
   - Stage 5 juga dilengkapi tiga checkpoint tanggal (data teknis diterima, mulai pengerjaan, laporan selesai) yang tampil sebagai tracking due date pada Kanban Board.
4. **Stage Tambahan & Reposisi (Stage 11c — Verifikasi Pembayaran):** Stage baru dengan PIC Finance, kini diposisikan **di antara Stage 11 dan gerbang Status Lunas** (bukan lagi di antara Stage 11b dan Stage 12), sebagai lapisan verifikasi sebelum SUKET boleh dikirim.
5. **Tracking Durasi SUKET (Stage 9):** Ditambahkan field input tanggal SUKET sebagai titik awal perhitungan durasi proses SUKET (dari input hingga selesai/done), untuk keperluan monitoring kecepatan proses.

## 5. Kebutuhan Monitoring dari Perspektif Marketing (Dashboard Requirements)

Untuk menghindari Marketing menanyakan proses secara manual kepada setiap PIC, sistem Dashboard harus menampilkan metrik berikut:

- Status Job pada setiap Stage.
- Informasi apabila terjadi reschedule beserta alasannya.
- Informasi proses Dinas/Disnaker dan apabila terjadi delay/kendala (berdasarkan Status Tagging dari Stage 8).
- Status penyusunan dan review laporan, termasuk **tracking due date** pada Stage 5 berdasarkan tiga tanggal: data teknis diserahkan, mulai pengerjaan laporan, dan laporan selesai.
- Status pembuatan Invoice & Kwitansi.
- Status pembayaran/pelunasan dan konfirmasi pembayaran.
- Status pengiriman SUKET kepada klien, termasuk **tanggal input SUKET (Stage 9)** dan **durasi proses SUKET** (dari input hingga selesai/done).
- Status **Verifikasi Pembayaran oleh Finance (Stage 11c)**, kini tampil segera setelah Stage 11 (Penagihan), sebagai syarat gerbang `Status Lunas?` sebelum SUKET boleh dikirim (Stage 11b) dan Job dapat Closed.
- Penanda **jumlah siklus retry** Job kembali ke Stage 11 (Penagihan) akibat status Partial/Pending, untuk memonitor Job yang berulang kali gagal diverifikasi Lunas.

## 6. Poin yang Masih Memerlukan Konfirmasi Lintas Divisi (Lanjutan Tahap 2–6)

Sebelum dokumen ini menjadi **Final Business Requirement Document (BRD)**, hal berikut wajib divalidasi oleh setiap role:

| Stage | Poin yang Perlu Divalidasi |
|---|---|
| **4** | Kebutuhan mengubah gerbang `Hasil RU & Unit?` dari biner per-Job menjadi keputusan per-Unit (lihat Bagian 8.3–8.5) — perlu validasi dampaknya ke SLA dan beban kerja Tim Ahli/Inspektur. |
| **4b** | Kapan Aktualisasi Unit muncul dan siapa PIC-nya. |
| **5** | Mekanisme review Admin, ketentuan case khusus, kondisi yang mengizinkan bypass dokumen langsung ke Manager, serta kejelasan definisi/SOP untuk pengisian tiga checkpoint tanggal (data teknis diserahkan, mulai pengerjaan, laporan selesai) — **kini dikonfirmasi berlaku di level LHPP per-Unit, bukan per-Job.** |
| **6** | Penetapan final siapa reviewer akhir (Manager/Management), mekanisme approval, dan alur revisi. |
| **7** | Validasi ulang dengan Admin dan Manager terkait penugasan Admin sebagai PIC Verifikasi ke Dinas. |
| **8** | Definisi baku status delay/kendala dan tindakan pencegahan ketika proses tertahan di Disnaker. |
| **9** | Definisi pasti titik "input tanggal SUKET" (mis. saat pengajuan ke Dinas atau saat dokumen diterima Admin) agar perhitungan durasi proses SUKET konsisten. |
| **10–11** | Sumber pencatatan status pembayaran di sistem, PIC konfirmasi, serta bukti valid yang digunakan. |
| **11c** | Kelengkapan dokumen/bukti yang wajib diverifikasi Finance, SLA maksimal proses Verifikasi Pembayaran, serta **batas maksimal siklus retry** Stage 11 ⇄ 11c ⇄ Gateway sebelum perlu eskalasi manual jika Job berulang kali gagal diverifikasi Lunas. |
| **11b–12** | Kriteria pasti yang harus terpenuhi agar Job berstatus Closed, termasuk kepastian bahwa gerbang `Status Lunas?` (berbasis Stage 11c) telah menyatakan Lunas sebelum Stage 11b dan Stage 12 berjalan. |

## 7. Kesimpulan

Masukan Marketing pada Tahap 1 berfokus pada dua hal utama:
1. Alur proses yang lebih jelas dan sesuai operasional.
2. Visibilitas status pekerjaan agar Marketing dapat memonitor Job sampai selesai.

Perubahan krusial seperti fitur reschedule, masking harga untuk Admin, status kendala di Disnaker, hingga penguncian pengiriman SUKET berdasarkan pelunasan tagihan menjadi fondasi utama perancangan UI/UX dan basis data sistem.

Dokumen ini menjadi baseline awal diskusi. Setelah seluruh stakeholder (Tahap 2 hingga Tahap 6) memberikan masukan, alur DNP Monitor akan diperbarui hingga menjadi requirement final.

## 8. Studi Kasus Tambahan — Split Job / Pengiriman SUKET Sebagian (Partial Batch Delivery)

### 8.1 Deskripsi Kasus

Satu Job memiliki jumlah Alat yang besar (contoh: 100 Alat). Pada saat Riksa Uji (Stage 4), sebagian Alat (contoh: 5 unit) mengalami kendala (rusak/tertunda) dan harus masuk ke rantai Stage 4b → 4c → 4d, sementara sisanya (95 unit) dinyatakan sesuai dan harus **tetap lanjut** melalui Stage 5–12 tanpa menunggu 5 unit yang tertunda. SUKET untuk 95 unit tersebut juga tidak terbit sekaligus, melainkan **bertahap** (10–20 unit per batch) mengikuti kecepatan penerbitan dari Disnaker, dan harus dikirim ke klien **sesegera mungkin per batch**, bukan menunggu seluruh Job selesai.

Pertanyaan yang diajukan: apakah sistem memerlukan stage khusus untuk **menggabungkan kembali** hasil yang terpecah tersebut menjadi 1 Job?

### 8.2 Evaluasi Opsi (Penilaian Jujur)

| Opsi | Penilaian | Alasan |
|---|---|---|
| **A. Tambah stage "Merge/Gabung Job"** (langkah manual untuk menyatukan kembali record yang terpisah) | **3/10 — Tidak disarankan** | Ini adalah tambalan (patch) atas model data yang salah, bukan solusi. Menambah PIC yang harus mengingat untuk "menggabungkan", menambah satu titik lagi di mana Job bisa tersangkut/lupa digabung, dan tidak menyelesaikan akar masalah — hanya memindahkan pekerjaan agregasi status ke langkah manual, padahal itu seharusnya otomatis. |
| **B. Split menjadi 2 Job terpisah** (Job A = 95 unit, Job B = 5 unit, masing-masing punya Job ID sendiri) | **4/10 — Situasional, berisiko** | Berjalan untuk kebutuhan pengiriman SUKET, tetapi berpotensi merusak proses Finance: bila 1 PO/SPK = 1 invoice/1 klien, memecah menjadi 2 Job ID berarti Finance harus merekonsiliasi 2 record terhadap 1 PO — inilah justru masalah "penggabungan" yang ingin dihindari, hanya dipindah ke ranah invoice. Opsi ini baru masuk akal **jika** 5 unit yang tertunda memang akan menjadi transaksi komersial terpisah (invoice terpisah/amandemen kontrak). |
| **C. Tetap 1 Job, pindahkan tracking status ke level Unit/Alat, dan kelompokkan pengiriman SUKET sebagai "Batch" di dalam Job yang sama** | **8/10 — Direkomendasikan** | Tidak perlu stage "gabung" karena identitas Job tidak pernah dipecah — yang dipecah hanya proses pengerjaannya. Ini juga sejalan dengan gerbang keputusan `Hasil RU & Unit?` pada Stage 4 yang sudah ada di rancangan flowchart (unit sesuai vs unit mismatch), namun perlu diperdalam agar granularitasnya di level Unit, bukan biner di level Job. |

### 8.3 Rekomendasi Desain (Opsi C — Disepakati)

1. **Perubahan model data — dari Job-level status menjadi Unit-level status:**
   Saat ini, gerbang `Hasil RU & Unit?` pada Stage 4 bersifat **biner untuk seluruh Job** ("Sesuai → seluruh Job ke Stage 5" / "Tidak Sesuai → seluruh Job masuk rantai S4b"). Ini harus diubah menjadi keputusan **per Unit/Alat**: setiap Alat punya status RU sendiri (Sesuai / Perlu Aktualisasi / Perlu RU Ulang). Job hanya boleh dianggap "Selesai Stage 4" saat menampilkan **progres agregat**, misalnya "95/100 Unit Lolos RU, 5/100 dalam proses Reschedule".

2. **Perkenalkan entitas "Batch"** yang berjalan dari Stage 6/7 sampai 11c:
   Karena Disnaker menerbitkan SUKET secara bertahap, satu Job perlu bisa memiliki **banyak record Batch**, masing-masing berisi: daftar Unit yang LHPP-nya sudah Approved, tanggal verifikasi ke Dinas, tanggal input & terbit SUKET, tanggal kirim ke klien, dan status batch (Diproses / Terbit / Terkirim). Ini menggantikan asumsi "1 tanggal SUKET per Job" yang ditulis pada Bagian Stage 9 & 11b sebelumnya.

3. **Ubah kriteria "Job Closed" (Stage 12) menjadi agregat, bukan tunggal:**
   Job baru berstatus Closed jika **seluruh Unit** dalam Job tersebut sudah Closed (seluruh Batch SUKET Terkirim + Stage 11c Verifikasi Pembayaran selesai untuk seluruh cakupan Job). Selama masih ada Unit yang belum selesai, Dashboard menampilkan status **"Partial — 95/100 Unit Closed"**, bukan status biner Open/Closed.

4. **Tidak perlu stage "Combine/Merge".** Penggabungan status cukup dilakukan sebagai **query agregasi otomatis** (rollup) di Dashboard/Kanban, bukan sebagai langkah kerja manual dalam alur.

### 8.4 Konfirmasi atas Pertanyaan Terbuka

| Pertanyaan | Status | Jawaban Terkonfirmasi | Implikasi Desain |
|---|---|---|---|
| Apakah LHPP 1 dokumen per Job atau bisa per Unit? | ✅ **Terkonfirmasi** | **LHPP diterbitkan per Unit/Alat.** BAP diterbitkan per sesi/kunjungan inspeksi (satu BAP bisa mencakup banyak Unit yang diperiksa dalam sesi yang sama). | Rencana "95 unit lanjut duluan" **bisa berjalan** — setiap Unit yang lolos RU langsung punya LHPP sendiri dan tidak perlu menunggu 5 unit yang masih di rantai 4b–4c–4d. LHPP dan BAP harus dimodelkan sebagai **entitas terpisah** (lihat 8.5) karena kardinalitasnya berbeda (LHPP 1:1 ke Unit, BAP 1:N ke Unit). |
| Berapa lama batas waktu (ceiling) Job boleh berstatus Partial sebelum eskalasi? | ✅ **Terkonfirmasi** | **Tidak ada batas waktu keras (infinite ceiling)** — Job boleh tetap Partial tanpa batas. Namun sistem **wajib memberi reminder/eskalasi otomatis** ketika sebuah Unit tertahan terlalu lama di loop 4b–4c–4d. | Perlu mekanisme **Escalation Reminder** berbasis SLA/threshold (bukan auto-cancel, bukan auto-close). Lihat 8.6 untuk detail level eskalasi dan trigger. |
| Invoice tetap 1 per Job atau bisa terpisah? | ⏳ Belum divalidasi | — | Asumsi sementara untuk implementasi awal: **1 Invoice per Job** (sesuai alur Termin DP/Full saat ini), tidak mengikuti pemecahan Batch. Perlu validasi Finance sebelum fase coding invoice selesai. |
| Siapa PIC pengelompokan Batch? | ⏳ Belum divalidasi | — | Asumsi sementara: **Admin** yang membentuk Batch secara manual di Stage 8/9 berdasarkan kesiapan SUKET dari Disnaker; sistem hanya memvalidasi bahwa Unit dalam Batch sudah berstatus LHPP Approved. |

### 8.5 Spesifikasi Data untuk Implementasi (Entity & Field List)

Struktur ini dirancang agar tim development bisa langsung memetakan ke skema database/API. Relasi utama: **1 Job → N Unit**; **1 Job → N InspectionEvent**; **1 InspectionEvent → N Unit** (many-to-many, karena satu sesi bisa memeriksa banyak Unit, dan satu Unit bisa diperiksa di lebih dari satu sesi jika gagal & di-retest); **1 Unit → N LHPP** (histori versi, 1 ditandai final); **1 Job → N Batch**; **1 Batch → N Unit** (Unit masuk Batch hanya setelah LHPP-nya Approved).

**Entity: `Job`**
| Field | Tipe | Keterangan |
|---|---|---|
| job_id | PK | |
| po_number | string | Nomor PO/SPK |
| client_id | FK | |
| termin_pembayaran | enum: `DP`, `FULL` | Dari Stage 1 |
| total_unit_count | int | Jumlah total Alat |
| job_status | enum: `Open`, `Partial`, `Closed` (computed) | Dihitung dari rollup status seluruh Unit, bukan field yang di-set manual |
| closed_unit_count | int (computed) | Untuk tampilan "95/100 Unit Closed" |

**Entity: `Unit` (Alat)**
| Field | Tipe | Keterangan |
|---|---|---|
| unit_id | PK | |
| job_id | FK | |
| nama_alat, no_seri, kategori | string | no_seri wajib hanya untuk kategori Listrik & Kebakaran |
| ru_result | enum: `Pending`, `Sesuai`, `Tidak Sesuai` | Hasil RU per Unit — **menggantikan gerbang biner lama** |
| current_stage | enum: `4`,`4b`,`4c`,`4d`,`5`,`6`,`7`,`8`,`9`,`11b`,`11c`,`12` | Posisi Unit saat ini di alur |
| unit_status | enum: `InProgress`, `ReworkLoop`, `Closed` | Status ringkas untuk rollup Job |
| final_lhpp_id | FK ke LHPP | LHPP aktif/terbaru yang berlaku untuk Unit ini |
| batch_id | FK ke Batch, nullable | Terisi setelah LHPP Approved dan Unit dikelompokkan |
| closed_at | datetime, nullable | |

**Entity: `InspectionEvent` (Sesi Riksa Uji — sumber BAP)**
| Field | Tipe | Keterangan |
|---|---|---|
| inspection_id | PK | |
| job_id | FK | |
| type | enum: `Initial RU (Stage 4)`, `Riksa Uji Ulang (Stage 4d)` | |
| tanggal_pelaksanaan | date | |
| petugas_ahli_id | FK | PIC: INS / Ahli-Petugas |
| bap_id | FK ke BAP (1:1) | |

**Entity: `InspectionUnit` (join table)**
| Field | Tipe | Keterangan |
|---|---|---|
| inspection_id | FK | |
| unit_id | FK | |
| hasil_unit | enum: `Sesuai`, `Tidak Sesuai` | Hasil spesifik Unit ini pada sesi tsb |

**Entity: `BAP` (Berita Acara Pemeriksaan)**
| Field | Tipe | Keterangan |
|---|---|---|
| bap_id | PK | |
| inspection_id | FK (1:1) | Satu BAP = satu sesi inspeksi, mencakup banyak Unit |
| file_url | string | |
| ditandatangani_oleh | string/FK | |
| tanggal_terbit | date | |

**Entity: `LHPP` (Laporan Hasil Pemeriksaan & Pengujian — per Unit)**
| Field | Tipe | Keterangan |
|---|---|---|
| lhpp_id | PK | |
| unit_id | FK | |
| source_inspection_id | FK | Sesi inspeksi mana yang menghasilkan LHPP ini (penting saat ada versi ke-2 setelah retest) |
| version_number | int | Bertambah jika Unit gagal lalu retest dan LHPP baru diterbitkan |
| is_final | bool | Hanya 1 versi per Unit yang aktif |
| status | enum: `Draft`, `Pengerjaan`, `Selesai`, `Review Manager`, `Approved`, `Rejected-Revisi` | |
| tanggal_data_teknis_diserahkan | date | (sudah ada dari update sebelumnya) |
| tanggal_mulai_pengerjaan | date | |
| tanggal_selesai | date | |
| reviewer_manager_id | FK, nullable | Terisi jika lewat jalur Review Manager (bukan Bypass Standar) |
| decision | enum: `Approve`, `Reject-to-Revise`, nullable | |

**Entity: `Batch` (Kelompok Pengajuan Dinas & Pengiriman SUKET)**
| Field | Tipe | Keterangan |
|---|---|---|
| batch_id | PK | |
| job_id | FK | |
| batch_sequence | int | Urutan batch dalam Job (Batch 1, 2, 3, dst.) |
| current_stage | enum: `7`,`8`,`9`,`11`,`11c`,`11b`,`Closed` | Batch bergerak bersama sebagai satu grup; melewati 11c (Verifikasi Pembayaran) sebelum 11b (Kirim Suket), sesuai reposisi gerbang Status Lunas |
| status_tag | enum: `On Track`, `Delayed`, `Issue` | Untuk Stage 8, dipakai Dashboard Marketing |
| tanggal_verifikasi_dinas | date | Stage 7 |
| tanggal_input_suket | date | Stage 9 (di-scope ulang ke Batch, bukan Job) |
| tanggal_terbit_suket | date | Stage 9 |
| durasi_proses_suket | int, computed | terbit − input |
| tanggal_kirim | date | Stage 11b |
| status_kirim | enum: `Menunggu`, `Siap Kirim`, `Terkirim` | |

**Entity: `BatchUnit` (join table)**
| Field | Tipe | Keterangan |
|---|---|---|
| batch_id | FK | |
| unit_id | FK | Unit hanya boleh masuk Batch jika `final_lhpp.status = Approved` |

**Entity: `PaymentVerification` (Stage 11c)**
| Field | Tipe | Keterangan |
|---|---|---|
| verification_id | PK | |
| job_id | FK | |
| verified_by | FK (Finance) | |
| verified_at | datetime | |
| bukti_url | string | |
| status | enum: `Pending`, `Verified`, `Partial` | Gate sebelum Stage 11b (Kirim Suket); status `Partial` memicu Job loop kembali ke Stage 11 (Penagihan) untuk ditagih ulang |
| retry_count | int, computed | Jumlah kali Job kembali ke Stage 11 akibat status Partial, untuk monitoring Job yang berulang kali gagal Lunas |

### 8.6 Mekanisme Escalation Reminder (Ceiling Tak Terbatas)

Karena tidak ada batas waktu keras, sistem menggunakan **reminder bertingkat berbasis durasi**, bukan auto-close/auto-cancel:

| Level | Trigger (durasi Unit diam di rantai 4b–4c–4d, dihitung sejak `ru_result = Tidak Sesuai`) | Penerima Notifikasi | Aksi Sistem |
|---|---|---|---|
| Reminder 1 | > 7 hari (SLA normal reschedule terlampaui) | Marketing (owner Stage 4b) & Admin (owner Stage 4c) | Notifikasi in-app + badge kuning pada Unit di Kanban |
| Reminder 2 | > 14 hari | Manager | Notifikasi eskalasi + badge merah; Unit ditandai "Perlu Keputusan Manager" |
| Reminder 3 (berulang) | Setiap 14 hari berikutnya tanpa perubahan status | Manager (berulang) | Notifikasi berulang sampai status Unit berubah (Sesuai/Closed) atau ada keputusan manual (mis. Unit dibatalkan dari kontrak) |

*Catatan: angka 7/14 hari di atas adalah **default yang dapat dikonfigurasi** (configurable SLA setting), bukan angka final — perlu divalidasi oleh Marketing/Manager sebelum coding SLA-nya di-hardcode.*

Job tidak pernah otomatis "gagal" atau "ditutup paksa" karena Unit yang stuck — status Job tetap `Partial` selamanya sampai ada resolusi manual (Unit lolos RU, atau Unit dikeluarkan dari cakupan Job oleh Manager dengan catatan/approval, yang tercatat sebagai audit trail, bukan penghapusan data).

### 8.7 Pertanyaan Terbuka yang Masih Wajib Divalidasi

- **Invoice/Penagihan (Stage 10–11c):** Apakah tetap 1 invoice untuk seluruh Job (sesuai default asumsi di 8.4), atau perlu invoice terpisah bila sebagian unit tertunda signifikan?
- **PIC pengelompokan Batch:** Dikonfirmasi Admin secara manual (asumsi sementara) — perlu validasi apakah ini perlu otomatisasi lebih lanjut di masa depan.
- **Angka threshold eskalasi (7/14 hari):** Perlu disepakati bersama Marketing & Manager sebagai SLA resmi sebelum di-hardcode ke sistem.
- **Unit yang dikeluarkan dari cakupan Job:** Perlu proses/approval formal (siapa yang berwenang, dokumen apa yang menyertai) agar tidak menjadi celah data hilang tanpa jejak audit.

---

### Metadata Dokumen Sumber
- **File asal:** Laporan_Revisi_Sistem_DNP_Monitor_tahap_1.docx
- **Pembuat:** Asus
- **Terakhir dimodifikasi oleh:** Asus E1504FA
- **Revisi:** 6 (update: tracking tanggal Stage 5, input & durasi SUKET Stage 9, penambahan Stage 11c Verifikasi Pembayaran, studi kasus Split Job/Partial SUKET Delivery pada Bagian 8, konfirmasi LHPP per-Unit & BAP per-sesi, spesifikasi data siap-development, mekanisme escalation reminder; Rev.6: reposisi Stage 11c ke tepat setelah Stage 11 — Penagihan, gerbang `Status Lunas?` kini berbasis hasil Stage 11c dengan cabang Partial/Pending yang loop kembali ke Stage 11, bukan self-loop)
