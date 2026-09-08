# DNP Monitor — End-to-End Job Pipeline & Workflow Specification (REVISED)

**Version:** 2.0  
**Last Updated:** 2026-09-08  
**Status:** Implementation-Ready

Dokumen ini menjelaskan alur operasional pekerjaan (**Job Pipeline**) sistem monitoring Riksa Uji PT Delta Nusantara Persada dari **Stage 1 (PO Masuk)** sampai **Stage 12 (Selesai/Closed)** beserta seluruh percabangan loopback, peran (RBAC), dokumen wajib, validasi *hard-gate*, dan kontrol audit.

---

## 1. Ringkasan Pipeline (17 Stages)

```mermaid
flowchart TD
    S1["Stage 1: PO / SPK (Marketing)"] --> S2["Stage 2: Verifikasi Dokumen (Admin)"]
    S2 --> S3["Stage 3: Penjadwalan & Surat Tugas (Admin/Ops)"]
    S3 --> S4["Stage 4: Pelaksanaan RU (Inspektur)"]

    %% Split Stage 4 into THREE paths
    S4 -->|Count Matches + All Laik| S5["Stage 5: Penyusunan LHPP (Tim Ahli)"]
    S4 -->|Count Mismatch (Logistics)| S4b["Stage 4b: Aktualisasi Unit (Marketing)"]
    S4 -->|Technical Finding / Rusak| S6["Stage 6: Review Laporan (QC)"]

    %% Stage 4b paths
    S4b -->|Reschedule| S4c["Stage 4c: Penjadwalan Ulang (Admin)"]
    S4b -->|Bypass| S5

    %% Stage 4c → 4d loop with max_reschedule_count=3
    S4c --> S4d["Stage 4d: Riksa Uji Ulang (Inspektur)"]
    S4d -->|Lolos Penuh| S5
    S4d -->|Gagal / Berulang| S4c

    %% Stage 6 paths
    S6 -->|Laik (max_revision_count=2)| S7["Stage 7: Verifikasi ke Dinas / Batch (Admin)"]
    S6 -->|Revisi Teknis| S5
    S6 -->|Tidak Laik| S4c

    %% Fase Laporan & Dinas
    S7 --> S8["Stage 8: Proses Disnaker (Admin)"]
    S8 --> S9["Stage 9: Pengurusan SUKET (Admin)"]

    %% Fase Keuangan & Delivery
    S9 --> S10["Stage 10: Pembuatan Invoice (Finance)"]
    S10 --> S11["Stage 11: Penagihan Pembayaran (Marketing)"]
    S11 --> S11c["Stage 11c: Verifikasi Pembayaran (Finance)"]
    S11c -->|Belum Lunas / Partial (max_payment_retry=5)| S11
    S11c -->|LUNAS + Bank Statement| S11b["Stage 11b: Kirim SUKET ke Klien (Marketing)"]
    S11b --> S12["Stage 12: Selesai / Closed (Finance)"]

    %% Stage 12 reopen path
    S12 -.->|Reopen by Kadiv/Manager/Superadmin| S5
```

---

## 2. Rincian Stage Demi Stage

### FASE 1: RU LAPANGAN & PENJADWALAN (Stage 1 – 4d)

#### Stage 1: PO / SPK / Proposal Masuk
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Mendaftarkan pesanan baru dari klien ke dalam sistem.
- **Input & Atribut**:
  - Nama Klien, Lokasi Pengujian, Jenis Pesawat/Alat K3.
  - Jumlah Unit, Nilai Kontrak (Rp).
  - **DP Amount/Percentage** (Wajib input, e.g., "30%" atau "Rp 15.000.000").
  - Skema Termin Pembayaran: `DP` (Down Payment) atau `FULL` (Pelunasan Belakang).
  - Nomor Seri Alat (Wajib untuk kategori *Listrik* dan *Kebakaran*).
- **Dokumen Diunggah**: File PO / SPK / Surat Permohonan Klien.
- **Validasi Gate**: Minimal 1 dokumen terunggah, termin pembayaran terdefinisi, **DP amount/percentage diinput**.

