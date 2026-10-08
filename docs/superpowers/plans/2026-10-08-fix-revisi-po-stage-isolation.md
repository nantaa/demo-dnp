# Fix Incidental Stage Movement on Revisi PO (Stage 10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent accidental stage transitions when modifying PO data in Stage 10, isolate form events, and ensure predictable card ordering and state synchronization in the 16-stage pipeline.

**Architecture:** 
1. Decouple timeline stage-movement actions from wrapping `<form>` tags in `JobDetailSheet.jsx` to prevent unintentional Enter-key or bubbling form submissions from triggering `handleMoveStage`.
2. Add explicit guards to `JobController::revisePo` ensuring `$job->stage` is immutable during PO revisions.
3. Fix state synchronization in `JobDetailSheet.jsx` by keying or observing `job.updated_at` so sheet state does not become stale when `po-revise` reloads.

**Tech Stack:** Laravel 11, Inertia.js, React, Vitest.

## Global Constraints
- Pipeline version: Strictly 16 stages (Stages 1 through 16). No v3 or 20-stage references.
- TDD order: Write automated test first -> verify failure -> write code -> verify pass -> review.
- Pause for user approval before modifying code.

---

### Task 1: Write Automated Test for Revisi PO Stage Immutability and Form Isolation

**Files:**
- Create: `tests/revisi_po_stage_isolation.test.js`

**Interfaces:**
- Consumes: `JobDetailSheet` component and `revisePo` backend endpoint signature.
- Produces: Test verifying that invoking PO revision keeps `stage === 10` and that form submission inside modals does not trigger stage moves.

- [ ] **Step 1: Write the failing test**
Create `tests/revisi_po_stage_isolation.test.js` verifying:
1. `JobController::revisePo` cannot change `stage` under any payload.
2. `JobDetailSheet` timeline form does not submit `handleMoveStage` when inputs inside modal or subcomponents fire submit events.

- [ ] **Step 2: Run test to verify it fails or exposes the vulnerability**
Run: `node tests/revisi_po_stage_isolation.test.js`

- [ ] **Step 3: Implement minimal fix in `JobDetailSheet.jsx`**
1. Change `<form onSubmit={handleMoveStage}>` to `<div className="space-y-4">` with an explicit submit button click handler, preventing accidental Enter-key form submits from advancing the stage.
2. In `handleRevisePo`, explicitly call `e.preventDefault()` and `e.stopPropagation()`.
3. In `JobDetailSheet.jsx`, update `useEffect` dependency to include `job.updated_at` so local state updates when PO data updates.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/revisi_po_stage_isolation.test.js`

- [ ] **Step 5: Run full test suite & build frontend assets**
Run: `npm test` and `npm run build`

- [ ] **Step 6: Commit changes**
Run: `git add . && git commit -m "fix: prevent incidental stage movement and isolate form events during Revisi PO"`
