# DNP Monitor — Kanban Parent–Child Job Split Specification

**Version:** 1.1  
**Status:** Implementation specification with operational safeguards  
**Scope:** Kanban UI, parent–child job splitting, batch inspection tracking, unit ownership, notifications, concurrency, document lineage, and closure rules.

> This document is an implementation specification for the application. It is not a substitute for confirming client contracts, accounting treatment, or applicable regulatory requirements.

---

## 1. Purpose

This specification defines how DNP Monitor represents a single PO with partial inspections.

Example: a PO contains 100 units. Batch 1 inspects 80 units and all 80 pass. The remaining 20 units are unavailable and must be inspected later. The application must allow the 80 passing units to continue through LHPP, Disnaker, SUKET, invoice, delivery, and closure **without losing traceability** to the 20 delayed units.

This is not a standard task Kanban. It is a relational workflow UI where one original commercial order may produce multiple independently progressing operational jobs.

---

## 2. Honest Design Decisions

### 2.1 What This Design Gets Right

- One PO may produce multiple operational jobs.
- A parent job can close while a child remains active.
- Unit-level allocation prevents duplicate or missing units.
- The Kanban is a projection of validated workflow state, not the source of truth.
- A family-level status tracks the overall PO while individual jobs progress independently.

### 2.2 Weak Assumptions Rejected

#### Automatic splitting is not always correct — rating: 4/10

Do not automatically split every partial inspection. A split can create separate SUKET, scheduling, documents, billing, and reconciliation work. It should be an explicit business decision.

#### Automatic separate invoicing is unsafe — rating: 3/10

A child operational job does not automatically mean a separate legal or tax invoice. The contract may require one invoice, milestone billing, or a manually approved allocation.

#### Free-form Kanban dragging is unsuitable — rating: 2/10

Unrestricted drag-and-drop can bypass document, payment, technical, or approval gates. The board must trigger validated action dialogs instead.

#### A parent closing means the whole PO is finished — rating: 1/10

That is wrong. A parent can be individually closed while the job family remains `PARTIALLY_CLOSED` because a child is still active.

---

## 3. Non-Negotiable Rules

1. **One PO is not always one job.** A PO is the commercial source document; one PO may produce one or more operational jobs after a split.
2. **One unit belongs to exactly one active job at a time.** A unit must never appear in both parent and child after a split.
3. **Every unit is traceable back to its original PO and root job.** Splitting must not destroy history.
4. **A parent job may close while one or more child jobs remain active.** Closing a parent does not close children.
5. **A child job progresses independently after splitting.** It has its own stage, schedule, LHPP, SUKET, invoice, payment status, and closure status, subject to the approved billing plan.
6. **The Kanban card represents an operational job, not a PO.** Parent and child jobs are separate cards.
7. **The Kanban must never allow direct drag-and-drop bypass of hard gates.** Stage changes must be performed through validated actions/modals.
8. **All split, transfer, reopen, bypass, closure, cancellation, and override actions require immutable audit logs.**
9. **The source of truth is the database state and unit allocation, not the card position.**
10. **A split must be atomic.** No child card may exist without its unit allocation, and no unit may move without its child job.
11. **Every operational action must have one current owner and one next action.** A card without an owner or next action is an operational defect.
12. **Historical inspection results are append-only.** Corrections must create a correction event, not silently overwrite field evidence.

---

## 4. Terminology

| Term | Definition |
|---|---|
| **PO** | Original client commercial document. One PO can fund multiple operational jobs after a split. |
| **Root Job** | First job created from a PO; audit root for all descendants. |
| **Parent Job** | Job that retains units after other units are moved into child jobs. |
| **Child Job** | Operational job created from units transferred out of another job. |
| **Normal Job** | Job that has never been split and has no parent or children. |
| **Job Family** | Root job plus all descendants connected through `root_job_id`. |
| **Inspection Batch** | One field visit or inspection attempt. |
| **Unit Allocation** | Current job responsible for a unit. |
| **Split** | Atomic operation creating a child job and transferring selected units into it. |
| **Passing Unit** | Unit with technically approved status `Laik`. |
| **Delayed Unit** | Unit not inspected due to availability or logistics. |
| **Failed Unit** | Unit recorded as `Tidak Laik` and awaiting repair/retest or final closure. |
| **SLA Clock** | A stage-specific timer with start, pause, resume, due, and escalation timestamps. |
| **Document Debt** | Missing document approved for temporary bypass but still required before the configured downstream gate. |

