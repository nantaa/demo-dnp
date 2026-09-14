# 📋 Status Rekap Masukan & Perbaikan — DNP Monitor

> **Sumber**: `Rekap_Masukan_Perbaikan_DNP_Monitor (1) (5).xlsx`
> **Terakhir diperbarui**: 2026-09-14
> **Status Dokumen**: Working draft — POV Admin & Tim Riksa Uji masih kosong, menunggu masukan Tahap 3.

---

## Legend Status

| Status | Arti |
|--------|------|
| ✅ **DONE** | Sudah diimplementasikan dan live |
| 🔧 **PERLU DIPERBAIKI** | Ada keputusan, bisa langsung diimplementasi |
| ⏳ **MENUNGGU KONFIRMASI** | Perlu keputusan bisnis/lintas divisi sebelum bisa dikerjakan |
| ⚠️ **KONFLIK** | Masukan antar divisi bertentangan — wajib diselaraskan dulu |

---

## ✅ Sudah Diperbaiki / Already Fixed

| # | Stage | Fitur / Perbaikan | Sumber | Keterangan |
|---|-------|-------------------|--------|------------|
| 1 | 5 (LHPP) | INS bisa upload file & mengisi data di Stage 5 Penyusunan LHPP | INS / Tim RU | `canManage` & `canManageStageDocs` di `JobDetailSheet.jsx` sudah diperbaiki |
| 2 | 5 (LHPP) | Field link LHPP diubah dari upload file menjadi input URL/link | INS / Tim RU | Multi-unit LHPP link editor dengan label & notes per unit sudah live |
| 3 | 5 (LHPP) | Penyimpanan file tidak mengubah nama file asli | INS / Tim RU | `uploadDocument()` di `JobController.php` sudah sanitize + preserve original filename |
| 4 | 5 (LHPP) | Multiple link drive sesuai jumlah unit, bisa diberi nama/label per unit | INS / Tim RU | `parseLhppLinks()` + multi-unit link editor di Stage 5 dan Stage 6 review sudah live |
| 5 | Semua Stage | Assigned INS tidak bisa akses job setelah job dipindahkan ke stage sebelumnya | INS / Tim RU | Diperbaiki di `Jobs/List.jsx`, `Dashboard/Index.jsx`, `Kanban/Index.jsx` |
| 6 | Semua Stage | Reject/kembalikan job tidak mengirim `target_stage` dengan benar | INS / Tim RU | `handleRejectStage` di `JobDetailSheet.jsx` diubah ke `router.post` dengan payload eksplisit |
| 7 | Semua Stage | Role `inspector` (English) tidak terdeteksi, hanya `inspektur` | INS / Tim RU | Semua filter role sudah support `['inspektur', 'inspector'].includes(...)` |
| 8 | Semua Stage | Pivot column `inspector_id` tidak dicek, hanya `user_id` | INS / Tim RU | `isAssignedInspector` di semua komponen sudah cek `pivot?.inspector_id` |
| 9 | 4 & 5 | INS Dashboard hanya menampilkan job Stage 6, bukan Stage 5 (LHPP) | INS | `lhppJobs` di `Dashboard/Index.jsx` diperbaiki: include `j.stage === 5` |
| 10 | 11b | Pembayaran harus dikonfirmasi sebelum SUKET dikirim | Marketing | Gate payment sudah diimplementasikan di Stage 14 (requires `paid` status) |
| 11 | 6 | Manager dapat approve/revisi laporan teknis | Marketing | Stage 6 `peer_review_status` flow sudah ada: submitted → approved/revision |
| 12 | 5 | Sistem preview multi-unit LHPP di Stage 6 untuk Manager review | MGR | Stage 6 view sudah menampilkan semua LHPP link per unit dengan label & notes |

---

## 🔧 Perlu Diperbaiki (Ada Keputusan, Bisa Langsung Dikerjakan)

| # | Stage | Fitur / Permintaan | Sumber | Detail Perbaikan yang Dibutuhkan | Prioritas |
|---|-------|--------------------|--------|----------------------------------|-----------|
| 1 | 8 (Disnaker) | Tambahkan status proses berjalan / delay / kendala di Disnaker | Marketing | Tambah field `s8_delay_reason`, `s8_status` (berjalan/delay/selesai) di Stage 8 | 🔴 Tinggi |
| 2 | 1 (PO/SPK) | Kalkulator PPN 11% otomatis saat input PO | Finance | Tambah kalkulasi `nilai_nett` & `nilai_ppn` ditampilkan real-time di Stage 1 form | 🟡 Sedang |
| 3 | 3 (Jadwal) | Fitur reschedule penjadwalan dengan alasan/keterangan | Marketing | Tambah tombol "Reschedule" di Stage 3 dengan field tanggal baru + alasan perubahan jadwal | 🟡 Sedang |
| 4 | 2 (Verifikasi) | Tambah kategori dokumen "Sertifikat Bahan" khusus PAA, escalator, elevator | Marketing | Tambah conditional upload slot di Stage 2 untuk pesawat type = PAA/escalator/elevator | 🟡 Sedang |
| 5 | 10 (Penagihan) | Tambah dokumen Faktur Pajak di Stage 10 | Finance | Tambah upload slot "Faktur Pajak" di Stage 10 document checklist | 🟡 Sedang |
| 6 | 10 (Penagihan) | Finance bisa edit Invoice & Faktur Pajak setelah diterbitkan | Finance | Tambah tombol edit/revisi dokumen invoice di Stage 10 untuk role Finance | 🟡 Sedang |
| 7 | 10 (Penagihan) | Marketing bisa monitoring status penagihan/pembayaran | Marketing | Tambah status badge pembayaran yang visible untuk Marketing di job card/detail | 🟡 Sedang |
| 8 | Lintas Stage | RBAC log history — beberapa log tertentu hanya visible ke Finance | Finance | Tambah `visible_to_roles` filter di `historyLogs` display, sembunyikan log finansial dari non-Finance | 🟠 Rendah |

