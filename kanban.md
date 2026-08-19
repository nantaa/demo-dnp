# DNP Riksa Uji Monitor — Kanban Data Requirements
> **Source:** `dnp-rework/` (12-Stage Production System)
> **Last Updated:** 2026-08-19
> **Ref Schema:** `2026_01_01_000010_create_dnp_monitor_schema.php` + all subsequent migrations

---

## Role Mapping

| Role | Stage Ownership | Notes |
|---|---|---|
| `marketing` | 1, 11 | Exclusive. MGR cannot intercept |
| `admin` | 2, 3, 5, 7, 8, 9 | Assigned via `user_stage_permissions` |
| `inspektur` | 4, 6 | Only inspectors assigned to the specific job |
| `manager` (Kadiv RU) | 8 + override all except MKT/FIN stages | Approval authority |
| `finance` | 10, 12 | Exclusive. MGR cannot intercept |
| `superadmin` | All | Unrestricted |

---

## Stage Overview

| # | Stage Name | Owner | SLA | Task Ref |
|---|---|---|---|---|
| 1 | PO / SPK | Marketing | — | Task 1 |
| 2 | Verifikasi Dokumen | Admin | — | Task 2 |
| 3 | Penjadwalan | Admin | — | Task 3 |
| 4 | Pelaksanaan Riksa Uji | Inspektur | — | Task 9–10 |
| 5 | Penyusunan LHPP | Admin | — | Task 13 |
| 6 | Review Laporan Teknis | Manager | — | Task 14 |
| 7 | Penyerahan ke Disnaker | Manager | — | Task 15 |
| 8 | Proses Disnaker | Admin | 30 hari | Task 16 |
| 9 | Pengurusan Suket | Admin | — | Task 17 |
| 10 | Penagihan | Finance | — | Task 18 |
| 11 | Penyerahan Suket ke Klien | Marketing | — | Task 19 |
| 12 | Lunas / Closed | Finance | — | Task 20 |

---

## Stage 1 — PO / SPK (Marketing)

### Purpose
Marketing menerima PO/SPK dari klien dan membuat job baru di sistem.

### Form Fields (Input)

| Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Nama Klien | `klien` | string | ✅ | Index, searchable |
| Lokasi | `lokasi` | text | ✅ | Kota/area pelaksanaan |
| Owner Marketing | `owner_marketing` | string | ✅ | Auto-fill dari user login |
| PIC Klien | `pic_klien` | string | — | Nama + Jabatan |
| Telepon PIC | `pic_klien_phone` | string | — | Format: 081x-xxxx |
| Jenis Pesawat | `pesawat` | string(100) | ✅ | e.g. FIRE, PV, LIFT, CRANE |
| Jumlah Unit | `units` | integer | ✅ | Min: 1 |
| Nilai Kontrak | `nilai` | decimal(15,2) | ✅ | Dalam Rupiah |
| No PO / SPK | `no_po` | string | ✅ | Format bebas |
| Tanggal PO | `tgl_po` | date | — | |
| Catatan / Scope | `notes` | text | — | Deskripsi lingkup kerja |

### Auto-Generated Fields

| Field | DB Column | Value |
|---|---|---|
| Kode Job | `kode` | `DNP/{YYYY}/{####}` (sequential) |
| Stage | `stage` | `1` |
| Stage Started | `stage_started_at` | `now()` |

### Required Documents (Upload at Stage 1)

| Dokumen | Type String | Wajib |
|---|---|---|
| Scan PO / SPK | `PO/SPK` | ✅ Minimal 1 dari 3 ini |
| Surat Permohonan | `Surat Permohonan` | ✅ |
| Surat Kuasa | `Surat Kuasa` | ✅ |
| Dokumen Pendukung Lain | free text | — |

> **Gate to advance:** Minimal 1 dokumen dari (`PO/SPK`, `Surat Permohonan`, `Surat Kuasa`) harus ada.

