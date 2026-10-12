# Finance Dashboard Integrity & Single Invoice Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve data discrepancies on the Finance Dashboard (eliminate double-counting between `siapTagih` and `piutangBerjalan`, fix `tandaTerimaPending`) and merge the 3 separate upload slots (Invoice, Kwitansi, Faktur Pajak) in Stage 10 of `JobDetailSheet.jsx` into a single consolidated upload slot.

**Architecture:** 
1. In `Dashboard/Index.jsx`: Align Finance Dashboard `piutangBerjalan` to strictly cover active billed unpaid stages (11, 14, 15), preventing Stage 10 draft jobs from double-counting in both `siapTagih` and `piutangBerjalan`. Correct `tandaTerimaPending` to focus on Stage 15 delivery and check uploaded document evidence.
2. In `Constants.js` & `JobDetailSheet.jsx`: Consolidate Stage 10 document upload into a single unified slot (`Invoice, Kwitansi & Faktur Pajak`) while preserving full backward-compatibility for previously uploaded legacy document types (`Invoice (PDF)`, `Kwitansi`, `Faktur Pajak`).
3. Maintain zero regression on RU Dashboard/Kanban (strictly untouched as instructed).

**Tech Stack:** React 18, Inertia.js, TailwindCSS, Laravel 10 / PHP 8.2, Node.js built-in test runner (`node --test`).

## Global Constraints
- Do NOT modify Tim RU Dashboard or Kanban Board `isINS` logic (explicitly excluded by user).
- Follow TDD order: Plan → Test → Implement → Review → Verify → Document.
- No duplicate writes or additional server resource overhead.
- Ensure 100% backward compatibility for existing uploaded documents in database.

---

### Task 1: Write TDD Automated Tests for Finance Dashboard & Unified Upload

**Files:**
- Create: `tests/finance_dashboard_and_single_upload.test.js`

