# DNP Monitor — Kanban Parent–Child Job Split Specification

**Version:** 1.0  
**Status:** Implementation specification  
**Scope:** Kanban UI, parent–child job splitting, batch inspection tracking, unit ownership, and closure rules.

---

## 1. Purpose

This specification defines how the DNP Monitor Kanban board must represent a single PO with partial inspections.

Example: a PO contains 100 units. Batch 1 inspects 80 units and all 80 pass. The remaining 20 units are unavailable and must be inspected later. The application must allow the 80 passing units to continue through LHPP, Disnaker, SUKET, invoice, delivery, and closure **without losing traceability** to the 20 delayed units.

This is not a standard task Kanban. It is a relational workflow UI where one original commercial order may produce multiple independently progressing operational jobs.

---

## 2. Non-Negotiable Rules

1. **One PO is not always one job.** A PO is the commercial source document; one PO may produce one or more operational jobs.
2. **One unit belongs to exactly one active job at a time.** A unit must never appear in both parent and child job after a split.
3. **Every unit is traceable back to its original PO and original root job.** Splitting must not destroy history.
4. **A parent job may close while one or more child jobs remain active.** Closing a parent does not close children.
5. **A child job progresses independently after splitting.** It has its own stage, schedule, LHPP, SUKET, invoice, payment status, and closure status.
6. **The Kanban card represents an operational job, not a PO.** Parent and child jobs are separate cards.
7. **The Kanban must never allow direct drag-and-drop bypass of hard gates.** Stage changes must be performed through validated actions/modals, then the UI moves the card automatically.
8. **All split, transfer, reopen, bypass, and closure actions require immutable audit logs.**

---

## 3. Terminology

| Term | Definition |
|---|---|
| **PO** | Original client commercial document. One PO can fund multiple operational jobs after a split. |
| **Root Job** | The first job created from a PO. It remains the audit root for all descendants. |
| **Parent Job** | A job that retained completed/passing units after one or more other units were moved to child jobs. |
| **Child Job** | A separate operational job created from units transferred out of another job. |
| **Normal Job** | A job that has never been split and has no parent or children. |
| **Job Family** | Root job plus all parent/child descendants connected through `root_job_id`. |
| **Inspection Batch** | One field visit or inspection attempt. Batch 1, Batch 2, and so on may occur within the same job. |
| **Unit Allocation** | The current job responsible for a unit. |
| **Split** | The atomic operation that creates a child job and transfers selected units into it. |
| **Passing Unit** | A unit with technically approved status `Laik`. |
| **Delayed Unit** | A unit not inspected due to logistics/availability and requiring later scheduling. |
| **Failed Unit** | A unit recorded as `Tidak Laik` and awaiting repair/retest or final closure. |

---

## 4. Core Domain Model

### 4.1 Relationship Model

```text
PO-2026-001 (100 units)
└── ROOT JOB: JOB-2026-001
    ├── Parent operational portion: JOB-2026-001 (80 passed units)
    │   └── progresses and may close at Stage 12
    │
    └── Child operational portion: JOB-2026-001-C01 (20 delayed units)
        └── independently starts/continues at Stage 4c and may close later
```

The root job can remain the parent operational job after split. Do **not** create a second replacement parent card unless there is a concrete business reason. Reusing the existing job as the parent preserves references, history, documents, and user familiarity.

### 4.2 Required Job Fields