---

## 5. Core Domain Model

### 5.1 Relationship Model

```text
PO-2026-001 (100 units)
└── ROOT/PARENT JOB: JOB-2026-001
    ├── 80 passing units
    │   └── progresses and may close at Stage 12
    │
    └── CHILD JOB: JOB-2026-001-C01
        └── 20 delayed units, independently scheduled and tracked
```

The root job remains the parent operational job after the first split. Do not create a replacement parent card unless there is a concrete business reason.

### 5.2 Required Job Fields

```ts
type JobType = 'NORMAL' | 'PARENT' | 'CHILD';
type JobStatus =
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'BLOCKED'
  | 'CLOSED'
  | 'CLOSED_FAILED'
  | 'CANCELLED';

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
  splitReason:
    | 'CLIENT_REQUEST'
    | 'UNIT_UNAVAILABLE'
    | 'MAX_RESCHEDULE_EXCEEDED'
    | 'TECHNICAL_FAILURE'
    | null;
  splitAt: string | null;
  splitApprovedByUserId: string | null;
  splitApprovalReason: string | null;

  // Commercial origin
  poId: string;
  poNumber: string;
  originalPoUnitCount: number;
  contractAllocationAmount: number | null;
  currency: 'IDR';
  billingPlanId: string | null;

  // Operational totals; generated from unit allocation
  currentUnitCount: number;
  laikUnitCount: number;
  tidakLaikUnitCount: number;
  pendingUnitCount: number;
  unavailableUnitCount: number;
  cancelledUnitCount: number;

  // Workflow
  currentStage: PipelineStage;
  status: JobStatus;
  currentOwnerUserId: string | null;
  currentOwnerRole: string | null;
  nextActionCode: string | null;
  nextActionDueAt: string | null;
  blockedReasonCode: string | null;
  blockedReasonNote: string | null;

  // Counters
  rescheduleCount: number;
  revisionCount: number;
  paymentRetryCount: number;

  // SLA clocks
  stageEnteredAt: string;
  stageDueAt: string | null;
  slaPausedAt: string | null;
  totalSlaPausedSeconds: number;

  // Dates
  createdAt: string;
  closedAt: string | null;
  lastActivityAt: string;
}
```

### 5.3 Required Unit Fields

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

### 5.4 Inspection Batch and Evidence Fields

The original design tracks unit status but under-specifies the historical inspection record. A current status is not enough to reconstruct what happened in the field.

```ts
interface InspectionBatch {
  id: string;
  jobId: string;
  batchNumber: number;
  inspectionDate: string;
  startedAt: string | null;
  endedAt: string | null;
  inspectorIds: string[];
  locationId: string;
  disnakerRegionId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'VOIDED';
  fieldStopReason: string | null;
  evidenceComplete: boolean;
  submittedByUserId: string;
  submittedAt: string | null;
}

interface UnitInspectionResult {
  id: string;
  inspectionBatchId: string;
  jobUnitId: string;
  outcome: 'LAIK' | 'TEMUAN' | 'NOT_INSPECTED';
  reason: string | null;
  findingDescription: string | null;
  correctiveAction: string | null;
  observationNote: string | null;
  evidenceDocumentIds: string[];
  recordedByUserId: string;
  recordedAt: string;
  supersedesResultId: string | null;
}
```

The result history is append-only. A correction creates a new result with `supersedesResultId`.

### 5.5 Data Integrity Constraints

```sql
CHECK (parent_job_id IS NULL OR parent_job_id <> id);

-- Root jobs point to themselves as root.
-- Children point to the immutable root ancestor through root_job_id.

-- A unit has one current operational owner.
UNIQUE (job_unit.id, job_unit.current_job_id);

-- A unit cannot be in more than one issued SUKET.
UNIQUE (suket_unit.job_unit_id) WHERE suket_unit.status IN ('DRAFT', 'ISSUED');

-- Unit totals on cards are derived from JobUnit records.
-- Do not expose manual total editing as a normal UI action.
```