### Advance Condition (Stage 1 → 2)
```
job.documents WHERE stage=1 AND type IN ('PO/SPK','Surat Permohonan','Surat Kuasa') COUNT >= 1
```

---

## Stage 2 — Verifikasi Dokumen (Admin)

### Purpose
Admin memverifikasi kelengkapan dokumen persyaratan dari klien sebelum penjadwalan.

### No New Input Fields
Stage ini tidak menambah field baru ke `dnp_jobs`. Admin melakukan verifikasi dokumen yang sudah ada dari Stage 1.

### Checklist Verifikasi (Ref: FM-PJK3-RIKU-009)
Admin memverifikasi keberadaan dokumen berikut (upload jika belum ada):

| # | Dokumen | Type String | Wajib | Kondisional |
|---|---|---|---|---|
| 1 | Surat Permohonan Riksa Uji | `Surat Permohonan` | ✅ | |
| 2 | Surat Kuasa dari Pemilik ke PJK3 | `Surat Kuasa` | ✅ | |
| 3 | Pernyataan Keabsahan Data | `Pernyataan Keabsahan` | ✅ | |
| 4 | Form Checklist Disnaker | `Form Checklist Klien` | ✅ | |
| 5 | Drawing / As-Built | `Drawing/As-Built` | ✅ | Wajib untuk PESAWAT tertentu |
| 6 | Manual Book / Spesifikasi Teknis | `Manual Book` | ✅ | Wajib untuk PESAWAT tertentu |
| 7 | Pengesahan Gambar dari Kemnaker | `Pengesahan Gambar Kemnaker` | Kondisional | Pesawat tertentu + regional |
| 8 | Copy Suket / Sertifikat Lama | `Copy Suket Lama` | — | Untuk perpanjangan |
| 9 | Catatan Verifikasi Admin | `Catatan Verifikasi` | ✅ | Wajib ada sebelum lanjut |

### Approval Flow (Bypass Mechanism)
Jika dokumen belum lengkap, Admin dapat meminta persetujuan Kadiv/MGR:

| Field | DB Column | Value |
|---|---|---|
| Status request | `peer_review_status` | `'requested'` |
| Waktu request | `peer_review_submitted_at` | `now()` |
| Nama requestor | `peer_review_submitted_by` | user.name |
| Waktu approved | `peer_review_approved_at` | `now()` (MGR action) |
| Nama approver | `peer_review_approved_by` | manager.name |

### Advance Condition (Stage 2 → 3)
```
EITHER:
  job.documents WHERE stage=2 AND type='Pengesahan Gambar Kemnaker' EXISTS
  AND job.documents WHERE stage=2 AND type='Catatan Verifikasi' EXISTS
OR:
  job.peer_review_status = 'approved'
```
> `peer_review_status` di-reset ke `null` setelah advance ke Stage 3.

---

## Stage 3 — Penjadwalan (Admin)

### Purpose
Admin menjadwalkan tanggal pelaksanaan, menugaskan inspektur, memilih alat uji, dan menerbitkan Surat Tugas.

### Form Fields (Input — wajib saat advance ke Stage 4)

| Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Tanggal Pelaksanaan | `tgl_pelaksanaan` | date | ✅ | |
| Jam Mulai | `jam_mulai` | string | ✅ | e.g. `"08:00"` |
| Durasi (hari) | `durasi_hari` | integer | ✅ | Min: 1 |
| Disnaker Tujuan | `disnaker_tujuan` | string | ✅ | Nama Disnaker regional |
| Inspektur | `job_inspectors` pivot | array of user IDs | ✅ Min 1 | Synced ke pivot table |
| Alat Uji | `alat_ids` | JSON array | — | Array of `alat_ujis.id` |
| Sertifikat PJK3 | `cert_ids` | JSON array | — | Array of `sertifikat_pjk3s.id` |

### Auto-Calculated Fields

