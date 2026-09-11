# DNP Monitor --- Stage Rail + List/Queue Implementation Specification

> **Status:** Proposed UI/architecture\
> **Primary goal:** Replace the 17-column "everything at once" Kanban as
> the primary operational view with a **Stage Rail + Work Queue**, while
> keeping the existing clickable Job Detail / Workflow view.\
> **Recommendation:** Do **not** replace the current system with another
> Kanban library. Refactor the current board into a deliberate workflow
> product.

## 1. Executive Decision

Your current Job Detail screen is already the right foundation.

The screenshot shows a Job Detail workspace with Status, Dokumen,
Riwayat, Info & Edit, a vertical workflow, completed stages visually
collapsed, the active stage expanded, role/PIC information,
stage-specific forms, and actions such as `Tolak / Kembalikan` and
`Lanjut ke Stage 5`.

The board should answer:

> **"What work is waiting for me, and what is currently happening in
> this process?"**

The Job Detail should answer:

> **"What exactly happened to this Job, what documents/data exist, and
> what can I do next?"**

Do not merge those responsibilities.

### Target architecture

``` text
DNP WORKFLOW
│
├── Stage Registry
│   ├── stages
│   ├── phases
│   ├── transitions
│   ├── roles/PIC
│   ├── SLA
│   └── rules/prerequisites
│
├── Pipeline / Stage Rail
│   └── choose the stage to work on
│
├── Work Queue
│   ├── Job list
│   ├── filters
│   ├── sorting
│   ├── search
│   └── bulk-safe operational actions
│
└── Job Detail
    ├── Status / Workflow
    ├── Dokumen
    ├── Riwayat
    └── Info & Edit
```

### Honest rating

  ------------------------------------------------------------------------
  Approach                                    Rating Verdict
  --------------------- ---------------------------- ---------------------
  Current 17-column                           7.5/10 Useful overview, weak
  Kanban only                                        as primary work UI

  Replace with another                          5/10 Mostly solves
  Kanban library                                     technical UI
                                                     problems, not your
                                                     business workflow

  Gantt as primary                            5.5/10 Good for timing,
  workflow UI                                        wrong mental model
                                                     for operational stage
                                                     ownership

  BPMN/swimlane as                              6/10 Good process
  daily UI                                           documentation, too
                                                     abstract for daily
                                                     work

  **Stage Rail + Work                     **9.5/10** Best fit
  Queue + Job Detail**                               

  Stage Rail + Queue +                    **9.5/10** Best if you want to
  optional Kanban                                    retain the visual
  toggle                                             board
  ------------------------------------------------------------------------

## 2. What You Are Actually Building

Do not think of the product as:

> "a Kanban board with 17 columns."

Think of it as:

> **a workflow operating system with multiple visualizations.**

The workflow is the source of truth. The views are projections of that
workflow.

``` text
                    ┌──────────────────┐
                    │  Workflow Engine │
                    │   Source of Truth│
                    └────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
       Stage Rail        Work Queue        Job Detail
       navigation        operations        deep work
```

If your React component knows one transition while a controller knows
another, the system will eventually drift. The backend workflow model
must own the process; the UI displays it.

## 3. Main UX Change

Current model:

``` text
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ S1 │ S2 │ S3 │ S4 │ S4b│ S4c│ S4d│ S5 │ S6 │ ...│
│job │job │job │job │job │job │job │job │job │    │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

It works, but the user must understand many columns, branches, and
horizontal positions at once.

The new primary screen should be:

``` text
Phase Filter
     ↓
Stage Rail
     ↓
Selected Stage
     ↓
Work Queue
     ↓
Job Detail
```

You no longer display every queue simultaneously.

You display:

> **one selected stage + the work belonging to that stage.**

## 4. Main Screen Layout

``` text
┌──────────────────────────────────────────────────────────────────────────────┐
│ DNP Monitor                                      Search   Filter   View ▾     │
├──────────────────────────────────────────────────────────────────────────────┤
│ PHASE 1             PHASE 2              PHASE 3                             │
│ RU Lapangan         Laporan & Dinas      Invoice & Delivery                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 PO → 2 Verify → 3 Schedule → [4 Inspection] → 5 LHPP → 6 Review → ...    │
├──────────────────────────────────────────────────────────────────────────────┤
│ STAGE 4 — PELAKSANAAN RU                          7 Jobs                     │
│ PIC: INSPEKTUR                          [My Jobs] [All Jobs]                 │
│ Search jobs...    Status ▾    SLA ▾    Client ▾    Date ▾                  │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ JOB-2026-001       PT ABC Indonesia              Due Today        >     │ │
│ │ 12 Unit • Inspector: Budi                                              │ │
│ │ [Photo 3/3] [Checklist 8/8] [Unit 12/12]             Open Job           │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 5. Stage Rail

The Stage Rail replaces the permanent 17-column Kanban as the primary
operational navigation.

It answers:

-   What stages exist?
-   What phase am I in?
-   How many Jobs are in each stage?
-   Which stage is selected?
-   Which stages require attention?

It should **not** contain the full Job cards.

### Example

``` text
PHASE 1 — RU LAPANGAN

[1 PO 12] → [2 Verifikasi 8] → [3 Jadwal 5] → [4 Inspeksi 7]
                                      │
                                      └─ [4b Aktualisasi 2]
                                             ↓
                                      [4c Reschedule 1]
                                             ↓
                                      [4d RU Ulang 1]

PHASE 2 — LAPORAN & DINAS

[5 LHPP 14] → [6 Review 4] → [7 Dinas 6] → [8 Disnaker 3] → [9 Suket 5]

PHASE 3 — FINANCE / DELIVERY

[10 Invoice 4] → [11 Collection 2] → [12 Delivery/Payment 3] → [Closed 21]
```

The exact final labels must follow your approved workflow model.

**Do not hardcode the number "17" into multiple React components.**
Derive the stage count from the stage registry.

## 6. Normal Stages vs Exception Stages

Your workflow is not a simple linear chain.

The documented Stage 4 decision sends matching Jobs directly to Stage 5,
while mismatched Jobs enter the 4b → 4c → 4d exception chain.
fileciteturn1file0L18-L45

Represent it like:

``` text
                       ┌── 4b → 4c → 4d ──┐
                       │                   │
1 → 2 → 3 → 4 → DECISION ─────────────────→ 5
                       │
                       └──────────────────→ 5
                         if all units match
```