**Critical implementation rule:** Use a database transaction and row-level locks for every split and unit transfer.

---

## 6. Stage 4 Inspection Outcome Model

### 6.1 Per-Unit Outcome Is Mandatory

Do not record only `80 inspected of 100`. The inspector must record an outcome for every expected unit:

| Unit condition | Required status | Required next handling |
|---|---|---|
| Inspected and passed | `LAIK` | Eligible for LHPP and SUKET path |
| Inspected with technical issue | `TEMUAN`, then `TIDAK_LAIK` after review | Repair/retest via S6 → S4c → S4d |
| Not inspected because unavailable | `NOT_INSPECTED` | Stage 4b decision: wait, reschedule, reduce scope, cancel, or split |
| Not inspected for another reason | `NOT_INSPECTED` with mandatory reason | Route by reason; escalate where necessary |

### 6.2 Mixed Result

For a 100-unit job after Batch 1:

```text
80 units: LAIK
20 units: NOT_INSPECTED / CLIENT_UNIT_UNAVAILABLE
```

This is a mixed result. The job enters Stage 4b because unresolved units exist, while the 80 passing units remain identifiable.

### 6.3 Batch Submission Gate

Stage 4 must not be marked complete until:

- Every expected unit has a result for that inspection attempt: `LAIK`, `TEMUAN`, or `NOT_INSPECTED`.
- Every `NOT_INSPECTED` unit has a reason.
- Every `TEMUAN` has a finding description and evidence where required.
- Mandatory field evidence is attached: departure, arrival, return, and BAP evidence according to the main pipeline policy.
- The inspector submits the batch; the system records the submission timestamp and actor.
- Corrections after submission require authorized correction workflow, not silent editing.

---

## 7. Split Decision at Stage 4b

### 7.1 Split Is Explicit

Do not automatically split every partial inspection. A split creates additional operational, document, Disnaker, SUKET, billing, and payment records.

At Stage 4b, Marketing selects:

| Decision | Use when | Result |
|---|---|---|
| `WAIT_AND_RESCHEDULE` | Client agrees to wait for all units | Keep one job; unresolved units go S4c |
| `SPLIT_FOR_PARTIAL_PROCESSING` | Client wants passing units processed independently | Existing job retains passing units; selected unresolved units move to child |
| `REDUCE_SCOPE` | Client formally removes units from scope | Contract/quantity adjusted; removed units get final disposition |
| `CANCEL_UNRESOLVED_UNITS` | Client will not continue for selected units | Units cancelled/closed with commercial approval and audit note |

### 7.2 Required Split Inputs

```ts
interface SplitRequest {
  sourceJobId: string;
  selectedUnitIds: string[];
  splitReason:
    | 'CLIENT_REQUEST'
    | 'UNIT_UNAVAILABLE'
    | 'MAX_RESCHEDULE_EXCEEDED'
    | 'TECHNICAL_FAILURE';
  clientRequestedPartialProcessing: boolean;
  commercialAllocationMode: 'PRO_RATA' | 'MANUAL_APPROVED' | 'BILL_PARENT_ONLY';
  childJobStage: 'S4C_RESCHEDULE' | 'S4D_REINSPECTION';
  rescheduleReason: string;
  approvedByUserId: string;
  approvalReason: string;
}
```

### 7.3 Split Preconditions

Reject the split if:

- No selected units exist.
- Any selected unit does not currently belong to the source job.
- Any selected unit has an issued SUKET.
- Any selected unit is included in a finalized invoice without an approved credit/debit-note workflow.
- Selected units are not unresolved, unless a special authorized transfer is supported.
- All units would be moved; use a controlled transfer/cancel workflow instead.
- Required authority or approval is missing.
- Reason, unit selection, or commercial allocation is missing.
- The source job is already closed, cancelled, or locked by a financial/legal process.
- Another split or unit transfer is currently in progress for the same job family.

### 7.4 Atomic Split Algorithm