---

#### Stage 2: Verifikasi Dokumen Teknis
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Memeriksa kelengkapan berkas administrasi dan legalitas teknis unit sebelum jadwal diterbitkan.
- **Checklist Dokumen (10 Item)**:
  1. PO / SPK / Proposal dari Klien
  2. Surat Permohonan Riksa Uji (bermeterai)
  3. Surat Kuasa dari Pemilik (bermeterai)
  4. Surat Pernyataan Keabsahan Data
  5. Form Checklist Disnaker (diisi klien)
  6. Drawing / Gambar Teknis (*as-built*)
  7. Manual Book / Spesifikasi Teknis
  8. Pengesahan Gambar dari Kemnaker
  9. Copy Suket Lama (jika perpanjangan)
  10. Verifikasi Drawing SESUAI dengan Nameplate (cek visual foto)
- **Validasi Gate**: Semua dokumen lengkap **ATAU** mendapat *Approval Bypass* dari **Kepala Divisi / Manager Teknis**.
- **Bypass Rule**: 
  - Bypass **requires written justification** logged in system (mandatory text field: "Alasan Bypass").
  - System tracks **document-debt** — job cannot proceed to Stage 11b (SUKET delivery) until all bypassed documents are uploaded.
  - Bypass approval logged with: approver name, timestamp, reason.

---

#### Stage 3: Penjadwalan & Surat Tugas
- **Penanggung Jawab (PIC)**: `ADMIN` / `OPERATIONAL`
- **Tujuan**: Menentukan tanggal inspeksi lapangan, menugaskan Tim Ahli K3 (Inspektur), memilih Penanggung Jawab Laporan, dan memilih Alat Uji/Sertifikat PJK3.
- **Fitur Khusus**:
  - **Smart Recommendation Engine**: Rekomendasi otomatis 3 kandidat teratas berdasarkan bobot:
    - *Spesialisasi Cocok (+40)*
    - *Domisili Terdekat (+20)*
    - *Pengalaman di Klien/Alat Serupa (+10)*
    - *Beban Kerja Aktif* (-20 jika ≥ 4 job aktif → status `Overload`).
    - *Filter Otomatis*: Menyaring keluar personil yang SKP-nya sudah expired atau status non-aktif.
  - **Multi-Day Scheduling**: Pengaturan penugasan inspektur per hari (Hari 1, Hari 2, dst).
  - **DP Hard-Gate**: Jika termin = `DP`, Surat Tugas **diblokir** sampai **DP amount ≥ configured threshold** (e.g., 30% of contract value) verified by Finance.
- **Output**: Surat Tugas diterbitkan, Disnaker Tujuan tercatat, personil & alat uji teralokasi.

---

#### Stage 4: Pelaksanaan RU (Riksa Uji Lapangan)
- **Penanggung Jawab (PIC)**: `INSPEKTUR` / `TIM AHLI`
- **Tujuan**: Melakukan pemeriksaan fisik dan pengujian alat K3 di lokasi klien.
- **Input & Bukti**:
  - Input: *Jumlah Alat yang Benar-benar Diperiksa*.
  - Status per unit: `Sesuai`, `Temuan (Rusak)`, atau `Tidak Tersedia (Logistics)`.
  - Foto Dokumentasi Wajib:
    1. *Foto Keberangkatan*
    2. *Foto Sampai Lokasi Riksauji*
    3. *Foto Kepulangan*
    4. *Foto BAP Lapangan (Berita Acara)*
- **Percabangan Kasus (THREE PATHS)**:
  - **Kasus A (Happy Path)**: Jumlah diperiksa = total unit AND semua unit `Sesuai` → **Lanjut ke Stage 5**.
  - **Kasus B (Count Mismatch - Logistics)**: Jumlah unit di lapangan < PO karena unit tidak tersedia (logistics, bukan rusak) → **Diarahkan ke Stage 4b (Aktualisasi Unit)**.
  - **Kasus C (Technical Finding)**: Unit ditemukan `Temuan (Rusak)` atau tidak laik fungsi → **Diarahkan ke Stage 6 (Review Laporan)** dengan status `Tidak Laik` per unit.

