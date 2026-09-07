# DNP Monitor — v5-2-2 Stage Delta Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete workflow specification from `DNP_Monitor_Stage_Delta_v5-2_to_v5-2-2.md` on the `v3` branch, adding the newly introduced **Stage 11c (Verifikasi Pembayaran)** with its **Gateway loopback (`Partial/Pending` $\rightarrow$ Stage 11)**, granular **LHPP 3-date tracking**, **Batch SUKET multi-delivery**, **Admin price masking**, and **Aggregate Job status rollup**.

**Architecture:** Domain-Driven Design on Laravel 11 (backend) + Inertia.js (routing & props) + React 19 (Kanban & Modals) with Node/Express fallback server. Workflow state transitions are decoupled across `Job` (aggregate root), `Unit` (granular equipment), `InspectionEvent` & `BAP` (1:N inspection sessions), `LHPP` (per-unit versioned technical report), `Batch` (multi-unit Disnaker & delivery bundle), and `PaymentVerification` (Finance stage 11c verification).

**Tech Stack:** PHP 8.2+ / Laravel 11, Inertia.js React, React 19, Tailwind CSS, MySQL / SQLite (`dnp.db`), Node.js Test Runner, Playwright.

---

## Global Constraints

- **TDD Workflow:** Plan $\rightarrow$ Test (Red) $\rightarrow$ Implement (Green) $\rightarrow$ Review $\rightarrow$ Verify $\rightarrow$ Remember $\rightarrow$ Improve. Every task must have automated tests written before implementation.
- **Branch Discipline:** All work takes place on the `v3` branch; `dnp-rework` remains untouched.
- **Stage 11c Repositioning (Hard Gate):** Stage 11c is strictly placed **after Stage 11 (Penagihan Pembayaran)** and **before Gateway "Status Lunas?"**.
- **Payment Verification Loopback:** When Finance sets status to `Partial / Pending`, the Job returns to Stage 11 (Marketing), increments `retry_count`, logs the exception reason, and keeps Stage 11b locked.
- **SUKET Delivery Hard Gate:** Stage 11b (`Kirim SUKET ke Klien`) is strictly locked until Finance submits a `Lunas` (Verified) decision in Stage 11c.
- **Price Masking (Security Hard Gate):** Admin role must never receive `nilai`, `total_invoice_amount`, or commercial figures in API responses or Inertia props.
- **Granular Entity Cardinality:**
  - 1 Job $\rightarrow$ N Units (`dnp_units`)
  - 1 InspectionEvent $\rightarrow$ N Units (via `inspection_units`) $\rightarrow$ 1 BAP (`dnp_baps`)
  - 1 Unit $\rightarrow$ N LHPPs (`dnp_lhpps`, 1 active `is_final = true`)
  - 1 Job $\rightarrow$ N Batches (`dnp_batches`)
  - 1 Batch $\rightarrow$ N Units (via `batch_units`, where `lhpp.status = 'Approved'`)
  - 1 Job $\rightarrow$ N PaymentVerifications (`payment_verifications`)

---

## User Review Required

> [!IMPORTANT]
> **Stage 11c Repositioning & Gateway Behavior:**
> In accordance with `DNP_Monitor_Stage_Delta_v5-2_to_v5-2-2.md`, Stage 11c is an authoritative Finance gate between Stage 11 and Stage 11b. If payment is `Partial` or `Pending`, the Job loops back to Stage 11 for Marketing collection follow-up, incrementing the retry counter.
>
> **SLA and Evidence Requirements:**
> - Stage 11c verification requires proof of transfer, bank mutation reference, amount received, and verifier identity.
> - Default escalation reminder thresholds are set to 7 days (Warning) and 14 days (Manager Escalation).

---

## Architecture & Domain Model (`/architect`)

