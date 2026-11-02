# End-User Visual Manual with Live Production Screencaptures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 100% end-user focused, visual step-by-step user manual (`USER_MANUAL_END_USER.md` and compiled `USER_MANUAL_END_USER.pdf`) modeled directly after the BigBuilder User Guide reference, featuring authentic high-resolution Playwright screencaptures from the live production system (`https://monitor-dnp.deltaindo.co.id/`), an official Daftar Gambar, clear access link callouts, zero developer jargon, and structured field-by-field instructions.

**Architecture:** A 4-phase test-driven pipeline: (1) Headless Playwright automated capture suite authenticating into `https://monitor-dnp.deltaindo.co.id/` to capture 18 high-resolution UI screenshots across all production menus and job detail drawers; (2) End-user manual authored in Indonesian adhering strictly to non-technical, task-oriented user guide conventions with prominent `https://monitor-dnp.deltaindo.co.id/` access badges; (3) Print compilation engine transforming Markdown + screenshots into a publication-grade PDF; (4) Verification against the BigBuilder reference style.

**Tech Stack:** Playwright (`playwright` npm package), Node.js, HTML5/CSS Paged Media, Microsoft Edge Headless (`--headless=new --print-to-pdf`), Jest/Node test runner.

## Global Constraints

- **Live Production URL:** Prominently feature `https://monitor-dnp.deltaindo.co.id/` in the Document Header, Section 1 (Akses Sistem), and Quick Reference Cards.
- **Audience:** Strictly END-USERS (Marketing, Admin, Inspektur Lapangan, Kadiv RU, Finance). Zero developer jargon (prohibited: `Laravel`, `React`, `ORM`, `Eloquent`, `Bcrypt`, `CSRF`, `middleware`, `controller`, `sanitizeAndDeduplicateFilename`, etc.).
- **Visual Evidence:** Every single core page, stage form, and drawer must include a numbered figure (`Gambar N: [Judul]`) with actual high-resolution screencaptures taken from the live production site.
- **Reference Standard:** Structure must strictly replicate the BigBuilder User Guide: Judul & Sampul → Daftar Isi → Daftar Gambar → Pendahuluan → Akses & Login (`https://monitor-dnp.deltaindo.co.id/`) → Panduan Langkah-demi-Langkah per Menu & Stage (Tabel Field, Tombol, Contoh) → FAQ & Troubleshooting Pengguna.
- **TDD Enforcement:** Automated tests must verify screenshot existence, absence of technical jargon, presence of the production link, and PDF integrity before asserting completion.
- **Pause Point:** Pause for user approval of this plan before executing the tasks.

---

### Task 1: Live Production Screenshot Automation via Playwright (TDD)

**Files:**
- Create: `tests/manual/screenshotSuite.test.js`
- Create: `scripts/captureLiveScreenshots.js`
- Output: `docs/screenshots/fig01_login.png` through `fig18_users_management.png`

**Interfaces:**
- Consumes: Live application at `https://monitor-dnp.deltaindo.co.id/` authenticated as Superadmin.
- Produces: 18 crisp, authentic production screenshots (1280x800 desktop viewport).

- [ ] **Step 1: Write the failing test for screenshot generation**

```javascript
// tests/manual/screenshotSuite.test.js
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots');

const EXPECTED_FIGURES = [
  'fig01_login.png',
  'fig02_dashboard_kpi.png',
  'fig03_kanban_board.png',
  'fig04_daftar_job.png',
  'fig05_create_job.png',
  'fig06_job_detail_overview.png',
  'fig07_stage1_po_form.png',
  'fig08_stage2_verify_form.png',
  'fig09_stage3_schedule_form.png',
  'fig10_stage4_inspection_form.png',
  'fig11_stage5_lhpp_form.png',
  'fig12_stage6_review_form.png',
  'fig13_stage8_disnaker_form.png',
  'fig14_stage10_invoice_form.png',
  'fig15_pelaporan.png',
  'fig16_reminder_suket.png',
  'fig17_alat_skp_inventory.png',
  'fig18_users_management.png'
];

console.log('--- TESTING SCREENSHOT AVAILABILITY ---');
assert(fs.existsSync(SCREENSHOT_DIR), 'FAIL: Screenshot directory does not exist');

for (const fig of EXPECTED_FIGURES) {
  const figPath = path.join(SCREENSHOT_DIR, fig);
  assert(fs.existsSync(figPath), `FAIL: Missing screenshot ${fig}`);
  const stat = fs.statSync(figPath);
  assert(stat.size > 20000, `FAIL: Screenshot ${fig} too small (${stat.size} bytes)`);
}

console.log('PASS: All 18 live UI screenshots are present and valid!');
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/manual/screenshotSuite.test.js`
Expected: FAIL with missing screenshots.