---

#### Stage 4b: Aktualisasi Unit (Delta)
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Rekonsiliasi komersial jika jumlah unit riil lapangan berbeda dengan kontrak awal **karena alasan logistik** (bukan kerusakan teknis).
- **Aksi Marketing**:
  - Menyesuaikan *Jumlah Unit Baru* dan *Nilai Kontrak/Invoice* jika klien sepakat mengurangi/menambah unit.
  - Opsi:
    1. **Jadwalkan Ulang (Stage 4c)**: Untuk sisa unit yang belum teruji karena alasan logistik.
    2. **Bypass ke Stage 5**: Jika unit yang ada langsung diterbitkan laporan apa adanya — **requires Kadiv/Manager approval + document-debt logged**.
- **Validasi Gate**: Stage 4b **hanya untuk count mismatch logistik**. Unit rusak/temuan teknis harus lewat Stage 6.

---

#### Stage 4c: Penjadwalan Ulang / Reschedule (Delta)
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Menyusun jadwal riksa uji susulan untuk unit yang tertunda.
- **Input & Form**:
  - *Alasan Penjadwalan Ulang* (e.g., Unit belum siap, operasional pabrik berjalan, cuaca ekstrim, **client repair untuk Tidak Laik**).
  - *Tanggal Jadwal Baru RU Ulang*, *Jam Mulai*, *Disnaker Tujuan*.
  - *Smart Recommendation & Multi-Day Inspector Assignment* (antarmuka lengkap seperti Stage 3).
  - *Alat Uji & Sertifikat PJK3*.
  - **Loop Counter**: `reschedule_count` (default=0, increment each loop).
- **Validasi Gate**: 
  - **max_reschedule_count = 3**. Jika exceeded:
    - **Option A (Job Split)**: Auto-create child job for delayed units, parent job proceeds to Stage 5 with passing units only.
    - **Option B (Close as Failed)**: Job closed with final report, no SUKET for failed units, invoice for services rendered.
  - Decision requires **Kadiv/Manager approval**.

---

#### Stage 4d: Riksa Uji Ulang (Delta)
- **Penanggung Jawab (PIC)**: `INSPEKTUR`
- **Tujuan**: Pelaksanaan inspeksi ulang di lokasi untuk unit susulan **atau** unit `Tidak Laik` yang sudah diperbaiki klien.
- **Hasil Pengujian**:
  - `✅ Lolos Penuh` → **Lanjut ke Stage 5 (Penyusunan LHPP)**.
  - `❌ Gagal / Temuan Berulang` → **Looping kembali ke Stage 4c (Reschedule ulang)**, `reschedule_count` increment.
- **Catatan Khusus**: Stage ini menangani **dua skenario**:
  1. Reschedule dari Stage 4c (logistics delay)
  2. Retest dari Stage 6 `Tidak Laik` path (technical failure after client repair)

---

### FASE 2: LAPORAN TEKNIS & PROSES DINAS (Stage 5 – 9)

#### Stage 5: Penyusunan LHPP (Laporan Hasil Pemeriksaan dan Pengujian)
- **Penanggung Jawab (PIC)**: `TIM AHLI` / `PENANGGUNG JAWAB LAPORAN`
- **Tujuan**: Menyusun dokumen draft laporan teknis komprehensif.
- **3-Date Milestone Tracking**:
  1. *Tanggal Pembuatan Konsep LHPP*
  2. *Tanggal Review Internal Tim Ahli*
  3. *Tanggal Final Draft LHPP*
- **SLA & Lead Time**: Sistem secara otomatis mengukur durasi penyusunan laporan (target SLA ≤ 3 hari kerja).
- **Unit-Level Tracking**: Setiap unit dalam job memiliki `laik_status` = `Laik` | `Tidak Laik` | `Pending`. Job dapat proceed ke Stage 6 hanya jika **semua unit memiliki status**.

---