```ts
type JobType = 'NORMAL' | 'PARENT' | 'CHILD';
type JobStatus = 'ACTIVE' | 'ON_HOLD' | 'CLOSED' | 'CLOSED_FAILED' | 'CANCELLED';
type PipelineStage =
  | 'S1_PO'
  | 'S2_DOCUMENT_VERIFICATION'
  | 'S3_SCHEDULING'
  | 'S4_INSPECTION'
  | 'S4B_UNIT_RECONCILIATION'
  | 'S4C_RESCHEDULE'
  | 'S4D_REINSPECTION'
  | 'S5_LHPP_DRAFT'
  | 'S6_TECHNICAL_REVIEW'
  | 'S7_DISNAKER_BATCH'
  | 'S8_DISNAKER_PROCESS'
  | 'S9_SUKET_ISSUANCE'
  | 'S10_INVOICE'
  | 'S11_COLLECTION'
  | 'S11C_PAYMENT_VERIFICATION'
  | 'S11B_SUKET_DELIVERY'
  | 'S12_CLOSED';

interface Job {
  id: string;
  jobNumber: string;

  // Family lineage
  rootJobId: string;
  parentJobId: string | null;
  jobType: JobType;
  splitSequence: number;
  splitReason: 'CLIENT_REQUEST' | 'UNIT_UNAVAILABLE' | 'MAX_RESCHEDULE_EXCEEDED' | 'TECHNICAL_FAILURE' | null;
  splitAt: string | null;
  splitApprovedByUserId: string | null;
  splitApprovalReason: string | null;

  // Commercial origin
  poId: string;
  poNumber: string;
  originalPoUnitCount: number;
  contractAllocationAmount: number | null;
  currency: 'IDR';

  // Operational totals; generated from unit allocation, not hand-entered
  currentUnitCount: number;
  laikUnitCount: number;
  tidakLaikUnitCount: number;
  pendingUnitCount: number;
  unavailableUnitCount: number;

  // Workflow
  currentStage: PipelineStage;
  status: JobStatus;
  rescheduleCount: number;
  revisionCount: number;
  paymentRetryCount: number;

  // Dates
  createdAt: string;
  closedAt: string | null;
}
```

### 4.3 Required Unit Fields

```ts
type UnitInspectionStatus =
  | 'PENDING'
  | 'NOT_INSPECTED'
  | 'INSPECTED'
  | 'TEMUAN'
  | 'LAIK'
  | 'TIDAK_LAIK'
  | 'CLOSED_FAILED';

type NonInspectionReason =
  | 'CLIENT_UNIT_UNAVAILABLE'
  | 'CLIENT_REQUESTED_RESCHEDULE'
  | 'SITE_ACCESS_DENIED'
  | 'WEATHER'
  | 'OPERATIONAL_CONSTRAINT'
  | 'OTHER'
  | null;

interface JobUnit {
  id: string;
  rootJobId: string;
  originalJobId: string;
  currentJobId: string;
  poId: string;

  unitCode: string;
  serialNumber: string | null;
  equipmentTypeId: string;

  inspectionStatus: UnitInspectionStatus;
  laikStatus: 'PENDING' | 'LAIK' | 'TIDAK_LAIK';
  nonInspectionReason: NonInspectionReason;
  nonInspectionNote: string | null;

  currentInspectionBatchNumber: number;
  totalInspectionAttempts: number;
  retestCount: number;

  suketId: string | null;
  finalDisposition: 'ACTIVE' | 'CERTIFIED' | 'CLOSED_FAILED' | 'CANCELLED';
}
```

### 4.4 Data Integrity Constraints

The following constraints are mandatory:

```sql
-- A job may be its own root but may never be its own parent.
CHECK (parent_job_id IS NULL OR parent_job_id <> id);

-- A normal/root job has root_job_id equal to itself.
-- A child has root_job_id equal to the root ancestor, never merely its direct parent.

-- A unit can belong to one and only one current operational job.
UNIQUE (job_unit.id, job_unit.current_job_id);

-- A unit cannot be included in more than one active SUKET.
UNIQUE (suket_unit.job_unit_id) WHERE suket_unit.status IN ('DRAFT', 'ISSUED');

-- Unit totals on job cards are derived from JobUnit records; do not allow manual editing.
```

**Critical implementation rule:** Use a database transaction and row-level locks for every split. If a split partially succeeds, your data becomes unreliable.

---

## 5. Stage 4 Inspection Outcome Model

### 5.1 Per-Unit Outcome Is Mandatory