```text
BEGIN TRANSACTION
  1. Acquire an application lock for the root job/family.
  2. Lock source job and selected unit rows.
  3. Revalidate all split preconditions.
  4. Create child job and reserve a unique job number.
  5. Copy immutable origin fields: PO, client, rootJobId, originalPoUnitCount.
  6. Set child.parentJobId = source job ID.
  7. Set child.rootJobId = source.rootJobId.
  8. Set child.currentStage = S4C or S4D.
  9. Transfer selected units by updating currentJobId.
  10. Create unit-transfer history rows.
  11. Recalculate source and child totals from JobUnit records.
  12. Create or attach the approved billing plan; do not invent billing terms.
  13. Create notification/outbox events.
  14. Write SplitCreated, UnitTransferred, Approval, and Allocation audit events.
COMMIT TRANSACTION
```

If any step fails, roll back the entire transaction. Use an outbox/event table so notifications cannot be lost after the database commit.

---

## 8. Required Flow: 100 Units, 80 Pass, 20 Delayed

### 8.1 Batch 1

```text
PO: PO-2026-001
Root job: JOB-2026-001
Expected: 100 units

Batch 1:
- 80 units inspected and pass
- 20 units unavailable because the client area is not ready
```

### 8.2 Option A: Do Not Split

```text
JOB-2026-001
  80 units: LAIK, waiting in the same job
  20 units: NOT_INSPECTED

S4 → S4b → WAIT_AND_RESCHEDULE → S4c → S4d

When all 20 pass:
100 units → S5 → S6 → S7 → S8 → S9 → S10 → S11 → S11c → S11b → S12
```

### 8.3 Option B: Split

```text
Before split:
JOB-2026-001 = 100 units

After split:

PARENT JOB: JOB-2026-001
- 80 units, all LAIK
- Next stage: S5_LHPP_DRAFT
- May progress to S12 and close

CHILD JOB: JOB-2026-001-C01
- parentJobId: JOB-2026-001
- rootJobId: JOB-2026-001
- 20 units, NOT_INSPECTED
- Next stage: S4C_RESCHEDULE
- Remains active until final disposition
```

Parent path:

```text
80 LAIK units
S5 → S6 → S7 → S8 → S9 → S10 → S11 → S11c → S11b → S12 CLOSED
```

Child path:

```text
20 delayed units
S4c → S4d → S5 → S6 → S7 → S8 → S9 → S10 → S11 → S11c → S11b → S12 CLOSED
```

Parent closure is valid while child remains active. Family status is `PARTIALLY_CLOSED`.

---

## 9. Kanban Board Design

### 9.1 Board Principle

The Kanban groups operational job cards by current stage. It does not group POs. A parent and child may appear in different columns simultaneously.

### 9.2 Board State Example

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

Later:

```text
┌───────────────────────┐        ┌────────────────────────────┐
│ S4c: Reschedule       │        │ S12: Closed                │
├───────────────────────┤        ├────────────────────────────┤
│ JOB-2026-001-C01      │        │ JOB-2026-001               │
│ CHILD · 20 pending    │        │ PARENT · 80 certified      │
│ Parent closed         │        │ Family: partially closed   │
└───────────────────────┘        └────────────────────────────┘
```

### 9.3 Columns

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

Use grouped columns by default on narrow screens, with exact-stage filtering.

### 9.4 Required Card Content

```text
[Parent/Child/Normal] [Stage] [SLA badge] [Blocked/Risk badge]
Job number
PO number
Client
Location / equipment type

Units: 80
Laik: 80 | Tidak Laik: 0 | Pending: 0 | Unavailable: 0

Parent: JOB-... / Children: 1 active
Current owner
Next required action
Due date and aging
Last activity
```

A card must make the next action obvious. “Stage 4c” alone is not enough; display “Admin: set inspection date” or the applicable action.

### 9.5 Family Drawer

Clicking parent or child opens:

```text
PO-2026-001 — Job Family
Original PO quantity: 100 units
Family status: PARTIALLY_CLOSED

JOB-2026-001 [PARENT] [S12 CLOSED]
  80 units: certified
  SUKET: issued/delivered

JOB-2026-001-C01 [CHILD] [S4c ACTIVE]
  20 units: unavailable
  Parent: JOB-2026-001
  Next action: schedule visit

Family totals:
  100 original
  80 certified
  20 active unresolved
  0 closed failed
```

### 9.6 Filters

