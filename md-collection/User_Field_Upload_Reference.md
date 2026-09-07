# DNP Riksa Uji Monitor — User Field & Upload Reference

> **Tujuan:** Panduan lengkap semua data yang harus diisi dan dokumen yang harus diunggah **per role pengguna**, mulai dari pra-Stage 1 hingga closed (Stage 12).
> **Last Updated:** 2026-08-20
> **Versi Sistem:** DNP Monitor v1.1 (12-Stage Rework)

---

## Ringkasan Role & Stage Kepemilikan

| Role | Stage yang Dikerjakan | Catatan |
|---|---|---|
| `marketing` | Pre-Stage 1, Stage 1, Stage 11 | Eksklusif — MGR tidak bisa masuk |
| `admin` | Stage 2, 3, 5, 8, 9 | Via `user_stage_permissions` |
| `inspektur` | Stage 4 | Hanya inspektur yang ditugaskan ke job |
| `manager` (Kadiv RU) | Stage 6, 7 + approval bypass S2 | Otoritas approval & review |
| `finance` | Stage 10, 12 | Eksklusif — MGR tidak bisa masuk |
| `superadmin` | Semua stage | Akses penuh tanpa batasan |

---

## 👤 MARKETING

### Pra-Stage 1 — Persiapan Sebelum Buat Job

Sebelum membuat job baru, Marketing **wajib memastikan** data dan dokumen berikut tersedia dari klien:

| # | Item | Keterangan | Prioritas |
|---|---|---|---|
| 1 | Surat Permohonan Riksa Uji (dari klien) | Bermaterai, ditandatangani pemilik alat | ✅ Wajib |
| 2 | Scan / Foto PO atau SPK | Nomor, nilai, dan lingkup harus terbaca jelas | ✅ Wajib |
| 3 | Surat Kuasa dari Pemilik ke PJK3 | Jika pemilik berbeda dengan pemohon | ✅ Wajib |
| 4 | Nama & Jabatan PIC Klien | Kontak yang bisa dihubungi selama proses | 📋 Penting |
| 5 | Nomor Telepon PIC | Format aktif (081x-xxxx) | 📋 Penting |
| 6 | Jenis & Jumlah Unit Pesawat | e.g. Boiler 3 unit, PV 2 unit, Lift 1 unit | ✅ Wajib |
| 7 | Lokasi Pelaksanaan | Kota/Kabupaten dan Provinsi | ✅ Wajib |
| 8 | Nilai Kontrak | Nominal dalam Rupiah | ✅ Wajib |
| 9 | Nomor PO / SPK | Kode referensi dari dokumen PO/SPK | ✅ Wajib |
| 10 | Tanggal PO / SPK | Tanggal diterbitkan dokumen | 📋 Penting |
| 11 | Catatan / Scope Pekerjaan | Deskripsi lingkup teknis bila ada | ℹ️ Opsional |

> **💡 Tips:** Minta klien mengisi form permintaan standar sebelum meeting, agar semua data sudah siap saat input ke sistem.

---

### Stage 1 — PO / SPK (Buat Job Baru)

**Aksi:** Buat job baru di sistem dengan mengisi form dan mengunggah dokumen awal.

#### Isi Form (Wajib Diisi)

| Field | Kolom DB | Keterangan | Wajib? |
|---|---|---|---|
| Nama Klien | `klien` | Nama perusahaan / perorangan klien | ✅ |
| Lokasi Pemeriksaan | `lokasi` | Pilih Provinsi → Kota/Kab dari dropdown (format: `"Kota, Provinsi"`) | ✅ |
| Jenis Pesawat | `pesawat` | Pilih jenis: FIRE, PV, LIFT, CRANE, BOILER, dll | ✅ |
| Jumlah Unit | `units` | Min. 1 unit | ✅ |
| Nilai Kontrak | `nilai` | Rupiah (tanpa titik/koma, input angka) | ✅ |
| No. PO / SPK | `no_po` | Nomor dari dokumen klien | ✅ |
| PIC Klien | `pic_klien` | Nama + jabatan | ℹ️ |
| Telepon PIC | `pic_klien_phone` | Format 081x | ℹ️ |
| Tanggal PO | `tgl_po` | Tanggal PO/SPK diterbitkan | ℹ️ |
| Catatan / Scope | `notes` | Deskripsi teknis / catatan khusus | ℹ️ |