Do not visually imply that every Job must go through 4b/4c/4d.

Normal stages should be visually primary. Exception stages should be
visually subordinate/branched.

## 7. Stage Rail Interaction

Click:

``` text
[4 Inspeksi 7]
```

and the queue becomes:

``` text
STAGE 4 — PELAKSANAAN RU
7 Jobs

[Search] [My Jobs] [All] [Filter] [Sort]

JOB-001   PT ABC       Today       Budi
JOB-002   PT XYZ       Overdue    Andi
JOB-003   PT DEF       Tomorrow   Budi
```

The Stage Rail stays visible, so moving from Stage 4 to Stage 5 does not
require returning to a separate page.

## 8. Work Queue

The queue is where actual operational work happens.

Do not simply copy the Kanban card.

A queue row can contain more useful operational information:

``` text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ● JOB-2026-001                                      DUE TODAY               │
│                                                                              │
│ PT ABC Indonesia                     12 Unit                                │
│ Bandung, Jawa Barat                   Inspector: Budi                        │
│                                                                              │
│ Due: 10 Sep 2026     Started: 10 Sep     Age: 6h                            │
│                                                                              │
│ [Photos 3/3] [Checklist 8/8] [Units 12/12]                                 │
│                                                                              │
│ Next: Complete inspection                               [Open Job →]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

The queue should show:

> **information required to decide what to do next.**

Not every piece of Job data.

## 9. Queue Density

Support two densities.

### Comfortable

``` text
JOB-001
PT ABC Indonesia
12 Unit • Budi • Due Today
[3/3 Photos] [8/8 Checklist]
```

### Compact

``` text
JOB-001 | PT ABC | 12 Unit | Budi | Today | Ready
JOB-002 | PT XYZ |  4 Unit | Andi | Overdue | Action
```

The compact mode is particularly useful for Admin/Finance users handling
many Jobs.

## 10. Queue Columns

Recommended desktop table columns:

  Column         Purpose
  -------------- -------------------------------------------
  Job            Identifier + client
  Unit           Quantity
  Current Task   What the stage needs
  PIC            Current responsible person
  Due            SLA/date
  Age            Time spent in current stage
  Status         Waiting / In Progress / Blocked / Overdue
  Completeness   Stage-specific summary
  Action         Open

Avoid 15+ columns. Add optional columns through:

``` text
[Columns ▾]
```

## 11. Search

Search should support:

-   Job number
-   Client name
-   Unit/location
-   PIC
-   document number

Use a debounced search, roughly 300--400 ms.

Do not make a server request on every keystroke.

## 12. Filters

Global:

``` text
Phase
Stage
PIC
Client
Date range
SLA
Status
```

Stage-specific filters should change according to the selected stage.

Stage 4:

``` text
Inspector
Scheduled date
Unit count
Inspection completeness
Photo completeness
```

Stage 5:

``` text
Report PIC
LHPP status
Data received
Report started
Report completed
Lead time
```

Finance:

``` text
Invoice status
Payment status
Delivery status
Batch
```

Do not build one giant filter dialog containing every possible field.

## 13. "My Work" vs "All Work"

Provide:

``` text
[ My Work ] [ All Work ]
```

but only expose data the user is authorized to see.

The backend determines visibility.

Example:

``` text
Inspector:
Jobs assigned/authorized to inspect

Finance:
Finance-related Jobs

Manager:
Jobs within managerial scope

Admin:
Administrative Jobs

Marketing:
Marketing-owned Jobs
```

Hiding a button in React is not authorization.

## 14. Job Detail --- Keep Your Current Concept

Your current Job Detail is good and should not be discarded.

The current design already has:

``` text
Status
Dokumen
Riwayat
Info & Edit
```

plus a vertical workflow where completed stages are collapsed and the
active stage is expanded.

Keep that.

The new interaction becomes:

``` text
Stage Rail
    ↓
Work Queue
    ↓
Click Job
    ↓
Existing Job Detail
    ↓
Perform Stage Action
    ↓
Backend validates transition
    ↓
Queue refreshes
```

The board becomes the **work discovery layer**. The Job Detail remains
the **execution layer**.

## 15. Job Detail Opening

Two valid options:

### Drawer

Good for quick checking while preserving queue context.

### Full page

Better for large forms, documents, uploads, and long workflows.

Recommended:

> Drawer for preview + full page/current workspace for deep work.

However, if your existing Job Detail is already functional and users are
comfortable with it, do not rewrite it just to follow a UI trend.

## 16. Job Detail Tabs

Keep:

``` text
Status
Dokumen
Riwayat
Info & Edit
```

Within Status, make these prominent:

``` text
Current Stage
Next Action
SLA
Workflow
```

## 17. Queue Status vs Workflow Stage

Do not confuse Stage with Status.

Stage:

> Where is the Job in the business process?

Status:

> What is happening inside that stage?

Example:

``` text
Stage 4
Status: IN_PROGRESS
```

or:

``` text
Stage 4
Status: BLOCKED
```

or:

``` text
Stage 4
Status: OVERDUE
```

Recommended status vocabulary:

``` text
WAITING
IN_PROGRESS
BLOCKED
AWAITING_APPROVAL
OVERDUE
COMPLETED
```

Keep this small.

## 18. Stage Health

Every selected stage can show:

``` text
Stage 4
────────────────────────
Total              7
On Track           5
Due Today          1
Overdue            1
Blocked            0
```

These numbers should be clickable filters where useful.

## 19. SLA

The workflow contains stage-level SLA definitions, including examples
such as Stage 3 = 1 day, Stage 4 = Hari-H, Stage 4b/4c = 1 day, Stage 4d
= Hari-H, and Stage 5 = 3 days/unit. fileciteturn1file1L66-L92
fileciteturn1file0L25-L45 fileciteturn1file2L126-L137

Do not calculate SLA independently in the frontend.

Persist or derive consistently from:

``` text
stage_entered_at
due_at
stage SLA rule
```

## 20. Stage 5 Is Special

The workflow explicitly says LHPP tracking is per Unit/LHPP rather than
simply per Job, with three checkpoints:

1.  technical data submitted
2.  report started
3.  report completed

Those timestamps are used for lead-time calculations.
fileciteturn1file2L126-L137

Therefore:

``` text
Job count ≠ LHPP count
```

A Stage 5 summary can show:

``` text
14 Jobs
27 LHPP
31 Units
```

A row can show:

``` text
JOB-001
PT ABC
12 Units
LHPP: 10/12 complete
```

## 21. Stage 5 Queue

Use stage-specific progress:

``` text
┌──────────────────────────────────────────────────────────────┐
│ JOB-001 — PT ABC                                             │
│ 12 Units                                                     │
│                                                              │
│ Data      ████████████░░ 10/12                               │
│ Started   ██████████░░░░  8/12                               │
│ Done      ███████░░░░░░░  6/12                               │
│                                                              │
│ Avg lead time: 2.1 days                                      │
│ Over SLA: 1 unit                                             │
│                                                              │
│ [Open Job]                                                   │
└──────────────────────────────────────────────────────────────┘
```

The system must preserve the distinction between Job, Unit, LHPP, and
BAP. The workflow specifies LHPP per Unit/Alat and BAP per inspection
session. fileciteturn1file2L129-L137

## 22. Stage 2 Queue Example

The document verification stage contains multiple technical/legal checks
and an urgent bypass that requires Manager approval.
fileciteturn1file1L56-L64

A queue row should summarize the actual problem:

``` text
JOB-001 — PT ABC