- Exact/grouped stage.
- Job type.
- `All`, `Only parent/root`, `Only children`, `Family with active child`.
- Client, Disnaker region, PIC/owner.
- SLA: `On Track`, `Due Soon`, `Overdue`.
- `Has Tidak Laik`, `Has Unavailable`, `Has Document Debt`, `Blocked`.
- PO, job number, unit serial number.

### 9.7 Board Interaction Rules

| Interaction | Allowed? | Behavior |
|---|---:|---|
| Drag card to another stage | No direct transition | Open validated action modal |
| Open parent from child | Yes | Parent detail/family drawer |
| Open child from parent | Yes | Child list, stage, unit count, reason |
| Split at S4b | Authorized roles | Split modal + atomic transaction |
| Merge child back | No by default | Controlled pre-downstream workflow only |
| Close parent with active child | Yes | Warning; validate parent only; family remains partial |
| Close child | Yes | Validate child and its billing/document policy |

### 9.8 Board Consistency and Refresh

The board must handle concurrent updates:

- Use optimistic versioning (`row_version` or `updated_at` comparison).
- If another user changes the job before a modal submits, reject stale submission and reload current state.
- After split, invalidate/refetch both source and child cards, the family drawer, counters, and filters.
- Use real-time events or polling so two operators do not see stale card locations.
- Show a clear “updated by [user] at [time]” message when state changes externally.
- Preserve current filter and scroll position after refresh where possible.

---

## 10. Split Job Modal

Required sections:

1. Inspection summary.
2. Decision: Wait, Split, Reduce Scope, Cancel.
3. Unit selection.
4. Child configuration.
5. Commercial allocation.
6. Approval and reason.
7. Confirmation preview.

Unit selection must show unit code, serial, equipment, status, reason, and inspection batch. Unresolved units are selectable by default; certified units are not.

Confirmation preview:

```text
Source/parent: JOB-2026-001
Retains: 80 units
Next stage: S5 LHPP Draft

New child: JOB-2026-001-C01
Receives: 20 units
Start: S4c Reschedule
Parent: JOB-2026-001
Root: JOB-2026-001
PO: PO-2026-001

Commercial allocation: [approved mode and amount]
This action is auditable and cannot be undone through normal UI.
```

---

## 11. Finance and SUKET Rules

### 11.1 Operational Split Is Not Automatically a Billing Split

Store operational lineage separately from commercial billing. The contract may require one invoice, milestone billing, or separate invoices.

### 11.2 Billing Modes

| Mode | Use when | Rule |
|---|---|---|
| `PRO_RATA` | Unit pricing or proportional allocation exists | Calculate by approved pricing rule |
| `MANUAL_APPROVED` | Lump-sum or ambiguous allocation | Authorized Finance/Manager enters allocation with justification |
| `BILL_PARENT_ONLY` | Contract requires one billing plan | Child operations remain separate; billing remains linked to parent/root |

Child invoice creation is blocked until the billing plan is approved.

### 11.3 SUKET Rules

- SUKET includes only technically approved units.
- A unit may appear in only one issued SUKET.
- Parent and child may receive separate SUKETs.
- Parent delivery may proceed while child remains active if parent gates are satisfied.
- Family dashboard shows cumulative certified units.

### 11.4 Payment Attribution

If the client makes one payment covering multiple related jobs, Finance must allocate that payment through a payment-allocation record:

```ts
interface PaymentAllocation {
  paymentId: string;
  familyRootJobId: string;
  jobId: string;
  invoiceId: string | null;
  allocatedAmount: number;
  approvedByUserId: string;
  approvedAt: string;
  note: string;
}
```

Do not mark the child as paid merely because the parent’s invoice is paid. The approved billing plan determines payment attribution.

---

## 12. Merge-Back Policy

### 12.1 Default: Do Not Merge

After a child has independent schedules, finalized reports, Disnaker records, SUKETs, invoices, or payment events, merging is disallowed by default. Preserve the split history.

### 12.2 Limited Merge Before Downstream Commitment

Merge-back is allowed only when:

- Child is in S4c or S4d.
- No LHPP is finalized for child units.
- No Disnaker batch exists.
- No invoice line is finalized.
- No SUKET is issued.
- Kadiv/Manager approves with a reason.

Use one transaction to transfer units back, cancel child, recalculate totals, and write audit events.

---

## 13. Closure Rules

### 13.1 Individual Job Closure