> **Auto-generated:** Kode Job (`DNP/YYYY/####`), Stage = 1, waktu mulai stage.

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? | Catatan |
|---|---|---|---|
| Scan PO / SPK | PDF, JPG, PNG | ✅ **Min. 1 dari 3** | |
| Surat Permohonan | PDF, JPG, PNG | ✅ **Min. 1 dari 3** | |
| Surat Kuasa | PDF, JPG, PNG | ✅ **Min. 1 dari 3** | |
| Dokumen Pendukung Lain | Semua format | ℹ️ | Optional |

> **Gate lanjut ke Stage 2:** Minimal 1 dari (`PO/SPK`, `Surat Permohonan`, `Surat Kuasa`) harus terupload.

---

### Stage 11 — Penyerahan Suket ke Klien

**Aksi:** Catat tanggal penyerahan Suket fisik ke klien dan upload tanda terima.

#### Isi Form

| Field | Kolom DB | Wajib? |
|---|---|---|
| Tanggal Serahkan ke Klien | `tgl_submit_mkt` | ✅ |

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? |
|---|---|---|
| Tanda Terima Suket (bermaterai + TTD klien) | PDF, JPG, PNG | 📋 Sangat direkomendasikan |

> **Syarat advance ke Stage 12:** `tgl_submit_mkt` harus diisi.

---

## 👤 ADMIN

### Stage 2 — Verifikasi Dokumen

**Aksi:** Admin memverifikasi kelengkapan dokumen klien dan mengisi status checklist.

#### Status Checklist Verifikasi (Klik OK / Tidak / NA per item)

| # | Item Dokumen | Keterangan | Status |
|---|---|---|---|
| 1 | Surat Permohonan Riksa Uji | Bermaterai, dari klien | `ok` / `tidak` / `na` |
| 2 | Surat Kuasa dari Pemilik ke PJK3 | Bermaterai | `ok` / `tidak` / `na` |
| 3 | Pernyataan Keabsahan Data | Bermaterai | `ok` / `tidak` / `na` |
| 4 | Form Checklist Disnaker | Diisi & TTD klien | `ok` / `tidak` / `na` |
| 5 | Drawing / As-Built | Gambar teknis alat | `ok` / `tidak` / `na` |
| 6 | Manual Book / Spesifikasi Teknis | Buku manual pabrik | `ok` / `tidak` / `na` |
| 7 | Pengesahan Gambar dari Kemnaker | Kondisional (pesawat tertentu + regional) | `ok` / `tidak` / `na` |
| 8 | Copy Suket / Sertifikat Lama | Hanya untuk perpanjangan | `ok` / `tidak` / `na` |
| 9 | Catatan Verifikasi Admin | Rangkuman hasil verifikasi | `ok` / `tidak` / `na` |

> **Penyimpanan:** Status checklist tersimpan otomatis ke `s2_verify_data` (JSON) di database saat diklik.

#### Upload Dokumen (Jika Belum Ada dari Stage 1)

| Dokumen | Jenis File | Catatan |
|---|---|---|
| Pernyataan Keabsahan Data | PDF | Jika belum diupload Marketing |
| Form Checklist Disnaker | PDF | Formulir yang diisi klien |
| Drawing / As-Built | PDF, DWG (zip) | |
| Manual Book | PDF | |
| Pengesahan Gambar Kemnaker | PDF | Kondisional |
| Catatan Verifikasi | PDF | Ringkasan/checklist verifikasi internal |
| Copy Suket Lama | PDF | Jika perpanjangan |

> **Bypass:** Jika dokumen belum lengkap, Admin bisa request approval ke Manager. Manager approve → Job bisa lanjut ke Stage 3.

---

### Stage 3 — Penjadwalan

**Aksi:** Admin mengatur jadwal, menugaskan inspektur, dan memilih alat uji.

#### Isi Form (Wajib Sebelum Advance ke Stage 4)

| Field | Kolom DB | Wajib? | Keterangan |
|---|---|---|---|
| Tanggal Pelaksanaan | `tgl_pelaksanaan` | ✅ | |
| Jam Mulai | `jam_mulai` | ✅ | Format `HH:MM` |
| Durasi (hari) | `durasi_hari` | ✅ | Min. 1 |
| Disnaker Tujuan | `disnaker_tujuan` | ✅ | Nama Disnaker regional setempat |
| Pilih Inspektur | `job_inspectors` pivot | ✅ Min. 1 | Pilih dari daftar inspektur aktif |
| Pilih Alat Uji | `alat_ids` JSON | ℹ️ | Array ID alat dari inventaris |
| Pilih Sertifikat PJK3 | `cert_ids` JSON | ℹ️ | Array ID sertifikat PJK3 |

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? |
|---|---|---|
| Surat Tugas | PDF, DOCX | 📋 Sangat direkomendasikan |
| Surat Pemberitahuan H-5 | PDF | Upload bukti submit ke Disnaker/TK3 |

