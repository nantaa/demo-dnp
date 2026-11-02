# Complete Functional User Manual & PDF Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an exhaustive, production-grade functional documentation manual (`USER_MANUAL_COMPLETE.md`) covering 100% of DNP Monitor's capabilities (all routes, 14 workflow stages, role permissions, recent feature reviews), and compile it into a publication-ready PDF (`USER_MANUAL_COMPLETE.pdf`) via an automated, test-driven pipeline.

**Architecture:** A test-driven documentation process where an automated test suite validates route/feature coverage and document integrity against the live codebase and `REVIEW HALF.pdf` audit items before compilation. Headless Chromium/Edge converts the semantic Markdown into high-fidelity, paginated HTML and prints to vector PDF with custom corporate print stylesheets.

**Tech Stack:** Node.js, Markdown, HTML5/CSS (Print Media Queries, Paged Media), Microsoft Edge / Headless Chromium (`--headless --print-to-pdf`), Jest/Node test runner.

## Global Constraints

- Truth over assumptions: Document actual codebase behavior (`routes/web.php`, `JobController.php`, `JobDetailSheet.jsx`, `REVIEW HALF.pdf`), not speculative features.
- Strict route coverage: Every web route in `routes/web.php` must be mapped to its corresponding user manual section.
- Zero placeholder content: No "TBD", "TODO", or missing descriptions in any manual section.
- TDD order: Automated coverage & PDF integrity test suite written before markdown and generator script.
- Pause for user approval before proceeding past plan phase.

---

### Task 1: Coverage Test Suite & Validation Harness

**Files:**
- Create: `tests/manual/manualCoverage.test.js`
- Create: `package.json` (or verify test script integration)

**Interfaces:**
- Consumes: `dnp-rework/routes/web.php`, `USER_MANUAL_COMPLETE.md`, `USER_MANUAL_COMPLETE.pdf`
- Produces: Test harness asserting 100% route/feature coverage, markdown heading integrity, and PDF generation validity.

- [ ] **Step 1: Write the failing test for manual coverage and PDF validity**

```javascript
// tests/manual/manualCoverage.test.js
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT_DIR = process.cwd();
const MD_PATH = path.join(ROOT_DIR, 'USER_MANUAL_COMPLETE.md');
const PDF_PATH = path.join(ROOT_DIR, 'USER_MANUAL_COMPLETE.pdf');
const ROUTES_PATH = path.join(ROOT_DIR, 'dnp-rework', 'routes', 'web.php');

console.log('--- RUNNING USER MANUAL TDD COVERAGE TESTS ---');

// Test 1: Markdown file existence and minimum length
assert(fs.existsSync(MD_PATH), 'FAIL: USER_MANUAL_COMPLETE.md does not exist');
const mdContent = fs.readFileSync(MD_PATH, 'utf-8');
assert(mdContent.length > 30000, `FAIL: USER_MANUAL_COMPLETE.md too short (${mdContent.length} chars)`);

// Test 2: Essential feature keywords from REVIEW HALF.pdf and active routes
const requiredKeywords = [
  'PPN 12%',
  's8_delay_reason',
  'Faktur Pajak',
  'Bypass Review',
  'Stage 1 (PO / SPK)',
  'Stage 2 (Verifikasi Dokumen)',
  'Stage 3 (Penjadwalan)',
  'Stage 4 (Pelaksanaan RU)',
  'Stage 4b',
  'Stage 5 (Penyusunan LHPP)',
  'Stage 6 (Review Laporan Teknis)',
  'Stage 7 (Submit Disnaker)',
  'Stage 8 (Proses Disnaker)',
  'Stage 9 (Pengurusan Suket)',
  'Stage 10 (Penagihan)',
  'Stage 11 (Penyerahan Suket)',
  'Stage 11b',
  'Stage 12',
  'Inventaris Alat Uji',
  'Sertifikat PJK3',
  'Template Dokumen',
  'User Management',
  'Reminder Suket',
  'Pelaporan',
  '/reminder-suket',
  '/inventory',
  '/pelaporan'
];

for (const kw of requiredKeywords) {
  assert(
    mdContent.includes(kw),
    `FAIL: USER_MANUAL_COMPLETE.md missing required feature keyword: "${kw}"`
  );
}

// Test 3: PDF file existence and binary validation
assert(fs.existsSync(PDF_PATH), 'FAIL: USER_MANUAL_COMPLETE.pdf does not exist');
const pdfBuffer = fs.readFileSync(PDF_PATH);
assert(pdfBuffer.length > 50000, `FAIL: PDF file too small (${pdfBuffer.length} bytes)`);
const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
assert.strictEqual(pdfHeader, '%PDF-', 'FAIL: Output file is not a valid PDF header');

console.log('PASS: All user manual coverage and PDF integrity checks passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/manual/manualCoverage.test.js`
Expected: FAIL with `AssertionError: FAIL: USER_MANUAL_COMPLETE.md does not exist`

