# DNP Monitor — End-to-End Job Pipeline & Workflow Specification

Dokumen ini menjelaskan alur operasional pekerjaan (**Job Pipeline**) sistem monitoring Riksa Uji PT Delta Nusantara Persada dari **Stage 1 (PO Masuk)** sampai **Stage 12 (Selesai/Closed)** beserta seluruh percabangan loopback, peran (RBAC), dokumen wajib, dan validasi *hard-gate*.

---

## 1. Ringkasan Pipeline (17 Stages)

```mermaid
flowchart TD
    S1["Stage 1: PO / SPK (Marketing)"] --> S2["Stage 2: Verifikasi Dokumen (Admin)"]
    S2 --> S3["Stage 3: Penjadwalan & Surat Tugas (Admin/Ops)"]
    S3 --> S4["Stage 4: Pelaksanaan RU (Inspektur)"]

    %% Split Rework Lapangan
    S4 -->|Unit Sesuai Penuh| S5["Stage 5: Penyusunan LHPP (Tim Ahli)"]
    S4 -->|Selisih Unit / Temuan Rusak| S4b["Stage 4b: Aktualisasi Unit (Marketing)"]
    S4b -->|Reschedule RU Ulang| S4c["Stage 4c: Penjadwalan Ulang (Admin)"]
    S4b -->|Bypass Unit Awal| S5
    S4c --> S4d["Stage 4d: Riksa Uji Ulang (Inspektur)"]
    S4d -->|Lolos Penuh| S5
    S4d -->|Gagal / Temuan Berulang| S4c

    %% Fase Laporan & Dinas
    S5 --> S6["Stage 6: Review Laporan Teknis (QC / Mgr)"]
    S6 -->|Revisi Teknis| S5
    S6 -->|Approved (Laik/Tidak Laik)| S7["Stage 7: Verifikasi ke Dinas / Batch (Admin)"]
    S7 --> S8["Stage 8: Proses Disnaker (Admin)"]
    S8 --> S9["Stage 9: Pengurusan SUKET (Admin)"]

    %% Fase Keuangan & Delivery
    S9 --> S10["Stage 10: Pembuatan Invoice (Finance)"]
    S10 --> S11["Stage 11: Penagihan Pembayaran (Marketing)"]
    S11 --> S11c["Stage 11c: Verifikasi Pembayaran (Finance)"]
    S11c -->|Belum Lunas / Partial| S11
    S11c -->|LUNAS (Verified)| S11b["Stage 11b: Kirim SUKET ke Klien (Marketing)"]
    S11b --> S12["Stage 12: Selesai / Closed (Finance)"]
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
  - Skema Termin Pembayaran: `DP` (Down Payment) atau `FULL` (Pelunasan Belakang).
  - Nomor Seri Alat (Wajib untuk kategori *Listrik* dan *Kebakaran*).
- **Dokumen Diunggah**: File PO / SPK / Surat Permohonan Klien.
- **Validasi Gate**: Minimal 1 dokumen terunggah & termin pembayaran terdefinisi.

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
- **Validasi Gate**: Semua dokumen lengkap **ATAU** mendapat *Approval Bypass* dari Kepala Divisi / Manager Teknis.

---

#### Stage 3: Penjadwalan & Surat Tugas
- **Penanggung Jawab (PIC)**: `ADMIN` / `OPERATIONAL`
- **Tujuan**: Menentukan tanggal inspeksi lapangan, menugaskan Tim Ahli K3 (Inspektur), memilih Penanggung Jawab Laporan, dan memilih Alat Uji/Sertifikat PJK3.
- **Fitur Khusus**:
  - **Smart Recommendation Engine**: Rekomendasi otomatis 3 kandidat teratas berdasarkan bobot:
    - *Spesialisasi Cocok (+40)*
    - *Domisili Terdekat (+20)*
    - *Pengalaman di Klien/Alat Serupa (+10)*
    - *Beban Kerja Aktif* (-20 jika $\ge 4$ job aktif $\rightarrow$ status `Overload`).
    - *Filter Otomatis*: Menyaring keluar personil yang SKP-nya sudah expired atau status non-aktif.
  - **Multi-Day Scheduling**: Pengaturan penugasan inspektur per hari (Hari 1, Hari 2, dst).
  - **DP Hard-Gate**: Jika termin = `DP`, Surat Tugas **diblokir** sampai verifikasi DP lunas oleh Finance.
- **Output**: Surat Tugas diterbitkan, Disnaker Tujuan tercatat, personil & alat uji teralokasi.

---

#### Stage 4: Pelaksanaan RU (Riksa Uji Lapangan)
- **Penanggung Jawab (PIC)**: `INSPEKTUR` / `TIM AHLI`
- **Tujuan**: Melakukan pemeriksaan fisik dan pengujian alat K3 di lokasi klien.
- **Input & Bukti**:
  - Input: *Jumlah Alat yang Benar-benar Diperiksa*.
  - Status per unit: `Sesuai` atau `Temuan` (catatan kerusakan/ketidaksesuaian).
  - Foto Dokumentasi Wajib:
    1. *Foto Keberangkatan*
    2. *Foto Sampai Lokasi Riksauji*
    3. *Foto Kepulangan*
    4. *Foto BAP Lapangan (Berita Acara)*
- **Percabangan Kasus**:
  - **Kasus A (Sesuai Penuh)**: Jumlah diperiksa = total unit dan semua unit lolos $\rightarrow$ **Lanjut ke Stage 5**.
  - **Kasus B (Selisih Unit / Temuan Rusak)**: Jumlah unit di lapangan kurang dari PO atau ada unit rusak $\rightarrow$ **Diarahkan ke Stage 4b (Aktualisasi Unit)**.

---

#### Stage 4b: Aktualisasi Unit (Delta)
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Rekonsiliasi komersial jika jumlah unit riil lapangan berbeda dengan kontrak awal.
- **Aksi Marketing**:
  - Menyesuaikan *Jumlah Unit Baru* dan *Nilai Kontrak/Invoice* jika klien sepakat mengurangi/menambah unit.
  - Opsi:
    1. **Jadwalkan Ulang (Stage 4c)**: Untuk sisa unit yang belum teruji / rusak.
    2. **Bypass ke Stage 5**: Jika unit yang ada langsung diterbitkan laporan apa adanya.

---

#### Stage 4c: Penjadwalan Ulang / Reschedule (Delta)
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Menyusun jadwal riksa uji susulan untuk unit yang tertunda.
- **Input & Form**:
  - *Alasan Penjadwalan Ulang* (e.g. Unit belum siap, operasional pabrik berjalan, cuaca ekstrim).
  - *Tanggal Jadwal Baru RU Ulang*, *Jam Mulai*, *Disnaker Tujuan*.
  - *Smart Recommendation & Multi-Day Inspector Assignment* (antarmuka lengkap seperti Stage 3).
  - *Alat Uji & Sertifikat PJK3*.

---

#### Stage 4d: Riksa Uji Ulang (Delta)
- **Penanggung Jawab (PIC)**: `INSPEKTUR`
- **Tujuan**: Pelaksanaan inspeksi ulang di lokasi untuk unit susulan.
- **Hasil Pengujian**:
  - `✅ Lolos Penuh` $\rightarrow$ **Lanjut ke Stage 5 (Penyusunan LHPP)**.
  - `❌ Gagal / Temuan Berulang` $\rightarrow$ **Looping kembali ke Stage 4c (Reschedule ulang)**.

---

### FASE 2: LAPORAN TEKNIS & PROSES DINAS (Stage 5 – 9)

#### Stage 5: Penyusunan LHPP (Laporan Hasil Pemeriksaan dan Pengujian)
- **Penanggung Jawab (PIC)**: `TIM AHLI` / `PENANGGUNG JAWAB LAPORAN`
- **Tujuan**: Menyusun dokumen draft laporan teknis komprehensif.
- **3-Date Milestone Tracking**:
  1. *Tanggal Pembuatan Konsep LHPP*
  2. *Tanggal Review Internal Tim Ahli*
  3. *Tanggal Final Draft LHPP*
- **SLA & Lead Time**: Sistem secara otomatis mengukur durasi penyusunan laporan (target SLA $\le 3$ hari kerja).

---

#### Stage 6: Review Laporan Teknis
- **Penanggung Jawab (PIC)**: `QC` / `MANAGER TEKNIS`
- **Tujuan**: Uji kelayakan teknis dan pengesahan laporan sebelum diajukan ke dinas.
- **Keputusan**:
  - `Setuju (Approved)`: Menentukan status kelayakan alat (`Laik` atau `Tidak Laik`) $\rightarrow$ **Lanjut ke Stage 7**.
  - `Tolak / Revisi`: Memberikan catatan revisi teknis $\rightarrow$ **Loopback kembali ke Stage 5**.

---

#### Stage 7: Verifikasi ke Dinas / Pembentukan Batch
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Pengelompokan berkas (*Batching*) per wilayah Disnaker.
- **Aturan Batch**: Hanya unit yang sudah berstatus **Approved LHPP** yang boleh dimasukkan ke dalam Batch pengajuan ke Disnaker.

---

#### Stage 8: Proses Disnaker
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Pengawasan proses evaluasi berkas oleh Pengawas K3 Disnaker Provinsi/Kabupaten.
- **Input**: Nomor Agenda Disnaker & Tanggal Pengajuan Berkas.

---

#### Stage 9: Pengurusan SUKET (Surat Keterangan K3)
- **Penanggung Jawab (PIC)**: `ADMIN`
- **Tujuan**: Penerbitan SUKET resmi dan pencatatan masa berlaku.
- **Input & Durasi**:
  - *Nomor SUKET Resmi*
  - *Tanggal Input Berkas* vs *Tanggal Terbit SUKET* (Durasi SUKET = Terbit - Input).
  - Unggah Dokumen Asli Scan SUKET.

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

---

#### Stage 11: Penagihan Pembayaran
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Mengirim invoice ke klien dan menindaklanjuti status pembayaran sesuai *aging*.
- **Tracking Aging**: Peringatan otomatis jika invoice telah melebihi batas waktu (e.g. 14 / 30 hari).

---

#### Stage 11c: Verifikasi Pembayaran (Finance Gateway)
- **Penanggung Jawab (PIC)**: `FINANCE`
- **Tujuan**: *Hard-gate* validasi mutasi rekening dan pencatatan lunas.
- **Keputusan Finance**:
  - **Kasus LUNAS (Verified)**:
    - Status menjadi `Verified`.
    - Mengaktifkan kunci gerbang untuk lanjut ke **Stage 11b (Kirim SUKET ke Klien)**.
  - **Kasus PENDING / PARTIAL (Belum Lunas)**:
    - Status dicatat `Partial` atau `Pending`.
    - **Looping kembali ke Stage 11** untuk penagihan ulang oleh Marketing (`payment_retry_count` bertambah +1).

---

#### Stage 11b: Pengiriman SUKET ke Klien
- **Penanggung Jawab (PIC)**: `MARKETING`
- **Tujuan**: Menyerahkan berkas fisik/digital SUKET resmi kepada klien.
- **Validasi Hard-Gate**: **DIBLOKIR** jika Stage 11c belum berstatus `Verified (Lunas)`.
- **Bukti Serah Terima**: Unggah Resi Kurir / BAST (Berita Acara Serah Terima) bermeterai.

---

#### Stage 12: Selesai / Closed
- **Penanggung Jawab (PIC)**: `FINANCE` / `MANAGEMENT`
- **Kriteria Penutupan**:
  - 100% unit telah selesai diuji dan SUKET telah diserahkan.
  - Pembayaran telah 100% diverifikasi lunas.
  - Seluruh arsip dokumen (PO, BAP, LHPP, SUKET, BAST, Invoice, Bukti Bayar) tersimpan lengkap di database.

---

## 3. Matriks Hak Akses (RBAC) & Proteksi Data

| Peran (Role) | Hak Akses Utama | Proteksi Nilai Finansial |
|---|---|---|
| **Superadmin** | Kontrol penuh seluruh stage, master data, konfigurasi user | Melihat nilai Rp |
| **Marketing** | PIC Stage 1, 4b, 11, 11b; Edit info komersial & klien | Melihat nilai Rp |
| **Admin** | PIC Stage 2, 3, 4c, 7, 8, 9; Penjadwalan & Disnaker | **Masking:** Nilai Rp disamarkan `Rp ***` |
| **Inspektur / Ahli K3** | PIC Stage 4, 4d, 5; Input hasil uji, BAP, & Draft LHPP | Masking nilai komersial |
| **QC / Manager Teknis** | PIC Stage 6; Review & Approval LHPP, Bypass Stage 2 | Melihat ringkasan teknis |
| **Finance** | PIC Stage 10, 11c, 12; Input Invoice, Verifikasi Lunas | Melihat & mengelola seluruh transaksi |

---

## 4. Kasus Khusus & Skenario Lapangan

### Skenario A: Unit Rusak di Lapangan
1. Di Stage 4, Inspektur menandai 2 dari 5 unit sebagai `Temuan (Rusak)`.
2. Job otomatis dialihkan ke Stage 4b (Marketing).
3. Marketing berkoordinasi dengan Klien dan memilih **Stage 4c (Jadwalkan Ulang)**.
4. Admin mengatur tanggal baru dan menugaskan tim di Stage 4c.
5. Inspektur melakukan tes ulang di Stage 4d. Setelah lolos, job lanjut ke Stage 5.

### Skenario B: Klien Hanya Membayar Uang Muka (DP)
1. Job dibuat dengan termin `DP`.
2. Di Stage 3, Surat Tugas **tidak dapat dicetak/dilanjutkan** sebelum verifikasi DP oleh Finance.
3. Setelah DP diverifikasi, job dapat lanjut ke Stage 4.
4. Di akhir alur (Stage 11c), Finance memverifikasi pelunasan sisa tagihan sebelum SUKET diserahkan (Stage 11b).

### Skenario C: Pembayaran Macet di Akhir
1. SUKET sudah terbit dari Disnaker (Stage 9) dan Invoice sudah dikirim (Stage 10-11).
2. Di Stage 11c, Finance mendapati pembayaran masih *Pending*.
3. Sistem secara otomatis **mengembalikan job ke Stage 11 (Marketing)** dengan status catatan penagihan dan menolak akses penyerahan SUKET di Stage 11b.
