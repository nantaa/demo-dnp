# Implementation Plan: Business Rules & Workflow Revisions (PO, PPN 112%, S7 Rollback, Role Lockdown & Same-Month Lock)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 workflow and business logic revisions: (1) Display price as user input × 112% (PPN 12%), (2) Lock PO documents exclusively for INS role, (3) Reject/Kembalikan from Stage 7 moves job directly back to Stage 5 (skipping S6), (4) Omit calculated values on Faktur Pajak price input, and (5) Enforce same-month cutoff for PO and Invoice revisions.

**Architecture:** 
- Domain layer (`src/domain/workflowEngine.js`): update masking to lock PO documents only for INS (`inspektur`, `ahli_k3`, `tenaga_ahli`), add reject transition rule for Stage 7 -> Stage 5, and introduce same-month validation helpers (`isEligibleForSameMonthRevision`).
- Server layer (`server/routes/jobs.js`): expose dedicated `POST /api/jobs/:id/reject` and `POST /jobs/:id/reject` route handling custom rollback targets (defaulting S7 -> S5), enforce same-month cutoff on `PUT /api/jobs/:id` (PO info) and `POST /api/jobs/:id/invoice-revise`, and apply INS-only PO document masking.
- Frontend layer (`dnp-rework/resources/js`): update price formatting/display components (`Create.jsx`, `EditInfoTab.jsx`, summaries, etc.) to show user input × 112% alongside DPP, ensure `Stage10Action.jsx` / `ReviseInvoiceModal.jsx` don't display calculated values for Faktur Pajak, enforce same-month disabled state for PO/Invoice edit buttons with user-friendly alerts, and hide PO documents from INS in `DocumentsTab.jsx` / `UploadSlot`.

**Tech Stack:** React 19, Inertia.js, Node.js + Express, Better-SQLite3, Node test runner (`node --test`).

---

## Direct & Honest Assessment of Requirements (Challenging Weak Assumptions)

Before writing code, here is the honest critique and rating of each idea:

| Item | Requirement | Rating | Honest Critique & Potential Pitfalls |
| :--- | :--- | :---: | :--- |
| **1** | Revise price shown to user input × 112% | **6.5 / 10** | **Potential Pitfall:** If the database stores user input as DPP (e.g. Rp 10.000.000) and the UI shows Rp 11.200.000 without a clear label, users will be confused whether the price is DPP or Gross. If a client is non-PKP or tax-exempt (0% PPN), hardcoding 112% will be incorrect. <br>**Better Approach:** Display both clearly: `Nilai Kontrak (DPP): Rp 10.000.000` and `Total Termasuk PPN (112%): Rp 11.200.000`. We will store the base input and display the calculated 112% as the prominent shown price. |
| **2** | Lock PO document ONLY for INS role; all other roles fine | **9.5 / 10** | **Strong & Pragmatic:** In an inspection company (PJK3), field inspectors must stay technically objective and have no business seeing commercial contracts or pricing. Conversely, Admin Dokumen, Marketing, Finance, and Management need PO documents to cross-check client identities and inspection scopes. Reversing the previous Admin lockdown in favor of an INS-only lockdown is completely aligned with operational reality. |
| **3** | Kembalikan Job in S7 moves job from S7 to S5 | **8.0 / 10** | **Good, with 1 Warning:** Rejection in Stage 7 (Dinas) occurs because Dinas finds technical errors in the LHPP draft. Sending it back to Stage 5 (Penyusunan LHPP) makes total sense because Admin/RU must re-draft the report. <br>**Warning ("You're wrong" if you bypass S6 forward):** After S5 finishes re-drafting, the job **must still pass through Stage 6 (Manager QC Review) before going back to Stage 7**. It cannot jump straight from 5 to 7. |
| **4** | On Faktur Pajak price input, no need to show calculated value | **10 / 10** | **Flawless:** Faktur Pajak is an official tax invoice issued from DJP e-Faktur where the nominal is already fixed. Applying an automatic × 112% calculation to Faktur Pajak input would be double-taxation (112% of 112% = 125.44%). |
| **5** | Revisi PO & Invoice accessible only in the same month after MKT created the job | **4.5 / 10 (Strict) → 8.5 / 10 (Refined)** | **You're wrong if this is applied literally to Invoices based on `job.created_at`:** <br>• In Riksa Uji, a job created on Sept 25 often reaches Stage 10 (Invoice) in October or November (Disnaker SLA alone is 30 days!). If Revisi Invoice is tied to "same month as job creation (`created_at`)", the invoice would be **locked and impossible to revise on the very day it is created**! <br>• **Proposed refinement:** Revisi PO is locked after the calendar month of PO/Job creation (`job.created_at`). Revisi Invoice is locked after the calendar month of **Invoice issuance** (`tgl_invoice_issued` or `job.invoice_created_at`). |