#### Stage 6: Review Laporan Teknis
- **Penanggung Jawab (PIC)**: `QC` / `MANAGER TEKNIS`
- **Tujuan**: Uji kelayakan teknis dan pengesahan laporan sebelum diajukan ke dinas.
- **Keputusan (THREE PATHS)**:
  - `Setuju - Laik (Approved)`: Semua unit `Laik` → **Lanjut ke Stage 7**.
  - `Tolak / Revisi`: Memberikan catatan revisi teknis → **Loopback kembali ke Stage 5**, `revision_count` increment.
  - `Tidak Laik`: Satu atau lebih unit tidak laik fungsi → **Diarahkan ke Stage 4c** untuk retest setelah client repair.
- **Validasi Gate**: 
  - **max_revision_count = 2**. Jika exceeded, requires **Kadiv/Manager approval** to proceed or close.
  - `Tidak Laik` path: Unit kembali ke klien untuk perbaikan, kemudian retest di Stage 4d. **SUKET withheld** sampai semua unit `Laik`.

---

#### Stage 7: Verifikasi ke Dinas / Pembentukan Batch
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Pengelompokan berkas (*Batching*) per wilayah Disnaker.
- **Aturan Batch**: 
  - Hanya unit yang sudah berstatus **Approved Laik** yang boleh dimasukkan ke dalam Batch pengajuan ke Disnaker.
  - Unit `Tidak Laik` **tidak masuk batch** — tetap di loop Stage 4c→4d→6 sampai `Laik`.
  - **Job Split Support**: Jika job split terjadi, child job memiliki `parent_job_id` dan berbagi nomor PO yang sama untuk audit trail.

---

#### Stage 8: Proses Disnaker
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Pengawasan proses evaluasi berkas oleh Pengawas K3 Disnaker Provinsi/Kabupaten.
- **Input**: Nomor Agenda Disnaker & Tanggal Pengajuan Berkas.
- **SLA**: **30 hari kalender** dari tanggal pengajuan.
  - **Day 31+**: System triggers **escalation alert** (Admin notifies Manager/Kadiv untuk follow-up dengan Disnaker).
  - **Note**: SLA adalah **internal target**, bukan hard gate — proses Disnaker di luar kontrol perusahaan.

---

#### Stage 9: Pengurusan SUKET (Surat Keterangan K3)
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Penerbitan SUKET resmi dan pencatatan masa berlaku.
- **Input & Durasi**:
  - *Nomor SUKET Resmi*
  - *Tanggal Input Berkas* vs *Tanggal Terbit SUKET* (Durasi SUKET = Terbit - Input).
  - Unggah Dokumen Asli Scan SUKET.
- **Validasi Gate**: **SUKET withheld** sampai:
  1. Semua unit dalam job berstatus `Laik`, **ATAU**
  2. Job split diimplementasikan — SUKET issued untuk passing units only, child job tetap open untuk delayed units.
  3. **No document debt** — semua dokumen yang di-bypass di Stage 2 sudah diunggah.

---

### FASE 3: INVOICE, PEMBAYARAN & PENUTUPAN (Stage 10 – 12)

#### Stage 10: Pembuatan Invoice
- **Penanggung Jawab (PIC)**: `FINANCE`
- **Tujuan**: Penerbitan faktur tagihan resmi ke klien.
- **Input Wajib**:
  - *Nomor Invoice*
  - *Total Nilai Tagihan (Rp)*
  - *Tanggal Terbit Invoice*
  - *Unggah Dokumen Faktur/Invoice (PDF)*
  - **parent_job_id** (jika job split, share PO number across splits untuk audit trail).

---

#### Stage 11: Penagihan Pembayaran
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Mengirim invoice ke klien dan menindaklanjuti status pembayaran sesuai *aging*.
- **Tracking Aging**: Peringatan otomatis jika invoice telah melebihi batas waktu (e.g., 14 / 30 hari).
- **SLA**: **30 hari kalender** dari tanggal invoice.
  - **Day 31+**: System triggers **aging alert** (Marketing notified untuk follow-up dengan klien).

---