```mermaid
graph TD
    S1["Stage 1: PO / SPK (Marketing)"] -->|Termin: DP / FULL| S2["Stage 2: Verifikasi Dokumen (Admin)"]
    S2 -->|Harga Di-masking| S3["Stage 3: Penjadwalan & Surat Tugas (Admin)"]
    S3 -->|Hard Gate: DP Lunas if Termin DP| S4["Stage 4: Pelaksanaan RU (INS)"]
    S4 -->|Unit Sesuai| S5["Stage 5: LHPP per-Unit & BAP (Admin)"]
    S4 -->|Unit Tidak Sesuai| S4b["Stage 4b: Aktualisasi Unit (Marketing)"]
    S4b --> S4c["Stage 4c: Reschedule (Admin)"]
    S4c --> S4d["Stage 4d: RU Ulang (Ahli/Petugas)"]
    S4d -->|Lolos RU Ulang| S5
    S4d -->|Gagal Lagi| S4b
    S5 -->|3 Tracking Dates| S6["Stage 6: Review Laporan Teknis (MGR)"]
    S6 -->|Reject-to-Revise| S5
    S6 -->|Approved -> Batching| S7["Stage 7: Verifikasi ke Dinas (Admin)"]
    S7 --> S8["Stage 8: Proses Disnaker (Admin Tagging)"]
    S8 --> S9["Stage 9: Pengurusan SUKET (Admin Duration)"]
    S9 --> S10["Stage 10: Pembuatan Invoice (Finance)"]
    S10 --> S11["Stage 11: Penagihan Pembayaran (Marketing)"]
    S11 --> S11c["Stage 11c: Verifikasi Pembayaran (Finance) [NEW]"]
    S11c --> Gate{"Gateway: Status Lunas?""}
    Gate -->|Partial / Pending| S11
    Gate -->|Lunas (Verified)| S11b["Stage 11b: Kirim SUKET per Batch (Marketing)"]
    S11b -->|100% Unit Terkirim| S12["Stage 12: Closed (Rollup Agregat)"]
```

---

## Database Schema Design (`/db-schema`)

### 1. `dnp_jobs` (Altered)
- `termin_pembayaran` (VARCHAR 20, default 'FULL')
- `dp_paid` (BOOLEAN, default false)
- `dp_amount` (DECIMAL 15,2, default 0)
- `total_unit_count` (INTEGER, default 1)
- `reschedule_reason_log` (JSON, nullable)
- `payment_retry_count` (INTEGER, default 0)

### 2. `payment_verifications` (New Table)
- `id` (UUID, Primary Key)
- `job_id` (UUID, Foreign Key $\rightarrow$ `dnp_jobs.id`)
- `verified_by` (VARCHAR, Finance user ID/name)
- `verified_at` (TIMESTAMP)
- `bukti_url` (VARCHAR, nullable)
- `bank_reference` (VARCHAR, nullable)
- `amount_received` (DECIMAL 15,2, nullable)
- `status` (VARCHAR 30: `Pending`, `Verified`, `Partial`)
- `notes` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMPS)
- Index: `[job_id, status]`

### 3. `dnp_units`, `inspection_events`, `inspection_units`, `dnp_baps`, `dnp_lhpps`, `dnp_batches`, `batch_units`
- Scoped to handle per-unit lifecycle, 3 LHPP tracking dates, SUKET batch durations, and partial shipments.

---

## API & Contract Design (`/api-design`)

### Endpoints
1. `POST /jobs/{job}/payment-verification`
   - **Role:** `finance`, `superadmin`
   - **Payload:**
     ```json
     {
       "status": "Verified | Partial | Pending",
       "amount_received": 50000000,
       "bank_reference": "MTR-BCA-889102",
       "notes": "Pelunasan sesuai rekening koran BCA 07/09",
       "bukti_url": "/storage/bukti/tf_889102.pdf"
     }
     ```
   - **Behavior:**
     - If `Verified`: records verification log, unlocks Stage 11b.
     - If `Partial` / `Pending`: increments `payment_retry_count`, sets `stage = 11`, creates audit log, sends notification to Marketing.

2. `POST /jobs/{job}/reschedule`
   - **Role:** `admin`, `superadmin`, `marketing`
   - **Payload:** `{ "reason": "...", "new_tgl_pelaksanaan": "2026-09-15" }`
   - **Behavior:** Appends to `reschedule_reason_log`, updates `tgl_pelaksanaan`.

3. `GET /api/jobs`
   - **Role Filtering:** If `role === 'admin'`, strips `nilai`, `total_invoice_amount`, `payment_amount_received`.