Do not record only `80 inspected of 100`. That is insufficient. The inspector must record an outcome for every expected unit:

| Unit condition | Required per-unit status | Required next handling |
|---|---|---|
| Inspected and passed | `LAIK` | Eligible for LHPP and later SUKET path |
| Inspected with technical issue | `TEMUAN` then `TIDAK_LAIK` after review | Repair/retest path via Stage 6 → Stage 4c → Stage 4d |
| Not inspected because unavailable | `NOT_INSPECTED` | Stage 4b commercial/operational decision: wait, reschedule, cancel, or split |
| Not inspected for another reason | `NOT_INSPECTED` with a mandatory reason | Routed by reason and reviewed by Admin/Manager where necessary |

### 5.2 Aggregated Job Result

A job may contain a mix of these statuses. Therefore, do not force the whole job into only one outcome state without creating unit groups.

For a 100-unit job after Batch 1:

```text
80 units: LAIK
20 units: NOT_INSPECTED / CLIENT_UNIT_UNAVAILABLE
```

This generates a **mixed result**. The job enters Stage 4b because unresolved units exist, while passing units remain identifiable and eligible for the parent portion of the job.

---

## 6. Split Decision at Stage 4b

### 6.1 Split Is an Explicit Decision, Not an Automatic Assumption

Do not automatically split merely because some units are delayed. That would create unnecessary invoices, SUKETs, and administrative work.

At Stage 4b, Marketing must select one of these actions:

| Decision | Use when | Result |
|---|---|---|
| `WAIT_AND_RESCHEDULE` | Client agrees to wait for all units; remaining units are expected soon | Keep one job; unresolved units go Stage 4c; passing units wait in the same job |
| `SPLIT_FOR_PARTIAL_PROCESSING` | Client requests partial processing or passing units must proceed independently | Existing job retains passing units; selected unresolved units move to a new child job |
| `REDUCE_SCOPE` | Client formally removes unavailable units from scope | Contract/quantity adjusted; removed units receive final commercial disposition |
| `CANCEL_UNRESOLVED_UNITS` | Client will not continue for selected units | Units marked cancelled/closed; commercial approval and audit note required |

### 6.2 Required Inputs for Split Decision

A split request must include:

```ts
interface SplitRequest {
  sourceJobId: string;
  selectedUnitIds: string[]; // Units moved into the child job
  splitReason: 'CLIENT_REQUEST' | 'UNIT_UNAVAILABLE' | 'MAX_RESCHEDULE_EXCEEDED' | 'TECHNICAL_FAILURE';
  clientRequestedPartialProcessing: boolean;
  commercialAllocationMode: 'PRO_RATA' | 'MANUAL_APPROVED';
  childJobStage: 'S4C_RESCHEDULE' | 'S4D_REINSPECTION';
  rescheduleReason: string;
  approvedByUserId: string; // Kadiv / Manager approval where policy requires it
  approvalReason: string;
}
```

### 6.3 Split Preconditions

The system must reject the split if any condition below is false:

- At least one selected unit exists.
- Every selected unit currently belongs to the source job.
- No selected unit has an issued SUKET.
- No selected unit is included in a finalized invoice belonging to the source job, unless Finance explicitly approves a credit/debit-note workflow.
- Selected units are unresolved (`NOT_INSPECTED`, `TIDAK_LAIK`, or equivalent); do not move certified units casually.
- At least one unit remains in the source job. If all units are moved, use a transfer/cancel workflow instead of a split.
- The user has authority to request the action; required approval is present.
- A reason and supporting note are present.

### 6.4 Split Transaction Algorithm

The implementation must be atomic:

```text
BEGIN TRANSACTION
  1. Lock source job and selected unit rows.
  2. Revalidate all split preconditions.
  3. Create child job.
  4. Copy immutable commercial origin fields: PO, client, rootJobId, originalPoUnitCount.
  5. Set child.parentJobId = source job ID.
  6. Set child.rootJobId = source.rootJobId.
  7. Set child.currentStage = S4C_RESCHEDULE (or S4D_REINSPECTION when applicable).
  8. Move selected units by updating currentJobId to child job ID.
  9. Recalculate source and child job unit totals from JobUnit records.
  10. Allocate contract value using approved allocation mode.
  11. Write SplitCreated, UnitTransferred, and Approval audit events.
COMMIT TRANSACTION
```

If any step fails, roll back the entire transaction. Never create a child card without moving units, and never move units without a child job.

---

## 7. Required Flow: 100 Units, 80 Pass, 20 Delayed

### 7.1 Batch 1 Result

```text
Original PO: PO-2026-001
Original/Root Job: JOB-2026-001
Expected units: 100

Batch 1:
- 80 units inspected and technically pass
- 20 units unavailable because client location/area is not ready
```

### 7.2 Option A: Do Not Split

Use this only when the client agrees to wait and the 20 units will be available soon.

```text
JOB-2026-001
  80 units: LAIK, waiting in the same job
  20 units: NOT_INSPECTED

S4 → S4b → WAIT_AND_RESCHEDULE → S4c → S4d

If the remaining 20 pass:
  100 units → S5 → S6 → S7 → S8 → S9 → S10 → S11 → S11c → S11b → S12
```

Result: one job, one operational path after all units catch up, normally one SUKET and one invoice.

### 7.3 Option B: Split for Partial Processing

Use this when the client needs the 80 passing units to continue now.

```text
Before split:
JOB-2026-001 = 100 units

After split:

PARENT JOB: JOB-2026-001
- 80 units, all LAIK
- Stage: S5_LHPP_DRAFT
- May progress to Stage 12 and close

CHILD JOB: JOB-2026-001-C01
- parentJobId: JOB-2026-001
- rootJobId: JOB-2026-001
- 20 units, NOT_INSPECTED
- Stage: S4C_RESCHEDULE
- Remains active until inspection/retest and final disposition
```

The parent progresses:

```text
80 LAIK units
S5 → S6 → S7 → S8 → S9 → S10 → S11 → S11c → S11b → S12 CLOSED
```

The child progresses independently:

```text
20 delayed units
S4c → S4d → S5 → S6 → S7 → S8 → S9 → S10 → S11 → S11c → S11b → S12 CLOSED
```

The parent closing is valid even if the child is still active. The Kanban must show their relationship rather than block closure.

---

## 8. Kanban Board Design

### 8.1 Board Principle

The Kanban board groups **job cards by current stage**. It does not group POs. A root/parent job and a child job may appear in different columns simultaneously.

Example board state after splitting 80/20 units:

```text
┌───────────────────────┐        ┌────────────────────────────┐
│ S4c: Reschedule       │        │ S5: LHPP Draft             │
├───────────────────────┤        ├────────────────────────────┤
│ JOB-2026-001-C01      │        │ JOB-2026-001               │
│ CHILD · PO-2026-001   │        │ PARENT · PO-2026-001       │
│ 20 units pending      │        │ 80/80 units Laik           │
│ Parent: JOB-2026-001  │        │ Children: 1 active         │
│ Next: schedule visit  │        │ Next: create LHPP           │
└───────────────────────┘        └────────────────────────────┘
```

Later, the parent can be in Stage 12 while the child remains in Stage 4c:

```text
┌───────────────────────┐        ┌────────────────────────────┐
│ S4c: Reschedule       │        │ S12: Closed                │
├───────────────────────┤        ├────────────────────────────┤
│ JOB-2026-001-C01      │        │ JOB-2026-001               │
│ CHILD · 20 pending    │        │ PARENT · 80 certified      │
│ Parent closed         │        │ Child: 1 still active       │
└───────────────────────┘        └────────────────────────────┘
```

This is valid. The board reflects independent operational jobs while preserving their family relationship.

### 8.2 Board Columns

Use the 17 workflow columns or grouped columns with stage labels:

| Board column | Stage codes |
|---|---|
| PO & Documents | S1, S2 |
| Scheduling | S3, S4c |
| Field Inspection | S4, S4d |
| Unit Reconciliation | S4b |
| LHPP & Technical Review | S5, S6 |
| Disnaker | S7, S8, S9 |
| Finance & Collection | S10, S11, S11c |
| SUKET Delivery | S11b |
| Closed | S12 |

Do not render all 17 columns on a narrow screen. Use grouped columns by default, then let users expand a group or filter by exact stage.

### 8.3 Required Card Content

Every card must display:

```text
[Parent/Child/Normal badge] [Stage badge] [Risk badge, if relevant]
Job number
PO number
Client name
Equipment category / location

Units: 80 total
Laik: 80 | Tidak Laik: 0 | Pending: 0 | Unavailable: 0

If parent: Children: 1 total, 1 active, 0 closed
If child: Parent: JOB-2026-001

Current owner/PIC
Next required action
SLA/aging indicator
```

Example parent card:

```text
PARENT · S8 DISNAKER
JOB-2026-001
PO-2026-001 · PT Example

80 units | 80 Laik | 0 unresolved
Child jobs: 1 active (20 units)
SUKET: Pending Disnaker
SLA: Day 18 / 30
```

Example child card:

```text
CHILD · S4c RESCHEDULE
JOB-2026-001-C01
PO-2026-001 · PT Example

20 units | 0 Laik | 20 unavailable
Parent: JOB-2026-001 (S8 Disnaker)
Reason: Client unit unavailable
Next action: Set retest date
```

### 8.4 Family Visualisation

Cards must have a clickable family indicator:

- Parent card: `Children: 1 active`.
- Child card: `Parent: JOB-2026-001`.
- Clicking either opens a **Job Family Drawer**.

Required Job Family Drawer:

```text
PO-2026-001 — Job Family
Original PO Quantity: 100 units

JOB-2026-001 [PARENT] [S8: Disnaker]
  80 units: 80 Laik, 0 unresolved
  SUKET: Pending
  Invoice: Not created

JOB-2026-001-C01 [CHILD] [S4c: Reschedule]
  20 units: 0 Laik, 20 pending
  Reason: Client unit unavailable
  Next schedule: Not set

Family totals:
  100 original units
  80 certified/passing
  20 active unresolved
  0 closed failed
```

Family totals must be computed from units across jobs, not added manually.

### 8.5 Board Filters

Required filters:

- Exact stage / grouped stage
- Job type: `NORMAL`, `PARENT`, `CHILD`
- Show family: `All`, `Only root/parent`, `Only children`, `Family with active child`
- Client
- Disnaker region
- PIC / owner
- SLA condition: `On Track`, `Due Soon`, `Overdue`
- Unresolved-unit condition: `Has Tidak Laik`, `Has Unavailable`, `Has Document Debt`
- PO number / job number / unit serial number search

### 8.6 Board Interaction Rules

| Interaction | Allowed? | Required behavior |
|---|---:|---|
| Drag card to another stage | No direct stage transition | Open action modal; validate gates; move card only after successful save |
| Open parent from child card | Yes | Navigate to parent detail or open family drawer |
| Open child from parent card | Yes | Show child list, stage, unit count, unresolved reason |
| Split job at Stage 4b | Yes, authorized roles only | Open Split Job modal and run atomic transaction |
| Merge child back to parent | No by default | Requires explicit controlled workflow; see Section 11 |
| Close parent with active child | Yes | Show warning but do not block if parent criteria are satisfied |
| Close child | Yes | Validate only child units/documents/payment, not parent state |

---

## 9. Split Job Modal Specification

### 9.1 Modal Sections

The Stage 4b action modal must have the following sections:

1. **Inspection Summary**
2. **Decision**: Wait, Split, Reduce Scope, Cancel
3. **Unit Selection**
4. **Child Job Configuration**
5. **Commercial Allocation**
6. **Approval & Audit Reason**
7. **Confirmation Preview**