| Field | DB Column | Calculation |
|---|---|---|
| Tanggal H-5 | `tgl_h5` | `tgl_pelaksanaan - 5 days` |
| H5 Confirmed | `h5_confirmed` | boolean, default `false` |
| H5 Method | `h5_method` | `'teman_k3'` \| `'manual'` |
| H5 Confirmed At | `h5_confirmed_at` | timestamp saat konfirmasi |
| H5 Confirmed By | `h5_confirmed_by` | user.name |

### Related Master Data Tables

**`alat_ujis`** — Inventaris alat uji:

| Field | Type | Notes |
|---|---|---|
| `kode_alat` | string unique | |
| `nama` | string | Nama alat |
| `merk` | string | |
| `serial` | string | |
| `kategori` | json | Array kategori |
| `kalibrasi_terakhir` | date | |
| `kalibrasi_expired` | date | ⚠ Hard block jika expired |
| `lab` | string | Laboratorium kalibrasi |
| `status` | string | `tersedia` \| `dipakai` |

**`sertifikat_pjk3s`** — Sertifikat PJK3:

| Field | Type | Notes |
|---|---|---|
| `kode_cert` | string unique | |
| `nama` | string | |
| `no_sk` | string | Nomor SK Kemnaker |
| `terbit` | date | |
| `expired` | date | |
| `kategori` | string | |

**`inspector_profiles`** — Profil inspektur:

| Field | Type | Notes |
|---|---|---|
| `user_id` | FK → users | |
| `skp` | string | Nomor SKP AK3 |
| `skp_expired_at` | date | ⚠ Hard block jika expired |
| `spesialisasi` | json | Array spesialisasi |
| `domisili` | string | |
| `senior_level` | integer | 1–5 (scoring algorithm) |
| `subrole` | string | Sub-role inspektur |
| `active` | boolean | |

### Documents at Stage 3

| Dokumen | Type String | Notes |
|---|---|---|
| Surat Tugas | `Surat Tugas` | Auto-generated dari template Word (dinonaktifkan sementara) |
| Surat Pemberitahuan H-5 | `Surat Pemberitahuan H-5` | Upload bukti submit Teman K3 atau manual ke Disnaker |

### Advance Condition (Stage 3 → 4)
```
tgl_pelaksanaan     REQUIRED
jam_mulai           REQUIRED
durasi_hari         REQUIRED
disnaker_tujuan     REQUIRED
inspector_ids       REQUIRED (min 1)
```

---

## Stage 4 — Pelaksanaan Riksa Uji (Inspektur)

### Purpose
Inspektur melaksanakan riksa uji di lapangan: verifikasi nameplate, pengukuran, pengujian fungsi, foto dokumentasi, dan menandatangani BAP.

### Form Fields (Saved via `POST /jobs/{job}/stage4-data`)

| Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Jumlah Unit Aktual | `actual_units` | integer | ✅ | Hasil hitung di lapangan |
| Catatan Perbedaan Unit | `unit_count_notes` | text | — | Jika berbeda dari `units` |

> **Unit Mismatch Logic:** Jika `actual_units ≠ units` saat advance ke Stage 5, sistem memblokir dan mengarahkan ke "Aktualisasi Unit" (kembali ke Marketing Stage 1 via `POST /jobs/{job}/return-to-stage1`).

### Field Checklist (Digital — stored via history/document)

| ID | Label | Kritis |
|---|---|---|
| `nameplate` | Verifikasi Nameplate (foto + cocokkan dokumen) | ✅ |
| `visual` | Pemeriksaan Visual: korosi, retak, kebocoran, deformasi | ✅ |
| `dimensi` | Pengukuran Dimensi & Ketebalan Material | — |
| `kelistrikan` | Pemeriksaan Sistem Kelistrikan & Grounding | — |
| `pengaman` | Test Fungsi Alat Pengaman (safety valve, limit switch) | ✅ |
| `fungsi` | Test Fungsi Operasional (load/pressure/functional test) | ✅ |
| `apd` | APD lengkap digunakan selama pengujian | — |
| `bap` | BAP ditandatangani PIC Klien di lapangan | ✅ |

