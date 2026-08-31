# Panduan Pengguna (User Manual) DNP Riksa Uji Monitor

> **Sistem Versi:** DNP Monitor v2.0 Production
> **Target Pengguna:** Marketing, Admin, Inspektur Lapangan, Manager RU, Finance, Superadmin
> **Platform:** Web Desktop / Mobile Browser / Tablet

---

## 1. Matriks Otoritas & Tanggung Jawab Role

Setiap pengguna memiliki peran (role) dengan hak akses khusus yang mengendalikan alur kerja 12 Stage Riksa Uji:

| Peran (Role) | Tanggung Jawab Utama | Stage Yang Dikelola | Akses Fitur Utama |
|---|---|---|---|
| **Marketing** | Penginputan SPK/PO awal & penyerahan Suket ke Klien | **Stage 1, Stage 11** | `+ Job Baru`, Upload PO/SPK, Form Handover Suket |
| **Admin Teknis** | Verifikasi dokumen, penjadwalan, penyusunan LHPP, & pengurusan Suket | **Stage 2, 3, 5, 8, 9** | Checklist Verifikasi, Smart Recommendation, Input Matrix LHPP, EWS Disnaker |
| **Inspektur Lapangan** | Pelaksanaan riksa uji di lokasi proyek & unggah BAP | **Stage 4** | Mobile Checklist, Kamera Foto Lapangan, Generator Surat Tugas & Form (.docx) |
| **Manager / Kadiv RU** | Review teknis LHPP, pengesahan bypass, & submit Disnaker | **Stage 6, Stage 7** | Approve/Reject Review, Approval Bypass Stage 2, Bundel Disnaker |
| **Finance** | Penerbitan invoice, pemantauan TOP, & konfirmasi lunas | **Stage 10, Stage 12** | Enforced PDF Invoice Upload, Payment Settlement, Tutup Job (Closed) |
| **Superadmin** | Pengelolaan pengguna, permission matrix, & master data | **Semua Stage (1–12)** | User Management, Matrix Permission (`user_stage_permissions`), Master Inventory |

<div style="page-break-after: always;"></div>

## 2. Panduan Umum & Navigasi Antarmuka

### 2.1 Login & Keamanan Akun
- Akses aplikasi melalui tautan resmi yang diberikan oleh administrator.
- Gunakan email dan password yang telah didaftarkan.
- Pastikan selalu melakukan **Logout** (lewat menu profil di pojok kanan atas) setelah selesai menggunakan sistem, terutama di perangkat publik.

### 2.2 Dashboard & Notifikasi
- **Dashboard KPI:** Menampilkan statistik pekerjaan aktif, job yang melewati SLA Disnaker, dan total pendapatan.
- **Toggle View:** Gunakan tombol **Kanban View** (tampilan papan) atau **List View** (tampilan tabel) sesuai kenyamanan Anda.
- **Pekerjaan Saya vs Semua Job:** Untuk Manager/Superadmin, toggle ini berguna memfilter job spesifik vs keseluruhan.
- **Notifikasi (Ikon Lonceng):** Sistem akan memberikan alert jika ada dokumen masuk, penolakan (reject), atau SLA yang mendekati batas waktu.

<div style="page-break-after: always;"></div>

## 3. Modul Role: MARKETING (Stage 1 & Stage 11)

### Stage 1: Pembuatan Job Baru (PO / SPK)
Marketing adalah gerbang utama aplikasi. Tidak ada job yang bisa dimulai tanpa inisiasi dari Marketing.

**Langkah-langkah Pembuatan Job:**
1. Klik tombol **`+ Job Baru`** di menu samping (sidebar).
2. Isi kelengkapan data klien, pilih **Lokasi** (dropdown otomatis dari 514 Kota/Kabupaten).
3. Masukkan jumlah unit, **Nilai Kontrak (tanpa PPN)**, dan rincian PIC klien.
4. **Unggah Dokumen Syarat Awal.**

> [!IMPORTANT]
> **Dokumen Wajib Stage 1:** Anda wajib mengunggah minimal 1 dokumen (Scan PO/SPK, Surat Permohonan, atau Surat Kuasa) sebelum job bisa dilanjutkan ke Stage 2.

### Stage 11: Penyerahan Suket ke Klien
Setelah proses Disnaker dan Penagihan Finance selesai, Marketing menyerahkan Suket (Surat Keterangan) fisik kepada Klien.

1. Buka Job yang berada di **Stage 11**.
2. Masukkan **Tanggal Penyerahan** ke Klien.
3. Unggah bukti **Tanda Terima Suket** yang sudah ditandatangani.
4. Klik **`Lanjutkan ke Stage 12`**.

<div style="page-break-after: always;"></div>

## 4. Modul Role: ADMIN (Stage 2, 3, 5, 8, 9)