Document Verification

Required documents:
✓ 4 complete
✕ 3 missing
⚠ 1 requires review

Result:
BLOCKED

[Open Job]
```

Do not hide the problem behind:

``` text
Progress 62%
```

## 23. Manager Approval

For Stage 6:

``` text
STAGE 6 — REVIEW LAPORAN

4 Jobs awaiting decision

JOB-001 — PT ABC
Reviewer: Manager A
Waiting: 6 hours

[Review Job →]
```

Inside Job Detail:

``` text
[Approve]
[Reject / Return to Revision]
```

The documented workflow supports approval to Stage 7 and rejection back
to Stage 5. fileciteturn1file4L272-L284

## 24. Exception UI

Exception stages should remain part of the same workflow:

``` text
Stage 4
Pelaksanaan RU
        │
        ▼
   Hasil RU & Unit?
     /          \
  MATCH       MISMATCH
   │             │
   │             ▼
   │          Stage 4b
   │          Aktualisasi
   │             │
   │             ▼
   │          Stage 4c
   │          Reschedule
   │             │
   │             ▼
   │          Stage 4d
   │          RU Ulang
   │             │
   └─────────────┴──────→ Stage 5
```

This is supported directly by the workflow definition.
fileciteturn1file0L18-L45

## 25. Stage Model

Create a central Stage Registry.

Example:

``` ts
type WorkflowStage = {
  id: number;
  code: string;
  name: string;
  short_name: string;

  phase_id: number;
  sequence: number;

  type:
    | 'standard'
    | 'gateway'
    | 'exception'
    | 'terminal';

  owner_role_id: number | null;

  sla_type:
    | 'calendar_days'
    | 'business_days'
    | 'same_day'
    | 'event_based'
    | 'none';

  sla_value: number | null;

  is_visible: boolean;
  is_terminal: boolean;

  parent_stage_id: number | null;

  metadata: JSON;
};
```

Example:

``` json
{
  "code": "S4",
  "name": "Pelaksanaan RU",
  "short_name": "Inspeksi",
  "phase": "FIELD",
  "sequence": 4,
  "type": "standard",
  "owner_role": "INSPECTOR",
  "sla_type": "same_day"
}
```

Exception:

``` json
{
  "code": "S4B",
  "name": "Aktualisasi Unit",
  "short_name": "Aktualisasi",
  "phase": "FIELD",
  "sequence": 4.1,
  "type": "exception",
  "owner_role": "MARKETING",
  "parent_stage": "S4"
}
```

## 26. Never Hardcode Workflow Rules in UI

Avoid scattered code such as:

``` tsx
if (stage === 4) { ... }
if (stage === '4b') { ... }
if (user === 'finance') { ... }
```

Instead:

``` tsx
const stage = workflow.stages.find(
  s => s.code === currentStage
);

return <StageRenderer stage={stage} />;
```

Business transition rules belong in Laravel/backend services.

## 27. Database Design

A practical relational model:

``` text
phases
------
id
code
name
sequence
is_active


workflow_stages
---------------
id
phase_id
code
name
short_name
sequence
type
owner_role_id
sla_type
sla_value
parent_stage_id
is_active
metadata


workflow_transitions
--------------------
id
from_stage_id
to_stage_id
transition_code
label
required_role
condition_type
condition_config
is_active


jobs
----
id
job_number
client_id
current_stage_id
current_status
created_at
updated_at


job_stage_instances
-------------------
id
job_id
stage_id
entered_at
started_at
completed_at
due_at
status
completed_by
metadata


job_transitions
---------------
id
job_id
from_stage_id
to_stage_id
transition_id
performed_by
performed_at
reason
metadata


job_logs
--------
id
job_id
user_id
event_type
message
metadata
created_at
```

## 28. Why `job_stage_instances` Matters

Do not only store:

``` text
jobs.current_stage_id
```

You need historical stage instances.

Example:

``` text
Stage 1
entered: 01 Sep
completed: 02 Sep

Stage 2
entered: 02 Sep
completed: 03 Sep

Stage 3
entered: 03 Sep
completed: 05 Sep

Stage 4
entered: 05 Sep
completed: 05 Sep

Stage 4b
entered: 05 Sep
completed: 06 Sep

Stage 4c
entered: 06 Sep
completed: 07 Sep

Stage 4d
entered: 07 Sep
completed: 07 Sep

Stage 5
entered: 07 Sep
...
```

This enables:

``` text
time_in_stage
total_lead_time
number_of_revisits
number_of_exceptions
SLA_breach
```

without reconstructing history from audit logs.

## 29. Transition Table

The backend should explicitly define allowed transitions.

Conceptual example:

``` text
S1 → S2
S2 → S3
S2 → S1
S2 → MANAGER_BYPASS
MANAGER_BYPASS → S3

S3 → S4

S4 → S5
S4 → S4B

S4B → S4C
S4C → S4D
S4D → S5

S5 → S6
S5 → S7

S6 → S5
S6 → S7

