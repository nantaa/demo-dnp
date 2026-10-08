# Document Scrollable Preview Pop-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an in-app scrollable document preview popup (modal) triggered whenever a user clicks any document chip or document link in `JobDetailSheet.jsx`, supporting PDFs and images natively with fallback download for Office/unsupported files, while preserving strict RBAC.

**Architecture:** 
1. Build a dedicated, reusable component `DocumentPreviewModal.jsx` featuring file type detection (PDF via `<iframe>`, Image via responsive `<img>` with zoom, and Office/fallback via metadata card), scrollable viewport container, and header toolbar (download, open in new tab, close).
2. Wire `previewDoc` state into `JobDetailSheet.jsx` and update `DocChip` and `renderDocuments` to open the preview modal on click without triggering file downloads immediately.
3. Ensure RBAC gating (`isPoLockedForIns`) strictly prevents Inspectors from opening previews of locked PO/SPK files.

**Tech Stack:** React 18, Tailwind CSS, Lucide React icons, Node.js built-in test runner (`node:test`).

## Global Constraints

- Never break existing 243 passing tests in `tests/*.test.js`.
- Strictly follow TDD: write failing test in `tests/document_preview_modal.test.js` first before implementing frontend code.
- Prevent event bubbling on `DocChip` delete action (`e.stopPropagation()`).
- Maintain RBAC: Inspector role cannot preview or view PO/SPK documents (`isPoLockedForIns`).
- Filetype safety: Do NOT feed `.docx` or `.xlsx` into native `<iframe>`; render informational download fallback instead.

---

### Task 1: Test Suite for Document Preview Modal & JobDetailSheet Integration

**Files:**
- Create: `tests/document_preview_modal.test.js`

**Interfaces:**
- Consumes: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`, `dnp-rework/resources/js/Components/DocumentPreviewModal.jsx`
- Produces: Test verification suite asserting component structure, filetype helper logic, keyboard listeners, event propagation handling, and RBAC lock enforcement.

- [x] **Step 1: Write the failing test**

Create `tests/document_preview_modal.test.js` with tests asserting:
1. `DocumentPreviewModal.jsx` file exists and exports a React component.
2. File type detection correctly identifies PDFs (`.pdf`), images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`), and unsupported/office files (`.docx`, `.xlsx`, `.zip`).
3. Modal renders scrollable body (`overflow-y-auto`, `max-h-[80vh]` or `max-h-[85vh]`).
4. Modal contains toolbar buttons for "Unduh / Download", "Buka di Tab Baru", and "Tutup".
5. `JobDetailSheet.jsx` imports and renders `DocumentPreviewModal`.
6. `DocChip` triggers `onPreview(doc)` when clicked, stopping download auto-trigger, and preserves `e.stopPropagation()` on `onDelete`.
7. `isPoLockedForIns` prevents opening preview for Inspectors.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/document_preview_modal.test.js`
Expected: FAIL (files/exports not found or assertions fail).

---

### Task 2: Create Reusable `DocumentPreviewModal.jsx` Component

**Files:**
- Create: `dnp-rework/resources/js/Components/DocumentPreviewModal.jsx`

**Interfaces:**
- Consumes: Props `{ doc, jobId, isOpen, onClose }`
- Produces: Self-contained modal overlay with scrollable inner viewer, zoom controls for images, iframe for PDFs, metadata card for Office files, and keyboard Escape listener.

- [x] **Step 1: Implement `DocumentPreviewModal.jsx`**

Implement the component:
- Detect file extension / MIME type from `doc.name` / `doc.mime_type` / `doc.path`.
- Modal overlay (`fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs`).
- Dialog card (`bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[88vh] border border-slate-200`).
- Sticky Header: document name, stage/type badge, file extension badge, "Unduh" button, "Buka di Tab Baru" button, and Close button.
- Scrollable Viewer Body (`flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[420px]`):
  - **PDF:** `<iframe src={fileUrl} className="w-full h-full min-h-[65vh] rounded-lg bg-white border border-slate-200 shadow-inner" title={doc.name} />`
  - **Image:** `<img src={fileUrl} alt={doc.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md transition-transform" />` with zoom controls (Zoom In, Zoom Out, Reset).
  - **Office/Fallback (.docx, .xlsx, others):** Card with file icon, "Format ini tidak mendukung preview langsung di browser", filename, and prominent download button.
- Escape key listener and backdrop click-to-close behavior.

- [x] **Step 2: Verify test progression**

Run: `node --test tests/document_preview_modal.test.js`
Expected: Tests for `DocumentPreviewModal.jsx` pass.

---

### Task 3: Wire Preview Modal into `JobDetailSheet.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`

**Interfaces:**
- Consumes: `DocumentPreviewModal` component
- Produces: `previewDoc` state, updated `DocChip` click handler, updated `renderDocuments` click handler.

- [x] **Step 1: Update `JobDetailSheet.jsx`**

1. Import `DocumentPreviewModal` from `./DocumentPreviewModal`.
2. Add `previewDoc` state: `const [previewDoc, setPreviewDoc] = useState(null);`
3. Update `DocChip` props to accept `onPreview` or handle preview click:
   - When clicked on the document title/badge, call `onPreview(doc)`.
   - Ensure `isPoLockedForIns` prevents any click trigger.
   - Ensure delete button (`x`) calls `e.stopPropagation()` so preview is not launched on delete.
4. Update `renderDocuments` in Documents tab:
   - Clicking document name calls `setPreviewDoc(doc)` instead of directly leaving the page.
5. Render `<DocumentPreviewModal doc={previewDoc} jobId={job.id} isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} />` at the bottom of `JobDetailSheet`.

- [x] **Step 2: Run test to verify it passes**

Run: `node --test tests/document_preview_modal.test.js`
Expected: PASS.

---

### Task 4: Full Regression Verification

**Files:**
- Test: `tests/*.test.js`

- [x] **Step 1: Run complete test suite**

Run: `node --test tests/*.test.js`
Expected: All 243+ tests pass with 0 failures.

- [x] **Step 2: Git commit changes**

```bash
git add tests/document_preview_modal.test.js dnp-rework/resources/js/Components/DocumentPreviewModal.jsx dnp-rework/resources/js/Components/JobDetailSheet.jsx docs/superpowers/plans/2026-10-07-document-scrollable-preview-popup.md
git commit -m "feat: add scrollable document preview popup with filetype detection and RBAC gating"
```