---

### Stage 5 — Penyusunan LHPP

**Aksi:** Admin menyusun Laporan Hasil Pemeriksaan & Pengujian berdasarkan data lapangan dari inspektur.

#### Isi Evaluasi Per Unit (`job_evaluations`)

| Field | Tipe | Wajib? | Pilihan |
|---|---|---|---|
| Label Unit | string | ✅ | e.g. "Boiler Unit A" |
| Status Kelaikan | string | ✅ | `laik` / `laik_bersyarat` / `tidak_laik` |
| Temuan Teknis | text | 📋 | Deskripsi temuan di lapangan |
| Rekomendasi | text | 📋 | Tindakan yang disarankan |

> **Wajib dilengkapi untuk semua unit** sebelum bisa advance ke Stage 6.

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? |
|---|---|---|
| LHPP (Laporan Hasil Pemeriksaan & Pengujian) | PDF | ✅ |
| BAP (Berita Acara Pemeriksaan) | PDF | ✅ |
| Laporan Teknis Tambahan | PDF, DOCX | ℹ️ |

> **Gate advance ke Stage 6:** LHPP + BAP harus ada, semua unit sudah dievaluasi.

---

### Stage 8 — Proses Disnaker

**Aksi:** Admin memantau progress di Disnaker dengan log follow-up rutin.

#### Isi Form

| Field | Kolom DB | Wajib? | Keterangan |
|---|---|---|---|
| Tanggal Dokumen Diserahkan ke Disnaker | `tgl_doc_submitted_disnaker` | 📋 | Tanggal fisik diterima Disnaker |
| Tanggal Dokumen Diterima Kembali (jika revisi) | `tgl_doc_received_disnaker` | ℹ️ | Jika ada pengembalian |

#### Log Follow-Up (Wajib Setiap 7 Hari)

| Field | Tipe | Keterangan |
|---|---|---|
| Status | dropdown | `progress` / `stuck` / `ready` |
| Catatan Follow-Up | text | Hasil telepon/kunjungan ke Disnaker |

> **⚠️ Alert:** Sistem akan menampilkan peringatan jika tidak ada follow-up selama ≥ 7 hari.

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? |
|---|---|---|
| Tanda Terima Disnaker | PDF, JPG | 📋 |
| Revisi Dokumen (jika dikembalikan) | PDF | ℹ️ |

---

### Stage 9 — Pengurusan Suket

**Aksi:** Admin mencatat nomor dan tanggal terbit Suket per unit, dan memantau progress.

#### Isi Form

| Field | Kolom DB | Wajib? |
|---|---|---|
| Status Progress | `s9_progress_status` | ✅ Pilih: `not_started` / `in_progress` / `almost_done` / `done` |

#### Input Per Unit (`units_tracking`)

| Field | Wajib? | Keterangan |
|---|---|---|
| No. Suket | ✅ | Nomor resmi dari Disnaker |
| Tanggal Terbit Suket | ✅ | |
| Masa Berlaku (bulan) | ✅ | Default per jenis pesawat (lihat tabel di bawah) |

**Default Masa Berlaku Suket:**

| Jenis Pesawat | Masa Berlaku |
|---|---|
| Pressure Vessel (PV) — Luar | 24 bulan |
| Pressure Vessel (PV) — Hydrotest | 60 bulan |
| Fire Fighting / Hydrant | 12 bulan |
| Crane / Angkat-Angkut | 12 bulan |
| Lift / Elevator | 12 bulan |
| Lainnya | 12 bulan |

> **Auto-advance ke Stage 10** jika semua unit sudah berstatus `issued`.

---

## 👤 INSPEKTUR

### Stage 4 — Pelaksanaan Riksa Uji

**Aksi:** Inspektur melaksanakan pemeriksaan di lapangan, mengisi checklist digital, dan mengupload dokumentasi.

#### Isi Form

| Field | Kolom DB | Wajib? | Keterangan |
|---|---|---|---|
| Jumlah Unit Aktual | `actual_units` | ✅ | Hitung ulang di lapangan, harus cocok dengan `units` |
| Catatan Perbedaan Unit | `unit_count_notes` | ℹ️ | Jika jumlah berbeda dari kontrak |