### 9.2 Inspection Summary

```text
Original PO units: 100
Current job units: 100
Batch 1 results:
- 80 Laik
- 0 Tidak Laik
- 20 Not Inspected: Client unit unavailable
```

### 9.3 Unit Selection Table

```text
[ ] Unit Code | Serial No. | Equipment | Status | Reason | Inspection Batch
[x] U-081     | SN-081     | Boiler    | Not Inspected | Client unavailable | 1
[x] U-082     | SN-082     | Boiler    | Not Inspected | Client unavailable | 1
...
```

The modal must not allow selecting `LAIK` units by default. If an authorized exception permits it, require a separate high-risk confirmation and audit reason.

### 9.4 Confirmation Preview

Before execution, show exactly what will happen:

```text
Split Preview

Source / Parent job after split
- JOB-2026-001
- Retains: 80 units
- Next stage: S5 LHPP Draft

New child job
- JOB-2026-001-C01
- Receives: 20 units
- Start stage: S4c Reschedule
- Parent: JOB-2026-001
- Root job: JOB-2026-001
- PO: PO-2026-001

Commercial allocation
- Parent: calculated/approved amount
- Child: calculated/approved amount

This action cannot be undone through the normal UI.
```

Require explicit confirmation by the authorized user.

---

## 10. Finance and SUKET Rules After Split

### 10.1 Avoid a Dangerous Assumption

Do not assume every split automatically creates two invoices. That can be wrong if the original PO is fixed-price, has one tax invoice, or contract terms do not permit partial billing.

The system must store commercial allocation separately from the operational split.

### 10.2 Required Commercial Allocation Modes

| Mode | Use when | Rule |
|---|---|---|
| `PRO_RATA` | Unit pricing is defined or allocation is proportional | Child/parent values calculated from unit quantities or pricing schedule |
| `MANUAL_APPROVED` | Contract is lump-sum or allocation cannot be derived safely | Finance/authorized approver enters allocation with justification |
| `BILL_PARENT_ONLY` | Contract requires one final invoice | Operational jobs are split, but billing remains attached to the root/parent invoice plan |

Do not implement “separate invoice for every child job” as a universal rule. That is commercially unsafe.

### 10.3 SUKET Rules

- A SUKET includes only units that have completed technical approval and are accepted for issuance.
- A unit may appear in only one issued SUKET.
- Parent and child may receive separate SUKETs.
- Parent SUKET delivery can proceed while a child job remains active, provided parent-only units meet all document, payment, and delivery gates.
- The family dashboard must show cumulative certified units across all jobs under the same PO.

---

## 11. Merge-Back Policy

### 11.1 Default Position: Do Not Merge

Once a child job has independent schedules, reports, Disnaker records, SUKETs, invoices, or payment events, merging it back into the parent is dangerous and should be disallowed.

**Reason:** Merging can corrupt audit history, document ownership, invoice allocation, and stage chronology.

### 11.2 Limited Merge Before Downstream Commitments

A controlled merge-back may be allowed only when **all** are true:

- Child is still in S4c or S4d.
- No LHPP is finalized for child units.
- No Disnaker batch exists for child units.
- No invoice line is finalized for child units.
- No SUKET is issued for child units.
- Kadiv/Manager approves with a mandatory reason.

If allowed, use a transaction that transfers units back, cancels the child job, writes audit events, and recalculates totals.

---

## 12. Closure Rules for Job Families

### 12.1 Individual Job Closure

Each job closes independently when its own units satisfy all applicable Stage 12 requirements:

- Its units have reached a final disposition: certified, closed failed, cancelled, or otherwise authorized.
- Required documents for that job are complete.
- Required SUKET delivery for certified units is recorded.
- Payment status meets the configured commercial policy for that job or its billing plan.
- No outstanding document debt blocks closure.

### 12.2 Family Closure

The **PO/job family** should have a separate derived status:

| Family status | Meaning |
|---|---|
| `ACTIVE` | At least one job in the family is active or on hold |
| `PARTIALLY_CLOSED` | One or more jobs are closed, but one or more child jobs remain active |
| `FULLY_CLOSED` | Every job in the family has a terminal status |
| `EXCEPTION_REVIEW` | A job is blocked, abandoned, failed, or requires manager decision |

Example:

```text
Parent JOB-2026-001: CLOSED (80 units certified)
Child JOB-2026-001-C01: ACTIVE (20 units awaiting schedule)

Family status: PARTIALLY_CLOSED
```

This is the correct way to “track 80 passed while waiting for 20.” The 80-unit job is closed; the PO family remains partially closed until the 20-unit child reaches a terminal state.

---

## 13. Required Audit Events

```ts
type AuditEventType =
  | 'INSPECTION_BATCH_RECORDED'
  | 'UNIT_STATUS_CHANGED'
  | 'SPLIT_REQUESTED'
  | 'SPLIT_APPROVED'
  | 'SPLIT_CREATED'
  | 'UNIT_TRANSFERRED_TO_CHILD'
  | 'COMMERCIAL_ALLOCATION_SET'
  | 'CHILD_JOB_CANCELLED'
  | 'MERGE_BACK_APPROVED'
  | 'MERGE_BACK_COMPLETED'
  | 'JOB_CLOSED'
  | 'JOB_REOPENED';

interface AuditEvent {
  id: string;
  rootJobId: string;
  jobId: string;
  jobUnitId: string | null;
  eventType: AuditEventType;
  actorUserId: string;
  occurredAt: string;
  reason: string | null;
  beforeJson: object | null;
  afterJson: object | null;
  correlationId: string; // Same ID for all events in one split transaction
}
```

Audit records must be append-only. Do not implement editable audit-log rows.

---

## 14. API Contract Outline

### 14.1 Record Inspection Batch

```http
POST /api/jobs/{jobId}/inspection-batches
```

```json
{
  "inspectionDate": "2026-09-08",
  "inspectorIds": ["USR-INS-001"],
  "units": [
    {
      "jobUnitId": "UNIT-001",
      "outcome": "LAIK",
      "note": null
    },
    {
      "jobUnitId": "UNIT-081",
      "outcome": "NOT_INSPECTED",
      "nonInspectionReason": "CLIENT_UNIT_UNAVAILABLE",
      "note": "Area produksi sedang maintenance"
    }
  ],
  "evidenceDocumentIds": ["DOC-BAP-001", "DOC-PHOTO-001"]
}
```

### 14.2 Create Split

```http
POST /api/jobs/{jobId}/splits
```

```json
{
  "selectedUnitIds": ["UNIT-081", "UNIT-082"],
  "splitReason": "CLIENT_REQUEST",
  "clientRequestedPartialProcessing": true,
  "commercialAllocationMode": "MANUAL_APPROVED",
  "childJobStage": "S4C_RESCHEDULE",
  "rescheduleReason": "20 unit belum tersedia di lokasi",
  "approvalReason": "Klien membutuhkan proses SUKET untuk 80 unit yang telah laik.",
  "approvedByUserId": "USR-MANAGER-001"
}
```

Success response:

```json
{
  "sourceJob": {
    "id": "JOB-2026-001",
    "jobType": "PARENT",
    "currentUnitCount": 80,
    "currentStage": "S5_LHPP_DRAFT"
  },
  "childJob": {
    "id": "JOB-2026-001-C01",
    "jobType": "CHILD",
    "parentJobId": "JOB-2026-001",
    "rootJobId": "JOB-2026-001",
    "currentUnitCount": 20,
    "currentStage": "S4C_RESCHEDULE"
  },
  "correlationId": "SPLIT-2026-001-001"
}
```

### 14.3 Get Job Family

```http
GET /api/jobs/{jobId}/family
```

The response must include root job, direct and nested descendants, unit totals by final/current status, family status, and cross-job SUKET/invoice summary.