S7 → S8
S8 → S9
...
```

The final matrix must follow the approved business workflow, including
the documented gateways and loops.

## 30. Transition Authorization

Every transition should pass:

``` text
1. Can this user perform this transition?
2. Are prerequisites satisfied?
3. Is approval required?
4. Execute atomically.
```

Example response:

``` json
{
  "allowed": false,
  "reason": "Checklist belum lengkap",
  "missing": [
    "Foto Keberangkatan",
    "Foto Kepulangan"
  ]
}
```

The frontend displays the reason. The backend remains authoritative.

## 31. Do Not Make Drag-and-Drop the Primary Transition

For this business process, I would **not** use drag-and-drop as the
primary workflow mechanism.

A user dragging:

``` text
Stage 4
→ Stage 5
```

does not prove that required photos, checklist, unit data, approvals, or
other prerequisites are complete.

Use:

``` text
Open Job
↓
Complete Stage Form
↓
Click "Lanjut ke Stage 5"
↓
Backend validates
↓
Transition succeeds
```

Your existing Job Detail already follows this safer pattern.

## 32. Queue Actions

Safe actions can appear directly in the queue:

``` text
[Open]
[Assign]
```

Business-critical actions should normally occur inside Job Detail:

``` text
[Approve]
[Reject]
[Complete Stage]
[Close Job]
```

This reduces accidental state changes.

## 33. Phase Filter

Keep the current phase filter idea:

``` text
[Semua]
[RU Lapangan]
[Laporan & Dinas]
[Finance & Delivery]
```

Selecting a phase changes the visible Stage Rail.

Example:

``` text
RU Lapangan

1 PO → 2 Verifikasi → 3 Jadwal → 4 Inspeksi
                               ↘ 4b → 4c → 4d
```

This is much cleaner than showing every downstream stage all the time.

## 34. "Jump To" Becomes Stage Rail

Your existing `LOMPAT KE` control is already the seed of this redesign.

Turn it into the primary stage navigation:

``` text
1 PO → 2 Verify → 3 Schedule → [4 Inspection] → 5 LHPP → ...
```

The Stage Rail is effectively your "Jump To", but promoted into a
first-class workflow navigation component.

## 35. Stage Rail Visual States

Use:

``` text
✓ Completed
● Available
◉ Selected
⚠ Has overdue work
↳ Exception
○ Empty / inactive
```

Do not use color alone. Combine color with icons, counts, labels, and
tooltips.

## 36. Count Semantics

Every count must have a defined meaning.

Bad:

``` text
Stage 5 [14]
```

What is 14?

Jobs? LHPP? Units?

Better:

``` text
Stage 5
14 Jobs
27 LHPP
```

or simply:

``` text
Stage 5
14 Jobs
```

with a tooltip explaining the scope.

Stage 5 is especially important because the workflow specifies
Unit/LHPP-level tracking. fileciteturn1file2L129-L137

## 37. Empty States

Differentiate:

``` text
No Jobs in this stage.
```

from:

``` text
No Jobs match these filters.
```

Example:

``` text
Stage 4 — Pelaksanaan RU

No Jobs currently require action here.

[View another stage]
```

Filtered:

``` text
No Jobs match these filters.

[Clear Filters]
```

## 38. URL State

Make selected stage/filter state addressable:

``` text
/workflow?phase=FIELD&stage=S4&view=queue
```

Possible additional parameters:

``` text
status=OVERDUE
sort=due_at
pic=42
```

Job:

``` text
/jobs/123
```

or:

``` text
/workflow?stage=S4&job=123
```

Benefits:

-   browser back/forward
-   bookmarks
-   shareable internal links
-   refresh persistence
-   easier support/debugging

## 39. Preserve Queue State

If a user is on:

``` text
Stage 4
My Work
Overdue
Sort: Due date
Page 2
```

and opens a Job, closing the Job should return them to exactly that
context.

Do not reset them to Stage 1 / All / Page 1.

## 40. Job Detail Data Loading

Queue payload should be small:

``` json
{
  "id": 123,
  "job_number": "JOB-2026-001",
  "client": "PT ABC",
  "stage": "S4",
  "pic": "Budi",
  "sla": "DUE_TODAY"
}
```

Job Detail can then load:

``` text
workflow
documents
current stage data
history
permissions
attachments
```

Do not load all documents/logs/photos into every queue row.

## 41. Pagination

Use server-side pagination.

Start around:

``` text
20–50 rows/page
```

The current system already demonstrates a realistic multi-job workload,
so don't build the queue around the assumption that all Jobs can always
be loaded into the browser.

## 42. Sorting

Recommended default:

``` text
OVERDUE
↓
DUE TODAY
↓
DUE SOON
↓
OLDEST WAITING
```

Optional:

``` text
Newest
Oldest
Client
PIC
Due date
Stage age
```

Operational queues should prioritize urgency rather than simply creation
date.

## 43. Next Action

I strongly recommend adding:

``` text
Next Action
```

to each queue row.

Examples:

``` text
Stage 4
Next: Complete inspection checklist
```

``` text
Stage 5
Next: Finish LHPP for 2 remaining units
```

``` text
Stage 6
Next: Manager technical review
```

This is one of the strongest advantages of a workflow-oriented queue.

## 44. Next Action Must Come From Workflow

Avoid hardcoded UI text:

``` text
if S4 => "Complete inspection"
```

Instead define stage actions:

``` json
{
  "action_code": "COMPLETE_INSPECTION",
  "label": "Complete inspection checklist",
  "required": [
    "photos",
    "checklist",
    "unit_count"
  ]
}
```

Then the UI renders the current action from workflow state.

## 45. Blocked State

Always explain why a Job is blocked:

``` text
BLOCKED

Reason:
Awaiting client confirmation

Since:
09 Sep 2026

Owner:
Marketing
```

Do not show only:

``` text
Blocked
```

## 46. Rework / Revision

When Manager rejects a Stage 6 report back to Stage 5:

``` text
Stage 5
↻ Revision

Reason:
Calculation requires correction

Returned by:
Manager

Returned:
10 Sep 2026 08:42
```

Show this in both queue and history because rework affects lead time.

## 47. Batch / Split Job

Do not assume one Job equals one delivery.

The workflow explicitly supports split/partial delivery using Batch/Unit
scope. fileciteturn0file0L809-L835

Example:

``` text
JOB-001
PT ABC