---

## User Review Required

> [!WARNING]
> **Critical Design Decision on Item 5 (Invoice Revision Cutoff):**
> Does "same month after MKT created the job" strictly apply to `job.created_at` for both PO and Invoice, or should Invoice use `tgl_invoice_issued`?
> - **Option A (Strict user prompt):** Both PO and Invoice revision lock at the end of the calendar month of `job.created_at`. If a job takes >30 days to reach Stage 10, Invoice cannot be revised.
> - **Option B (Recommended Operational Logic):** Revisi PO locks at the end of the calendar month of `job.created_at`. Revisi Invoice locks at the end of the calendar month of `tgl_invoice_issued` (or `job.created_at` if invoice has no date).
> We will implement Option B with fallback to `job.created_at`, so month-closing accounting rules are respected without breaking multi-month inspection jobs.

---

## Proposed Changes

Grouped logically following TDD methodology:

### Domain & Workflow Engine (`src/domain/workflowEngine.js`)

#### [MODIFY] [workflowEngine.js](file:///d:/Download%20Backup/Lovable/dnp-monitor/src/domain/workflowEngine.js)
- Update `maskSensitiveData(data, role)`:
  - Remove masking for `role === 'admin'`. Admin can now view `nilai`, `total_invoice_amount`, and PO/SPK documents.
  - Add masking for `role === 'inspektur'` (and `ahli_k3`, `tenaga_ahli`): Mask documents of type `PO/SPK`, `PO / SPK`, `PO / SPK / Proposal`, and mask `nilai`.
- Add `getRejectTargetStage(currentStage)`:
  - If `currentStage === 7`, return `5` (skips Stage 6 directly back to Penyusunan LHPP).
  - If `currentStage === 8`, return `6`.
  - If `currentStage === 13 || currentStage === 5`, return `4`.
  - If `currentStage === 14`, return `11`.
  - Default: `Math.max(1, currentStage - 1)`.
- Add `isEligibleForSameMonthRevision(dateString, referenceDate = new Date())`:
  - Compares year and month (`d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()`).
- Add price display helper `calculateGrossPrice(netPrice)`:
  - Returns `Math.round(netPrice * 1.12)`.

---

### Backend API & Express Router (`server/routes/jobs.js`)

#### [MODIFY] [server/routes/jobs.js](file:///d:/Download%20Backup/Lovable/dnp-monitor/server/routes/jobs.js)
- Add route `POST /api/jobs/:id/reject` and `POST /jobs/:id/reject`:
  - Validates role permissions for rejecting stage.
  - Automatically routes Stage 7 to Stage 5 using `getRejectTargetStage`.
  - Adds audit history log: `DITOLAK / DIKEMBALIKAN: Job dikembalikan dari Stage 7 ke Stage 5. Catatan: ...`
- Update `GET /api/jobs` and `GET /api/jobs/:id`:
  - When `role === 'inspektur'`, apply `maskSensitiveData(job, 'inspektur')` to strip PO documents and sensitive prices.
  - Do NOT mask PO documents for `admin`.
- Update `POST /api/jobs/:id/invoice-revise`:
  - Enforce same-month revision check using `isEligibleForSameMonthRevision(job.tgl_invoice_issued || job.created_at)`.
  - If month has elapsed, reject with `403 Forbidden` (`Revisi Invoice terkunci karena sudah melewati bulan penerbitan (Tutup Buku Bulanan)`).
- Update `PUT /api/jobs/:id`:
  - If updating PO fields (`no_po`, `tgl_po`, `nilai`, `termin_pembayaran`), check `isEligibleForSameMonthRevision(job.created_at)`.
  - If month has elapsed, reject with `403 Forbidden` (`Revisi PO terkunci karena sudah melewati bulan pembuatan job`).

---