A job closes independently when its own units satisfy applicable Stage 12 requirements:

- Units have final disposition: certified, closed failed, or cancelled.
- Required documents are complete.
- Required SUKET delivery is recorded for certified units.
- Payment status satisfies the approved billing plan.
- No document debt blocks closure.
- No unresolved mandatory action remains on the job.

### 13.2 Family Status

| Family status | Meaning |
|---|---|
| `ACTIVE` | At least one family job is active or on hold |
| `PARTIALLY_CLOSED` | One or more jobs closed while another remains active |
| `FULLY_CLOSED` | Every family job has a terminal status |
| `EXCEPTION_REVIEW` | A job is blocked, abandoned, failed, or requires manager decision |

Example:

```text
Parent: CLOSED — 80 units certified
Child: ACTIVE — 20 units awaiting schedule
Family: PARTIALLY_CLOSED
```

### 13.3 Abandonment and No-Response Handling

The previous design lacked an explicit “nothing is happening” state. A child must not remain indefinitely in S4c with no date and no owner.

For each active child:

- Store `lastClientContactAt` and `nextFollowUpAt`.
- Admin/Marketing records contact attempt and outcome.
- If the configured no-response period is exceeded, set job to `ON_HOLD` or `EXCEPTION_REVIEW`; do not silently close it.
- Kadiv/Manager chooses: continue, reduce scope, cancel unresolved units, or close failed.
- Closure requires reason, final unit disposition, and commercial treatment.

The exact no-response period is a business configuration and is intentionally not guessed here.

---

## 14. Audit Trail and Document Lineage

### 14.1 Audit Events

```ts
type AuditEventType =
  | 'INSPECTION_BATCH_RECORDED'
  | 'UNIT_STATUS_CHANGED'
  | 'UNIT_RESULT_CORRECTED'
  | 'SPLIT_REQUESTED'
  | 'SPLIT_APPROVED'
  | 'SPLIT_CREATED'
  | 'UNIT_TRANSFERRED_TO_CHILD'
  | 'COMMERCIAL_ALLOCATION_SET'
  | 'PAYMENT_ALLOCATED'
  | 'CHILD_JOB_CANCELLED'
  | 'MERGE_BACK_APPROVED'
  | 'MERGE_BACK_COMPLETED'
  | 'JOB_BLOCKED'
  | 'JOB_UNBLOCKED'
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
  correlationId: string;
}
```

Audit rows are append-only.

### 14.2 Document Ownership and Lineage

Every document must identify:

```ts
interface DocumentLink {
  documentId: string;
  rootJobId: string;
  jobId: string;
  jobUnitId: string | null;
  documentType: string;
  sourceDocumentId: string | null;
  uploadedByUserId: string;
  uploadedAt: string;
  version: number;
  status: 'ACTIVE' | 'SUPERSEDED' | 'VOIDED';
}
```

A document copied or reused by a child must retain `sourceDocumentId` and cannot be silently duplicated as if independently produced. Field evidence must remain associated with the inspection batch and affected units.

---

## 15. API Contract Outline

### 15.1 Record Inspection Batch

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

### 15.2 Create Split

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

### 15.3 Get Job Family

```http
GET /api/jobs/{jobId}/family
```

Response must include root job, descendants, unit totals by current/final status, family status, document debt, SLA alerts, and cross-job SUKET/invoice/payment summary.

### 15.4 Required Error Responses

The API must return structured errors, not generic “failed” messages:

```json
{
  "code": "SPLIT_STALE_VERSION",
  "message": "Job changed by another user. Reload before splitting.",
  "details": {
    "jobId": "JOB-2026-001",
    "currentUpdatedAt": "2026-09-08T09:20:00+07:00"
  }
}
```

Minimum error codes:

- `JOB_NOT_FOUND`
- `JOB_LOCKED`
- `STALE_VERSION`
- `UNIT_NOT_OWNED_BY_SOURCE_JOB`
- `UNIT_ALREADY_CERTIFIED`
- `UNIT_ALREADY_INVOICED`
- `SPLIT_REQUIRES_APPROVAL`
- `BILLING_PLAN_REQUIRED`
- `DOCUMENT_DEBT_BLOCKS_ACTION`
- `INVALID_STAGE_TRANSITION`
- `CANNOT_CLOSE_ACTIVE_WORK`

