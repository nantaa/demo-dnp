# Refinement Plan: User & Manager Capabilities Matrix (SLA Performance, Delayed v3, & Missing Features)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine `PROJECT_CAPABILITIES_AND_BOUNDARIES.html` (and public mirror) to explicitly state that the system cannot track individual performance based on SLA / on-time completion yet, reframe v3 (20 stages) as "Ditunda (Delayed) karena kompleksitas alur", and include newly audited operational features (Multi-Unit tracking, WhatsApp escalation, and E-Sign limitation).

**Architecture:** Single-file HTML5 document with responsive Tailwind styling and client-side filtering, verified by an updated Node.js TDD test suite (`tests/capabilities_matrix.test.js`).

**Tech Stack:** HTML5, TailwindCSS CDN, Vanilla JS, Node.js Test Runner.

## Global Constraints

- Scope: Strictly tailored for User (Staff Operasional) and Manager.
- Terminology: Professional Bahasa Indonesia, clear and manageable for non-technical leadership.
- Tone: Direct, honest, no sugarcoating.
- TDD Order: Update failing tests in `tests/capabilities_matrix.test.js` before modifying the HTML file.

---

### Task 1: Update TDD Test Specification (tests/capabilities_matrix.test.js)

**Files:**
- Modify: `tests/capabilities_matrix.test.js`

**Interfaces:**
- Asserts that:
  1. HTML explains that performance cannot be tracked based on SLA / "on-time job done" yet (`SLA` & `kinerja` / `on-time`).
  2. HTML phrases v3 (20 Tahap) as "Ditunda" / "Delayed" due to workflow complexity.
  3. HTML documents Multi-Unit tracking and WhatsApp escalation under capabilities.
  4. HTML documents absence of Certified E-Sign / Tanda Tangan Digital Kriptografis under limitations.

- [ ] **Step 1: Write the failing test**

```javascript
  test('HTML documents SLA-based on-time performance limitation and delayed v3 status', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.toLowerCase().includes('on-time') || content.toLowerCase().includes('tepat waktu'), 'Must document on-time job performance limitation');
    assert.ok(content.toLowerCase().includes('ditunda') || content.toLowerCase().includes('delay'), 'Must document v3 as delayed due to complexity');
    assert.ok(content.includes('Multi-Unit') || content.includes('Banyak Unit'), 'Must document multi-unit capability');
    assert.ok(content.includes('WhatsApp') || content.includes('Wablas'), 'Must document WhatsApp escalation capability');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/capabilities_matrix.test.js`
Expected: FAIL.

- [ ] **Step 3: Update HTML files**

Edit `public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html` and mirror to `PROJECT_CAPABILITIES_AND_BOUNDARIES.html`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/capabilities_matrix.test.js`
Expected: PASS.

- [ ] **Step 5: Verify entire test suite**

Run: `node --test tests/*.test.js`
Expected: PASS (all 340 tests pass).

---

### Task 2: Update HTML Document Content & Narrative

**Sections to Refine:**
1. **Belum Ada Penilaian Kinerja Berbasis SLA / "On-Time Job Done":**
   - Clarify that SLA badges on cards are operational early-warning signals for bottlenecks, NOT individual staff scorecards.
   - Explain why: delays at Stage 8 (Disnaker) or Stage 11 (Client Payment) involve external parties, so individual punctuality scoring is not yet implemented.
2. **Pembaruan Versi 3 (v3 - 20 Tahap) Ditunda (Delayed):**
   - Change wording from "tidak digunakan" to "Ditunda (Delayed) karena tingginya kompleksitas alur kerja proyek lapangan".
   - Management prioritized stabilizing the 16-stage pipeline before reconsidering 20 stages.
3. **Tambahan Fitur yang BISA Dilakukan (Yang Sebelumnya Belum Tertulis):**
   - **Pelacakan Multi-Unit Peralatan (Unit Tracking):** Satu nomor SPK/pekerjaan dapat memuat banyak unit alat riksa uji (crane, boiler, lift, bejana tekan) dengan kartu pemantauan per unit.
   - **Eskalasi Notifikasi Otomatis via WhatsApp (Wablas):** Notifikasi genting yang belum dibaca lebih dari 30 menit dikirimkan otomatis ke nomor WhatsApp penanggung jawab.
4. **Tambahan Batasan (Yang BELUM Bisa Dilakukan):**
   - **Belum Ada Tanda Tangan Digital Bersertifikasi (E-Sign):** Dokumen Berita Acara dan laporan masih menggunakan scan tanda tangan/stempel fisik, belum menggunakan sertifikat digital elektronik BSrE/Peruri.