> **⚠️ Penting:** Jika `actual_units ≠ units`, job akan dikembalikan ke Stage 1 untuk koreksi Marketing.

#### Checklist Lapangan (Klik Centang per Item)

| ID | Item Pemeriksaan | Kritis? |
|---|---|---|
| `nameplate` | Verifikasi Nameplate — cocokkan dengan dokumen teknis | ✅ |
| `visual` | Pemeriksaan Visual — korosi, retak, kebocoran, deformasi | ✅ |
| `dimensi` | Pengukuran Dimensi & Ketebalan Material | ℹ️ |
| `kelistrikan` | Pemeriksaan Sistem Kelistrikan & Grounding | ℹ️ |
| `pengaman` | Test Fungsi Alat Pengaman (safety valve, limit switch) | ✅ |
| `fungsi` | Test Fungsi Operasional (load/pressure/functional test) | ✅ |
| `apd` | APD lengkap digunakan selama pengujian | ℹ️ |
| `bap` | BAP ditandatangani PIC Klien di lapangan | ✅ |

#### Upload Dokumen & Foto

| Dokumen / Foto | Jenis File | Wajib? | Catatan |
|---|---|---|---|
| Foto Nameplate | JPG, PNG | ✅ Direkomendasikan | Bisa langsung dari kamera HP |
| Foto Kondisi Fisik | JPG, PNG | ✅ Direkomendasikan | Sebelum & sesudah pengujian |
| BAP (scan tertandatangani) | PDF, JPG | ✅ | TTD PIC Klien di lapangan |
| Foto Hasil Pengukuran | JPG, PNG | ℹ️ | |
| Foto Alat Pengaman | JPG, PNG | ℹ️ | |
| Foto APD & Tim di Lokasi | JPG, PNG | ℹ️ | |
| Foto Dokumentasi Lapangan | JPG, PNG | ℹ️ | |
| Data Pengukuran (file) | XLSX, PDF | ℹ️ | |

> **Catatan Foto:** Sertakan deskripsi singkat di field `Catatan Foto` (max 500 karakter) saat upload foto. Catatan tersimpan di log riwayat job.

---

## 👤 MANAGER (Kadiv RU)

### Stage 2 — Approval Bypass (Jika Dokumen Belum Lengkap)

**Aksi:** Manager menerima notifikasi request bypass dari Admin dan memberikan keputusan.

| Aksi | Keterangan |
|---|---|
| ✅ **Setujui** | Job bisa lanjut ke Stage 3 meski dokumen belum lengkap |
| ❌ **Tolak** | Job tetap di Stage 2, Admin harus melengkapi dokumen |

---

### Stage 6 — Review Laporan Teknis

**Aksi:** Manager mereview LHPP & BAP dari Admin dan memutuskan kelayakannya.

#### Isi Form

| Field | Kolom DB | Wajib? | Pilihan |
|---|---|---|---|
| Keputusan Review | `s5_review_decision` | ✅ | `approved` / `approved_conditional` / `rejected` |
| Catatan Review | `s5_review_notes` | ℹ️ | Catatan teknis jika ada revisi |

| Keputusan | Akibat |
|---|---|
| `approved` | Job maju ke Stage 7 |
| `approved_conditional` | Job maju ke Stage 7 + catatan tersimpan |
| `rejected` | Job kembali ke Stage 5, Admin harus revisi LHPP/BAP |

---

### Stage 7 — Penyerahan ke Disnaker

**Aksi:** Manager menyiapkan bundel dokumen fisik dan menyerahkan ke Disnaker.

#### Isi Form

| Field | Kolom DB | Wajib? |
|---|---|---|
| Tanggal Serahkan ke Disnaker | `tgl_submit_disnaker` | ✅ |

#### Checklist Bundel Fisik yang Harus Disiapkan

**Grup A — Dari Klien:**

| # | Dokumen | Catatan |
|---|---|---|
| 1 | Surat Permohonan ke Disnaker | Asli, bermaterai |
| 2 | Surat Kuasa dari Pemilik ke PJK3 | Asli, bermaterai |
| 3 | Pernyataan Keabsahan Data | Asli, bermaterai |
| 4 | Form Checklist Disnaker | Diisi & TTD klien |
| 5 | Drawing / As-Built | Gambar teknis |
| 6 | Manual Book | Spesifikasi pabrik |
| 7 | Pengesahan Gambar Kemnaker | Kondisional |
| 8 | Copy Suket Lama | Hanya perpanjangan |