**Interfaces:**
- Consumes: `dnp-rework/resources/js/Constants.js`, `dnp-rework/resources/js/Pages/Dashboard/Index.jsx`, `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Produces: Test assertions for single Stage 10 upload slot, backward compatible doc matching, and Finance Dashboard stage isolation.

- [ ] **Step 1: Write the failing test**
Create `tests/finance_dashboard_and_single_upload.test.js` covering:
1. `DOC_TYPES_BY_STAGE[10]` contains unified upload type `'Invoice, Kwitansi & Faktur Pajak'` with length 1.
2. `JobDetailSheet.jsx` Stage 10 renders single unified slot and allows legacy document types in chip rendering.
3. `JobDetailSheet.jsx` Stage 10 gating `hasInvoiceDoc10` recognizes the new combined type.
4. `Dashboard/Index.jsx` Finance stats calculation isolates `piutangBerjalan` from Stage 10 (no double-count with `siapTagih`).
5. `Dashboard/Index.jsx` `tandaTerimaPending` targets Stage 15 and checks uploaded documents.

- [ ] **Step 2: Run test to verify failure**
Run: `node --test tests/finance_dashboard_and_single_upload.test.js`
Expected: FAIL on unified slot and stage isolation assertions.

---

### Task 2: Implement Finance Dashboard Calculation Fixes in `Dashboard/Index.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Dashboard/Index.jsx:220-275`
- Modify: `dnp-rework/resources/js/Pages/Dashboard/Index.jsx:1565-1575`

**Interfaces:**
- Consumes: `jobs` array from Inertia props
- Produces: Corrected `stats` object with isolated `piutangBerjalan` and accurate `tandaTerimaPending`.

- [ ] **Step 1: Update `piutangBerjalan` logic**
In `Dashboard/Index.jsx`:
Change:
```javascript
const isUnpaid = (j) => !j.paid && j.payment_status !== 'paid' && j.s14_payment_status !== 'paid';
const hasInvoice = (j) => Boolean(j.invoice_no || [11, 14, 15].includes(j.stage) || (j.stage === 10 && j.invoice_no));
const piutangBerjalan = jobs.filter(j => hasInvoice(j) && isUnpaid(j) && j.stage < 16);
```
To:
```javascript
const isUnpaid = (j) => !j.paid && j.payment_status !== 'paid' && j.s14_payment_status !== 'paid';
// Piutang Berjalan: Active billed jobs in stages 11, 14, 15 that are unpaid. Stage 10 belongs strictly to siapTagih.
const piutangBerjalan = jobs.filter(j => [11, 14, 15].includes(j.stage) && isUnpaid(j));
```

- [ ] **Step 2: Update `tandaTerimaPending` logic**
In `Dashboard/Index.jsx`:
Change:
```javascript
const tandaTerimaPending = jobs.filter(j => (j.stage === 11 || j.stage === 15) && !j.tanda_terima_kembali);
```
To:
```javascript
const tandaTerimaPending = jobs.filter(j => 
    j.stage === 15 && 
    !j.tanda_terima_kembali && 
    !(j.documents || []).some(d => d.stage === 15 && ['Tanda Terima Suket', 'Dokumen Penyerahan'].includes(d.type))
);
```

- [ ] **Step 3: Update Table Header in `FinDashboard`**
In `Dashboard/Index.jsx:1568`:
Update subheader from `<h3>Invoice Belum Lunas (Tahap 10 – 15)</h3>` to `<h3>Invoice Belum Lunas (Tahap 11 – 15)</h3>` to accurately reflect stage boundaries.

- [ ] **Step 4: Run test to verify Finance Dashboard tests pass**
Run: `node --test tests/finance_dashboard_and_single_upload.test.js`
Expected: Finance Dashboard assertions PASS.

---

### Task 3: Unify Stage 10 Document Upload into a Single Slot in `Constants.js` & `JobDetailSheet.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Constants.js:126`
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:260-335` (UploadSlot component)
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:873-877` (handleMoveStage check)
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:2365-2375` (s10CanMove gate)
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:2440-2448` (Stage 10 render slot)

**Interfaces:**
- Consumes: `DOC_TYPES_BY_STAGE[10]`, `job.documents`
- Produces: Single unified upload box displaying all Stage 10 billing documents (new and legacy).

- [ ] **Step 1: Update `Constants.js`**
Update Stage 10 document types:
```javascript
10: ['Invoice, Kwitansi & Faktur Pajak'],
```

- [ ] **Step 2: Update `UploadSlot` in `JobDetailSheet.jsx` to support multi-type matching**
Enhance `UploadSlot` to accept an optional `acceptedTypes` prop or match all Stage 10 billing docs when `stageId === 10`:
```javascript
const existing = (docs || []).filter(d => {
    if (d.stage !== stageId) return false;
    if (stageId === 10) {
        return ['Invoice, Kwitansi & Faktur Pajak', 'Invoice (PDF)', 'Invoice', 'Kwitansi', 'Faktur Pajak', 'Faktur / Invoice', 'Faktur'].includes(d.type) || d.stage === 10;
    }
    return !type || d.type === type;
});
```

- [ ] **Step 3: Update Stage 10 Move Validation Gates in `JobDetailSheet.jsx`**
Update `hasInvoiceDoc` in `handleMoveStage` and `hasInvoiceDoc10`:
```javascript
const hasInvoiceDoc10 = (job.documents || []).some(d => 
    ['Invoice, Kwitansi & Faktur Pajak', 'Invoice (PDF)', 'Invoice', 'Faktur / Invoice', 'Faktur', 'Faktur Pajak', 'Kwitansi'].includes(d.type) ||
    d.stage === 10
);
```

- [ ] **Step 4: Update existing tests that checked legacy Stage 10 array**
Update `tests/stage_10_to_12_workflow.test.js` and `tests/rekap_waiting_decisions_implementation.test.js` to assert the unified Stage 10 type `'Invoice, Kwitansi & Faktur Pajak'`.

- [ ] **Step 5: Run all test suites**
Run: `node --test tests/finance_dashboard_and_single_upload.test.js`
Run: `node --test tests/stage_10_to_12_workflow.test.js`
Run: `node --test tests/role_dashboards_data_integrity.test.js`
Expected: All tests PASS.

---

### Task 4: Production Build Verification & Code Review

**Files:**
- Test: `dnp-rework/package.json`

- [ ] **Step 1: Run production build verification**
Run: `npm --prefix dnp-rework run build`
Expected: Vite build succeeds with 0 errors.

- [ ] **Step 2: Review all diffs for precision & performance**
Ensure no memory leaks, no unintended double writes, and zero mutations outside the defined scope.