### Stage 2: Verifikasi Dokumen
Verifikasi dokumen yang telah diunggah oleh Marketing.
- Klik tombol **`OK`**, **`Tidak`**, atau **`NA`** pada checklist digital.
- Jika dokumen belum lengkap, sistem akan menahan job di Stage 2.
- **Bypass Approval:** Jika mendesak, klik tombol **`Request Bypass Manager`** untuk meminta izin lanjut ke Stage 3 dari Kadiv RU.

### Stage 3: Penjadwalan
1. Masukkan **Tanggal Pelaksanaan**, **Jam**, **Durasi**, dan target **Disnaker**.
2. Pilih Inspektur (Gunakan tombol **Rekomendasi Inspektur** untuk pencocokan otomatis berdasarkan SKP aktif).
3. Pilih Alat Uji dari inventaris dan Sertifikat PJK3.
4. Pastikan melakukan Submit Surat Pemberitahuan (H-5) dan catat di sistem.

### Stage 5: Penyusunan LHPP
1. Isi matriks evaluasi per unit: Pilih Status Kelaikan (`laik`, `laik_bersyarat`, `tidak_laik`).
2. Tuliskan Temuan Teknis dan Rekomendasi per unit.
3. Unggah dokumen **LHPP (PDF)** dan **BAP**.
4. Klik **`Lanjutkan ke Stage 6`**.

### Stage 8 & 9: Proses Disnaker & Pengurusan Suket
- **Stage 8 (SLA EWS 30 Hari):** Pantau status SLA (Warna Merah jika Overdue). Lakukan follow-up rutin maksimal setiap 7 hari dan catat di menu **Tambah Log Follow-Up**.
- **Stage 9:** Masukkan Nomor Suket, Tanggal Terbit, dan Bulan Berlaku. Sistem akan otomatis menghitung tanggal kadaluarsa (Expired Date) dan memunculkan notifikasi H-90.

<div style="page-break-after: always;"></div>

## 5. Modul Role: INSPEKTUR LAPANGAN (Stage 4)

Aplikasi dirancang responsif untuk diakses via handphone/tablet saat berada di lokasi proyek.

> [!TIP]
> Gunakan kamera HP Anda secara langsung pada tombol Upload Foto untuk memudahkan dokumentasi lapangan.

### Prosedur Pelaksanaan (Stage 4)
1. **Verifikasi Jumlah Unit Aktual:**
   Hitung jumlah unit di lapangan. Masukkan ke kolom `Jumlah Unit Aktual`.
   > [!WARNING]
   > Jika unit aktual berbeda dengan kontrak (misal: kontrak 3, di lapangan 2), klik tombol **`Kembalikan ke Stage 1`**. Marketing harus merevisi nilai kontrak/PO terlebih dahulu!
2. **Checklist Digital:** Centang status pemeriksaan (Nameplate, Visual, Fungsi Pengaman, dll).
3. **Download Dokumen Lapangan (.docx):**
   Gunakan tombol **`Download Surat Tugas`** dan **`Download Form Riksa Uji`** untuk mencetak otomatis dokumen pelaksanaan yang sudah terisi nama klien, lokasi, dan tim inspektur.
4. **Unggah BAP:** Pastikan BAP telah ditandatangani Klien di lapangan lalu unggah ke sistem.

<div style="page-break-after: always;"></div>

## 6. Modul Role: MANAGER / KADIV RU (Stage 6 & Stage 7)

Manager memegang otoritas review dan keputusan teknis akhir sebelum diserahkan ke instansi (Disnaker).

### Stage 6: Review Laporan Teknis
- Periksa LHPP yang disusun oleh Admin.
- Pilih Keputusan Review: **Approved**, **Approved Conditional**, atau **Rejected**.
- Jika **Rejected**, masukkan catatan revisi dan Job akan otomatis dikembalikan ke Stage 5.

### Stage 7: Penyerahan Bundel ke Disnaker
- Pastikan kelengkapan fisik bundel dokumen (Grup A dari klien, Grup B dari internal PJK3).
- Masukkan **Tanggal Submit Disnaker**. Tanggal ini adalah argo mulainya SLA 30 Hari (Stage 8).

<div style="page-break-after: always;"></div>

## 7. Modul Role: FINANCE (Stage 10 & Stage 12)

Finance bertanggung jawab atas penerbitan invoice dan penyelesaian akhir (Closed Job).

### Stage 10: Penagihan (Invoicing)
1. Masukkan Nilai Tagihan (termasuk PPN) dan Nomor Invoice.
2. Tentukan Tanggal Jatuh Tempo melalui input **TOP (Terms of Payment) Days**.
3. **Unggah Invoice:**
   > [!IMPORTANT]
   > Sistem secara tegas menolak format apapun selain PDF. Unggah Invoice wajib dalam format **.PDF**.

