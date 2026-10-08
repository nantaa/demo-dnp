# Instant Document Preview & Topmost Modal Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Route all Stage 2 document pills and checklist links to trigger the instant preview popup rather than direct file downloads.
2. Fix the stacking context and viewport clipping of `DocumentPreviewModal` so it renders via `createPortal` with `z-[9999]`, appearing strictly on top of the tabs bar (`Status`, `Dokumen`, `Riwayat`), header, and full viewport at 100% zoom without requiring users to zoom out.

**Architecture:**
1. **Topmost Modal Stacking with React Portal:**
   - In `DocumentPreviewModal.jsx`, wrap the rendered modal inside `createPortal(..., typeof document !== 'undefined' ? document.body : null)` and set classes to `fixed inset-0 z-[9999]`.
   - This bypasses the parent `JobDetailSheet` bounding box (`max-w-4xl`, `h-[92vh]`, `overflow-hidden`, and `backdrop-blur-sm` stacking context) and ensures the modal header ("Tab Baru", "Unduh", "x") is never hidden behind the `z-10` tabs bar at standard 100% zoom.
2. **Instant Preview Wiring:**
   - In `JobDetailSheet.jsx`, convert Stage 2 verification document anchors (`<a download>`) into clickable preview buttons calling `setPreviewDoc(d)`.
   - Convert Stage 2 summary card anchors into preview buttons.
   - Retain the download action inside `DocumentPreviewModal` header for users needing offline files.

**Tech Stack:** React 18, `createPortal`, TailwindCSS, Inertia.js, Vitest / Node.js test runner.

## Global Constraints
- Pipeline version: Strictly 16 stages (Stages 1 through 16).
- TDD order: Write automated test first -> verify failure -> write code -> verify pass -> review.
- Pause for user approval before modifying code.

---

### Task 1: Write Automated Tests for Topmost Portal & Stage 2 Preview Triggers

**Files:**
- Create: `tests/topmost_document_preview_modal.test.js`

**Interfaces:**
- Consumes: `JobDetailSheet.jsx` and `DocumentPreviewModal.jsx`
- Produces: Test verifying:
  1. `DocumentPreviewModal` uses React Portal (`createPortal`) targeting `document.body` with `z-[9999]`.
  2. Stage 2 verification table (`STAGE2_VERIFY_CHECKLIST`) renders preview buttons instead of `<a download>` tags.
  3. Stage 2 summary card renders preview buttons instead of `<a download>` tags.

- [ ] **Step 1: Write the failing test**
Create `tests/topmost_document_preview_modal.test.js` asserting the above criteria.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/topmost_document_preview_modal.test.js`
Expected: FAIL indicating absence of `createPortal` and presence of `<a download>` in Stage 2.

- [ ] **Step 3: Implement minimal fix in `DocumentPreviewModal.jsx` and `JobDetailSheet.jsx`**
1. In `DocumentPreviewModal.jsx`:
   - Import `createPortal` from `'react-dom'`.
   - Return `createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs ...">...</div>, document.body)`.
   - Ensure SSR safety (`if (typeof document === 'undefined') return null;`).
2. In `JobDetailSheet.jsx`:
   - Replace `<a download>` in Stage 2 verification table (lines 1370-1374) with `<button type="button" onClick={() => setPreviewDoc(d)} ...>`.
   - Replace `<a download>` in Stage 2 summary card (lines 3250-3261) with `<button type="button" onClick={() => setPreviewDoc(d)} ...>`.
3. In `JobDetailSheet.jsx`:
   - Ensure `DocumentPreviewModal` continues to receive `previewDoc` and `job.id`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/topmost_document_preview_modal.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite & build frontend assets**
Run: `npm test` and `npm run build`

- [ ] **Step 6: Commit changes**
Run: `git add . && git commit -m "feat: make Stage 2 doc pills instant preview and portal modal to document.body with z-[9999]"`