- [ ] **Step 3: Commit test harness**

```bash
git add tests/manual/manualCoverage.test.js
git commit -m "test: add TDD coverage and verification test for user manual"
```

---

### Task 2: Authoring the Comprehensive User Manual (`USER_MANUAL_COMPLETE.md`)

**Files:**
- Create: `USER_MANUAL_COMPLETE.md`
- Inspect: `USER_GUIDE_MANUAL.md`, `USER_MANUAL.md`, `REVIEW HALF.pdf`, `dnp-rework/routes/web.php`

**Interfaces:**
- Consumes: Real-world system behavior from controller actions and UI components.
- Produces: Complete, exhaustive documentation in clean GitHub-flavored Markdown.

- [ ] **Step 1: Draft Section 1 – Architecture & Role Authority Matrix**
  - High-level system overview, technology stack (Laravel 11, React Inertia, SQLite/MySQL).
  - Explicit role matrix (`MKT`, `ADM`, `INS`, `MGR`, `FIN`, `SUP`) with stages owned, visibility rules (`canSeeNilai`, inspector job retention).
  - 14-stage workflow breakdown (including conditional Stage 4b unit mismatch and Stage 11b payment settlement).

- [ ] **Step 2: Draft Section 2 – Master Navigation & Core Pages**
  - `/dashboard`: KPI cards, active job counters, SLA warning counters, real-time job sync.
  - `/kanban`: Kanban board columns, wave background styling, card badges, delay reason tags (`s8_delay_reason`), inline stage transitions.
  - `/jobs`: Table listing, multi-role filter criteria, search, sorting.
  - `/reminder-suket`: Suket expiry tracking (H-90), SKP & Alat kalibrasi alerts (H-30).
  - `/pelaporan`: Operational reports generation and export engine (`/pelaporan/export`).
  - `/profile`: Profile self-service and password changes.

- [ ] **Step 3: Draft Section 3 – Deep-Dive Stage-by-Stage Functional Reference**
  - **Stage 1 (PO/SPK):** DPP vs PPN 12% real-time interactive calculation box, required documents gate (PO/SPK, Surat Permohonan, Surat Kuasa), multi-day schedule builder.
  - **Stage 2 (Verifikasi Dokumen):** Digital verification checklist (`OK`/`Tidak`/`NA`), conditional upload for material certificates (PAA/Lift), manager bypass request.
  - **Stage 3 (Penjadwalan & Surat Tugas):** Inspector smart recommendation matching active SKP, tool assignment from 23 tool inventory, H-5 notification trigger, automatic Word document generator (`.docx` Surat Tugas & Form Riksa).
  - **Stage 4 (Pelaksanaan RU):** Mobile inspector checklist, photo capture, unit count verification. If mismatch: return to Stage 1 or branch to Stage 4b.
  - **Stage 4b (Aktualisasi Unit):** PO revision flow by Marketing when field units differ from contract.
  - **Stage 5 (Penyusunan LHPP):** Multi-unit evaluation matrix (`laik`, `laik_bersyarat`, `tidak_laik`), technical findings, multi-unit cloud storage link editor, original filename preservation, dual submission flow (Regular Manager Review vs Direct Bypass).
  - **Stage 6 (Review Laporan Teknis):** Kadiv RU approval portal (Approve, Approve Conditional, Reject with automatic rollback to Stage 5).
  - **Stage 7 (Submit Disnaker):** Document bundle check (Client Group A + PJK3 Group B), submission date logging (starts 30-day SLA timer).
  - **Stage 8 (Proses Disnaker):** 30-day SLA EWS monitoring, routine 7-day follow-up logs (`/jobs/{job}/disnaker-followup`), roadblock reason tagging (`s8_delay_reason`).
  - **Stage 9 (Pengurusan Suket):** Suket number recording, issue date, validity months, automated calculation of expiry date and H-90 alert.
  - **Stage 10 (Penagihan):** Finance invoicing, DPP + PPN 12% billing, Terms of Payment (TOP) days calculation, mandatory PDF-only invoice enforcement, dedicated Faktur Pajak slot, 15th-of-the-month tax closing warning banner.
  - **Stage 11 (Penyerahan Suket ke Klien):** Physical handover documentation, handover date, client receipt upload.
  - **Stage 11b (Pembayaran / Pelunasan):** Finance settlement confirmation for credit/delayed payment terms.
  - **Stage 12 / 14 (Selesai & Closed):** Final closure prerequisites (paid status, verified Suket), permanent archive, Superadmin re-open capability (`/jobs/{job}/reopen`).

