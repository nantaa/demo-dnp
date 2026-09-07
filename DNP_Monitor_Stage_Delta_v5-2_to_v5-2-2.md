# DNP Monitor — Stage Delta v5-2 → v5-2-2

## Purpose

This document records workflow content introduced or materially expanded in `DNP_Monitor_Strict_Sequence_v5-2-2.html` compared with `DNP_Monitor_Strict_Sequence_v5-2.html`.

> Note: no standalone Markdown (`.md`) source file was included in the supplied files. This is therefore a flowchart-to-flowchart delta document, ready to be merged into the main Markdown workflow specification.

## Summary of missing stage

The only **new numbered operational stage** added in v5-2-2 is:

| Stage | Name | Owner | Type | Position in flow |
|---|---|---|---|---|
| **Stage 11c** | **Verifikasi Pembayaran** | Admin Keuangan / Finance (FIN) | Usulan baru; hard gate | After Stage 11 and before Gateway “Status Lunas?” / Stage 11b |

The new version also introduces a fourth scenario control: **Pembayaran** with states **Lunas** and **Partial / Pending**.

---

# Stage 11c — Verifikasi Pembayaran

## Objective

Verify that the client’s final payment or remaining balance has been received in full before the SUKET can be released to the client. This separates Marketing’s collection/follow-up responsibility from Finance’s confirmation of funds received.

## Placement

```text
Stage 10 — Pembuatan Invoice
  → Stage 11 — Penagihan Pembayaran (Marketing)
    → Stage 11c — Verifikasi Pembayaran (Finance) [NEW]
      → Gateway — Status Lunas?
        ├─ Lunas → Stage 11b — Kirim SUKET ke Klien
        └─ Partial / Pending → back to Stage 11 — Penagihan Pembayaran
```

## Role and service level

| Attribute | Definition |
|---|---|
| Stage | 11c |
| Stage title | Verifikasi Pembayaran |
| Primary owner | Admin Keuangan / Finance (FIN) |
| Classification | Proposed new stage / hard gate for SUKET release |
| Prerequisite | Marketing has performed collection at Stage 11 and supplied the available payment evidence |
| Output | Verified payment status: **Lunas** or **Partial / Pending** |
| Downstream gateway | Gateway “Status Lunas?” |
| SLA | **TBD** — the flowchart explicitly marks the maximum verification SLA as not yet validated |

## Main procedure

1. Receive the payment evidence and collection status from Stage 11.
2. Match the proof of transfer against the bank statement or other authoritative Finance receipt record.
3. Verify the amount received against the final invoice, including the remaining balance when the job used a DP payment term.
4. Confirm that payment evidence is complete and that the funds are actually received, not merely promised or submitted as an unverified transfer receipt.
5. Set the verified payment outcome:
   - **Lunas:** enable the SUKET-release path.
   - **Partial / Pending:** return the job to Stage 11 for further Marketing collection.
6. Retain the evidence and verification result as an audit trail on the job/payment record.

## Business rules

- Stage 11c is mandatory after Stage 11 and before the `Status Lunas?` decision can be made.
- Stage 11c is owned by Finance; Marketing remains the owner of customer collection and follow-up at Stage 11.
- Finance verification—not the existence of a payment-proof upload alone—determines whether the SUKET release gate can open.
- Stage 11b (`Kirim SUKET ke Klien`) must be unavailable when payment status is `Partial / Pending`.
- A `Partial / Pending` result loops back to Stage 11; it must not close the job or release a SUKET.
- A `Lunas` result enables Stage 11b and the later automatic-close path.

## Required data and validation (TBD for confirmation)

| Data / control | Intended validation |
|---|---|
| Job and client reference | Payment is associated with the correct job, client, and invoice |
| Final invoice reference | Finance verifies the invoice being settled |
| Invoice total / outstanding balance | Amount due is available for comparison |
| Payment proof | File/reference is present and readable |
| Bank receipt / mutation reference | Finance can reconcile payment to an authoritative receipt record |
| Amount received | Compared to the outstanding balance |
| Payment date | Recorded for audit and reporting |
| Verification status | `Lunas` or `Partial / Pending` only |
| Verifier identity and timestamp | Captured when Finance decides the status |
| Exception reason | Required when result is `Partial / Pending` or payment cannot be reconciled |

## Acceptance criteria

- The workflow cannot reach Stage 11b unless Stage 11c has an approved `Lunas` verification result.
- Selecting `Partial / Pending` makes the Stage 11 → Stage 11c → gateway path visible and routes the job back to Stage 11.
- Selecting `Lunas` makes Stage 11b and Stage 12 eligible for the active route.
- The payment decision is traceable to Finance, a verification timestamp, and supporting payment evidence.
- The user interface prevents a user from manually sending SUKET while the job is unpaid, partially paid, pending reconciliation, or missing a Finance verification.