### Frontend Components (`dnp-rework/resources/js`)

#### [MODIFY] [useJobPermissions.js](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Components/JobDetail/hooks/useJobPermissions.js)
- Update `canViewStageDocs(sid)`:
  - If `user?.role === 'inspektur'`, block access to Stage 1 PO documents (`PO/SPK`, `PO / SPK / Proposal`).
  - Allow `admin` to view Stage 1 PO documents.
- Add `canRevisePO`: `isEligibleForSameMonthRevision(job.created_at) && ['marketing', 'admin', 'finance', 'superadmin'].includes(user?.role)`.
- Add `canReviseInvoice`: `isEligibleForSameMonthRevision(job.tgl_invoice_issued || job.created_at) && ['finance', 'superadmin'].includes(user?.role)`.

#### [MODIFY] [Create.jsx](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Pages/Jobs/Create.jsx)
- In `Nilai Kontrak` section, display calculated price live:
  - `Nilai Kontrak (DPP): [Input]`
  - `Total Nilai Termasuk PPN 12% (112%): Rp XX.XXX.XXX`
- Ensure DP calculation uses the base or gross amount appropriately with clear label.

#### [MODIFY] [EditInfoTab.jsx](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Components/JobDetail/Tabs/EditInfoTab.jsx)
- Update price display: Show `Nilai Kontrak (Termasuk PPN 112%): {fmtCurrency(job.nilai * 1.12)}` with subtitle `(DPP: {fmtCurrency(job.nilai)})`.
- In edit mode: Live preview `Nilai Termasuk PPN (112%): {fmtCurrency(editForm.data.nilai * 1.12)}`.
- Lock "Edit" button if `!canRevisePO`, showing badge `Terkunci (Melewati Bulan Pembuatan)`.

#### [MODIFY] [Stage10Action.jsx](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Components/JobDetail/StageActions/Stage10Action.jsx) & [ReviseInvoiceModal.jsx](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Components/JobDetail/Modals/ReviseInvoiceModal.jsx)
- Ensure Faktur Pajak / Total Invoice input field does **NOT** display any 112% calculation. The value entered is taken as-is without any secondary calculated badge.

#### [MODIFY] [JobDetailSheet.jsx](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Components/JobDetailSheet.jsx)
- Disable the `📝 Revisi Invoice` button if `!canReviseInvoice`, with tooltip and warning explanation.
- In `handleRejectStage`, if `job.stage === 7`, default the target stage in the payload to `5`.

#### [MODIFY] [DocumentsTab.jsx](file:///d:/Download%20Backup/Lovable/dnp-monitor/dnp-rework/resources/js/Components/JobDetail/Tabs/DocumentsTab.jsx)
- Filter out documents with type `PO/SPK` when the active user is `inspektur`.

---

## Detailed Task Breakdown (TDD Order)

### Task 1: TDD for Domain Rules (PPN 112%, S7->S5 Rollback, INS PO Masking, Same-Month Lock)

**Files:**
- Create: `tests/revision_rules_and_lockdowns.test.js`
- Modify: `src/domain/workflowEngine.js`

- [ ] **Step 1: Write failing tests in `tests/revision_rules_and_lockdowns.test.js`**
  - Test 1: `maskSensitiveData` masks PO documents for `inspektur`, but allows `admin` and `finance`.
  - Test 2: `getRejectTargetStage` returns `5` when rejecting from Stage 7.
  - Test 3: `calculateGrossPrice(10000000)` returns `11200000` (112%).
  - Test 4: `isEligibleForSameMonthRevision` returns `true` for current month, `false` for past months.
- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test tests/revision_rules_and_lockdowns.test.js`
  Expected: FAIL (functions not yet updated/exported).
- [ ] **Step 3: Implement domain logic in `src/domain/workflowEngine.js`**
  - Implement `getRejectTargetStage`.
  - Implement `calculateGrossPrice`.
  - Implement `isEligibleForSameMonthRevision`.
  - Update `maskSensitiveData` for role `inspektur` and remove admin PO lockdown.
- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test tests/revision_rules_and_lockdowns.test.js`
  Expected: PASS (all tests pass).

---

### Task 2: Backend Reject Endpoint & Same-Month Lock Enforcement

**Files:**
- Modify: `server/routes/jobs.js`
- Test: `tests/api_routes_v3.test.js` or `tests/revision_rules_and_lockdowns.test.js`

