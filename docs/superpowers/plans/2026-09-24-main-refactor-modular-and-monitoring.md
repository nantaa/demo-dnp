# Implementation Plan: `main-refactor` Modular Architecture + Personnel Performance & SLA Monitoring

**Branch:** `main-refactor`  
**Prerequisites:** Tag `stable-240926` verified on `main`. Zero breaking changes to active production data.

---

## 1. Overview & Objectives

This implementation delivers two major capabilities on the `main-refactor` branch:
1. **JobDetailSheet Modular Decomposition**: Refactor the monolithic 3,637-line `JobDetailSheet.jsx` into clean, testable subcomponents (`Common/`, `Modals/`, `Tabs/`, `StageActions/`) with full parity with `RBAC_SPECIFICATION.md`.
2. **Personnel Performance & SLA Monitoring System**: Add quantitative tracking to measure staff performance by individual person (On-Time vs Overdue jobs, SLA adherence rate, Average Turnaround Time, and Rework/Return rate) without penalizing staff for external bottlenecks (Disnaker/Client).

---

## 2. Proposed Architecture & Component Design

```
dnp-rework/resources/js/
├── Components/
│   ├── JobDetailSheet.jsx             # Coordinator component (< 1,200 lines)
│   └── JobDetail/
│       ├── helpers.js                 # Pure utility & formatting helpers (Done)
│       ├── Common/                    # Atom UI units (DocChip, UploadSlot, MoveRow, NoteField) (Done)
│       ├── Modals/                    # Revisions modals (RevisePo, ReviseInvoice) (Done)
│       ├── Tabs/                      # [NEW] Auxiliary tab views:
│       │   ├── TimelineTab.jsx        # Vertical stage timeline & completed audit summaries
│       │   ├── DocumentsTab.jsx       # Categorized document repository with role gating
│       │   └── EditInfoTab.jsx        # Editable client, aircraft, and units metadata
│       └── StageActions/              # [NEW] 16 dedicated stage action panels:
│           ├── Stage1Action.jsx       # Order intake & PO upload (Marketing)
│           ├── Stage2Action.jsx       # 11-item document verification (Admin)
│           ├── Stage3Action.jsx       # Scheduling & Disnaker assignment (Admin)
│           ├── Stage4Action.jsx       # Field inspection & BAP/photo upload (Inspektur)
│           ├── Stage5Action.jsx       # Multi-unit LHPP links & drafting (Inspektur/Ahli)
│           ├── Stage6Action.jsx       # Technical review & authorization (Manager)
│           ├── Stage7Action.jsx       # Formal Disnaker submission (Admin)
│           ├── Stage8Action.jsx       # Disnaker tracking & delay logging (Admin)
│           ├── Stage9Action.jsx       # Suket workflow lifecycle (Admin)
│           ├── Stage10Action.jsx      # Invoice & PPN 12% issuance (Finance)
│           ├── Stage11Action.jsx      # Billing follow-up & reminders (Marketing)
│           ├── Stage14Action.jsx      # Payment verification & Lunas gate (Finance)
│           ├── Stage15Action.jsx      # Suket dispatch & resi tracking (Marketing)
│           ├── Stage12Action.jsx      # Closing recap & vault handover (Finance)
│           ├── Stage13Action.jsx      # Optional client report handover (Marketing)
│           └── Stage16Action.jsx      # Archival Vault & restore action (Superadmin)
├── Utils/
│   └── performanceSla.js              # [NEW] SLA calculation engine for TAT & Overdue metrics
└── Pages/
    └── Dashboard/
        └── Index.jsx                  # [ENHANCED] New "Kinerja Personel (SLA)" scorecard & leaderboard
```

---

## 3. SLA & Performance Monitoring Specifications

### 3.1. Standard SLA Configuration Table (Working Days)
Only internal actionable stages are measured; external waiting stages are tracked separately:

| Stage | Responsible Role | SLA Target | Measurement Event Start | Measurement Event End |
| :---: | :--- | :---: | :--- | :--- |
| **S2** | Admin Operasional | **1 Day** | S1 Moved (PO Uploaded) | S2 Moved (Verification Completed) |
| **S3** | Admin Operasional | **1 Day** | S2 Moved | S3 Moved (Schedule & Inspector Locked) |
| **S4** | Inspektur Lapangan | **Per Schedule** | Scheduled Date | S4 Moved (Field Check & Photos Complete) |
| **S5** | Inspektur / Report Writer | **3 Days** | S4 Inspection Done | S5 Moved (LHPP Links Attached) |
| **S6** | Manager / Kadiv | **1 Day** | S5 Moved (Draft Submitted) | S6 Approved / Rejected |
| **S7** | Admin Operasional | **1 Day** | S6 Approved | S7 Moved (Submitted to Disnaker) |
| **S8** | Disnaker (External) | *Exempt from SLA* | S7 Submitted | Tracked as *External Waiting Time* |
| **S10** | Finance | **1 Day** | S9 Suket Selesai | S10 Moved (Invoice & PPN Issued) |
| **S11** | Marketing | *Client Terms* | S10 Invoice Issued | Tracked as *Aging Tagihan (DSO)* |
| **S14** | Finance | **Same-Day (0.5d)** | Payment Received | S14 Marked "Lunas" |
| **S15** | Marketing | **1 Day** | S14 Marked "Lunas" | S15 Resi Recorded & Dispatched |

### 3.2. Computed Metrics per Person
1. **On-Time Rate (%)**: `(On-Time Actions / Total Actions) * 100`
2. **Overdue Count**: Active jobs currently held by this person past the SLA target.
3. **Average Turnaround Time (TAT)**: Average days/hours taken to complete their stages.
4. **Rework / Return Count**:
   - For Inspectors: Times LHPP was rejected by Manager from S6 back to S5.
   - For Marketing: Times PO was returned by Admin from S2 back to S1.

---

## 4. Phased Implementation Steps (Strict TDD Order)

### Phase 1: Test-Driven Development (TDD)
1. **`tests/modular_job_detail.test.js`**: Update and extend to verify all 16 `StageActions/`, 3 `Tabs/`, and lean `JobDetailSheet.jsx` (<1,200 lines).
2. **`tests/personnel_performance_sla.test.js`**: Write unit tests covering SLA definitions, business day calculation, overdue detection from `job_history`, and individual scorecard aggregation.

### Phase 2: Implementation of Modular Subcomponents
1. Create `Tabs/TimelineTab.jsx`, `Tabs/DocumentsTab.jsx`, and `Tabs/EditInfoTab.jsx`.
2. Create `StageActions/Stage1Action.jsx` through `Stage16Action.jsx`, encapsulating their exact respective form logic, validation alerts, and role authorization checks.
3. Rewire `JobDetailSheet.jsx` to import these modular components, reducing line count from 3,637 to a clean coordinator.

### Phase 3: Implementation of Performance SLA Engine & Dashboard UI
1. Create `resources/js/Utils/performanceSla.js` to compute individual metrics from `jobs` and `job_history`.
2. Enhance `Dashboard/Index.jsx` to render:
   - **Personnel Performance Cards**: Summary table with avatar, role, total jobs handled, on-time percentage badge, active overdue warnings, and avg TAT.
   - **Active Bottleneck Drawer**: Filterable list showing which specific job is overdue, who holds it, and days delayed.

### Phase 4: Verification & AST Integrity
1. Run `node --test tests/*.test.js` (All test suites must pass 100%).
2. Run `node --test tests/ast_integrity_check.test.js` (Must maintain 0 undeclared variables).
3. Validate browser rendering and error-free execution.

---

## 5. Review & Checkpoints

- **Branch Isolation**: All changes committed strictly on `main-refactor`.
- **Safety**: `main` remains untouched at `stable-240926`.
- **VPS Ready**: Ready for zero-downtime testing via `./deploy.sh main-refactor`.
