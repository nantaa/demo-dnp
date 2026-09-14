# Rekap Masukan Perbaikan DNP Monitor

Dokumen ini merupakan hasil konversi dari file `Rekap_Masukan_Perbaikan_DNP_Monitor.xlsx` ke format Markdown, disusun ulang per baris masukan (long format) agar mudah di-crosscheck satu per satu oleh AI/manusia.

## Sumber Sheet 1: Komparasi Antar Divisi

| Stage | Proses | Sumber Divisi | Masalah / Masukan | Progress Dropdown |
|---|---|---|---|---|
| 1 | PO / SPK<br>(MKT) | Finance | - Periode tutup buku pajak jatuh pada tanggal 15<br>- Marketing/Admin dapat langsung melihat nilai bersih (setelah PPN) saat input PO | (belum diisi) |
| 1 | PO / SPK<br>(MKT) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Perjelas field wajib saat input<br>- Catatan Konfirmasi: Perjelas dokumen wajib diupload<br>- Catatan Konfirmasi: Perlu kriteria baku "pengecualian" yang boleh diambil<br>- Catatan Konfirmasi: Perlu batas waktu maksimal revisi PO dihitung dari tanggal tutup pajak<br>- Catatan Konfirmasi: Pastikan hasil kalkulator hanya untuk tampilan atau menjadi nilai resmi tersimpan | Status: (belum diisi) |
| 1b | Invocie DP (FIN)<br>(Usulan Baru — MKT) | Marketing | - Penambahan dari marketing | (belum diisi) |
| 1b | Invocie DP (FIN)<br>(Usulan Baru — MKT) | Finance | - Sudah konfirmasi Finance, sudah ok | (belum diisi) |
| 1c | Penagihan DP (MKT)<br>(Usulan Baru — MKT) | Marketing | - Penambahan dari marketing | (belum diisi) |
| 1c | Penagihan DP (MKT)<br>(Usulan Baru — MKT) | Finance | - Sudah konfirmasi Finance, sudah ok | (belum diisi) |
| 1d | Konfirmasi DP lunas (FIN)<br>(Usulan Baru — MKT) | Marketing | - Penambahan dari marketing | (belum diisi) |
| 1d | Konfirmasi DP lunas (FIN)<br>(Usulan Baru — MKT) | Finance | - Sudah konfirmasi Finance, sudah ok | (belum diisi) |
| 2 | Verifikasi Dokumen (ADM) | Marketing | - Masukan Akses: Admin tidak boleh melihat informasi harga pada PO/SPK<br>- Masukan Dokumen: uploadTambahkan dokumen "Sertifikat Bahan" Khusus untuk PAA, escalator, dan elevator.<br>- Usulan Akses: Terapkan pembatasan akses berdasarkan role | (belum diisi) |
| 2 | Verifikasi Dokumen (ADM) | Finance | - Nilai Kontrak dapat dilihat oleh Admin<br>- Tim RU (pelaksana Riksa Uji lapangan) tidak diperbolehkan melihat Nilai Kontrak | (belum diisi) |
| 2 | Verifikasi Dokumen (ADM) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Tentukan dokumen/field yang tetap terlihat oleh Admin<br>⚠ Konflik: Bertentangan dengan masukan Marketing (Admin tidak boleh lihat harga PO/SPK)<br>- Catatan Konfirmasi: Perlu sesi klarifikasi bersama Marketing, Admin, dan Finance | Status: (belum diisi) |
| 3 | Penjadwalan & Surat Tugas (ADM) | Marketing | - Masukan Fitur: Diperlukan fitur penjadwalan ulang (reschedule)<br>- Masukan Proses: Contoh kasus: unit rusak sehingga pemeriksaan tidak sesuai jadwal<br>- Usulan Fitur: Tambahkan kolom alasan/perubahan jadwal | (belum diisi) |
| 3 | Penjadwalan & Surat Tugas (ADM) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Business rule reschedule perlu dibahas lebih lanjut<br>- Catatan Konfirmasi: Perlu kriteria baku "pengecualian" yang boleh diambil<br>- Catatan Konfirmasi: Perlu batas waktu maksimal revisi PO dihitung dari tanggal tutup pajak | Status: (belum diisi) |
| 4 | Pelaksanaan RU (TIM RU) | Tim Riksa Uji | - Dashboard untuk tim RU langsung ada upload foto absen. masukan untuk RU.<br>- Stage 4 input absen ada drop down perhari nya masukan untuk Tim RU.<br>- hitungan akumulasi unit masukan untuk RU. | (belum diisi) |
| 4 | Pelaksanaan RU (TIM RU) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Detail kebutuhan dari Tim Ahli/Inspektur perlu dikumpulkan pada tahap berikutnya | Status: (belum diisi) |
| 4b | Aktualisasi Unit (Kondisional) (MKT) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Trigger aktualisasi unit<br>- Catatan Konfirmasi: PIC aktualisasi unit<br>- Catatan Konfirmasi: Dokumen & output aktualisasi | Status: (belum diisi) |
| 4c | Penjadwalan Ulang (ADM)<br>(Usulan Baru — MKT) | Marketing | - Masukan penambahan stage penjadwalan ulang setelah aktualisasi unit | (belum diisi) |
| 4c | Penjadwalan Ulang (ADM)<br>(Usulan Baru — MKT) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Trigger aktualisasi unit<br>- Catatan Konfirmasi: PIC aktualisasi unit<br>- Catatan Konfirmasi: Dokumen & output aktualisasi | Status: (belum diisi) |
| 4d | RU Ulang (TIM RU)<br>(Usulan Baru — MKT) | Marketing | - Masukan penambahan stage RU ulang setelah Penjadwalan ulang | (belum diisi) |
| 4d | RU Ulang (TIM RU)<br>(Usulan Baru — MKT) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Trigger aktualisasi unit<br>- Catatan Konfirmasi: PIC aktualisasi unit<br>- Catatan Konfirmasi: Dokumen & output aktualisasi | Status: (belum diisi) |
| 5 | Penyusunan LHPP / BAP (TIM RU) | Marketing | - Review dokumen oleh Admin<br>- Kemungkinan alur bypass langsung ke Manager | (belum diisi) |
| 5 | Penyusunan LHPP / BAP (TIM RU) | Admin | - Upload laporan belum lengkap masukan dari Admin bertujuan agar base data yang bisa di monitoring oleh DNP / admin (masukan admin). Masukan<br>- Tampilan Untuk UI untuk sistem kanban itu terlalu rumit kalau bisa di search atau button scroll untuk ke kanan itu di pindah ke atas untuk<br>daftar job. daftar job perlu ada nomor PO dan juga fitur filter di daftar JOB masukan dari Admin. | (belum diisi) |
| 5 | Penyusunan LHPP / BAP (TIM RU) | Tim Riksa Uji | - Contoh yang harus di periksa sama ahli contoh kebakaran.<br>- Yang upload penyusunan LHPP/BAP petugas RU saja. (masukan tim RU) - pertanyaan nya apakah yang di upload hanya laporan belum ada<br>stemple skp<br>dll.<br>- Masukan untuk flow dunia sempurna di perbaiki agar nama admin dokumen dan RU harus di perbaiki menjadi admin dokumen saja dan untuk<br>tim  ahli di ganti menjadi tim riksa uji bukan tim ahli / inspektur.<br>- 1 unit laporan ada 5 file, masukan dari Tim RU untuk perbaikan dan masukan untuk bisa di drag and drop banyak file ke system upload web. atau alternatif kedua yaitu menjadi upload link gdrive.<br>- Laporan teknis tambahan (opsional) ada beberapa case perusahaan itu seperti harus ada sertifikat wayrope. dan itu dilakukan juga input oleh Marketing sebagai syarat dokumen.<br>- upload Dok teknis tambahan dan BAP bisa di satukan ke gdrive. | (belum diisi) |
| 5 | Penyusunan LHPP / BAP (TIM RU) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Case khusus perlu diperjelas<br>- Catatan Konfirmasi: Rule bypass harus disepakati sebelum diimplementasikan | Status: (belum diisi) |
| 6 | Review Laporan Teknis<br>(AHLI) | Marketing | - Review mengarah pada Management/Manager<br>- Mekanisme final masih perlu dikonfirmasi<br>- Mekanisme approve/revisi setelah validasi lintas role | (belum diisi) |
| 6 | Review Laporan Teknis<br>(AHLI) | Tim Riksa Uji | - verifikasi untuk tim ahli ketika laporan sudah selesai bagaimana baik nya untuk flow verifikasi nya pertanyaan dari | (belum diisi) |
| 6 | Review Laporan Teknis<br>(AHLI) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Tentukan siapa reviewer final<br>- Catatan Konfirmasi: Tentukan apakah laporan dapat dikembalikan (revisi) | Status: (belum diisi) |
| 7 | Verifikasi ke Dinas<br>(ADM) | Marketing | - Masukan Akses: Proses seharusnya dilakukan oleh Admin, bukan Manager | (belum diisi) |
| 7 | Verifikasi ke Dinas<br>(ADM) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Perlu validasi dengan Admin dan Manager sebelum perubahan final | Status: (belum diisi) |
| 8 | Proses Disnaker<br>(ADM) | Marketing | - Perlu status proses berjalan/delay/kendala di Dinas-Disnaker<br>- Tambahkan status proses di card kanban | (belum diisi) |
| 8 | Proses Disnaker<br>(ADM) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Status dan definisi delay perlu disepakati bersama | Status: (belum diisi) |
| 9 | Pengurusan SUKET<br>(ADM) | Marketing | -Tambahkan status proses di card kanban | (belum diisi) |
| 9 | Pengurusan SUKET<br>(ADM) | Admin | - Nama/judul kanban 9 sesuai saja / pengurusan Suket<br>- Point² kanban 9<br>- Suket diterima<br>- Pengcoveran (scan, penamaan cover dan tanda terima)<br>- Selesai | (belum diisi) |
| 9 | Pengurusan SUKET<br>(ADM) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Detail PIC dan output dikonfirmasi pada tahap berikutnya | Status: (belum diisi) |
| 10 | Pembuatan Inovice<br>(FIN)<br>(Usulan di ganti nama oleh MKT menjadi Pembuatan Invoice dari Penagihan) | Marketing | - Masukan Proses: Finance membuat Invoice & Kwitansi | (belum diisi) |
| 10 | Pembuatan Inovice<br>(FIN)<br>(Usulan di ganti nama oleh MKT menjadi Pembuatan Invoice dari Penagihan) | Finance | - Faktur Pajak ditambahkan sebagai dokumen pada tahap Penagihan<br>- Invoice maupun Faktur Pajak harus dapat diedit oleh Finance<br>- Jika ada revisi Invoice proses berjalan paralel, tidak menghentikan progres Job<br>- Jika revisi menyebabkan perubahan tanggal ke bulan berikutnya, pelaporan pajak berisiko tidak sesuai. terdapat sistem kalkulator dan notifikasi denda pajak. | (belum diisi) |
| 10 | Pembuatan Inovice<br>(FIN)<br>(Usulan di ganti nama oleh MKT menjadi Pembuatan Invoice dari Penagihan) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Detail status Finance dan sumber data pembayaran perlu dikonfirmasi<br>- Catatan Konfirmasi: Tentukan mekanisme edit: versi revisi (audit trail) atau overwrite dokumen lama | Status: (belum diisi) |
| 11 | Penagihan / Pembayaran<br>(MKT) | Marketing | - Pembayaran harus dilakukan & dikonfirmasi sebelum SUKET dikirim ke klien | (belum diisi) |
| 11 | Penagihan / Pembayaran<br>(MKT) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Tentukan PIC konfirmasi pembayaran<br>- Catatan Konfirmasi: Tentukan bukti pembayaran yang menjadi dasar | Status: (belum diisi) |
| 11b | Pengiriman SUKET ke Klien<br>(MKT) | Marketing | - Masukan Proses: Urutan pada rancangan awal dinilai terbalik terhadap Stage 11b<br>- Usulan Proses: Stage 11b Pembayaran -> Konfirmasi -> Stage 11 Pengiriman SUKET | (belum diisi) |
| 11b | Pengiriman SUKET ke Klien<br>(MKT) | Finance | - Masukan harus ada 2 kondisi antara pengiriman SUKET berdampingan dengan Invoice / Invoice dahulu di lunasi baru SUKET di kirimkan. | (belum diisi) |
| 11b | Pengiriman SUKET ke Klien<br>(MKT) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Rule pengiriman perlu dibuat tegas di sistem | Status: (belum diisi) |
| 11c | Verifikasi Pembayaran/Pelunasan Keputusan PPh<br>(FIN)<br>(Usulan Baru — FIN) | Finance | - Masukan harus ada verifikasi PPh apakah sudah di bayar atau belum, job tidak akan selesai sebelum di bayar. | (belum diisi) |
| 11c | Verifikasi Pembayaran/Pelunasan Keputusan PPh<br>(FIN)<br>(Usulan Baru — FIN) | Catatan / Potensi Konflik | - Catatan Konfirmasi: Rule pengiriman perlu dibuat tegas di sistem | Status: (belum diisi) |
| 12 | Selesai / Closed | Marketing | - Masukan Proses: Tidak ada masukan perubahan khusus<br>- Usulan Proses: Job dinyatakan Closed setelah rangkaian proses selesai sesuai rule final | (belum diisi) |
| 12 | Selesai / Closed | Catatan / Potensi Konflik | - Catatan Konfirmasi: Kriteria Closed perlu divalidasi lintas role | Status: (belum diisi) |