#### Stage 11c: Verifikasi Pembayaran (Finance Gateway)
- **Penanggung Jawab (PIC)**: `FINANCE`
- **Tujuan**: *Hard-gate* validasi mutasi rekening dan pencatatan lunas.
- **Input Wajib**:
  - Status Pembayaran: `Lunas` | `Partial` | `Pending`
  - **Bank Statement / Mutasi Rekening Attachment** (mandatory audit trail).
  - `payment_retry_count` (auto-increment jika loop back ke Stage 11).
- **Keputusan Finance**:
  - **Kasus LUNAS (Verified)**:
    - Status menjadi `Verified`.
    - **Bank statement attachment mandatory**.
    - Mengaktifkan kunci gerbang untuk lanjut ke **Stage 11b (Kirim SUKET ke Klien)**.
  - **Kasus PENDING / PARTIAL (Belum Lunas)**:
    - Status dicatat `Partial` atau `Pending`.
    - **Looping kembali ke Stage 11** untuk penagihan ulang oleh Marketing (`payment_retry_count` bertambah +1).
- **Validasi Gate**: 
  - **max_payment_retry = 5**. Jika exceeded:
    - Auto-escalation: **Kadiv + Manager notified**.
    - **Freeze future jobs** untuk klien ini sampai payment resolved (optional, configurable).

---

#### Stage 11b: Pengiriman SUKET ke Klien
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Menyerahkan berkas fisik/digital SUKET resmi kepada klien.
- **Validasi Hard-Gate**: **DIBLOKIR** jika:
  1. Stage 11c belum berstatus `Verified (Lunas)`, **ATAU**
  2. Stage 11c belum ada **bank statement attachment**, **ATAU**
  3. Ada **document debt** dari Stage 2 bypass yang belum diunggah.
- **Bukti Serah Terima**: Unggah Resi Kurir / BAST (Berita Acara Serah Terima) bermeterai.

---

#### Stage 12: Selesai / Closed
- **Penanggung Jawab (PIC)**: `FINANCE` / `MANAGEMENT`
- **Kriteria Penutupan**:
  - 100% unit telah selesai diuji dan SUKET telah diserahkan.
  - Pembayaran telah 100% diverifikasi lunas.
  - Seluruh arsip dokumen (PO, BAP, LHPP, SUKET, BAST, Invoice, Bukti Bayar) tersimpan lengkap di database.
  - **No document debt** — semua dokumen yang di-bypass di Stage 2 sudah diunggah.
- **Reopen Rule**: 
  - Closed jobs dapat dibuka kembali **hanya oleh Kadiv / Manager Teknis / Superadmin**.
  - **Mandatory audit log**: Who reopened, When (timestamp), Why (mandatory text field), What changed post-reopen.
  - Reopen action logged separately untuk audit purposes.

---

## 3. Matriks Hak Akses (RBAC) & Proteksi Data

| Peran (Role) | Hak Akses Utama | Proteksi Nilai Finansial | Special Authority |
|---|---|---|---|
| **Superadmin** | Kontrol penuh seluruh stage, master data, konfigurasi user | Melihat nilai Rp | Reopen Stage 12, bypass any gate (logged) |
| **Marketing** | PIC Stage 1, 4b, 11, 11b; Edit info komersial & klien | Melihat nilai Rp | Input DP amount/percentage |
| **Admin** | PIC Stage 2, 3, 4c, 7, 8, 9; Penjadwalan & Disnaker | **Masking:** Nilai Rp disamarkan `Rp ***` | None |
| **Inspektur / Ahli K3** | PIC Stage 4, 4d, 5; Input hasil uji, BAP, & Draft LHPP | Masking nilai komersial | None |
| **QC / Manager Teknis** | PIC Stage 6; Review & Approval LHPP | Melihat ringkasan teknis | **max_revision_count override** (requires justification) |
| **Kepala Divisi / Manager Teknis** | Oversight all technical stages | Melihat ringkasan teknis | **Stage 2 bypass approval**, Stage 4c split/close decision, Stage 12 reopen |
| **Finance** | PIC Stage 10, 11c, 12; Input Invoice, Verifikasi Lunas | Melihat & mengelola seluruh transaksi | None |