### Documents at Stage 4

| Dokumen | Type String | Wajib | Notes |
|---|---|---|---|
| Foto Nameplate | `Foto Nameplate` | ✅ Rec | Upload dari HP (capture env) |
| Foto Kondisi Fisik | `Foto Kondisi Fisik` | ✅ Rec | |
| Foto Hasil Pengukuran | `Foto Hasil Pengukuran` | — | |
| Foto Alat Pengaman | `Foto Alat Pengaman` | — | |
| Foto APD & Tim | `Foto APD & Tim di Lokasi` | — | |
| Foto Dokumentasi Lapangan | `Foto Dokumentasi Lapangan` | — | |
| BAP (scan) | `BAP (scan tertandatangani)` | ✅ | PDF/Scan tanda tangan PIC |
| Data Pengukuran | `Data Pengukuran (file)` | — | File Excel/PDF |

> **Upload Rules:** Max 10MB per file. Tipe: `pdf, jpg, jpeg, png, zip, docx, xlsx`. Foto bisa langsung dari kamera HP (`capture="environment"`).  
> **Photo Notes:** Field `photo_notes` (string, max 500) dapat dikirim bersamaan upload foto, disimpan ke `job_history`.

### Permission Check
```
Only: job.inspectors WHERE users.id = auth.id EXISTS
OR: user.role IN ('manager', 'superadmin')
```

### Advance Condition (Stage 4 → 5)
```
actual_units        MUST BE SET
IF actual_units != units → redirect to Stage 1 (return-to-stage1)
```

---

## Stage 5 — Penyusunan LHPP (Admin)

### Purpose
Admin menyusun Laporan Hasil Pemeriksaan & Pengujian (LHPP) dan Berita Acara Pemeriksaan (BAP) berdasarkan data lapangan dari Inspektur.

### No New DB Columns
Stage ini tidak menambah field baru ke `dnp_jobs`. Aktivitas utama adalah upload dokumen dan pengisian evaluasi per unit.

### Per-Unit Evaluations (`job_evaluations` table)

| Field | DB Column | Type | Notes |
|---|---|---|---|
| Job ID | `job_id` | FK uuid | |
| Nomor Unit | `unit_no` | integer | 1, 2, 3... |
| Label Unit | `unit_label` | string | e.g. "Boiler Unit A" |
| Status Kelaikan | `status` | string(50) | `laik` \| `laik_bersyarat` \| `tidak_laik` |
| Temuan | `findings` | text | Deskripsi temuan teknis |
| Rekomendasi | `recommendation` | text | Tindakan yang disarankan |

> **Aggregate Status Logic:**
> - Semua `laik` → aggregate = `laik`
> - Ada `tidak_laik` → aggregate = `tidak_laik`
> - Lainnya → aggregate = `laik_bersyarat`

### Documents at Stage 5

| Dokumen | Type String | Wajib |
|---|---|---|
| LHPP | `LHPP` | ✅ Diperlukan sebelum review |
| BAP | `BAP` | ✅ Diperlukan sebelum review |
| Laporan Teknis Tambahan | free text | — |

### `laik_status` field on `dnp_jobs`

| Value | Meaning |
|---|---|
| `laik` | Semua unit layak operasi |
| `laik_bersyarat` | Layak dengan syarat perbaikan |
| `tidak_laik` | Tidak layak, perlu tindak lanjut |

### Advance Condition (Stage 5 → 6)
```
job.documents WHERE type='LHPP' EXISTS
job.documents WHERE type='BAP' EXISTS
job_evaluations WHERE job_id = job.id COUNT = job.units (all evaluated)
```