- [ ] **Step 1: Add automated tests for `/api/jobs/:id/reject` and same-month cutoff**
  - Test `POST /api/jobs/:id/reject` from Stage 7 sets `stage = 5`.
  - Test `POST /api/jobs/:id/invoice-revise` blocks revision if `job.tgl_invoice_issued` was in a previous month.
  - Test `GET /api/jobs` masks PO documents when role header `x-user-role: inspektur` is passed, but exposes them to `admin`.
- [ ] **Step 2: Implement `/api/jobs/:id/reject` and `/jobs/:id/reject` in `server/routes/jobs.js`**
- [ ] **Step 3: Add same-month validation check in `POST /api/jobs/:id/invoice-revise` and `PUT /api/jobs/:id`**
- [ ] **Step 4: Run backend tests to verify**
  Run: `npm test`
  Expected: All existing 79 tests + new tests pass.

---

### Task 3: Frontend Price Display (112%) & Faktur Pajak Clean Input

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Jobs/Create.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetail/Tabs/EditInfoTab.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetail/StageActions/Stage10Action.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetail/Modals/ReviseInvoiceModal.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetail/CompletedSummaries/CompletedStageSummary.jsx`

- [ ] **Step 1: Update `Create.jsx` to show live 112% price display under Nilai Kontrak**
- [ ] **Step 2: Update `EditInfoTab.jsx` to show user input × 112% as the main shown price**
- [ ] **Step 3: Verify `Stage10Action.jsx` and `ReviseInvoiceModal.jsx` keep raw nominal input without calculated display**
- [ ] **Step 4: Run AST check to verify no syntax errors**
  Run: `node --test tests/v3_ast_integrity_check.test.js`
  Expected: PASS.

---

### Task 4: INS PO Document Lockdown & Same-Month Lock UI Guards

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetail/hooks/useJobPermissions.js`
- Modify: `dnp-rework/resources/js/Components/JobDetail/Tabs/DocumentsTab.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetail/StageActions/Stage1Action.jsx`

- [ ] **Step 1: Update `useJobPermissions.js` to block INS from viewing PO documents**
- [ ] **Step 2: Update `DocumentsTab.jsx` to hide PO documents from inspectors**
- [ ] **Step 3: Add same-month check to `JobDetailSheet.jsx` (Revisi Invoice button) and `EditInfoTab.jsx` (Edit PO button)**
- [ ] **Step 4: Update `handleRejectStage` in `JobDetailSheet.jsx` to pass `target_stage: 5` when `job.stage === 7`**

---

### Task 5: End-to-End Verification & Full Test Suite

- [ ] **Step 1: Run full test suite**
  Run: `npm test`
- [ ] **Step 2: Verify AST integrity across all frontend files**
  Run: `node --test tests/v3_ast_integrity_check.test.js`
- [ ] **Step 3: Manual flow check with sample jobs**
  Verify via API / DOM simulation:
  - Price display shows 112%
  - Inspector cannot see PO
  - Admin can see PO
  - Reject S7 moves to S5
  - Faktur Pajak has no calculated value
  - Past month job blocks PO & Invoice revision

---

## Verification Plan

### Automated Tests
- Command: `npm test`
  - Runs all existing 79 tests + new suite `tests/revision_rules_and_lockdowns.test.js`.
- Command: `node --test tests/v3_ast_integrity_check.test.js`
  - Validates esbuild AST compilation and imports for all modified JSX/JS files.

### Manual Verification
1. Log in as Marketing: Create job with Nilai Kontrak Rp 10.000.000 -> verify price shown is Rp 11.200.000 (112%).
2. Log in as Inspektur: Open job detail -> verify PO/SPK document is NOT visible in Stage 1 / Documents tab.
3. Log in as Admin: Open job detail -> verify PO/SPK document IS visible and accessible.
4. Move job to Stage 7 (Verifikasi ke Dinas) -> click "Tolak / Kembalikan" -> verify job moves to Stage 5 (Penyusunan LHPP).
5. Move job to Stage 10 -> verify Faktur Pajak price input displays only raw value without calculated 112%.
6. Test same-month cutoff: Simulate a job created in previous month -> verify "Revisi PO" and "Revisi Invoice" buttons are disabled with warning.