---

## 15. Acceptance Criteria

### AC-01: Partial Inspection Without Split

Given a job has 100 units and Batch 1 marks 80 `LAIK` and 20 `NOT_INSPECTED`, when Marketing selects `WAIT_AND_RESCHEDULE`, then the system keeps all 100 units in one job and routes unresolved units to S4c.

### AC-02: Split for 80/20 Case

Given a job has 80 `LAIK` units and 20 `NOT_INSPECTED` units, when authorized Marketing/Manager selects `SPLIT_FOR_PARTIAL_PROCESSING`, then:

- the source job becomes `PARENT`;
- source job retains exactly 80 units;
- the new child receives exactly 20 units;
- each transferred unit’s `currentJobId` becomes the child ID;
- both jobs share the same `rootJobId` and PO;
- source progresses to S5;
- child is created in S4c;
- the board displays two cards in their respective columns;
- family totals remain exactly 100 units.

### AC-03: Parent Closes Before Child

Given a parent has 80 eligible units and a child has 20 delayed units, when the parent fulfills all Stage 12 gates, then the parent may close even if the child remains active. The family status becomes `PARTIALLY_CLOSED`.

### AC-04: No Duplicate Unit Ownership

Given a split has completed, when a user opens parent and child unit lists, then no unit appears in both lists. The sum of units across active family jobs equals the original PO unit count, excluding formally cancelled units with an audit record.

### AC-05: No Direct Kanban Bypass

Given a user drags a card from S4b to S5, when required split/reconciliation details are missing, then the system rejects the transition. It must show the required action modal instead of moving the card.

### AC-06: Family Drawer Visibility

Given a parent is closed and its child remains in S4c, when a user opens either card, then the family drawer shows both jobs, their stages, their unit counts, and family status `PARTIALLY_CLOSED`.

### AC-07: Financial Separation Is Controlled

Given a child job is created, when no commercial allocation has been approved, then the system may create and operate the child job but must block child invoice issuance until Finance/authorized user sets an approved allocation or a shared billing plan.

---

## 16. Implementation Warnings

1. **Do not use a single `job.status` field as the source of truth for 100 units.** Unit-level state is mandatory.
2. **Do not duplicate units during split.** Transfer allocation by changing `currentJobId`; preserve immutable original/root references.
3. **Do not use card position as workflow truth.** The database stage field is authoritative; the Kanban is a projection.
4. **Do not permit unrestricted drag-and-drop.** It will bypass validation gates and damage auditability.
5. **Do not force every child into a separate invoice.** Contract terms may require shared or parent-level billing.
6. **Do not block a qualifying parent from closing because a child remains open.** Use family-level status for the unresolved overall PO.
7. **Do not merge jobs after downstream documents exist.** Preserve the split history instead.
8. **Do not hand-calculate card counts.** All counts must be derived from current unit records.

---

## 17. Honest Design Assessment

| Design decision | Rating | Assessment |
|---|---:|---|
| Treating one PO as potentially many operational jobs | 10/10 | Correct; necessary for partial field completion and separate follow-up work. |
| Parent job can close while child remains active | 10/10 | Correct; family status solves the apparent contradiction. |
| Tracking unit allocation and status per unit | 10/10 | Non-negotiable for correctness and auditability. |
| Showing parent and child as separate Kanban cards | 9/10 | Correct UI model; requires family drawer and clear badges to avoid confusion. |
| Standard free-form drag-and-drop Kanban | 2/10 | Wrong for compliance workflow; it bypasses hard gates. |
| Automatically splitting every partial inspection | 4/10 | Wrong; it creates needless administrative and financial fragmentation. Make it an explicit decision. |
| Automatically invoicing every child job | 3/10 | Commercially unsafe; billing must follow contract allocation rules. |
| Reusing original job as parent and creating only a child for unresolved units | 9/10 | Best default: preserves IDs, documents, and history while minimizing data churn. |

---

**END OF SPECIFICATION**