---

## 4. Loop Controls & Escalation Matrix

| Loop Path | Max Count | Action on Exceed |
|---|---|---|
| Stage 4d → 4c (Reschedule) | 3 | Kadiv/Manager decides: Job Split or Close as Failed |
| Stage 6 → 5 (Revision) | 2 | Kadiv/Manager approval required to continue |
| Stage 6 → 4c (Tidak Laik retest) | 3 (same as reschedule) | Kadiv/Manager decides: Job Split or Close as Failed |
| Stage 11c → 11 (Payment retry) | 5 | Auto-escalate to Kadiv + Manager, optional freeze future jobs |

---

## 5. SLA & Aging Alerts

| Stage | SLA | Alert Trigger | Action |
|---|---|---|---|
| Stage 5 (LHPP) | ≤3 business days | Day 4 | Notify Tim Ahli + Manager |
| Stage 8 (Disnaker) | ≤30 calendar days | Day 31 | Admin notifies Manager/Kadiv for Disnaker follow-up |
| Stage 11 (Invoice) | ≤30 calendar days | Day 31 | Marketing notified for client follow-up |

---

## 6. Kasus Khusus & Skenario Lapangan

### Skenario A: Unit Rusak di Lapangan (Technical Finding)
1. Di Stage 4, Inspektur menandai 2 dari 5 unit sebagai `Temuan (Rusak)`.
2. Job **dialihkan ke Stage 6** (bukan 4b) dengan status `Tidak Laik` per unit.
3. QC di Stage 6 approves `Tidak Laik` → unit kembali ke klien untuk perbaikan.
4. Admin menjadwalkan retest di Stage 4c, Inspektur melakukan tes ulang di Stage 4d.
5. Setelah unit `Laik`, job lanjut ke Stage 5 untuk unit tersebut.
6. **Jika max_reschedule_count (3) exceeded**: Kadiv/Manager decides job split or close as failed.

### Skenario B: Unit Tidak Tersedia (Logistics Mismatch)
1. Di Stage 4, Inspektur melaporkan 3 dari 5 unit tersedia, 2 unit tidak ada di lokasi (klien lupa / operasional).
2. Job **dialihkan ke Stage 4b** (Marketing).
3. Marketing koordinasikan dengan klien: klien sepakat jadwalkan ulang untuk 2 unit tertunda.
4. Admin atur jadwal baru di Stage 4c, Inspektur tes di Stage 4d.
5. Setelah lolos, job lanjut ke Stage 5.

### Skenario C: Klien Hanya Membayar Uang Muka (DP)
1. Job dibuat dengan termin `DP`, Marketing input DP amount = 30%.
2. Di Stage 3, Surat Tugas **tidak dapat dicetak/dilanjutkan** sebelum Finance verifikasi DP ≥ 30% received.
3. Setelah DP diverifikasi, job dapat lanjut ke Stage 4.
4. Di akhir alur (Stage 11c), Finance memverifikasi pelunasan sisa tagihan + attach bank statement sebelum SUKET diserahkan (Stage 11b).

### Skenario D: Pembayaran Macet di Akhir
1. SUKET sudah terbit dari Disnaker (Stage 9) dan Invoice sudah dikirim (Stage 10-11).
2. Di Stage 11c, Finance mendapati pembayaran masih *Pending*.
3. Sistem secara otomatis **mengembalikan job ke Stage 11 (Marketing)** dengan status catatan penagihan dan menolak akses penyerahan SUKET di Stage 11b.
4. **Jika payment_retry_count reaches 5**: Auto-escalate to Kadiv + Manager, optional freeze future jobs for this client.