Batch A — 5 units — Delivered
Batch B — 4 units — Waiting
Batch C — 3 units — Pending payment
```

This should be visible without creating separate Jobs for every batch.

## 48. Finance / Delivery Gateway

The workflow includes a later gateway for:

``` text
PAY_FIRST
SEND_FIRST
ON_HOLD
```

with payment verification and shipping potentially happening in
different orders. fileciteturn0file0L852-L900

Represent this as workflow state, not arbitrary card movement.

Example:

``` text
Route:
PAY FIRST

Payment:
Awaiting verification

Delivery:
Blocked until payment

[Open Job]
```

or:

``` text
Route:
SEND FIRST

Payment:
Pending

Delivery:
Ready
```

## 49. Closing

The documented workflow assigns manual closing to Finance with a
readiness checklist, audit trail, and override behavior.
fileciteturn0file0L926-L936

Therefore:

``` text
Closed
```

must be a terminal workflow state, not simply "the card reached the last
column."

Before closing, validate:

``` text
required documents
payment state
delivery state
SUKET state
batch completeness
financial requirements
```

Then create an audit event.

## 50. Audit Trail

Every meaningful workflow event should record:

``` text
who
what
when
from
to
why
metadata
```

Example:

``` json
{
  "event": "JOB_STAGE_CHANGED",
  "job_id": 123,
  "from": "S4",
  "to": "S5",
  "user_id": 42,
  "reason": "Inspection completed",
  "metadata": {
    "unit_count": 12
  }
}
```

Example user-facing history:

``` text
10 Sep 2026 08:42
Budi — Inspector

Completed Stage 4

Action:
Lanjut ke Stage 5

Result:
Success
```

## 51. Stage Transition Must Be Atomic

Conceptually:

``` text
BEGIN TRANSACTION

1. validate authorization
2. validate prerequisites
3. close current stage instance
4. create next stage instance
5. update jobs.current_stage_id
6. create transition history
7. create audit log
8. dispatch notifications/jobs

COMMIT
```

If a critical operation fails:

``` text
ROLLBACK
```

Do not update the Job stage and history in unrelated non-atomic
operations.

## 52. Laravel Backend Structure

If your backend is Laravel:

``` text
app/
├── Models/
│   ├── Job.php
│   ├── WorkflowStage.php
│   ├── WorkflowTransition.php
│   ├── JobStageInstance.php
│   ├── JobTransition.php
│   └── JobLog.php
│
├── Policies/
│   ├── JobPolicy.php
│   └── WorkflowPolicy.php
│
├── Services/
│   └── Workflow/
│       ├── WorkflowEngine.php
│       ├── TransitionValidator.php
│       ├── StageResolver.php
│       └── SlaCalculator.php
│
├── Http/
│   ├── Controllers/
│   │   ├── WorkflowController.php
│   │   ├── StageQueueController.php
│   │   └── JobController.php
│   └── Requests/
│       ├── TransitionJobRequest.php
│       └── QueueFilterRequest.php
│
└── Events/
    ├── JobStageChanged.php
    └── JobAssigned.php
```

## 53. React / Inertia Structure

``` text
resources/js/
├── Pages/
│   ├── Workflow/
│   │   ├── Index.tsx
│   │   └── StageQueue.tsx
│   └── Jobs/
│       └── Show.tsx
│
├── Components/
│   └── Workflow/
│       ├── StageRail/
│       │   ├── StageRail.tsx
│       │   ├── StageNode.tsx
│       │   ├── PhaseGroup.tsx
│       │   └── ExceptionBranch.tsx
│       │
│       ├── Queue/
│       │   ├── WorkQueue.tsx
│       │   ├── QueueRow.tsx
│       │   ├── QueueFilters.tsx
│       │   ├── QueueSort.tsx
│       │   └── QueueEmptyState.tsx
│       │
│       └── Job/
│           ├── JobDrawer.tsx
│           ├── JobStatus.tsx
│           ├── JobWorkflow.tsx
│           ├── JobDocuments.tsx
│           └── JobHistory.tsx
```

## 54. API / Inertia Contract

Page data can look like:

``` json
{
  "phases": [],
  "stages": [],
  "selected_stage": {},
  "queue": {
    "data": [],
    "meta": {}
  },
  "filters": {},
  "permissions": {},
  "summary": {}
}
```

Stage:

``` json
{
  "id": 4,
  "code": "S4",
  "name": "Pelaksanaan RU",
  "short_name": "Inspeksi",
  "phase": "FIELD",
  "count": 7,
  "overdue_count": 1,
  "can_act": true
}
```

Queue row:

``` json
{
  "id": 123,
  "job_number": "JOB-2026-001",
  "client": {
    "name": "PT ABC Indonesia"
  },
  "unit_count": 12,
  "stage": {
    "code": "S4",
    "name": "Pelaksanaan RU"
  },
  "pic": {
    "name": "Budi"
  },
  "status": "IN_PROGRESS",
  "sla": {
    "status": "DUE_TODAY",
    "due_at": "2026-09-10T17:00:00"
  },
  "progress": {
    "photos": "3/3",
    "checklist": "8/8",
    "units": "12/12"
  }
}
```

## 55. Queue Query

Conceptually:

``` text
GET /workflow/queue
?stage=S4
&search=ABC
&status=OVERDUE
&pic=42
&sort=due_at
&page=1
```

Response:

``` json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total": 7
  }
}
```

## 56. Stage Rail API

Conceptually:

``` text
GET /workflow/stages
```

Response:

``` json
{
  "phases": [
    {
      "code": "FIELD",
      "name": "RU Lapangan",
      "stages": [
        {
          "code": "S1",
          "count": 12
        },
        {
          "code": "S2",
          "count": 8
        }
      ]
    }
  ]
}
```

The Stage Rail should not fetch the full queue just to display counts.

## 57. Queue Query / Visibility

Conceptually:

``` php
$jobs = Job::query()
    ->with([
        'client',
        'currentStage',
        'currentStageInstance',
        'assignedUser',
    ])
    ->where('current_stage_id', $stage->id)
    ->visibleTo($user)
    ->applyFilters($filters)
    ->applySorting($sort)
    ->paginate(25);