---

## Stage 6 — Review Laporan Teknis (Manager / Kadiv RU)

### Purpose
Manager/Kadiv RU mereview dan memutuskan apakah LHPP & BAP sudah sesuai standar sebelum diserahkan ke Disnaker.

### Form Fields (Saved via `POST /jobs/{job}/stage5-review`)

| Field | DB Column | Type | Options | Required |
|---|---|---|---|---|
| Keputusan Review | `s5_review_decision` | string(50) | `approved` \| `approved_conditional` \| `rejected` | ✅ |
| Catatan Review | `s5_review_notes` | text | Free text | — |

### Auto-Set Fields

| Field | DB Column | Value |
|---|---|---|
| Reviewed By | `s5_reviewed_by` | manager.name |
| Reviewed At | `s5_reviewed_at` | `now()` |

### Decision Actions

| Decision | Meaning | Next Action |
|---|---|---|
| `approved` | LHPP & BAP disetujui | Advance ke Stage 7 |
| `approved_conditional` | Disetujui dengan catatan | Advance ke Stage 7 + catatan tercatat |
| `rejected` | Ditolak, perlu revisi | Job kembali ke Stage 5 |

### Permission
```
user.role IN ('manager', 'superadmin')
```

### Documents at Stage 6
Tidak ada upload baru. Dokumen dari Stage 5 digunakan sebagai acuan review.