### Skenario E: Stage 2 Bypass dengan Document Debt
1. Admin di Stage 2 menemukan 2 dokumen belum lengkap (e.g., Drawing belum ada).
2. Kadiv/Manager Teknis approve bypass dengan justification: "Drawing akan diunggah klien dalam 7 hari".
3. System logs bypass: approver, timestamp, reason, tracks document-debt.
4. Job proceeds normally melalui pipeline.
5. **Di Stage 11b (SUKET delivery)**: System **blocks** delivery sampai dokumen yang di-bypass sudah diunggah.
6. Admin upload dokumen yang tertinggal, document-debt cleared, SUKET delivery unlocked.

### Skenario F: Job Split pada Reschedule Exceed
1. Job dengan 10 unit, 3 unit gagal berulang kali di Stage 4d (max_reschedule_count = 3 exceeded).
2. Kadiv/Manager putuskan **Job Split**:
   - Parent job: 7 unit passing → proceed to Stage 5, SUKET issued.
   - Child job: 3 unit failed → new job created with `parent_job_id` link, separate invoice tracking, same PO number.
3. Parent job closes normally (Stage 12).
4. Child job continues through 4c→4d loop independently.

---

## 7. Audit Trail Requirements

| Action | Logged Fields |
|---|---|
| Stage 2 Bypass | approver_name, timestamp, justification_text, documents_missing |
| Stage 4c Split/Close Decision | decision_maker, timestamp, decision (split/close), reason |
| Stage 6 Revision Override | approver_name, timestamp, revision_count_at_override, justification |
| Stage 11c Payment Verification | verifier_name, timestamp, status, bank_statement_attached (Y/N) |
| Stage 12 Reopen | reopener_name, timestamp, reason_text, changes_made_post_reopen |
| Document Upload (post-bypass) | uploader_name, timestamp, document_type, bypass_reference_id |

---

## 8. Changelog (v2.0)

| Change | Rationale |
|---|---|
| Split Stage 4 output into THREE paths (happy, count mismatch, technical finding) | Conflating logistics mismatch with technical failure created audit/compliance risk |
| Add max_reschedule_count=3, max_revision_count=2, max_payment_retry=5 | Prevent infinite loops, force escalation/decision |
| Stage 6 `Tidak Laik` → Stage 4c retest loop (withhold SUKET) | Clarify that failed units must be retested, not exit pipeline |
| Stage 2 bypass requires justification log + document-debt tracking | Prevent compliance time bomb — work can proceed but SUKET delivery blocked |
| Stage 11c requires bank statement attachment | Audit trail for payment verification, reduce fraud/error risk |
| Stage 12 reopen requires Kadiv/Manager/Superadmin + mandatory audit log | Operational flexibility with accountability |
| Add SLA table (Stage 5, 8, 11) with escalation alerts | Manage expectations, trigger follow-up actions |
| Add job-split logic with parent_job_id, shared PO number | Support partial deliveries without breaking audit trail |
| RBAC table updated: QC removed from Stage 2 bypass (only Kadiv/Manager) | Match stage-level spec, clarify authority |

---

## 9. Implementation Notes

1. **Schema Changes Required**:
   - Add `dp_amount` / `dp_percentage` to Stage 1
   - Add `reschedule_count`, `revision_count`, `payment_retry_count` counters
   - Add `laik_status` per unit (not just per job)
   - Add `parent_job_id`, `child_job_id` for job splits
   - Add `bypass_justification`, `document_debt_flag` to Stage 2
   - Add `bank_statement_attached` boolean to Stage 11c
   - Add `reopen_log` table (who, when, why, what changed)

2. **Configuration Thresholds**:
   - `dp_threshold_percentage` (default: 30%)
   - `max_reschedule_count` (default: 3)
   - `max_revision_count` (default: 2)
   - `max_payment_retry` (default: 5)
   - `sla_lhpp_days` (default: 3)
   - `sla_disnaker_days` (default: 30)
   - `sla_invoice_days` (default: 30)

3. **Alert Triggers**:
   - Stage 5 SLA exceed → notify Tim Ahli + Manager
   - Stage 8 SLA exceed → notify Manager/Kadiv for Disnaker follow-up
   - Stage 11 SLA exceed → notify Marketing
   - max_payment_retry exceed → notify Kadiv + Manager, optional freeze

---

**END OF SPECIFICATION**