- [ ] **Step 3: Implement `scripts/captureLiveScreenshots.js`**
  - Authenticates into `https://monitor-dnp.deltaindo.co.id/login`.
  - Navigates through each menu: `/`, `/kanban`, `/jobs`, `/jobs/create`, `/pelaporan`, `/reminder-suket`, `/inventory`, `/users`, `/profile`.
  - Opens the Job Detail Sheet drawer on Kanban and steps through stage forms (Stage 1, 2, 3, 4, 5, 6, 8, 10).
  - Captures clean, unblurred PNGs into `docs/screenshots/`.

- [ ] **Step 4: Execute capture script and verify test passes**
Run: `node scripts/captureLiveScreenshots.js`
Run: `node tests/manual/screenshotSuite.test.js`
Expected: PASS with 18 authentic live screenshots.

---

### Task 2: Authoring the End-User Manual (`USER_MANUAL_END_USER.md`)

**Files:**
- Create: `tests/manual/userManualContent.test.js`
- Create: `USER_MANUAL_END_USER.md`

**Interfaces:**
- Consumes: The 18 captured PNG files, official portal URL `https://monitor-dnp.deltaindo.co.id/`, and end-user workflows.
- Produces: Comprehensive Indonesian user manual strictly following the BigBuilder guide format.

- [ ] **Step 1: Write failing content verification test**
  - Asserts existence of:
    - Cover page with `https://monitor-dnp.deltaindo.co.id/`.
    - `Daftar Isi`.
    - `Daftar Gambar` listing all 18 figures.
    - Zero developer terms (`Laravel`, `React`, `ORM`, `Eloquent`, `Bcrypt`, `CSRF`, `middleware`, `controller`).
    - Numbered action steps ("Langkah 1", "Langkah 2") and field definition tables in each chapter.

- [ ] **Step 2: Write Section 1 – Sampul, Daftar Isi & Daftar Gambar**
  - Formal document cover with PT Delta Nusantara Persada branding and direct access link.
  - Linked table of contents and list of figures.

- [ ] **Step 3: Write Section 2 – Pendahuluan & Gambaran Alur Kerja**
  - Penjelasan fungsi sistem dari kacamata bisnis riksa uji (bukan software engineering).
  - Penjelasan alur 12 tahapan utama secara visual dan mudah dipahami staf.

- [ ] **Step 4: Write Section 3 – Akses Sistem & Navigasi Antarmuka**
  - **Akses Tautan:** Banner resmi `https://monitor-dnp.deltaindo.co.id/`.
  - **Gambar 1: Halaman Login.** Cara masuk sistem, ketentuan email resmi `@deltaindo.co.id`, dan opsi "Remember me".
  - **Gambar 2: Dashboard Superadmin & KPI.** Membaca kartu Total Pipeline, Job Aktif, Total Overdue SLA, dan grafik beban kerja.
  - **Gambar 3: Papan Visual Kanban.** Memahami 14 kolom stage, lencana status, indikator kendala dinas (`s8_delay_reason`), dan cara membuka detail job.
  - **Gambar 4: Halaman Daftar Job.** Cara mencari nama PT klien, filter bidang alat, dan sorting tanggal.