---

## Task Decomposition & TDD Steps

### Phase 1: Test Suite Construction (TDD Red)

- [ ] **Task 1: Stage 11c & Gateway Loopback Test Suite**
  - **Files:** `tests/stage_11c_gateway.test.js`, `dnp-rework/tests/Feature/PaymentVerificationGateTest.php`
  - **Tests:**
    1. Verify Stage 11 $\rightarrow$ 11c transition requires payment proof from Marketing.
    2. Verify Finance `Partial` decision loops Job back to Stage 11 and increments `payment_retry_count`.
    3. Verify Finance `Verified` (Lunas) decision enables Stage 11b SUKET delivery.
    4. Verify Stage 11b remains locked when payment verification is `Pending` or `Partial`.

- [ ] **Task 2: LHPP 3-Date Tracking & Batch SUKET Duration Test Suite**
  - **Files:** `tests/lhpp_and_batch_tracking.test.js`, `dnp-rework/tests/Unit/LHPPLeadTimeTest.php`
  - **Tests:**
    1. Verify 3 LHPP tracking dates record correctly and compute drafting lead time.
    2. Verify SUKET processing duration computes `tanggal_terbit_suket - tanggal_input_suket` per batch.

---

### Phase 2: Backend Implementation (TDD Green)

- [ ] **Task 3: Payment Verification & Gateway Enforcement in Backend**
  - **Files:**
    - `dnp-rework/app/Http/Controllers/JobController.php`
    - `dnp-rework/app/Services/WorkflowService.php`
    - `server/routes/jobs.js`
  - **Details:**
    - Implement `savePaymentVerification()` with validation and loopback logic.
    - Implement `WorkflowService::canDeliverSuket()` enforcing `Verified` payment status.
    - Wire Express `/api/jobs/:id/payment-verification` endpoint.

- [ ] **Task 4: LHPP 3-Date Recording & Batch Duration Engine**
  - **Files:**
    - `dnp-rework/app/Models/LHPP.php`
    - `dnp-rework/app/Models/Batch.php`
    - `src/domain/workflowEngine.js`
  - **Details:**
    - Ensure date parsing and diff calculation for LHPP sub-phases (`queue_days`, `drafting_days`).
    - Ensure Batch duration computation (`durasi_proses_suket`).

---

### Phase 3: Frontend & Kanban UI Integration

- [ ] **Task 5: Stage 11c UI Card & Payment Verification Modal**
  - **Files:**
    - `src/components/KanbanBoard.jsx` (or `dnp-rework/resources/js/Pages/Kanban/Index.jsx`)
    - `src/components/JobDetailModal.jsx` (or `JobDetailSheet.jsx`)
  - **Details:**
    - Add Stage 11c swimlane/modal tab for Finance role.
    - Add payment reconciliation fields: bank reference, amount received, status selector (`Lunas` vs. `Partial/Pending`), exception reason.
    - Add retry counter indicator badge on Kanban cards returning from Stage 11c loopback.

- [ ] **Task 6: LHPP 3-Date Progress Display & Batch SUKET Delivery UI**
  - **Files:**
    - `src/components/JobDetailModal.jsx`
  - **Details:**
    - Render 3-date tracking milestones in Stage 5.
    - Render multi-batch SUKET delivery section in Stage 11b with tracking numbers and shipment dates.

---

### Phase 4: Verification, QC & Build

- [ ] **Task 7: Full Test Suite & Production Build Verification**
  - **Commands:**
    - `npm test`
    - `npm run build`
    - Playwright browser validation of Stage 11c modal & retry loop
  - **Artifacts:** Update `walkthrough.md` and `audit_qc_report.md`.

---

## Verification Plan

### Automated Tests
- `npm test`: Run all 17+ unit and integration tests covering security masking, DP gate, split flow, escalation reminders, LHPP lead time, Stage 11c payment loop, and aggregate status rollup.
- `npm run build`: Compile production assets with Vite (0 errors).

### Live Playwright Verification
- Verify Stage 11c UI rendering in browser with Finance role.
- Verify `Partial` decision loopback to Stage 11 and badge increment.
- Verify `Lunas` decision unlocking Stage 11b batch delivery.