## Sumber Sheet 2: Masukan Fitur (Tambahan)

| Stage | Proses | Sumber Divisi | Masalah / Masukan | Progress Dropdown |
|---|---|---|---|---|
| 4 | Pelaksanaan RU (TIM RU) | Tim Riksa Uji | - Dashboard untuk tim RU langsung ada upload foto absen. masukan untuk RU.<br>- hitungan akumulasi unit masukan untuk RU. | (belum diisi) |
| 5 | Penyusunan LHPP / BAP (TIM RU) | Tim Riksa Uji | - 1 unit laporan ada 5 file, masukan dari Tim RU untuk perbaikan dan masukan untuk bisa di drag and drop banyak file ke system upload web. atau alternatif kedua yaitu menjadi upload link gdrive.<br>- Laporan teknis tambahan (opsional) ada beberapa case perusahaan itu seperti harus ada sertifikat wayrope. dan itu dilakukan juga input oleh Marketing sebagai syarat dokumen.<br>- upload Dok teknis tambahan dan BAP bisa di satukan ke gdrive. | (belum diisi) |
|  |  | Admin DNP | Tampilan Kanban<br>- Tampilan Untuk UI untuk sistem kanban itu terlalu rumit kalau bisa di search atau button scroll untuk ke kanan itu di pindah ke atas untuk daftar job. | (belum diisi) |