---

# Existing stages updated in v5-2-2

These are not new stage numbers, but the newer flowchart adds information that should be incorporated into the existing Markdown documentation.

## Stage 1 — Buat Job PO/SPK

**New clarification:** PO/SPK price information has been edited/masked, and serial-number information is unavailable except for Electrical and Fire Protection work. Document the data-visibility rule and the applicable equipment exceptions.

## Stage 2 — Verifikasi Dokumen

**New clarification:** the document checklist explicitly calls out material certificates / material letters for PAA, escalators, and elevators, plus a drawing-versus-nameplate visual check. The price-masking restriction for Admin is also made explicit.

## Stage 4 — Pelaksanaan RU

**New open item:** automatic generation of the Surat Tugas is still marked as unvalidated. Keep this as a pending requirement rather than treating it as implemented workflow behavior.

## Stage 4b — Aktualisasi Unit

**New open items:** the newer diagram states that the conditions for showing this stage and the exact PIC are still unvalidated. Confirm:

- Which job types can bypass Stage 4b.
- Who owns the decision and update: Marketing, Admin, or another role.
- What contractual/operational event creates the need for an updated unit count.

## Stage 5 — Penyusunan LHPP/BAP

**New tracking rules:**

- LHPP is issued **per unit/equipment**, while BAP is issued **per inspection visit** and may cover multiple units.
- Track three dates for each LHPP: technical data submitted by inspector, report work started, and report completed.
- Calculate and show duration / lead time for each sub-phase on the Kanban Board rather than using only a single `In Progress` / `Done` status.
- Scope the tracking to the per-unit LHPP entity, not only to the overall job.

## Stage 9 — Pengurusan SUKET

**New tracking rules:**

- Record the SUKET input date as the start of this process-duration measurement.
- Calculate the SUKET processing duration when the SUKET is completed and display it in Kanban/Dashboard reporting.
- For split-job or partial-delivery scenarios, review the scope of this date/duration: it should be recorded at batch/unit level rather than a single job-level value.

## Stage 11 — Penagihan Pembayaran

**Changed responsibility and behavior:**

- The stage title is expanded from `Penagihan` to `Penagihan Pembayaran`.
- Marketing is explicitly the collection and customer follow-up owner.
- When Stage 11c returns `Partial / Pending`, the job returns here for renewed collection follow-up.
- Payment validation is shared operationally with Finance, but the authoritative gate is now Stage 11c.

## Stage 11b — Kirim SUKET ke Klien

**New split-delivery rule:**

- A job may require several SUKET deliveries by batch (for example, 10–20 units per delivery), rather than one delivery for the entire job.
- The system should support multiple Stage 11b delivery records within a job.
- Each delivery record requires its own shipment date and delivery status, in addition to a consignment/tracking number and proof of handover.

## Stage 12 — Selesai / Closed

**New aggregate-close rule:**

- The job may be `Open`, `Partial`, or `Closed` based on roll-up of all units/batches.
- For split jobs, `Closed` is allowed only when every unit is closed and every required SUKET batch has been delivered.
- Example: if 95 of 100 units are closed, the job remains `Partial`, not `Closed`.

---

# Open decisions to resolve

1. Define the maximum SLA for Finance verification at Stage 11c.
2. Define the complete mandatory evidence/document set for payment reconciliation at Stage 11c.
3. Define whether partial payment can enable any partial SUKET delivery, or whether every Stage 11b delivery requires full job-level payment. The current chart shows SUKET release only after `Lunas`.
4. Define Stage 4b visibility criteria and ownership.
5. Define when and how Surat Tugas can be generated automatically.
6. Define the data model for LHPP-per-unit, BAP-per-visit, and SUKET-delivery-per-batch records.
7. Define job roll-up formulas and UI states for `Open`, `Partial`, and `Closed`.

# Suggested changelog entry

```md
## [v5-2-2] — Payment Verification and Partial-Payment Loop

### Added
- Stage 11c — Verifikasi Pembayaran, owned by Finance, positioned after Stage 11 and before the `Status Lunas?` gateway.
- Payment scenario selector: `Lunas` and `Partial / Pending`.
- Loop from `Partial / Pending` payment result back to Stage 11 for Marketing collection follow-up.
- Split-job delivery and aggregate closing rules.

### Changed
- Stage 11 is clarified as Marketing-owned payment collection.
- Stage 11b is blocked unless Finance verifies `Lunas`.
- Stage 5 and Stage 9 receive per-unit/per-batch duration-tracking requirements.

### Pending validation
- Stage 11c mandatory evidence and SLA.
- Stage 4b visibility/PIC.
- Automatic Surat Tugas behavior.
```
