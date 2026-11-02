# PT DELTA NUSANTARA PERSADA
### Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)

<br /><br />

# DNP MONITOR
## Sistem Informasi Pemantauan Riksa Uji K3

<br />

### BUKU PANDUAN PENGGUNA (USER GUIDE)

<br /><br />

**Tautan Aplikasi:** [https://monitor-dnp.deltaindo.co.id/](https://monitor-dnp.deltaindo.co.id/)  
**Versi Sistem:** 2.4 Production  
**Tanggal Rilis:** November 2026  
**Sasaran Pembaca:** Marketing, Admin Teknis, Tim Ahli / Inspektur Lapangan, Kadiv RU, Finance  

<!-- PAGE_BREAK: COVER -->

# Daftar Isi

- [Daftar Isi](#daftar-isi)
- [Daftar Gambar](#daftar-gambar)
- [Daftar Tabel](#daftar-tabel)
- [1. Pendahuluan](#1-pendahuluan)
  - [1.1 Ringkasan Aplikasi](#11-ringkasan-aplikasi)
  - [1.2 Alur 12 Tahapan Riksa Uji](#12-alur-12-tahapan-riksa-uji)
  - [1.3 Peran Pengguna (Role)](#13-peran-pengguna-role)
- [2. Akses Aplikasi dan Login](#2-akses-aplikasi-dan-login)
  - [2.1 Alamat Website](#21-alamat-website)
  - [2.2 Cara Masuk ke Akun](#22-cara-masuk-ke-akun)
  - [2.3 Menu Utama dan Navigasi](#23-menu-utama-dan-navigasi)
  - [2.4 Cara Keluar Akun (Logout)](#24-cara-keluar-akun-logout)
- [3. Halaman Dashboard](#3-halaman-dashboard)
  - [3.1 Ringkasan Angka Kinerja](#31-ringkasan-angka-kinerja)
  - [3.2 Grafik Beban Kerja Lintas Tahapan](#32-grafik-beban-kerja-lintas-tahapan)
  - [3.3 Peringatan Waktu Dinas (Overdue)](#33-peringatan-waktu-dinas-overdue)
- [4. Papan Kanban (Kanban Board)](#4-papan-kanban-kanban-board)
  - [4.1 Tampilan Kolom Tahapan](#41-tampilan-kolom-tahapan)
  - [4.2 Membaca Kartu Pekerjaan](#42-membaca-kartu-pekerjaan)
  - [4.3 Membuka Lembar Rincian (Job Detail Sheet)](#43-membuka-lembar-rincian-job-detail-sheet)
- [5. Halaman Daftar Job](#5-halaman-daftar-job)
  - [5.1 Tampilan Tabel Pekerjaan](#51-tampilan-tabel-pekerjaan)
  - [5.2 Pencarian dan Penyaringan Data](#52-pencarian-dan-penyaringan-data)
- [6. Pendaftaran Pekerjaan Baru (+ Job Baru)](#6-pendaftaran-pekerjaan-baru--job-baru)
  - [6.1 Membuka Formulir Job Baru](#61-membuka-formulir-job-baru)
  - [6.2 Mengisi Data Order dan Klien](#62-mengisi-data-order-dan-klien)
  - [6.3 Menghitung Pajak dengan Kalkulator PPN 12%](#63-menghitung-pajak-dengan-kalkulator-ppn-12)
  - [6.4 Memilih Jadwal dan Mengunggah Berkas PO](#64-memilih-jadwal-dan-mengunggah-berkas-po)
  - [6.5 Tabel Keterangan Isian Formulir](#65-tabel-keterangan-isian-formulir)
- [7. Petunjuk Operasional Tiap Tahap (Stage 1 – 12)](#7-petunjuk-operasional-tiap-tahap-stage-1--12)
  - [7.1 Pengenalan Panel Job Detail Sheet](#71-pengenalan-panel-job-detail-sheet)
  - [7.2 Stage 1: PO / SPK dan Kelengkapan Awal](#72-stage-1-po--spk-dan-kelengkapan-awal)
  - [7.3 Stage 2: Verifikasi Berkas dan Izin Bypass](#73-stage-2-verifikasi-berkas-dan-izin-bypass)
  - [7.4 Stage 3: Penjadwalan, Ahli K3, dan Cetak Surat Tugas](#74-stage-3-penjadwalan-ahli-k3-dan-cetak-surat-tugas)
  - [7.5 Stage 4: Pemeriksaan Lapangan dan Unggah BAP](#75-stage-4-pemeriksaan-lapangan-dan-unggah-bap)
  - [7.6 Penanganan Perbedaan Jumlah Unit Lapangan (Stage 4b)](#76-penanganan-perbedaan-jumlah-unit-lapangan-stage-4b)
  - [7.7 Stage 5: Penyusunan LHPP dan Tautan Multi-Unit](#77-stage-5-penyusunan-lhpp-dan-tautan-multi-unit)
  - [7.8 Stage 6: Pemeriksaan Teknis oleh Kadiv RU](#78-stage-6-pemeriksaan-teknis-oleh-kadiv-ru)
  - [7.9 Stage 7: Penyerahan Bundel Berkas ke Disnaker](#79-stage-7-penyerahan-bundel-berkas-ke-disnaker)
  - [7.10 Stage 8: Pengawalan Proses Dinas dan Log Kendala](#710-stage-8-pengawalan-proses-dinas-dan-log-kendala)
  - [7.11 Stage 9: Penerimaan dan Pencatatan Nomor Suket](#711-stage-9-penerimaan-dan-pencatatan-nomor-suket)
  - [7.12 Stage 10: Penerbitan Tagihan Invoice dan Faktur Pajak](#712-stage-10-penerbitan-tagihan-invoice-dan-faktur-pajak)
  - [7.13 Stage 11: Penyerahan Fisik Suket ke Klien](#713-stage-11-penyerahan-fisik-suket-ke-klien)
  - [7.14 Stage 11b: Konfirmasi Pelunasan Pembayaran](#714-stage-11b-konfirmasi-pelunasan-pembayaran)
  - [7.15 Stage 12: Penutupan Pekerjaan (Closed Job)](#715-stage-12-penutupan-pekerjaan-closed-job)
- [8. Modul Pendukung dan Administrasi](#8-modul-pendukung-dan-administrasi)
  - [8.1 Modul Pelaporan](#81-modul-pelaporan)
  - [8.2 Modul Pengingat (Reminder Suket & SKP)](#82-modul-pengingat-reminder-suket--skp)
  - [8.3 Modul Inventaris Alat dan SKP](#83-modul-inventaris-alat-dan-skp)
  - [8.4 Modul Pengaturan Pengguna (Users)](#84-modul-pengaturan-pengguna-users)
- [9. Kendala Pengguna dan Tanya Jawab (FAQ)](#9-kendala-pengguna-dan-tanya-jawab-faq)
  - [9.1 Pertanyaan yang Sering Diajukan](#91-pertanyaan-yang-sering-diajukan)
  - [9.2 Saluran Bantuan](#92-saluran-bantuan)

<!-- PAGE_BREAK: DAFTAR_ISI -->

# Daftar Gambar

- **Gambar 1.** Halaman Masuk Akun (Login)
- **Gambar 2.** Tampilan Halaman Dashboard dan Angka Kinerja
- **Gambar 3.** Tampilan Papan Kerja Visual (Kanban Board)
- **Gambar 4.** Halaman Daftar Job dalam Bentuk Tabel
- **Gambar 5.** Formulir Pembuatan Job Baru (+ Job Baru)
- **Gambar 6.** Tampilan Panel Lembar Rincian (Job Detail Sheet)
- **Gambar 7.** Panel Formulir Stage 1 (PO/SPK)
- **Gambar 8.** Panel Formulir Stage 2 (Verifikasi Berkas)
- **Gambar 9.** Panel Formulir Stage 3 (Penjadwalan & Ahli K3)
- **Gambar 10.** Panel Formulir Stage 4 (Pemeriksaan Lapangan & BAP)
- **Gambar 11.** Panel Formulir Stage 5 (Evaluasi Unit & Berkas LHPP)
- **Gambar 12.** Panel Formulir Stage 6 (Review Teknis Kadiv RU)
- **Gambar 13.** Panel Formulir Stage 8 (Pengawalan Proses Disnaker)
- **Gambar 14.** Panel Formulir Stage 10 (Tagihan Invoice & Faktur Pajak)
- **Gambar 15.** Halaman Pelaporan dan Ekspor Data
- **Gambar 16.** Halaman Pengingat Dokumen (Reminder Suket & SKP)
- **Gambar 17.** Halaman Inventaris Alat Uji Lapangan
- **Gambar 18.** Halaman Pengaturan Pengguna (Users)

<br />

# Daftar Tabel

- **Tabel 1.** Matriks Pembagian Peran dan Tanggung Jawab Staf
- **Tabel 2.** Keterangan Isian Formulir Pendaftaran Job Baru
- **Tabel 3.** Ringkasan Persyaratan Dokumen per Tahapan Riksa Uji
- **Tabel 4.** Daftar Alat Uji Standar dan Ketentuan Kalibrasi

<!-- PAGE_BREAK: DAFTAR_GAMBAR -->

# 1. Pendahuluan

Dokumen User Guide ini disusun untuk membantu pengguna dalam memahami dan mengoperasikan aplikasi DNP Monitor. Panduan ini mencakup langkah-langkah kerja mulai dari penerimaan order pekerjaan baru dari klien industri hingga penyerahan Surat Keterangan (Suket) dan penutupan tagihan.

## 1.1 Ringkasan Aplikasi
DNP Monitor adalah aplikasi berbasis web yang digunakan oleh seluruh divisi di PT Delta Nusantara Persada untuk memantau proses riksa uji K3. Dengan aplikasi ini, setiap bagian dapat:
1. Memantau posisi berkas secara langsung tanpa harus menanyakan secara manual ke divisi lain.
2. Mengetahui batas waktu proses berkas di Dinas Tenaga Kerja (Disnaker) agar tidak terlambat.
3. Menyimpan seluruh riwayat dokumen pemeriksaan (PO, Surat Tugas, LHPP, Suket, Invoice, Faktur Pajak) secara rapi dalam satu tempat.

## 1.2 Alur 12 Tahapan Riksa Uji
Proses pemeriksaan dan pengujian K3 diatur dalam alur tahapan berurutan sebagai berikut:
- **Stage 1 (PO / SPK):** Marketing memasukkan data pesanan klien dan mengunggah berkas PO resmi.
- **Stage 2 (Verifikasi Dokumen):** Admin memeriksa kelengkapan berkas administrasi pemohon.
- **Stage 3 (Penjadwalan):** Admin menetapkan tanggal riksa uji, menugaskan Ahli K3, dan memilih alat uji.
- **Stage 4 (Pelaksanaan RU):** Ahli K3 melakukan uji fisik mesin di lapangan dan mengunggah BAP.
- **Stage 4b (Aktualisasi Unit):** Penyesuaian kontrak jika jumlah mesin di lapangan berbeda dari PO awal.
- **Stage 5 (Penyusunan LHPP):** Ahli K3 mengisi evaluasi teknis per unit alat dan mengunggah draf laporan.
- **Stage 6 (Review Laporan Teknis):** Kadiv RU memeriksa draf laporan teknis.
- **Stage 7 (Submit Disnaker):** Penyerahan bundel berkas fisik ke kantor dinas tenaga kerja.
- **Stage 8 (Proses Disnaker):** Pengawalan berkas di dinas dengan batas target waktu 30 hari kerja.
- **Stage 9 (Pengurusan Suket):** Pencatatan nomor register Suket yang telah disahkan dinas.
- **Stage 10 (Penagihan):** Finance menerbitkan tagihan invoice PDF dan faktur pajak.
- **Stage 11 (Penyerahan Suket):** Marketing menyerahkan dokumen fisik Suket asli kepada klien.
- **Stage 11b (Pelunasan):** Konfirmasi pembayaran masuk jika klien membayar secara tempo.
- **Stage 12 (Selesai & Closed):** Penutupan pekerjaan setelah seluruh dokumen dan pembayaran lunas.

## 1.3 Peran Pengguna (Role)
Setiap pengguna memiliki hak akses sesuai dengan pembagian tugas divisinya, seperti tertera pada Tabel 1.

**Tabel 1. Matriks Pembagian Peran dan Tanggung Jawab Staf**
| Peran (Role) | Divisi / Jabatan | Tahapan yang Dikelola | Tugas Utama |
|---|---|:---:|---|
| **Marketing** | Pemasaran | Stage 1, 4b, 11 | Mendaftarkan job baru, revisi unit kontrak, penyerahan suket |
| **Admin Teknis** | Administrasi RU | Stage 2, 3, 8, 9 | Verifikasi berkas, penjadwalan inspektur, pengawalan dinas |
| **Tim Ahli** | Inspektur Lapangan | Stage 4, 5 | Pemeriksaan fisik alat di lokasi klien, penyusunan draf LHPP |
| **Kadiv RU** | Manager Teknis | Stage 6, 7 | Persetujuan teknis LHPP, validasi bundel dinas, izin bypass |
| **Finance** | Keuangan | Stage 10, 11b, 12 | Penerbitan invoice PDF, faktur pajak, tutup job |
| **Superadmin** | Administrator | Semua Stage | Pengelolaan akun staf, master alat, pembukaan kunci berkas |

---

# 2. Akses Aplikasi dan Login

## 2.1 Alamat Website
Aplikasi DNP Monitor dapat dibuka melalui peramban web (Google Chrome, Microsoft Edge, atau Mozilla Firefox) pada komputer, laptop, tablet, maupun telepon genggam.

Alamat resmi aplikasi:  
**https://monitor-dnp.deltaindo.co.id/**

Pastikan komputer atau perangkat Anda terhubung dengan jaringan internet yang stabil.

## 2.2 Cara Masuk ke Akun
Berikut adalah langkah-langkah untuk masuk ke dalam aplikasi:
1. Buka peramban web pada komputer Anda.
2. Masukkan alamat **https://monitor-dnp.deltaindo.co.id/** pada baris alamat peramban lalu tekan Enter.
3. Halaman login aplikasi akan terbuka seperti pada Gambar 1.

![Gambar 1. Halaman Masuk Akun (Login)](docs/screenshots/fig01_login.png)
<div align="center"><em>Gambar 1. Halaman Masuk Akun (Login)</em></div>

4. Pada kolom **EMAIL**, ketikkan alamat email resmi Anda (contoh: `budi@deltaindo.co.id`).
5. Pada kolom **PASSWORD**, ketikkan kata sandi akun Anda.
6. Centang kotak **Remember me** apabila Anda menggunakan komputer kerja pribadi.
7. Klik tombol biru **LOG IN**.
8. Setelah data sesuai, sistem akan mengarahkan Anda langsung ke halaman Dashboard.

## 2.3 Menu Utama dan Navigasi
Setelah berhasil login, Anda akan melihat tampilan antarmuka yang terdiri dari dua bagian utama:
1. **Menu Samping Kiri (Sidebar):**
   - **Dashboard:** Menampilkan ringkasan angka dan grafik pekerjaan.
   - **Kanban:** Menampilkan alur visual kartu pekerjaan dari Stage 1 hingga 12.
   - **Daftar Job:** Menampilkan daftar seluruh pekerjaan dalam format tabel baris.
   - **+ Job Baru:** Tombol cepat untuk mendaftarkan pekerjaan baru dari klien.
   - **Pelaporan:** Menampilkan rekapitulasi data dan tombol unduh ke file spreadsheet.
   - **Users:** Pengaturan akun karyawan (khusus Superadmin).
   - **Reminder Suket:** Halaman pengingat masa kadaluarsa suket, izin SKP, dan alat uji.
   - **Alat & SKP:** Pengelolaan master inventaris alat uji dan perpanjangan kalibrasi.
2. **Bilah Bagian Atas (Header):**
   - **Lonceng Notifikasi:** Menampilkan pemberitahuan pekerjaan baru atau berkas masuk.
   - **Profil Pengguna:** Menampilkan nama lengkap dan peran akun yang sedang aktif.
   - **Tombol Keluar:** Tombol di pojok kanan atas untuk keluar dari sesi kerja.

## 2.4 Cara Keluar Akun (Logout)
Apabila Anda telah selesai bekerja:
1. Klik tombol **Logout** (ikon pintu dengan anak panah) di pojok kanan atas layar.
2. Sistem akan menutup sesi dan mengembalikan tampilan ke halaman login.

---

# 3. Halaman Dashboard

Halaman Dashboard menyajikan ringkasan kinerja pekerjaan secara langsung untuk membantu monitoring operasional harian.

![Gambar 2. Tampilan Halaman Dashboard dan Angka Kinerja](docs/screenshots/fig02_dashboard_kpi.png)
<div align="center"><em>Gambar 2. Tampilan Halaman Dashboard dan Angka Kinerja</em></div>

## 3.1 Ringkasan Angka Kinerja
Pada bagian atas dashboard terdapat empat kotak informasi utama:
1. **TOTAL PIPELINE:** Menampilkan total nominal rupiah dari seluruh pekerjaan yang sedang berjalan. Nilai ini disembunyikan untuk akun Inspektur Lapangan.
2. **JOB AKTIF (GLOBAL):** Jumlah keseluruhan pekerjaan yang saat ini sedang aktif dikerjakan.
3. **LAPORAN SELESAI (BULAN INI):** Jumlah pekerjaan yang telah selesai diterbitkan Suket pada bulan berjalan.
4. **TOTAL OVERDUE:** Jumlah pekerjaan yang telah melebihi target waktu standar pengerjaan di dinas tenaga kerja.

## 3.2 Grafik Beban Kerja Lintas Tahapan
Bagian *Beban Kerja Lintas Tahapan* menampilkan grafik posisi pekerjaan di tiap tahapan:
- Memperlihatkan tahapan mana yang memiliki antrean pekerjaan paling banyak.
- Membantu pimpinan dalam mengatur pembagian tugas tim kerja agar tidak menumpuk di satu bagian.

## 3.3 Peringatan Waktu Dinas (Overdue)
Kotak *Total Overdue* diberi warna merah muda dengan tanda peringatan. Apabila angka pada kotak ini bertambah, Admin Teknis perlu memeriksa berkas di Stage 8 untuk menindaklanjuti proses di dinas.

---

# 4. Papan Kanban (Kanban Board)

Papan Kanban adalah sarana visual untuk melihat seluruh pekerjaan yang sedang berjalan berdasarkan kolom tahapannya.

![Gambar 3. Tampilan Papan Kerja Visual (Kanban Board)](docs/screenshots/fig03_kanban_board.png)
<div align="center"><em>Gambar 3. Tampilan Papan Kerja Visual (Kanban Board)</em></div>

## 4.1 Tampilan Kolom Tahapan
- Kolom tersusun rapi dari kiri ke kanan, dimulai dari Stage 1 hingga Stage 12.
- Pada bagian atas tiap kolom tertera nama tahapan dan angka jumlah pekerjaan yang berada di kolom tersebut.
- Geser tampilan layar ke samping kanan untuk melihat kolom tahapan berikutnya.

## 4.2 Membaca Kartu Pekerjaan
Setiap kartu pada papan Kanban mewakili satu berkas pekerjaan:
1. **Nama Klien:** Tertulis tebal pada baris pertama kartu.
2. **Kode Job & Bidang K3:** Menampilkan nomor registrasi (misal: `DNP-2026-0012`) dan kategori alat (misal: Bejana Tekan, Lift, Listrik).
3. **Jumlah Unit:** Informasi berapa unit alat yang diperiksa.
4. **Lencana Kendala Dinas:** Pada kolom Stage 8, jika proses di dinas tertahan, kartu akan menampilkan tanda merah berisi uraian kendala (misal: *Petugas dinas sedang rapat luar kota*).

## 4.3 Membuka Lembar Rincian (Job Detail Sheet)
Untuk melihat berkas, mengisi data pemeriksaan, atau memajukan tahapan:
1. Klik satu kali pada kartu pekerjaan yang dipilih di papan Kanban.
2. Lembar kerja rincian (*Job Detail Sheet*) akan terbuka dari sebelah kanan layar.

---

# 5. Halaman Daftar Job

Bagi pengguna yang membutuhkan tampilan data dalam bentuk daftar panjang, menu **Daftar Job** menyajikan data pekerjaan dalam bentuk tabel.

![Gambar 4. Halaman Daftar Job dalam Bentuk Tabel](docs/screenshots/fig04_daftar_job.png)
<div align="center"><em>Gambar 4. Halaman Daftar Job dalam Bentuk Tabel</em></div>

## 5.1 Tampilan Tabel Pekerjaan
Tabel memuat kolom informasi:
- Kode Pekerjaan
- Nama Perusahaan Klien
- Bidang Pesawat K3
- Jumlah Unit
- Staf Penanggung Jawab
- Posisi Tahapan Terkini
- Status Pembayaran

## 5.2 Pencarian dan Penyaringan Data
1. **Pencarian Cepat:** Ketik nama PT klien pada kolom pencarian di bagian atas tabel.
2. **Filter Bidang:** Pilih kategori alat (PUBT, PAA, Elevator, Listrik, Proteksi Kebakaran) pada menu pilihan penyaring.
3. Klik pada salah satu baris tabel untuk membuka rincian pekerjaan.

---

# 6. Pendaftaran Pekerjaan Baru (+ Job Baru)

Pendaftaran pekerjaan baru dilakukan oleh bagian **Marketing** atau **Superadmin**.

![Gambar 5. Formulir Pembuatan Job Baru (+ Job Baru)](docs/screenshots/fig05_create_job.png)
<div align="center"><em>Gambar 5. Formulir Pembuatan Job Baru (+ Job Baru)</em></div>

## 6.1 Membuka Formulir Job Baru
1. Klik tombol **`+ Job Baru`** pada menu samping kiri, atau buka alamat **https://monitor-dnp.deltaindo.co.id/jobs/create**.
2. Layar formulir pendaftaran pekerjaan baru akan terbuka seperti pada Gambar 5.

## 6.2 Mengisi Data Order dan Klien
1. Masukkan **Nama Perusahaan Klien** lengkap dengan bentuk badan usahanya (contoh: *PT Tri Bintang Mandiri*).
2. Masukkan **Alamat Lokasi Proyek** tempat alat uji dipasang.
3. Pilih **Kota / Kabupaten** lokasi dari daftar pilihan dropdown.
4. Masukkan **Nama PIC Klien** dan nomor telepon/WhatsApp yang aktif.
5. Tentukan **Bidang Pesawat K3** dan masukkan **Jumlah Unit** mesin yang akan diuji.

## 6.3 Menghitung Pajak dengan Kalkulator PPN 12%
Aplikasi memiliki kotak kalkulasi pajak otomatis:
1. Masukkan nilai harga penawaran sebelum pajak pada kolom **Nilai Kontrak (DPP)**.
2. Kotak kalkulator akan langsung menampilkan rincian:
   - **DPP:** Nominal sebelum pajak.
   - **PPN 12%:** Nilai pertambahan nilai resmi tarif 12%.
   - **Total Tagihan:** DPP ditambah PPN 12%.
3. Angka yang tersimpan di sistem adalah nilai dasar sebelum pajak, sehingga pencatatan keuangan tetap akurat.

## 6.4 Memilih Jadwal dan Mengunggah Berkas PO
1. Pilih perkiraan tanggal pelaksanaan riksa uji pada kalender jadwal.
2. **Unggah Berkas Pesanan:**
   - Siapkan berkas pindaian Purchase Order (PO), Surat Perintah Kerja (SPK), atau Surat Permohonan Klien.
   - Klik pada kotak unggah berkas, lalu pilih file dari komputer Anda.
   - Minimal satu berkas pesanan resmi **wajib diunggah** agar tombol simpan dapat memproses pekerjaan ke tahap berikutnya.
3. Klik tombol biru **Simpan & Daftarkan Job**.

## 6.5 Tabel Keterangan Isian Formulir
Petunjuk pengisian formulir tertera pada Tabel 2.

**Tabel 2. Keterangan Isian Formulir Pendaftaran Job Baru**
| Nama Kolom (Field) | Jenis Isian | Contoh Pengisian | Status Isian |
|---|---|---|:---:|
| **Nama Klien** | Teks Bebas | *PT Wijaya Prima Semesta* | Wajib |
| **Alamat Proyek** | Teks Panjang | *Kawasan Industri GIIC Blok C-12, Cikarang* | Wajib |
| **Kota / Kabupaten** | Pilihan Dropdown | *Kab. Bekasi* | Wajib |
| **PIC Lapangan** | Teks Bebas | *Bapak Hendra Gunawan* | Wajib |
| **Kontak PIC** | Angka Telepon | `081234567890` | Wajib |
| **Bidang K3** | Pilihan | *Pesawat Tenaga dan Produksi (PTP)* | Wajib |
| **Jumlah Unit** | Angka | `3` | Wajib |
| **Nilai Kontrak (DPP)** | Angka Rupiah | `25000000` | Wajib |
| **Berkas PO / SPK** | File PDF / Foto | Scan dokumen PO resmi bertandatangan | Wajib (Min. 1) |

---

# 7. Petunjuk Operasional Tiap Tahap (Stage 1 – 12)

Pengoperasian tahapan dilakukan melalui panel geser **Job Detail Sheet**.

![Gambar 6. Tampilan Panel Lembar Rincian (Job Detail Sheet)](docs/screenshots/fig06_job_detail_overview.png)
<div align="center"><em>Gambar 6. Tampilan Panel Lembar Rincian (Job Detail Sheet)</em></div>

## 7.1 Pengenalan Panel Job Detail Sheet
Pada panel rincian pekerjaan:
- Bagian atas menampilkan tombol nomor tahapan (S01 sampai S12).
- Tahapan yang sedang aktif ditandai dengan warna biru terang.
- Setiap divisi hanya dapat mengisi formulir pada tahapan yang menjadi kewenangannya.

---

## 7.2 Stage 1: PO / SPK dan Kelengkapan Awal

![Gambar 7. Panel Formulir Stage 1 (PO/SPK)](docs/screenshots/fig07_stage1_po_form.png)
<div align="center"><em>Gambar 7. Panel Formulir Stage 1 (PO/SPK)</em></div>

- **Bagian yang Bertanggung Jawab:** Marketing.
- **Langkah Kerja:**
  1. Periksa kembali kebenaran nama klien, alamat pabrik, dan jumlah unit alat.
  2. Pastikan file scan PO/SPK sudah terunggah dan dapat dibuka dengan jelas.
  3. Klik tombol **Lanjutkan ke Stage 2**.

---

## 7.3 Stage 2: Verifikasi Berkas dan Izin Bypass

![Gambar 8. Panel Formulir Stage 2 (Verifikasi Berkas)](docs/screenshots/fig08_stage2_verify_form.png)
<div align="center"><em>Gambar 8. Panel Formulir Stage 2 (Verifikasi Berkas)</em></div>

- **Bagian yang Bertanggung Jawab:** Admin Teknis.
- **Langkah Kerja:**
  1. Periksa dokumen legalitas yang telah diunggah oleh Marketing.
  2. Berikan tanda pada checklist periksa: klik **OK** jika berkas sah, **Tidak** jika berkas kurang, atau **NA** jika tidak disyaratkan.
  3. **Khusus Pesawat Angkat (PAA) dan Lift:** Unggah Sertifikat Bahan tali baja/rantai pada kotak berkas yang disediakan.
  4. **Pengajuan Izin Bypass:** Jika jadwal sudah mendesak namun berkas fisik klien masih proses, klik tombol **Request Bypass Manager**. Kadiv RU akan memeriksa permohonan ini untuk mengizinkan berkas lanjut sementara ke Stage 3.

---

## 7.4 Stage 3: Penjadwalan, Ahli K3, dan Cetak Surat Tugas

![Gambar 9. Panel Formulir Stage 3 (Penjadwalan & Ahli K3)](docs/screenshots/fig09_stage3_schedule_form.png)
<div align="center"><em>Gambar 9. Panel Formulir Stage 3 (Penjadwalan & Ahli K3)</em></div>

- **Bagian yang Bertanggung Jawab:** Admin Teknis.
- **Langkah Kerja:**
  1. Masukkan tanggal dan waktu pelaksanaan pengujian di lokasi pabrik klien.
  2. **Pilih Ahli K3:** Sistem akan menampilkan daftar rekomendasi nama inspektur yang memiliki sertifikat SKP aktif pada bidang tersebut. Pilih nama personel yang ditugaskan.
  3. **Pilih Alat Uji:** Centang instrumen alat ukur yang akan dibawa tim ke lapangan. Pastikan memilih alat yang kalibrasinya masih berlaku.
  4. **Cetak Dokumen:**
     - Klik **Download Surat Tugas** untuk mencetak surat penugasan format Word yang sudah terisi otomatis.
     - Klik **Download Form Riksa Uji** untuk mencetak lembar pemeriksaan lapangan.
  5. Klik tombol **Lanjutkan ke Stage 4**.

---

## 7.5 Stage 4: Pemeriksaan Lapangan dan Unggah BAP

![Gambar 10. Panel Formulir Stage 4 (Pemeriksaan Lapangan & BAP)](docs/screenshots/fig10_stage4_inspection_form.png)
<div align="center"><em>Gambar 10. Panel Formulir Stage 4 (Pemeriksaan Lapangan & BAP)</em></div>

- **Bagian yang Bertanggung Jawab:** Tim Ahli / Inspektur Lapangan.
- **Langkah Kerja:**
  1. Buka aplikasi di lokasi proyek melalui smartphone atau tablet.
  2. **Hitung Unit Fisik:** Masukkan jumlah mesin yang benar-benar siap diuji pada kolom *Jumlah Unit Aktual*.
  3. Isi daftar periksa teknis visual dan uji fungsi pengaman mesin.
  4. Ambil foto pengujian alat menggunakan kamera smartphone lalu unggah ke sistem.
  5. Minta tanda tangan perwakilan klien pada lembar Berita Acara Pemeriksaan (BAP) fisik, lalu foto dan unggah file scan BAP tersebut.
  6. Klik tombol **Lanjutkan ke Stage 5**.

---

## 7.6 Penanganan Perbedaan Jumlah Unit Lapangan (Stage 4b)
Apabila saat pemeriksaan di lokasi pabrik klien ditemukan jumlah alat berbeda dari PO (contoh: di kontrak tertulis 4 unit, tetapi di lapangan hanya ada 2 unit yang beroperasi):
1. Inspektur mengetikkan angka riil di kolom *Jumlah Unit Aktual*.
2. Sistem akan mendeteksi perbedaan dan menampilkan tombol **Kembalikan ke Stage 1 / Stage 4b**.
3. Berkas akan kembali ke antrean Marketing.
4. Marketing berkoordinasi dengan klien untuk menerbitkan revisi PO sebelum penulisan laporan teknis dilanjutkan.

---

## 7.7 Stage 5: Penyusunan LHPP dan Tautan Multi-Unit

![Gambar 11. Panel Formulir Stage 5 (Evaluasi Unit & Berkas LHPP)](docs/screenshots/fig11_stage5_lhpp_form.png)
<div align="center"><em>Gambar 11. Panel Formulir Stage 5 (Evaluasi Unit & Berkas LHPP)</em></div>

- **Bagian yang Bertanggung Jawab:** Tim Ahli / Inspektur.
- **Langkah Kerja:**
  1. Masukkan nomor seri tiap unit mesin pada tabel evaluasi.
  2. Tentukan kesimpulan status kelaikan: pilih **Laik**, **Laik Bersyarat**, atau **Tidak Laik**.
  3. Tuliskan ringkasan *Temuan Teknis* dan *Rekomendasi Perbaikan* sesuai standar keselamatan K3.
  4. Masukkan tautan link penyimpanan cloud (Google Drive) draf laporan tiap unit pada kolom tautan yang disediakan.
  5. Unggah berkas draf laporan lengkap format PDF.
  6. Klik tombol **Kirim Approval ke Manager** untuk diserahkan ke Stage 6.

---

## 7.8 Stage 6: Pemeriksaan Teknis oleh Kadiv RU

![Gambar 12. Panel Formulir Stage 6 (Review Teknis Kadiv RU)](docs/screenshots/fig12_stage6_review_form.png)
<div align="center"><em>Gambar 12. Panel Formulir Stage 6 (Review Teknis Kadiv RU)</em></div>

- **Bagian yang Bertanggung Jawab:** Kadiv RU / Manager Teknis.
- **Langkah Kerja:**
  1. Kadiv RU memeriksa draf laporan teknis yang disusun oleh inspektur.
  2. Pilih keputusan:
     - **Approve:** Laporan disetujui. Berkas maju ke Stage 7.
     - **Approve Bersyarat:** Laporan disetujui dengan catatan revisi kecil.
     - **Reject:** Laporan keliru. Manager wajib menuliskan catatan revisi. Sistem akan otomatis **mengembalikan pekerjaan ke Stage 5** agar draf laporan diperbaiki oleh inspektur bersangkutan.

---

## 7.9 Stage 7: Penyerahan Bundel Berkas ke Disnaker
- **Bagian yang Bertanggung Jawab:** Kadiv RU / Admin Teknis.
- **Langkah Kerja:**
  1. Periksa kelengkapan bundel fisik: surat pengantar resmi PJK3, draf LHPP rangkap tiga, dan surat penunjukan Ahli K3.
  2. Masukkan **Tanggal Penyerahan Berkas** ke loket Dinas Tenaga Kerja.
  3. Pengisian tanggal ini otomatis menyalakan hitungan mundur target waktu 30 hari kerja di Stage 8.

---

## 7.10 Stage 8: Pengawalan Proses Dinas dan Log Kendala

![Gambar 13. Panel Formulir Stage 8 (Pengawalan Proses Disnaker)](docs/screenshots/fig13_stage8_disnaker_form.png)
<div align="center"><em>Gambar 13. Panel Formulir Stage 8 (Pengawalan Proses Disnaker)</em></div>

- **Bagian yang Bertanggung Jawab:** Admin Teknis.
- **Langkah Pengawalan:**
  1. Pantau angka hari pada indikator peringatan waktu 30 hari. Lencana hijau menandakan aman, dan merah menandakan proses lewat batas waktu.
  2. Admin wajib menghubungi petugas dinas minimal seminggu sekali dan mencatat hasilnya melalui tombol **Tambah Log Follow-Up**.
  3. **Pencatatan Kendala Dinas:** Jika berkas tertahan di dinas, pilih status kendala dan tuliskan alasannya agar terpantau pada kartu papan Kanban.

---

## 7.11 Stage 9: Penerimaan dan Pencatatan Nomor Suket
- **Bagian yang Bertanggung Jawab:** Admin Teknis.
- **Langkah Kerja:**
  1. Terima dokumen fisik Surat Keterangan (Suket) asli yang telah ditandatangani dan dicap dinas.
  2. Masukkan **Nomor Suket Resmi** per unit alat.
  3. Masukkan **Tanggal Terbit** dan **Masa Berlaku** (12 atau 24 bulan). Sistem otomatis menghitung tanggal kadaluarsa suket untuk peringatan resertifikasi pada **H-90**.
  4. Unggah scan dokumen Suket PDF asli, lalu klik **Lanjutkan ke Stage 10**.

---

## 7.12 Stage 10: Penerbitan Tagihan Invoice dan Faktur Pajak

![Gambar 14. Panel Formulir Stage 10 (Tagihan Invoice & Faktur Pajak)](docs/screenshots/fig14_stage10_invoice_form.png)
<div align="center"><em>Gambar 14. Panel Formulir Stage 10 (Tagihan Invoice & Faktur Pajak)</em></div>

- **Bagian yang Bertanggung Jawab:** Staf Finance.
- **Langkah Kerja:**
  1. Masukkan Nomor Invoice resmi dan nominal tagihan.
  2. Tentukan jangka waktu pembayaran melalui kolom **TOP (Hari)**.
  3. **Unggah Invoice PDF:** Berkas tagihan wajib berupa file **.PDF** asli dengan ukuran maksimal 10 MB.
  4. **Unggah Faktur Pajak:** Masukkan nomor Faktur Pajak DJP dan unggah file e-faktur pada slot yang disediakan.
  5. Klik tombol **Lanjutkan ke Stage 11**.

---

## 7.13 Stage 11: Penyerahan Fisik Suket ke Klien
- **Bagian yang Bertanggung Jawab:** Marketing.
- **Langkah Kerja:**
  1. Staf Marketing menyerahkan fisik asli sertifikat Suket dan buku laporan kepada klien.
  2. Masukkan **Tanggal Penyerahan** dan **Nama Penerima Klien**.
  3. Unggah scan tanda terima dokumen yang sudah ditandatangani dan dicap stempel oleh pihak klien.
  4. Klik **Lanjutkan**.

---

## 7.14 Stage 11b: Konfirmasi Pelunasan Pembayaran
- **Bagian yang Bertanggung Jawab:** Finance.
- **Langkah Kerja:**
  1. Apabila klien bertransaksi tempo, Finance memeriksa mutasi rekening bank perusahaan.
  2. Setelah dana diterima, unggah bukti transfer bank dan aktifkan status **Lunas (Paid)**.

---

## 7.15 Stage 12: Penutupan Pekerjaan (Closed Job)
- **Bagian yang Bertanggung Jawab:** Finance atau Superadmin.
- **Syarat Penutupan:** Status pembayaran wajib **Lunas** dan dokumen (PO, BAP, LHPP, Suket, Invoice, Tanda Terima) telah lengkap.
- Klik tombol **Tutup Job (Closed)**. Berkas pekerjaan selesai dan tersimpan aman di arsip sistem.

---

# 8. Modul Pendukung dan Administrasi

## 8.1 Modul Pelaporan
Menu **Pelaporan** (akses: **https://monitor-dnp.deltaindo.co.id/pelaporan**) digunakan untuk merekap data pekerjaan.

![Gambar 15. Halaman Pelaporan dan Ekspor Data](docs/screenshots/fig15_pelaporan.png)
<div align="center"><em>Gambar 15. Halaman Pelaporan dan Ekspor Data</em></div>

1. Pilih rentang tanggal pada kolom tanggal awal dan tanggal akhir.
2. Pilih filter status pekerjaan.
3. Klik tombol hijau **Export Excel / Spreadsheet** untuk mengunduh rekapitulasi data.

---

## 8.2 Modul Pengingat (Reminder Suket & SKP)
Menu **Reminder Suket** (akses: **https://monitor-dnp.deltaindo.co.id/reminder-suket**) berfungsi untuk memantau masa berlaku dokumen hukum.

![Gambar 16. Halaman Pengingat Dokumen (Reminder Suket & SKP)](docs/screenshots/fig16_reminder_suket.png)
<div align="center"><em>Gambar 16. Halaman Pengingat Dokumen (Reminder Suket & SKP)</em></div>

- **Reminder Suket Klien (H-90):** Menampilkan daftar Suket klien yang akan habis dalam waktu 90 hari ke depan untuk ditindaklanjuti bagian Marketing.
- **Reminder SKP Ahli K3 (H-60):** Menampilkan masa aktif surat penunjukan Ahli K3 internal PT Delta Nusantara Persada.
- **Reminder Kalibrasi Alat (H-30):** Menampilkan alat uji yang masa berlaku kalibrasinya akan berakhir dalam 30 hari.

---

## 8.3 Modul Inventaris Alat dan SKP
Menu **Alat & SKP** (akses: **https://monitor-dnp.deltaindo.co.id/inventory**) mengelola data instrumen uji lapangan.

![Gambar 17. Halaman Inventaris Alat Uji Lapangan](docs/screenshots/fig17_alat_skp_inventory.png)
<div align="center"><em>Gambar 17. Halaman Inventaris Alat Uji Lapangan</em></div>

- Mendata 23 master alat uji (Earth Tester, Thickness Gauge, Sound Level Meter, Lux Meter, Gas Detector, dll).
- Untuk memperbarui tanggal kalibrasi, klik tombol **Edit** pada baris alat yang bersangkutan, masukkan tanggal baru, dan unggah sertifikat kalibrasi KAN yang baru.

---

## 8.4 Modul Pengaturan Pengguna (Users)
Menu **Users** (akses: **https://monitor-dnp.deltaindo.co.id/users**) khusus diakses oleh **Super Administrator**.

![Gambar 18. Halaman Pengaturan Pengguna (Users)](docs/screenshots/fig18_users_management.png)
<div align="center"><em>Gambar 18. Halaman Pengaturan Pengguna (Users)</em></div>

- Digunakan untuk menambah akun karyawan baru, mengubah nomor WhatsApp notifikasi, serta mengatur izin pengerjaan stage untuk masing-masing staf.

---

# 9. Kendala Pengguna dan Tanya Jawab (FAQ)

## 9.1 Pertanyaan yang Sering Diajukan

**Q1: Mengapa tombol untuk melanjutkan stage berwarna abu-abu dan tidak bisa diklik?**  
*Jawaban:* Tombol terkunci karena masih ada data yang belum lengkap. Pastikan semua kolom bertanda bintang sudah diisi dan berkas wajib pada tahap tersebut (misal: file scan PO di Stage 1, atau file BAP di Stage 4) sudah terunggah.

**Q2: Mengapa file invoice saya ditolak oleh sistem di Stage 10?**  
*Jawaban:* Berkas invoice wajib diunggah dalam format **.PDF asli** dengan ukuran di bawah 10 MB. Sistem secara otomatis menolak file foto (.jpg/.png) atau Word (.docx). Ekspor ulang dokumen invoice Anda ke PDF sebelum diunggah.

**Q3: Bagaimana jika jumlah unit di lapangan tidak sama dengan kontrak PO?**  
*Jawaban:* Pada Stage 4, ketikkan jumlah unit riil pada kolom *Jumlah Unit Aktual*. Sistem akan menampilkan tombol **Kembalikan ke Stage 1 / Stage 4b** agar bagian Marketing dapat meminta revisi PO kepada klien terlebih dahulu.

**Q4: Berkas klien belum lengkap tetapi jadwal uji di pabrik sudah mendesak. Apa solusinya?**  
*Jawaban:* Di Stage 2, Admin Teknis dapat mengklik tombol **Request Bypass Manager**. Jika Kadiv RU menyetujui, pekerjaan diizinkan lanjut ke Stage 3 dengan catatan dokumen disusulkan sebelum berkas diserahkan ke dinas.

**Q5: Apakah Inspektur Lapangan bisa melihat besaran harga nilai kontrak?**  
*Jawaban:* Tidak. Nilai rupiah kontrak otomatis disembunyikan untuk akun peran Tim Ahli / Inspektur guna menjaga kerahasiaan data komersial perusahaan.

**Q6: Bagaimana cara memperbarui sertifikat kalibrasi alat yang sudah habis?**  
*Jawaban:* Buka menu **Alat & SKP**, cari alat yang selesai dikalibrasi, klik tombol **Edit**, masukkan tanggal kalibrasi baru, dan unggah sertifikat kalibrasi KAN yang baru.

## 9.2 Saluran Bantuan
Apabila Anda mengalami kendala teknis atau kendala operasional:
1. Hubungi Admin Teknis atau Kadiv RU untuk verifikasi data isian.
2. Hubungi Super Administrator untuk penanganan pembukaan kunci akun atau pembukaan kembali pekerjaan yang tertutup.
3. Selalu pastikan Anda menggunakan alamat resmi di **[https://monitor-dnp.deltaindo.co.id/](https://monitor-dnp.deltaindo.co.id/)**.

---
*(Dokumen Buku Panduan Pengguna Resmi DNP Monitor v2.4 - PT Delta Nusantara Persada)*