```

Only load what the queue needs.

## 58. Role-Aware Stage Visibility

Distinguish:

``` text
visible
```

from:

``` text
actionable
```

Example:

``` json
{
  "stage": "S6",
  "visible": true,
  "can_act": true
}
```

or:

``` json
{
  "stage": "S5",
  "visible": true,
  "can_act": false
}
```

A user can understand the overall process without being allowed to
modify every stage.

## 59. Permissions Model

Use layers:

``` text
Role
  ↓
Permission
  ↓
Policy
  ↓
Workflow Transition
  ↓
Business Rules
```

Example:

``` text
INSPECTOR
    ↓
can_complete_stage_4
    ↓
JobPolicy
    ↓
S4_COMPLETE
    ↓
check photos + checklist + unit data
```

## 60. Security

Never trust a client-supplied `stage_id` or role.

Bad:

``` php
$job->current_stage_id = $request->stage_id;
$job->save();
```

Better:

``` text
requested transition
       ↓
server resolves transition
       ↓
authorize
       ↓
validate prerequisites
       ↓
execute transaction
```

The browser must never be able to arbitrarily assign a Job to Stage 12.

## 61. Concurrency

Protect against:

``` text
User A opens Job
User B completes Job
User A submits stale action
```

Use:

-   current-stage validation
-   database transactions
-   optimistic locking/versioning if necessary

Example:

``` text
workflow_version = 14
```

If the stored version is already 15, reject the stale action and ask the
user to refresh.

## 62. Notifications

Notify for meaningful events:

``` text
New assignment
Stage assigned to you
Approval required
SLA approaching
SLA breached
Document rejected
Job returned
Payment verified
Delivery action required
```

Do not notify for:

``` text
User opened Job
User changed a filter
User sorted the queue
```

## 63. Dashboard vs Queue

Do not turn the queue into a dashboard.

Dashboard:

``` text
71 Jobs
12 Overdue
8 Due Today
31 In Field
14 LHPP
6 Dinas
...
```

Queue:

``` text
Show me the actual Jobs I need to work on.
```

Keep them separate.

## 64. Dashboard → Queue Drilldown

A strong architecture is:

``` text
Dashboard metric
      ↓
Stage Rail
      ↓
Queue
      ↓
Job
```

Example:

``` text
Stage 5 — LHPP
18 Jobs
Average age: 3.7 days
SLA breach: 6

[Open Stage 5 Queue]
```

## 65. Suggested Main Navigation

``` text
Sidebar
│
├── Dashboard
├── Workflow
│   ├── All
│   ├── RU Lapangan
│   ├── Laporan & Dinas
│   └── Finance & Delivery
├── Jobs
├── Documents
├── Reports
└── Administration
```

Main Workflow:

``` text
Header
↓
Phase Selector
↓
Stage Rail
↓
Stage Summary
↓
Queue
↓
Job Detail
```

## 66. Keep Kanban as Secondary View

I would not delete your current Kanban.

Use:

``` text
View:

[Queue] [Board]
```

Queue = primary daily work.

Board = visual overview.

Both consume the same workflow data.

``` text
Workflow Engine
      ↓
┌─────┴─────┐
Queue      Kanban
```

The Kanban becomes an **overview mode**, not the workflow engine.

## 67. Kanban Mode

If retained:

-   keep cards compact
-   don't put forms in cards
-   don't make drag/drop mandatory
-   keep click-to-open
-   retain phase filtering
-   retain stage navigation
-   consider virtualization if needed

## 68. Three Workflow Views

### View 1 --- Pipeline

``` text
Stage Rail
+
Queue
```

Daily operations.

### View 2 --- Kanban

``` text
Columns
+
Cards
```

Visual overview.

### View 3 --- Job Workflow

``` text
Timeline
+
Stage Forms
+
Documents
+
History
```

Deep work.

``` text
              DNP Workflow
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
    Pipeline      Kanban       Job Detail
       │            │            │
    daily work    overview     execution
```

## 69. Component Responsibility

This is the anti-Frankenstein boundary.

### WorkflowEngine

Owns:

-   transition rules
-   prerequisites
-   stage state
-   authorization checks

### StageRail

Owns:

-   stage navigation
-   stage counts
-   phase grouping
-   visual state

It does **not** change Job stages.

### WorkQueue

Owns:

-   querying
-   filtering
-   sorting
-   pagination
-   rendering Jobs

It does **not** decide business workflow rules.

### JobDetail

Owns:

-   Job information
-   documents
-   stage form
-   history
-   workflow actions

It does **not** invent transition rules.

### KanbanBoard

Owns:

-   board rendering

It does **not** own workflow logic.

## 70. Stage 5 Special Configuration

Example:

``` php
[
    'code' => 'S5',
    'name' => 'Penyusunan LHPP',
    'tracking_scope' => 'LHPP_UNIT',

    'checkpoints' => [
        'technical_data_received',
        'report_started',
        'report_completed',
    ],

    'sla' => [
        'type' => 'days_per_unit',
        'value' => 3,
    ],
]
```

This reflects the documented Stage 5 checkpoint and Unit/LHPP tracking
requirements. fileciteturn1file2L126-L137

## 71. Frontend Queue State

Example:

``` ts
type QueueState = {
  selectedPhase: string | null;
  selectedStage: string | null;

  search: string;

  filters: {
    status?: string;
    pic?: number;
    sla?: string;
    client?: number;
    dateFrom?: string;
    dateTo?: string;
  };

  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };

  view: 'queue' | 'kanban';

  density: 'comfortable' | 'compact';

  selectedJobId: number | null;
};
```

## 72. "Why Is This Job Here?"

Job Detail should answer this immediately:

``` text
Current Stage:
Stage 4 — Pelaksanaan RU

Why here:
Inspection scheduled for 10 Sep 2026.

Next:
Complete inspection checklist and required photos.

SLA:
Due today.
```

This is more useful than simply showing `Stage 4`.

## 73. "Why Can't I Move This Job?"

When an action fails:

``` text
Cannot continue to Stage 5

2 requirements are incomplete:

✕ Foto Kepulangan
✕ Jumlah Unit Riil

Complete these items before continuing.
```

Never return only:

``` text
Validation error.
```

## 74. Confirmation Dialogs

Use confirmation for consequential actions:

``` text
Return Job to Stage 5?

Reason is required.