### Stage 12: Lunas & Penutupan Job
1. Setelah Klien membayar, masuk ke Panel Stage 12.
2. Aktifkan toggle **Lunas (Paid)**.
3. Masukkan nominal yang diterima dan tanggal pembayaran.
4. Unggah **Bukti Transfer**.
5. Klik **`Tutup Job (Closed)`**. Status Job akan selesai permanen.

<div style="page-break-after: always;"></div>

## 8. Modul Khusus: SUPERADMIN & PENGELOLAAN MASTER DATA

Superadmin dan Admin memiliki akses ke menu **Alat & SKP** dan **User Management** untuk menjaga kelancaran operasional.

### 8.1 Manajemen Inventaris Alat Uji (23 Tool Items)
- **Monitoring Kalibrasi:** Perhatikan lencana masa berlaku kalibrasi. Lencana berwarna kuning menunjukkan H-30 kalibrasi berakhir.
- **Tambah / Edit Alat:** Masukkan nama alat, merk, tipe, nomor seri, tanggal kalibrasi, dan upload sertifikat kalibrasi.

### 8.2 Sertifikat PJK3 SK Kemnaker
- Daftarkan SK PJK3 resmi perusahaan lengkap dengan kategori pesawat K3 dan tanggal kadaluarsa SK.

### 8.3 Template Dokumen Master (.docx)
- Sistem menyusun template Word secara otomatis menggunakan pengurutan alami (natural sorting) berdasarkan `kode_form`.
- Admin dapat mengunduh atau mengunggah pembaruan template `.docx` yang berisi placeholder tag (seperti `${KODE_JOB}`, `${NAMA_KLIEN}`).

### 8.4 User Management & Permission Matrix
- Buka menu **User Management** di sidebar.
- Klik tombol **`Edit Permission`** pada baris pengguna untuk mengatur matriks `user_stage_permissions`. Matriks ini menentukan stage mana saja yang dapat dibuka dan diubah oleh pengguna tersebut.

<div style="page-break-after: always;"></div>

## 9. Troubleshooting & FAQ (Tanya Jawab Kendala Populer)

**Q: Mengapa tombol "Lanjutkan Stage" berwarna abu-abu dan tidak bisa diklik?**
A: Pastikan semua form input yang berstatus *Wajib (Required)* sudah terisi dan dokumen wajib di stage tersebut (seperti PO/SPK di Stage 1, atau Invoice di Stage 10) sudah terunggah sempurna.

**Q: Bagaimana jika saat Inspektur ke lapangan, jumlah alatnya tambah/kurang?**
A: Di Stage 4, ketika Inspektur memasukkan angka aktual yang berbeda dengan unit kontrak, akan muncul tombol **`Kembalikan ke Stage 1`**. Klik tombol tersebut. Job akan ditarik mundur agar Marketing bisa mengupdate nilai PO.

**Q: Saya Admin, dokumen klien belum lengkap tapi jadwal sudah mendesak. Apa yang harus saya lakukan?**
A: Buka Stage 2, klik tombol **`Request Bypass Manager`**. Manager Anda akan menerima notifikasi untuk menyetujui pembebasan syarat sementara.

**Q: Di mana saya bisa memperbarui masa berlaku Kalibrasi Alat Uji?**
A: Buka menu **Alat & SKP** di sidebar. Pilih tab **Inventaris Alat Uji**, lalu klik **Edit** pada alat yang dimaksud untuk memperbarui tanggal kalibrasinya.

**Q: Mengapa file Invoice ditolak saat diunggah oleh Finance?**
A: Sistem memberlakukan validasi ketat format `.pdf`. Pastikan file invoice Anda disimpan/diexport sebagai file PDF dan ukurannya di bawah 10 MB.

<div style="page-break-after: always;"></div>

## 10. Glosarium Istilah (Glossary)

| Istilah | Kepanjangan / Pengertian |
|---|---|
| **Riksa Uji** | Pemeriksaan dan Pengujian Teknis K3 pada pesawat/alat produksi sesuai regulasi Kemnaker. |
| **PO / SPK** | *Purchase Order* / Surat Perintah Kerja dari Klien sebagai dasar dimulainya pekerjaan. |
| **LHPP** | Laporan Hasil Pemeriksaan dan Pengujian (Dokumen teknis hasil riksa uji). |
| **BAP** | Berita Acara Pemeriksaan (Bukti fisik pemeriksaan di lapangan yang ditandatangani Klien). |
| **Suket** | Surat Keterangan Kelaikan K3 yang diterbitkan oleh Dinas Tenaga Kerja (Disnaker). |
| **PJK3** | Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PT Delta Nusantara Persada). |
| **SKP K3** | Surat Keputusan Penunjukan Ahli K3 / Inspektur dari Kementerian Ketenagakerjaan. |
| **EWS** | *Early Warning System* (Notifikasi otomatis untuk SLA Disnaker & Kadaluarsa Suket/Kalibrasi). |
| **TOP** | *Terms of Payment* (Jangka waktu pembayaran tagihan/invoice dalam hitungan hari). |

