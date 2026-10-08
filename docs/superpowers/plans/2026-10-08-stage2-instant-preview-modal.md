# Instant Document Preview on Stage 2 & Document Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route all Stage 2 verification document buttons and related job document links to open the in-app scrollable `DocumentPreviewModal` instantly instead of triggering a direct file download.

**Architecture:** 
1. Replace anchor tags with `download` attributes in Stage 2 verification table (`STAGE2_VERIFY_CHECKLIST`) and completed stage summaries with clickable button elements that call `setPreviewDoc(d)`.
2. Ensure `DocumentPreviewModal` retains the fallback download button inside the modal header so users who explicitly want to save the physical file can still do so.
3. Keep the 16-stage pipeline structure intact with zero regressions to document permissions or stage transitions.

**Tech Stack:** React 18, Inertia.js, TailwindCSS, Vitest / Node.js test runner.

## Global Constraints
- Pipeline version: Strictly 16 stages (Stages 1 through 16).
- TDD order: Write automated test first -> verify failure -> write code -> verify pass -> review.
- Pause for user approval before modifying code.

---

### Task 1: Write Automated Test for Instant Document Preview Integration

**Files:**
- Create: `tests/stage2_document_preview.test.js`

**Interfaces:**
- Consumes: `JobDetailSheet.jsx` and `DocumentPreviewModal.jsx`
- Produces: Test verifying that Stage 2 document pills trigger `setPreviewDoc` rather than rendered `<a download>` elements.

- [ ] **Step 1: Write the failing test**
Create `tests/stage2_document_preview.test.js` asserting:
1. Stage 2 verification checklist renders preview buttons (`type="button"` with `onClick`) for existing files, not `<a download>`.
2. Stage 2 summary cards render preview buttons for existing files, not `<a download>`.
3. Clicking a document element triggers the preview state handler (`setPreviewDoc`).

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/stage2_document_preview.test.js`
Expected: FAIL indicating `<a download>` tags exist instead of preview button triggers.

- [ ] **Step 3: Implement minimal fix in `JobDetailSheet.jsx`**
1. In `JobDetailSheet.jsx` (Stage 2 checklist, lines 1369-1376):
   Replace:
   ```jsx
   <a key={d.id} href={getDocDownloadUrl(d)} download target="_blank" rel="noopener noreferrer"
       className="px-2 py-1 rounded bg-green-50 border border-green-300 text-green-700 font-semibold text-[10px] hover:underline truncate max-w-[80px]" title={d.name}>
       {d.name.split('.').pop().toUpperCase()}
   </a>
   ```
   With:
   ```jsx
   <button key={d.id} type="button" onClick={() => setPreviewDoc(d)}
       className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[10px] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
       title={`Klik untuk pratinjau instan: ${d.name}`}>
       <Eye size={11} className="text-emerald-700" />
       <span>{d.name.split('.').pop().toUpperCase() || 'PDF'}</span>
   </button>
   ```
2. In `JobDetailSheet.jsx` (Stage 2 completed summary checklist, lines 3250-3261):
   Replace `<a download>` with `<button type="button" onClick={() => setPreviewDoc(d)} ...>`.
3. Ensure `Eye` icon is imported from `lucide-react` if not already present.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/stage2_document_preview.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite & build frontend assets**
Run: `npm test` and `npm run build`

- [ ] **Step 6: Commit changes**
Run: `git add . && git commit -m "feat: convert Stage 2 document buttons to instant in-app preview modal"`