[Cancel]
[Return Job]
```

Don't ask for confirmation for harmless actions such as opening a Job.

## 75. Stage Age

Queue rows should show:

``` text
Age in Stage
```

Example:

``` text
Stage 4
Age: 6 hours
```

or:

``` text
Stage 5
Age: 3.2 days
```

For Stage 5, distinguish:

``` text
Job stage age
```

from:

``` text
LHPP/unit lead time
```

## 76. Reporting Metrics

Once proper stage instances exist, you can derive:

``` text
Average time per stage
Median time per stage
SLA breach rate
Rework rate
Jobs per PIC
Stage backlog
Exception rate
Stage throughput
End-to-end lead time
```

Stage 5 additionally supports:

``` text
Data → Started
Started → Completed
Data → Completed
```

because of its three checkpoint timestamps.
fileciteturn1file2L133-L137

## 77. Saved Views

Later, users could save:

``` text
My Overdue Inspections
```

as:

``` json
{
  "stage": "S4",
  "scope": "MY_WORK",
  "sla": "OVERDUE"
}
```

Don't build this before the core queue is stable.

## 78. Export

Export should respect:

``` text
selected stage
filters
permissions
date range
```

Use:

``` text
Export current queue
```

rather than an unrestricted "export everything" button.

## 79. Realtime

Do not add WebSockets merely because they sound modern.

Start with:

``` text
manual refresh
+
refresh after transition
```

Later, if concurrent editing makes it necessary, add realtime events
such as:

``` text
JobStageChanged
```

## 80. Performance

Initial rules:

``` text
Stage Rail: lightweight
Queue: paginated
Search: debounced
Job Detail: loaded separately
Documents: lazy loaded
Images: thumbnails
Logs: paginated
```

For your current 71 Jobs, the main problem is human navigation/cognitive
load, not raw browser capacity.

## 81. Accessibility

Do not make Stage Rail meaning dependent only on color.

Use:

``` text
✓ Completed
● Active
⚠ Overdue
↳ Exception
```

with color as reinforcement.

All interactive Stage Rail nodes should have:

``` text
keyboard focus
visible focus state
accessible labels
```

## 82. Responsive Behavior

Desktop:

``` text
Stage Rail
+
Queue
+
Optional Job Drawer
```

Tablet:

``` text
Compact Stage Rail
+
Queue
+
Full-screen Job Detail
```

Mobile:

``` text
Phase
↓
Stage dropdown
↓
Queue
↓
Job Detail page
```

Do not attempt to display 17 columns on mobile.

## 83. Initial MVP

Do not implement every feature at once.

Build:

``` text
1. Stage Registry
2. Stage Rail
3. Phase Filter
4. Queue
5. Search
6. Basic filters
7. Click Job
8. Existing Job Detail
9. Backend transition validation
10. Queue refresh after transition
```

That is enough to validate the architecture.

## 84. Version 2

Then:

``` text
11. SLA indicators
12. My Work
13. Compact/comfortable density
14. Kanban toggle
15. URL state
16. Better history
17. Queue counts
```

## 85. Version 3

Then:

``` text
18. Dashboard
19. Bottleneck metrics
20. Realtime updates
21. Advanced reporting
22. Saved filters
23. Notifications
```

## 86. Migration From Current Kanban

Do not rebuild the entire application.

### Phase 1 --- Extract Stage Model

Create:

``` text
phases
workflow_stages
workflow_transitions
```

Move stage definitions out of React.

Do not change the UI yet.

### Phase 2 --- Build Stage Rail

Take the current:

``` text
LOMPAT KE
```

and make it `StageRail`.

Keep phase filtering.

### Phase 3 --- Build Queue

When Stage 4 is selected:

``` text
GET /workflow?stage=S4
```

Return Jobs currently in S4.

Reuse existing Job Card data initially if that makes migration faster.

### Phase 4 --- Keep Job Detail

Click Job → current Job Detail.

Do not rewrite it.

### Phase 5 --- Add Queue/Kanban Toggle

``` text
[Queue] [Kanban]
```

Both views consume the same stage/workflow model.

### Phase 6 --- Make Queue Default

Once validated by users:

``` text
Queue = default
Kanban = optional
```

Do not delete Kanban until there is evidence it is no longer useful.

## 87. Migration Component Structure

If you currently have:

``` text
KanbanBoard
KanbanColumn
KanbanCard
```

refactor toward:

``` text
WorkflowBoard
│
├── PhaseFilter
├── StageRail
└── WorkflowView
    ├── QueueView
    │   └── QueueRow
    └── KanbanView
        ├── KanbanColumn
        └── KanbanCard
```

Both consume:

``` text
workflow.stages
workflow.jobs
```

Never create separate state machines for Queue and Kanban.

## 88. Testing

### Unit tests

Test:

``` text
Stage 4 → Stage 5 when prerequisites pass
Stage 4 → Stage 4b when mismatch
Unauthorized user cannot transition
Missing photo blocks Stage 4 completion
Manager rejection returns Stage 6 → Stage 5
Closing cannot occur while readiness is incomplete
```

### Feature tests

Test:

``` text
User opens Stage 4
User sees authorized Jobs
User filters overdue
User opens Job
User completes stage
Job appears in Stage 5
Audit log is created
```

### Browser tests

Test:

``` text
Stage Rail
Queue
Filter
Open Job
Complete action
Return to queue
Queue state preserved
```

## 89. Critical Workflow Test Cases

### Stage 2

``` text
Incomplete documents
→ cannot continue

Urgent bypass
→ Manager approval required
```

The workflow explicitly defines the bypass and Manager decision.
fileciteturn1file1L56-L64

### Stage 4

``` text
All units match
→ Stage 5

Mismatch
→ Stage 4b

4b complete
→ Stage 4c

4c complete
→ Stage 4d

4d complete
→ Stage 5
```

### Stage 5

``` text
LHPP per unit
Technical data received timestamp
Report started timestamp
Report completed timestamp
```

### Stage 6

``` text
Approve
→ Stage 7

Reject
→ Stage 5
```

The workflow supports this. fileciteturn1file4L272-L284

### Closing

``` text
Readiness complete
→ Closed