---

## 16. Acceptance Criteria

### AC-01: Partial Inspection Without Split

100 units; Batch 1 marks 80 `LAIK`, 20 `NOT_INSPECTED`. Marketing selects `WAIT_AND_RESCHEDULE`. All 100 remain in one job; unresolved units route to S4c.

### AC-02: Split for 80/20

Given 80 `LAIK` and 20 `NOT_INSPECTED`, an authorized user selects split:

- source becomes `PARENT`;
- source retains exactly 80 units;
- child receives exactly 20;
- transferred units’ `currentJobId` is child ID;
- both share PO and root job;
- source goes to S5;
- child starts at S4c;
- two cards appear in correct columns;
- family total remains 100.

### AC-03: Parent Closes Before Child

Parent fulfills Stage 12 while child remains active. Parent becomes `CLOSED`; family becomes `PARTIALLY_CLOSED`; child remains unchanged and visible.

### AC-04: No Duplicate Ownership

After split, no unit appears in both current job lists. Family current allocations plus formally cancelled units reconcile to original PO quantity.

### AC-05: No Direct Kanban Bypass

Dragging S4b to S5 does not directly change state. The system opens the required action modal and rejects missing split/reconciliation data.

### AC-06: Family Drawer

Opening either card shows every family job, stage, current owner, unit counts, family status, active child count, and next actions.

### AC-07: Financial Separation

Child creation is allowed without automatic invoice creation. Child invoice issuance is blocked until billing allocation or shared plan is approved.

### AC-08: Concurrent Split Protection

Two users attempt to split the same 20 units simultaneously. Exactly one succeeds; the other receives `STALE_VERSION` or `JOB_LOCKED`, and no duplicate child or duplicate unit allocation is created.

### AC-09: Inspection Evidence Correction

After a batch is submitted, a correction does not overwrite the original result. It creates a superseding result, records actor/time/reason, and preserves the original evidence.

### AC-10: No-Response Child

A child remains in S4c without a schedule. The system shows owner, last client contact, next follow-up, aging, and escalation state. It cannot remain invisible indefinitely.

### AC-11: Payment Attribution

A family payment is allocated explicitly to one or more jobs/invoices. No child becomes paid solely because a parent payment is recorded.

---

## 17. Implementation Warnings

1. Do not use one job status as the source of truth for all units.
2. Do not duplicate units during split; transfer current allocation while preserving history.
3. Do not use card position as workflow truth.
4. Do not permit unrestricted drag-and-drop.
5. Do not force every child into a separate invoice.
6. Do not block a qualifying parent from closing because a child remains open.
7. Do not merge jobs after downstream documents exist.
8. Do not hand-calculate card counts.
9. Do not silently overwrite inspection findings or documents.
10. Do not allow a child to remain indefinitely without owner, next action, contact date, or escalation state.
11. Do not send notifications directly inside a transaction without an outbox/retry mechanism.
12. Do not treat cached Kanban counts as authoritative; refresh from transactional data.

---

## 18. Honest Design Assessment

| Design decision | Rating | Assessment |
|---|---:|---|
| One PO can produce multiple operational jobs | 10/10 | Necessary and correct for partial field completion. |
| Parent closes while child remains active | 10/10 | Correct; family status resolves the contradiction. |
| Unit-level ownership and status | 10/10 | Non-negotiable. |
| Parent/child as separate Kanban cards | 9/10 | Correct if family drawer and badges are clear. |
| Family-level status separate from job status | 10/10 | Important addition for accurate reporting. |
| Free-form drag-and-drop | 2/10 | Unsafe for hard-gated workflow. |
| Automatic split for every partial inspection | 4/10 | Creates unnecessary operational and billing fragmentation. |
| Automatic separate invoice for each child | 3/10 | Commercially unsafe. |
| Historical inspection result tracking | 10/10 | Required for field auditability. |
| Outbox/retry for notifications | 9/10 | Important production reliability safeguard. |
| No-response/escalation handling | 9/10 | Prevents invisible “zombie” child jobs. |
| Current design overall | 9/10 | Strong implementation foundation; contract-specific billing and regulatory confirmation remain external decisions. |

---

**END OF SPECIFICATION**