---

## ⏳ Menunggu Konfirmasi / Waiting for Decision

> Fitur-fitur ini **tidak bisa langsung dikerjakan** karena masih ada pertanyaan bisnis yang perlu dijawab terlebih dahulu.

| # | Stage | Fitur / Isu | Sumber | Pertanyaan yang Harus Dijawab | Pihak yang Memutuskan |
|---|-------|-------------|--------|-------------------------------|----------------------|
| 1 | 1 (PO/SPK) | Field wajib & dokumen wajib upload saat buat job baru | Marketing | Apa saja field yang wajib diisi? Dokumen apa saja yang wajib diupload? | Marketing + Admin |
| 2 | 1 (PO/SPK) | Kalkulator PPN — apakah hasil disimpan atau hanya tampilan? | Finance | Apakah `nilai` di DB adalah nilai SEBELUM atau SESUDAH PPN? | Finance + Management |
| 3 | 1 & 3 | Revisi PO dalam periode pajak — mekanisme eskalasi ke Finance | Finance | Kriteria baku "pengecualian" yang boleh diambil? Batas waktu revisi PO? | Finance (Mas Deka) |
| 4 | 3 (Jadwal) | Business rule reschedule: kapan boleh, siapa yang approve? | Marketing | Trigger reschedule? Siapa yang menyetujui? Berapa kali boleh reschedule? | Management + Marketing |
| 5 | 4b (Aktualisasi) | Trigger & PIC aktualisasi unit kondisional | Marketing | Kapan aktualisasi unit harus dilakukan? Siapa PIC-nya? Output dokumennya apa? | Admin + Tim RU |
| 6 | 5 (LHPP) | Case khusus bypass langsung ke Manager dari LHPP | Marketing | Apa saja "case khusus" yang boleh bypass stage review? Siapa yang boleh trigger? | Management |
| 7 | 7 (Verifikasi Dinas) | PIC Verifikasi ke Dinas: Admin atau Manager? | Marketing | Swimlane stage 7 saat ini: Admin. Marketing minta evaluasi ulang. Sudah ada keputusan? | Management + Admin |
| 8 | 9b (Baru) | Stage baru: Klarifikasi sebelum Invoice — perlu dibuat atau tidak? | Finance | Apakah stage 9b resmi ditambahkan? Siapa PIC-nya? Poin apa yang diverifikasi? | Finance + Management |
| 9 | 10 (Penagihan) | Edit Invoice/Faktur Pajak: versi revisi (audit trail) atau overwrite? | Finance | Mekanisme edit: buat versi baru + simpan history, atau replace file lama? | Finance |
| 10 | 12 (Selesai) | Kriteria Job dinyatakan Closed | Marketing | Kondisi apa yang harus terpenuhi agar job bisa di-close? Siapa yang bisa trigger Close? | Management + Finance |
| 11 | Lintas Stage | Level akses akun Mas Terzha — apakah "Manager & Spesialis" perlu dipecah? | Finance | Apakah swimlane Manager & Spesialis dijadikan 2 lane terpisah? Role apa untuk Mas Terzha? | Management |

---

## ⚠️ Konflik Antar Divisi (Wajib Diselaraskan Sebelum Implementasi)

| # | Stage | Isu Konflik | Posisi Marketing | Posisi Finance | Status Resolusi |
|---|-------|-------------|------------------|----------------|-----------------|
| 1 | 2 (Verifikasi) | Visibilitas nilai kontrak/harga PO untuk Admin | Admin **TIDAK** boleh melihat harga PO/SPK | Admin **BOLEH** melihat Nilai Kontrak; Tim RU yang dibatasi | ❌ Belum ada keputusan — perlu sesi klarifikasi bersama |

---

## 📌 Catatan: POV Yang Belum Masuk

Sheet **POV Admin** dan **POV Tim Riksa Uji** pada Excel masih kosong (template belum diisi):

> ⚠️ Seluruh masukan dari perspektif Admin dan Tim Inspektur/Tim Ahli **belum terkumpul**. Masukan Tahap 3 masih ditunggu. Setelah ada, rekap ini perlu diperbarui lagi.

---

## 🗂️ Ringkasan Eksekutif

| Kategori | Jumlah Item |
|----------|-------------|
| ✅ Sudah Diperbaiki | **12** |
| 🔧 Perlu Diperbaiki (siap dikerjakan) | **8** |
| ⏳ Menunggu Konfirmasi | **11** |
| ⚠️ Konflik Antar Divisi | **1** |
| **Total** | **32** |

**Bottom line**: ~37% sudah selesai. Hampir sepertiga dari semua item masih menunggu keputusan bisnis dari management/lintas divisi — **jangan dikerjakan dulu** sebelum ada jawaban, risikonya rework.