Readiness incomplete
→ Cannot close
```

## 90. Final Desktop UI

``` text
┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW MONITOR                                    71 Active Jobs          │
│                                                                             │
│ [All] [RU Lapangan] [Laporan & Dinas] [Finance & Delivery]                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1 PO 12 → 2 Verify 8 → 3 Schedule 5 → [4 Inspection 7] → 5 LHPP 14 → ... │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ STAGE 4 — PELAKSANAAN RU                                                   │
│ INSPEKTUR • 7 JOBS • 1 OVERDUE • 1 DUE TODAY                               │
│                                                                             │
│ [ Search ] [ My Work ] [ SLA ] [ PIC ] [ Date ] [ Sort ]                  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ JOB-001  PT ABC Indonesia                              OVERDUE           │ │
│ │ 12 Unit • Budi • Due Today                                                │ │
│ │ Photos 3/3 • Checklist 8/8 • Units 12/12                                 │ │
│ │ Next: Complete inspection                                                 │ │
│ │                                                        [OPEN JOB →]      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 91. Job Detail Integration

Clicking `OPEN JOB` should open your existing workspace:

``` text
┌───────────────────────────────────────────────┐
│ PT ABC Indonesia                    Stage 4   │
│ JOB-2026-001                         [X]       │
├───────────────────────────────────────────────┤
│ Status | Dokumen | Riwayat | Info & Edit     │
├───────────────────────────────────────────────┤
│ ✓ Stage 1                                     │
│ ✓ Stage 2                                     │
│ ✓ Stage 3                                     │
│ ● Stage 4 — Pelaksanaan RU                   │
│                                               │
│ [existing stage-specific form]                │
│                                               │
│ [Tolak / Kembalikan] [Lanjutkan]              │
│                                               │
│ ○ Stage 4b                                    │
│ ○ Stage 5                                     │
│ ○ Stage 6                                     │
│ ...                                           │
└───────────────────────────────────────────────┘
```

This is the correct division of responsibility.

## 92. The "Frankenstein Test"

Before adding a feature, ask:

### Question 1

Does it belong to:

``` text
Workflow
Queue
Stage Rail
Job Detail
Dashboard
```

If you can't answer, stop.

### Question 2

Does it change business state?

If yes:

> Backend workflow engine.

### Question 3

Does it only change how data is viewed?

If yes:

> UI layer.

### Question 4

Does it belong to one Job?

If yes:

> Job Detail.

### Question 5

Does it apply to many Jobs?

If yes:

> Queue / Dashboard.

## 93. Anti-Frankenstein Ownership Table

  Concern               Owner
  --------------------- ------------------------------
  Stage definition      WorkflowStage
  Allowed transitions   WorkflowTransition
  Authorization         Policy
  SLA                   SlaCalculator / stage config
  Queue query           Queue service/query
  Stage navigation      StageRail
  Job display           QueueRow
  Job execution         Job Detail
  History               JobHistory
  Audit                 Audit service
  Metrics               Reporting service

If two components own the same business rule, that is a warning sign.

## 94. Definition of Done

### Navigation

-   [ ] User can select phase
-   [ ] User can select stage
-   [ ] Stage count is visible
-   [ ] Exception stages are distinguishable
-   [ ] Current stage is visually clear

### Queue

-   [ ] Jobs load only for selected stage
-   [ ] Search works
-   [ ] Filters work
-   [ ] Sorting works
-   [ ] Pagination works
-   [ ] SLA is visible
-   [ ] PIC is visible
-   [ ] Next Action is visible
-   [ ] Empty states work

### Job

-   [ ] Clicking a row opens existing Job Detail
-   [ ] Job Detail keeps current tabs
-   [ ] Current workflow remains visible
-   [ ] Documents remain accessible
-   [ ] History remains accessible
-   [ ] Stage actions remain inside Job Detail

### Workflow

-   [ ] Backend validates transitions
-   [ ] RBAC is enforced server-side
-   [ ] Prerequisites are enforced
-   [ ] Exceptions are supported
-   [ ] Revision loops are supported
-   [ ] Audit trail is generated
-   [ ] Stage duration is recorded

### Performance

-   [ ] Queue is paginated
-   [ ] Documents are not loaded into queue
-   [ ] Logs are not loaded into queue
-   [ ] Images use thumbnails/lazy loading

## 95. Final Recommendation

### Keep

-   existing Job Detail
-   clickable Jobs
-   Status / Documents / History / Info & Edit
-   phase filters
-   stage counts
-   current workflow timeline
-   Kanban as optional overview
-   stage-specific forms

### Refactor

-   `LOMPAT KE` → **Stage Rail**
-   Kanban primary view → **Queue primary view**
-   stage logic → **central Workflow Engine**
-   stage definitions → **Stage Registry**
-   transition logic → **Workflow Transitions**
-   stage history → **Stage Instances**
-   operational work → **Work Queue**

### Do not build

-   another generic Kanban library just because it looks more
    professional
-   drag/drop as the main transition mechanism
-   separate workflow logic inside every component
-   a giant universal filter
-   17 hardcoded stage definitions in multiple files
-   a dashboard disguised as a queue

## 96. Architecture to Commit To

``` text
                           DNP MONITOR
                                │
                    ┌───────────┴───────────┐
                    │    WORKFLOW ENGINE    │
                    │                       │
                    │ Stage Registry        │
                    │ Transitions           │
                    │ RBAC / Policies        │
                    │ Prerequisites          │
                    │ SLA                    │
                    │ Audit                  │
                    └───────────┬───────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
                 ▼              ▼              ▼
             STAGE RAIL      WORK QUEUE     JOB DETAIL
                 │              │              │
            Navigate        Find work       Execute work
                 │              │              │
                 └──────────────┼──────────────┘
                                │
                                ▼
                          JOB / UNIT / LHPP
                                │
                                ▼
                           HISTORY / AUDIT
```

## 97. The Most Important Principle

Your current system is **not wrong**.

The mistake would be thinking:

> "I need to find a better Kanban."

The actual problem is:

> **You need a better workflow visualization architecture.**

Your current UI has already proven the useful part of the concept:

``` text
Job
 ↓
Workflow
 ↓
Current Stage
 ↓
Stage-specific form
 ↓
Documents
 ↓
History
 ↓
Transition
```

The Stage Rail + Queue moves **work discovery** outside that Job Detail.

The final relationship should be:

``` text
                "What needs work?"
                         │
                         ▼
                STAGE RAIL + QUEUE
                         │
                         │ click
                         ▼
                "How do I work it?"
                         │
                         ▼
                    JOB DETAIL
                         │
                         ▼
                "What happened?"
                         │
                         ▼
                     HISTORY
```

**Do not throw away the current system. Refactor it around this model.**