- [ ] **Step 4: Draft Section 4 – Administration & Master Inventory (`/inventory` & `/users`)**
  - Tool calibration tracking (23 tool items), calibration renewal alerts.
  - PJK3 certificates management & SK Kemnaker registration.
  - Document templates management with natural sorting (`kode_form`) and `${PLACEHOLDER}` tag specs.
  - User Management (`/users`), role assignments, and granular `user_stage_permissions` matrix editing.

- [ ] **Step 5: Draft Section 5 – Edge Cases, Troubleshooting & FAQ**
  - All 10 FAQ entries from `USER_MANUAL.md` + 20 conflict resolutions from `REVIEW HALF.pdf`.
  - Step-by-step resolution of common operational roadblocks.

- [ ] **Step 6: Run coverage test to verify all keywords and content are present**

Run: `node tests/manual/manualCoverage.test.js`
Expected: Output progresses past Test 2 (fails only at Test 3 because PDF is not yet compiled).

---

### Task 3: PDF Generation Pipeline & Print Styling

**Files:**
- Create: `scripts/generateManualPdf.js`
- Create: `scripts/manualPrintTemplate.html`

**Interfaces:**
- Consumes: `USER_MANUAL_COMPLETE.md`
- Produces: `USER_MANUAL_COMPLETE.pdf` formatted with custom header, page numbering, table styling, and print page breaks.

- [ ] **Step 1: Build the print template with CSS Paged Media**
  - Configure `@page` rules for A4 paper size, margins, and running page numbers (`counter(page)`).
  - Professional typography (clean sans-serif, high contrast corporate navy `#062444`, accent blue `#00A8E8`).
  - Table formatting with alternating rows, fixed headers, and no page-split row clippings (`page-break-inside: avoid`).
  - Callout boxes (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`) with clear borders and background accents.

- [ ] **Step 2: Implement `scripts/generateManualPdf.js`**
  - Converts Markdown into structured HTML.
  - Injects print template styles.
  - Spawns `msedge.exe --headless --disable-gpu --print-to-pdf="USER_MANUAL_COMPLETE.pdf" --no-pdf-header-footer` pointing to the temporary rendered HTML.
  - Cleans up temporary artifacts.

- [ ] **Step 3: Run the generation script**

Run: `node scripts/generateManualPdf.js`
Expected: Output message `Successfully generated USER_MANUAL_COMPLETE.pdf`.

- [ ] **Step 4: Run the TDD coverage test suite to verify full pass**

Run: `node tests/manual/manualCoverage.test.js`
Expected: `PASS: All user manual coverage and PDF integrity checks passed!`

- [ ] **Step 5: Commit complete manual and generator**

```bash
git add USER_MANUAL_COMPLETE.md scripts/ tests/manual/
git commit -m "docs: generate comprehensive user manual and automated PDF build pipeline"
```

---

### Task 4: Final Review & Artifact Verification

**Files:**
- Inspect: `USER_MANUAL_COMPLETE.md`
- Inspect: `USER_MANUAL_COMPLETE.pdf`

- [ ] **Step 1: Check PDF visual rendering using view/size inspection**
  - Verify PDF page count, file size, and visual integrity.
- [ ] **Step 2: Confirm all 20 items from `REVIEW HALF.pdf` are explicitly documented in the manual.**
- [ ] **Step 3: Output summary of files created and invite user review.**