**Grup B — Dari PJK3 (PT Delta Nusantara Persada):**

| # | Dokumen | Sumber |
|---|---|---|
| 1 | LHPP | Upload Stage 5 |
| 2 | BAP | Upload Stage 5 |
| 3 | Copy SKP Ahli K3 Inspektur | Auto dari profil inspektur |
| 4 | Copy Sertifikat PJK3 (SK Kemnaker) | Auto dari master sertifikat |
| 5 | Foto Dokumentasi Pemeriksaan | Upload Stage 4 |
| 6 | Copy Sertifikat Kalibrasi Alat Ukur | Auto dari inventaris alat uji |

**Grup C — Kelengkapan Bundel:**

| # | Item |
|---|---|
| 1 | Cover bundel (nama klien & jenis pesawat) |
| 2 | Daftar isi bundel |
| 3 | Dokumen dijilid / distaples rapi |
| 4 | Salinan bundel untuk arsip internal |

---

## 👤 FINANCE

### Stage 10 — Penagihan

**Aksi:** Finance menerbitkan invoice dan memantau pembayaran klien.

#### Isi Form

| Field | Kolom DB | Wajib? | Keterangan |
|---|---|---|---|
| Total Nilai Invoice | `total_invoice_amount` | ✅ | Bisa berbeda dari nilai kontrak (PPN, dll) |
| No. Invoice | `invoice_no` | ✅ | Nomor invoice resmi perusahaan |
| Tanggal Invoice | `invoice_date` | ✅ | |
| Terms of Payment (hari) | `top_days` | 📋 | Default 30 hari |
| Status Pembayaran | `payment_status` | ✅ | `pending` / `sent` / `paid` |
| Tanggal Submit ke Marketing | `tgl_submit_mkt` | 📋 | Tanggal invoice diserahkan ke Marketing |
| Status Progress | `s10_progress_status` | ✅ | `not_started` / `in_progress` / `done` |

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? | Catatan |
|---|---|---|---|
| Invoice | **PDF saja** | ✅ | **PDF ONLY** — enforced server-side |
| Kwitansi | PDF, JPG | ℹ️ | |
| Bukti Transfer | PDF, JPG | ℹ️ | Upload saat konfirmasi pembayaran |

---

### Stage 12 — Lunas / Closed

**Aksi:** Finance mengkonfirmasi pembayaran diterima penuh dan menutup job.

#### Isi Form

| Field | Kolom DB | Wajib? |
|---|---|---|
| Tandai Lunas (`paid`) | `paid` = `true` | ✅ |
| Jumlah Diterima | `payment_amount_received` | ✅ |
| Waktu Pembayaran | `payment_paid_at` | ✅ |
| Status Pembayaran | `payment_status` = `'paid'` | ✅ |
| Tanda Terima Fisik Kembali | `tanda_terima_kembali` | ℹ️ |

#### Upload Dokumen

| Dokumen | Jenis File | Wajib? |
|---|---|---|
| Bukti Transfer / Pembayaran | PDF, JPG | ✅ |
| Kwitansi Lunas | PDF | 📋 |

> **Job tertutup** jika `paid = true`, `payment_amount_received > 0`, dan `payment_paid_at` terisi. Tidak ada stage selanjutnya.

---

## Aturan Upload Dokumen (Global)

| Aturan | Nilai |
|---|---|
| Ukuran maksimal per file | **10 MB** |
| Format yang diterima | PDF, JPG, JPEG, PNG, ZIP, DOCX, XLSX |
| Invoice Stage 10 | **PDF saja** (enforced server-side) |
| Stage harus cocok | `request.stage == job.stage` (divalidasi server) |
| Path penyimpanan | `storage/app/public/job-documents/{job_id}/` |
| Catatan foto | Field `photo_notes` max 500 karakter, tersimpan ke `job_history` |

---

## Legenda

| Simbol | Arti |
|---|---|
| ✅ | **Wajib** — Tidak bisa advance ke stage berikutnya tanpa ini |
| 📋 | **Sangat direkomendasikan** — Penting untuk kelancaran proses |
| ℹ️ | **Opsional** — Diisi sesuai kebutuhan |
| ⚠️ | **Perhatian khusus** — Ada konsekuensi jika diabaikan |

---

*End of Document — DNP Riksa Uji Monitor User Field & Upload Reference v1.0*