- [ ] **Step 5: Write Section 4 – Panduan Langkah-demi-Langkah Tahapan Riksa Uji (Stage 1 – 12)**
  - **Stage 1 (PO/SPK) [Gambar 5 & 7]:** Tombol `+ Job Baru`, memilih 514 kota/kabupaten, kalkulator real-time PPN 12%, dan unggah berkas wajib PO.
  - **Stage 2 (Verifikasi Dokumen) [Gambar 8]:** Digital checklist, tombol OK/Tidak/NA, dan alur permohonan Bypass Manager jika berkas darurat.
  - **Stage 3 (Penjadwalan & Surat Tugas) [Gambar 9]:** Multi-day schedule picker, rekomendasi pintar inspektur ber-SKP aktif, alokasi alat uji, unduh otomatis Surat Tugas & Form Riksa Word.
  - **Stage 4 (Pelaksanaan RU) [Gambar 10]:** Verifikasi jumlah unit fisik, prosedur jika unit mismatch di lapangan, foto uji kamera HP, dan unggah BAP.
  - **Stage 5 (Penyusunan LHPP) [Gambar 11]:** Pengisian matriks kelaikan (laik/tidak laik), catatan rekomendasi teknis, multi-link cloud drive per unit, opsi Kirim Approval vs Bypass Langsung.
  - **Stage 6 (Review Laporan Teknis) [Gambar 12]:** Otoritas Kadiv RU menyetujui (Approve), menyetujui bersyarat, atau menolak (Reject) dengan catatan revisi.
  - **Stage 7 & 8 (Proses Disnaker) [Gambar 13]:** Bundel dokumen dinas, argo mundur 30 hari EWS, pencatatan log koordinasi dinas, penandaan status kendala.
  - **Stage 9 (Pengesahan Suket):** Pencatatan nomor suket dinas, tanggal terbit, masa berlaku, dan argo H-90.
  - **Stage 10 (Penagihan Finance) [Gambar 14]:** Input nomor invoice, TOP hari, aturan mutlak unggah file invoice PDF, slot Faktur Pajak DJP, peringatan tgl 15.
  - **Stage 11 & 12 (Serah Terima & Penutupan):** Handover berkas ke klien, upload bukti tanda terima, konfirmasi lunas, dan kriteria penutupan job permanen.

- [ ] **Step 6: Write Section 5 – Panduan Modul Pendukung & Administrasi**
  - **Modul Pelaporan [Gambar 15]:** Menarik rekapitulasi pekerjaan ke Excel.
  - **Modul Reminder Suket [Gambar 16]:** Memantau Suket Klien (H-90), SKP Ahli K3 (H-60), dan Kalibrasi Alat Uji (H-30).
  - **Modul Inventaris Alat [Gambar 17]:** Mengelola 23 instrumen uji dan memperbarui sertifikat kalibrasi KAN.
  - **Modul Manajemen Pengguna [Gambar 18]:** Pengaturan akun staf, nomor WhatsApp notifikasi, dan hak akses pengerjaan stage.

- [ ] **Step 7: Write Section 6 – Tanya Jawab & Kendala Operasional User (FAQ)**
  - Jawaban praktis atas kendala tombol abu-abu, file invoice ditolak, mismatch unit di lapangan, dan lupa kata sandi.

- [ ] **Step 8: Run content test to verify compliance**
Run: `node tests/manual/userManualContent.test.js`
Expected: PASS.

---

### Task 3: PDF Generation Pipeline with Embedded Live Figures

**Files:**
- Create: `scripts/generateUserManualPdf.js`
- Create: `scripts/userManualPrintTemplate.html`
- Output: `USER_MANUAL_END_USER.pdf` and copy as `user manual.pdf`

**Interfaces:**
- Consumes: `USER_MANUAL_END_USER.md` and live screenshots in `docs/screenshots/`.
- Produces: Polished, book-quality PDF with embedded figures, captions, running headers, and page breaks.

- [ ] **Step 1: Design print stylesheet for figures and captions**
  - Figures centered with 1px border, subtle shadow, and caption styling (`Gambar N: [Keterangan]`).
  - No page-break separation between image and its caption (`break-inside: avoid`).
  - Access link banner with vibrant blue background and QR/link indicator.

- [ ] **Step 2: Implement PDF generation script**
  - Injects live screenshots and styles into HTML.
  - Compiles via Microsoft Edge Headless engine (`--headless=new`).

- [ ] **Step 3: Run generation script & verify output**
Run: `node scripts/generateUserManualPdf.js`
Expected: Successful generation of `USER_MANUAL_END_USER.pdf` (>2MB due to live screenshots).

---

### Task 4: Final Review & Quality Audit

- [ ] Verify PDF visually against the BigBuilder reference document.
- [ ] Ensure all 18 live figures are sharp, properly labeled, and referenced in "Daftar Gambar".
- [ ] Confirm `https://monitor-dnp.deltaindo.co.id/` is present in all key access sections.
- [ ] Confirm zero developer jargon remains anywhere in the text.
- [ ] Present completed work to the user.