### Advance Condition (Stage 6 → 7)
```

---

## Stage 7 — Penyerahan ke Disnaker (Manager / Kadiv RU)

### Purpose
Manager/Kadiv RU menyiapkan dan menyerahkan bundel dokumen fisik ke kantor Disnaker untuk pengajuan Suket.

### Form Fields (Saved via `POST /jobs/{job}/stage7-data`)

| Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Tanggal Serahkan ke Disnaker | `tgl_submit_disnaker` | date | ✅ | Tanggal bundel fisik diserahkan |

### Auto-Set on Advance to Stage 8

| Field | DB Column | Value |
|---|---|---|
| Disnaker EWS Deadline | `disnaker_deadline_at` | `now() + 30 days` |

### Bundle Dokumen Checklist (FM-PJK3-RIKU-009)

**Grup A — Dokumen dari Client:**

| # | Dokumen | Type String | Ket |
|---|---|---|---|
| 1 | Surat Permohonan ke Disnaker (asli, bermaterai) | `Surat Permohonan` | Wajib |
| 2 | Surat Kuasa dari Pemilik ke PJK3 (asli, bermaterai) | `Surat Kuasa` | Wajib |
| 3 | Pernyataan Keabsahan Data (asli, bermaterai) | `Pernyataan Keabsahan` | Wajib |
| 4 | Form Checklist Disnaker (diisi & TTD client) | `Form Checklist Klien` | Wajib |
| 5 | Drawing / Gambar Teknis (as-built) | `Drawing/As-Built` | Wajib |
| 6 | Manual Book / Spesifikasi Teknis | `Manual Book` | Wajib |
| 7 | Pengesahan Gambar dari Kemnaker | `Pengesahan Gambar Kemnaker` | Kondisional |
| 8 | Copy Suket / Sertifikat Lama | `Copy Suket Lama` | Perpanjangan saja |

**Grup B — Dokumen dari PJK3:**

| # | Dokumen | Type String | Auto |
|---|---|---|---|
| 1 | LHPP | `LHPP` | — |
| 2 | BAP | `BAP` | — |
| 3 | Copy SKP Ahli K3 | — | Auto dari `inspector_profiles` |
| 4 | Copy Sertifikat PJK3 (SK Kemnaker) | — | Auto dari `sertifikat_pjk3s` |
| 5 | Foto Dokumentasi Pemeriksaan | `Foto*` | — |
| 6 | Copy Sertifikat Kalibrasi Alat Ukur | — | Auto dari `alat_ujis` |

**Grup C — Kelengkapan Bundel Fisik:**

| # | Item |
|---|---|
| 1 | Cover Bundel (nama client & jenis pesawat) |
| 2 | Daftar Isi Bundel |
| 3 | Dokumen dijilid / distaples rapi |
| 4 | Copy bundel untuk arsip internal |

### Permission
```
user.role IN ('manager', 'superadmin')
```

### Advance Condition (Stage 7 → 8)
```
tgl_submit_disnaker   REQUIRED
```

---

## Stage 8 — Proses Disnaker (Admin)

### Purpose
Admin memantau progress penerimaan dan review dokumen oleh Disnaker, dengan SLA 30 hari dan Early Warning System.

### Form Fields (Saved via `POST /jobs/{job}/stage8-data`)

| Field | DB Column | Type | Notes |
|---|---|---|---|
| Tanggal Dokumen Diserahkan Disnaker | `tgl_doc_submitted_disnaker` | date | Tanggal fisik diterima Disnaker |
| Tanggal Dokumen Diterima Kembali | `tgl_doc_received_disnaker` | date | Jika ada pengembalian/revisi |

### Auto-Calculated: SLA Status

| Field | DB Column | Logic |
|---|---|---|
| Status SLA | `disnaker_sla_status` | Dihitung dari `tgl_doc_submitted_disnaker` |

| Value | Kondisi |
|---|---|
| `on_track` | < 30 hari sejak submit |
| `last_day` | Tepat 30 hari sejak submit |
| `overdue` | > 30 hari sejak submit |

### Disnaker Follow-Up Log (`disnaker_followups` table)

| Field | DB Column | Type | Notes |
|---|---|---|---|
| Job ID | `job_id` | FK uuid | |
| Status | `status` | string(50) | `progress` \| `stuck` \| `ready` |
| Catatan | `notes` | text | Hasil telp/kunjungan ke Disnaker |
| Oleh | `action_by_user_id` | FK → users | |
| Waktu | `created_at` | timestamp | Auto |

> **SOP:** Follow-up wajib setiap **7 hari**. Alert muncul jika ≥ 7 hari tanpa follow-up.

### Per-Unit Tracking (`units_tracking` table)

| Field | DB Column | Type | Notes |
|---|---|---|---|
| Job ID | `job_id` | FK uuid | |
| No Unit | `unit_no` | integer | |
| Label Unit | `unit_label` | string | |
| Status Kelaikan | `laik_status` | string(50) | Dari Stage 5 |
| Status Suket | `status` | string(50) | `pending` \| `submitted` \| `issued` \| `rejected` |
| Tgl Submit ke Disnaker | `tgl_submit` | date | Per unit independen |
| No Registrasi | `no_registrasi` | string | Tanda terima Disnaker |
| No Suket | `no_suket` | string | Diisi saat Suket terbit |
| Tgl Terbit Suket | `tgl_suket` | date | |
| Tgl Expired Suket | `suket_expired_at` | date | Indexed untuk reminder |
| Masa Berlaku | `suket_validity_months` | integer | Bulan |
| Catatan | `notes` | text | Alasan penolakan dll |

### Documents at Stage 8

| Dokumen | Type String |
|---|---|
| Tanda Terima Disnaker | `Tanda Terima Disnaker` |
| Revisi Dokumen (jika ada) | free text |

### Permission
```
user.role IN ('admin', 'manager', 'superadmin')
```

---

## Stage 9 — Pengurusan Suket (Admin)

### Purpose
Admin memantau penerbitan Suket per unit oleh Disnaker dan mencatat nomor Suket saat terbit.

### Form Fields (Saved via `POST /jobs/{job}/stage9-data`)

| Field | DB Column | Type | Options | Required |
|---|---|---|---|---|
| Status Progress | `s9_progress_status` | string(50) | `not_started` \| `delayed` \| `in_progress` \| `almost_done` \| `done` | ✅ |

### Suket Terbit per Unit (via `units_tracking`)

| Field | DB Column | Required | Notes |
|---|---|---|---|
| No Suket | `no_suket` | ✅ | Nomor resmi dari Disnaker |
| Tanggal Terbit | `tgl_suket` | ✅ | |
| Masa Berlaku (bulan) | `suket_validity_months` | ✅ | Default per jenis pesawat |
| Tanggal Expired | `suket_expired_at` | Auto | `tgl_suket + validity_months` |

**Default Validity per Jenis Pesawat:**

| Jenis Pesawat | Masa Berlaku |
|---|---|
| Pressure Vessel (PV) — Luar | 24 bulan |
| Pressure Vessel (PV) — Hydrotest | 60 bulan |
| Fire Fighting / Hydrant | 12 bulan |
| Crane / Angkat-Angkut | 12 bulan |
| Lift / Elevator | 12 bulan |
| Lainnya | 12 bulan |

### Suket Reminder System
- **H-90 hari:** Alert kuning di dashboard Reminder Suket
- **Expired:** Alert merah, perlu diperpanjang

### Auto-Advance to Stage 10
```
IF ALL units_tracking WHERE job_id = job.id HAVE status = 'issued'
THEN job.stage → 10  (otomatis)
```

---

## Stage 10 — Penagihan (Finance)

### Purpose
Finance menerbitkan invoice kepada klien dan memantau status pembayaran.

### Form Fields (Saved via `POST /jobs/{job}/stage10-data`)

| Field | DB Column | Type | Notes |
|---|---|---|---|
| Total Nilai Invoice | `total_invoice_amount` | decimal(15,2) | Bisa berbeda dari `nilai` (PPN dll) |
| Tanggal Invoice Diterbitkan | `tgl_invoice_issued` | date | |
| Status Progress | `s10_progress_status` | string(50) | `not_started` \| `in_progress` \| `done` |
| Tanggal Submit ke MKT | `tgl_submit_mkt` | date | Tanggal invoice diserahkan ke Marketing |

### Additional Billing Fields (on `dnp_jobs`)

| Field | DB Column | Type | Notes |
|---|---|---|---|
| No Invoice | `invoice_no` | string | Nomor invoice resmi |
| Tanggal Invoice | `invoice_date` | date | |
| Terms of Payment | `top_days` | integer | Default: 30 hari |
| Jatuh Tempo | `payment_due_date` | date | `invoice_date + top_days` |
| Status Pembayaran | `payment_status` | string(50) | `pending` \| `sent` \| `paid` |
| Waktu Pembayaran | `payment_paid_at` | datetime | |
| Jumlah Diterima | `payment_amount_received` | decimal(15,2) | |
| Tanda Terima Kembali | `tanda_terima_kembali` | boolean | Dokumen fisik sudah kembali |
| Paid Flag | `paid` | boolean | Index untuk filter laporan |

### Documents at Stage 10

| Dokumen | Type String | Wajib | Notes |
|---|---|---|---|
| Invoice (PDF) | `Invoice (PDF)` | ✅ | **PDF only** — enforced server-side |
| Kwitansi | `Kwitansi` | — | |
| Bukti Transfer | `Bukti Transfer` | — | Upload saat lunas |

### Permission
```
user.role IN ('finance', 'superadmin')
```

---

## Stage 11 — Penyerahan Suket ke Klien (Marketing)

### Purpose
Marketing menyerahkan Suket asli kepada klien dan mencatat tanggal penyerahan.

### Form Fields

| Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Tanggal Serahkan ke Klien | `tgl_submit_mkt` | date | ✅ | Tanggal Suket diserahkan ke klien |

### Documents at Stage 11

| Dokumen | Type String | Notes |
|---|---|---|
| Tanda Terima Suket | `Tanda Terima Suket` | Bukti tanda tangan terima dari klien |

### Permission
```
user.role = 'marketing' (AND job.owner_marketing = auth.user.name)
OR user.role = 'superadmin'
```
> Stage 11 adalah **exclusive Marketing stage**. MGR tidak dapat mengintervensi.

### Advance Condition (Stage 11 → 12)
```
tgl_submit_mkt    REQUIRED
```

---

## Stage 12 — Lunas / Closed (Finance)

### Purpose
Finance mengkonfirmasi pembayaran diterima penuh dan menutup job. Tahap akhir dari pipeline.

### Form Fields

| Field | DB Column | Type | Required | Notes |
|---|---|---|---|---|
| Status Bayar | `paid` | boolean | ✅ | Set `true` |
| Jumlah Diterima | `payment_amount_received` | decimal(15,2) | ✅ | |
| Waktu Pembayaran | `payment_paid_at` | datetime | ✅ | |
| Status Pembayaran | `payment_status` | string(50) | ✅ | Set ke `'paid'` |
| Tanda Terima Kembali | `tanda_terima_kembali` | boolean | — | Dokumen fisik sudah dikembalikan |

### Documents at Stage 12

| Dokumen | Type String |
|---|---|
| Bukti Transfer / Pembayaran | `Bukti Transfer` |
| Kwitansi Lunas | `Kwitansi Lunas` |

### Permission
```
user.role IN ('finance', 'superadmin')
```

### Close Condition
```
paid = true
payment_amount_received > 0
payment_paid_at IS NOT NULL
```
> Job di Stage 12 dengan `paid = true` dianggap **Closed**. Tidak ada stage berikutnya.

---

## Global Tables Reference

### `job_documents`

| Field | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `job_id` | FK uuid → dnp_jobs | |
| `stage` | smallint | Stage saat dokumen diupload |
| `type` | string(100) | Jenis dokumen (lihat per-stage) |
| `name` | string | Nama file asli |
| `path` | string(512) | `job-documents/{job_id}/...` |
| `uploaded_by_user_id` | FK → users | |
| `created_at` | timestamp | |

### `job_history` (Audit Log)

| Field | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `job_id` | FK uuid → dnp_jobs | |
| `stage` | smallint | Stage saat action terjadi |
| `action` | string | Deskripsi aksi |
| `returned_from_stage` | smallint | Diisi jika job di-reject/return |
| `notes` | text | Catatan tambahan |
| `action_by_user_id` | FK → users | |
| `created_at` | timestamp | |

### `user_stage_permissions`

| Field | Type | Notes |
|---|---|---|
| `user_id` | FK → users | |
| `stage` | smallint (1–12) | |
| `is_owner` | boolean | Dapat memindahkan job di stage ini |
| `can_view` | boolean | Dapat melihat job di stage ini |

> **Unique:** `(user_id, stage)` — satu record per user per stage.

---

## Reject / Return Flow

| Endpoint | Logic |
|---|---|
| `POST /jobs/{job}/reject` | Kembalikan ke `stage - 1`. Requires `notes`. |
| `POST /jobs/{job}/return-to-stage1` | Paksa kembali ke Stage 1 (unit mismatch). Requires `notes` min 5 chars. |

Kedua aksi mencatat ke `job_history` dengan `returned_from_stage` terisi.

---

## Document Upload Rules (Global)

| Rule | Value |
|---|---|
| Max file size | **10 MB** per file |
| Accepted MIME types | `pdf, jpg, jpeg, png, zip, docx, xlsx` |
| Stage 10 Invoice | **PDF only** (enforced server-side) |
| Stage must match | `request.stage == job.stage` (enforced) |
| Storage path | `storage/app/public/job-documents/{job_id}/` |
| Photo notes field | `photo_notes` max 500 chars — saved to `job_history` |

---

*End of Document — DNP Riksa Uji Monitor Kanban Data Requirements v1.0 (12-Stage Rework)*
