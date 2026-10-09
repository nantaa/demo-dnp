# Fix Stuck Loading After Upload & Kanban Mutation Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the permanently frozen loading overlay ("Memproses...") after document uploads, prevent background polling visit cancellations, fix broken `useForm.post` stage transitions, and ensure robust lifecycle and error handling across all mutations on the Kanban Board.

**Architecture:** Frontend React/Inertia coordination. Background polling in `Kanban/Index.jsx` is guarded against active mutations (`[data-dnp-busy="true"]`), all upload and stage move handlers in `JobDetailSheet.jsx` implement guaranteed `onFinish` state resets with `preserveScroll` and `preserveState`, `useEffect([job])` defensively clears lingering loading flags on server prop sync, and the loader overlay gains a watchdog timer and emergency dismiss action.

**Tech Stack:** Laravel 11, Inertia.js (`@inertiajs/react`), React 18, Vite 5, Node.js `node:test` runner.

## Global Constraints
- Framework base is Laravel 11 + Inertia.js (NOT Next.js).
- Never modify production code before writing and demonstrating failing tests (Strict TDD order: plan → test → implement → review → verify → document/remember → refactor/improve).
- No placeholders or hand-waving: every task step must contain exact code, files, and commands.
- Preserve all existing permissions and stage rules.
- Do NOT run destructive git operations (`reset --hard`, `clean -fd`).

---

### Task 1: Comprehensive Test Suite for Upload and Mutation Lifecycle

**Files:**
- Create: `tests/upload_and_mutation_lifecycle.test.js`

**Interfaces:**
- Consumes: AST/Static analysis and runtime logic checks of `dnp-rework/resources/js/Components/JobDetailSheet.jsx` and `dnp-rework/resources/js/Pages/Kanban/Index.jsx`.
- Produces: Contract verification suite enforcing:
  1. Guaranteed `onFinish` in all upload handlers (`onFileChange`, `uploadFileDirectly`, `uploadPhoto`).
  2. Defensive loading state clearing (`setIsUploading(false)`, `setIsMoving(false)`) inside `useEffect([job])`.
  3. Loader overlay safety watchdog, emergency dismiss action, and `data-dnp-busy="true"` attribute.
  4. Non-cancelling polling coordination in `Kanban/Index.jsx` (skipping reload when busy).
  5. Replacement of broken `post('/jobs/.../move', { data: ... })` calls with `router.post`.
  6. Removal of duplicate `<input type="file" ref={fileInputRef}>`.
  7. Consistent `preserveScroll` and `preserveState` across all stage save functions.

- [ ] **Step 1: Write the failing test**

Create `tests/upload_and_mutation_lifecycle.test.js` with the full test specifications:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const kanbanPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');

describe('Upload & Kanban Mutation Lifecycle Test Suite', () => {
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

    it('1. onFileChange, uploadFileDirectly, and uploadPhoto must implement onFinish resetting isUploading', () => {
        // onFileChange
        const onFileChangeMatch = sheetContent.match(/const onFileChange = [\s\S]*?router\.post\([^)]+documents[\s\S]*?\}\);/);
        assert.ok(onFileChangeMatch, 'onFileChange router.post must exist');
        assert.ok(onFileChangeMatch[0].includes('onFinish:'), 'onFileChange must have onFinish callback');
        assert.ok(onFileChangeMatch[0].includes('setIsUploading(false)'), 'onFileChange onFinish must call setIsUploading(false)');

        // uploadFileDirectly
        const uploadDirectMatch = sheetContent.match(/const uploadFileDirectly = [\s\S]*?router\.post\([^)]+documents[\s\S]*?\}\);/);
        assert.ok(uploadDirectMatch, 'uploadFileDirectly router.post must exist');
        assert.ok(uploadDirectMatch[0].includes('onFinish:'), 'uploadFileDirectly must have onFinish callback');
        assert.ok(uploadDirectMatch[0].includes('setIsUploading(false)'), 'uploadFileDirectly onFinish must call setIsUploading(false)');

        // uploadPhoto
        const uploadPhotoMatch = sheetContent.match(/const uploadPhoto = [\s\S]*?router\.post\([^)]+documents[\s\S]*?\}\);/);
        assert.ok(uploadPhotoMatch, 'uploadPhoto router.post must exist');
        assert.ok(uploadPhotoMatch[0].includes('setIsUploading(true)'), 'uploadPhoto must set setIsUploading(true)');
        assert.ok(uploadPhotoMatch[0].includes('onFinish:'), 'uploadPhoto must have onFinish callback');
        assert.ok(uploadPhotoMatch[0].includes('setIsUploading(false)'), 'uploadPhoto onFinish must call setIsUploading(false)');
    });

    it('2. useEffect([job]) must defensively reset isUploading and isMoving when fresh server props arrive', () => {
        const jobEffectMatch = sheetContent.match(/\/\/ Keep local form states synchronized when job prop updates[\s\S]*?useEffect\(\(\) => \{([\s\S]*?)\}, \[job\]\);/);
        assert.ok(jobEffectMatch, 'useEffect([job]) must exist');
        const effectBody = jobEffectMatch[1];
        assert.ok(effectBody.includes('setIsUploading(false)'), 'useEffect([job]) must reset isUploading(false)');
        assert.ok(effectBody.includes('setIsMoving(false)'), 'useEffect([job]) must reset isMoving(false)');
    });

    it('3. Loader overlay must include watchdog timer, dismiss action, and data-dnp-busy attribute', () => {
        assert.ok(sheetContent.includes('data-dnp-busy="true"'), 'Loader overlay must have data-dnp-busy="true" attribute');
        assert.ok(sheetContent.includes('showStuckDismiss') || sheetContent.includes('dismissTimer'), 'Component must track stuck loading state for watchdog/dismiss');
        assert.ok(sheetContent.includes('Proses terlalu lama?') || sheetContent.includes('Tutup loading'), 'Must render dismiss option when loading is stuck');
    });

    it('4. Kanban/Index.jsx background polling must skip reload if data-dnp-busy is active', () => {
        const pollEffectMatch = kanbanContent.match(/const syncInterval = setInterval\(\(\) => \{([\s\S]*?)\}, 10000\);/);
        assert.ok(pollEffectMatch, 'Background polling setInterval must exist');
        const pollBody = pollEffectMatch[1];
        assert.ok(pollBody.includes('data-dnp-busy'), 'Polling must check data-dnp-busy before triggering router.reload');
    });

    it('5. Stage moves in JobDetailSheet must not use broken useForm post with data override', () => {
        // Assert no calls of form post(`/jobs/${job.id}/move`, { data: ... })
        const brokenPostMatches = sheetContent.match(/post\(`\/jobs\/\$\{job\.id\}\/move`,\s*\{\s*data:/g);
        assert.strictEqual(brokenPostMatches, null, 'Must NOT use post(`/jobs/${job.id}/move`, { data: ... }) because Inertia useForm ignores options.data');

        // All router.post move calls must have onFinish resetting isMoving
        const handleMoveMatch = sheetContent.match(/const handleMoveStage = [\s\S]*?const handleBypassStage5/);
        assert.ok(handleMoveMatch, 'handleMoveStage block must exist');
        assert.ok(handleMoveMatch[0].includes('onFinish: () => setIsMoving(false)') || handleMoveMatch[0].includes('setIsMoving(false)'), 'handleMoveStage must reset isMoving in onFinish');
    });

    it('6. Duplicate hidden file input must be eliminated from JobDetailSheet.jsx', () => {
        const fileInputMatches = sheetContent.match(/<input type="file" ref=\{fileInputRef\}/g);
        assert.strictEqual(fileInputMatches?.length, 1, 'There must be exactly ONE <input type="file" ref={fileInputRef}> in JobDetailSheet.jsx');
    });

    it('7. Stage save handlers and document delete must specify preserveScroll and preserveState', () => {
        const deleteDocMatch = sheetContent.match(/const deleteDoc = async[\s\S]*?router\.delete\([^)]+\);/);
        assert.ok(deleteDocMatch, 'deleteDoc must exist');
        assert.ok(deleteDocMatch[0].includes('preserveState: true'), 'deleteDoc must include preserveState: true');

        // Check handleSaveS4 through handleSaveS15
        ['handleSaveS4', 'handleSaveS5', 'handleSaveS7', 'handleSaveS8', 'handleSaveS9', 'handleSaveS10', 'handleSaveS11', 'handleSaveS14', 'handleSaveS15'].forEach(fn => {
            const regex = new RegExp(`const ${fn}\\s*=\\s*\\([\\s\\S]*?router\\.post\\([^,]+,[^,]+,\\s*\\{([\\s\\S]*?)\\}\\);`);
            const match = sheetContent.match(regex);
            assert.ok(match, `${fn} must exist as router.post`);
            assert.ok(match[1].includes('preserveScroll: true'), `${fn} must include preserveScroll: true`);
            assert.ok(match[1].includes('preserveState: true'), `${fn} must include preserveState: true`);
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/upload_and_mutation_lifecycle.test.js`
Expected: FAIL with multiple assertion errors showing missing `onFinish`, duplicate inputs, broken `post`, and uncoordinated polling.

---

### Task 2: Implement Frontend Upload Resilience & Mutation Lifecycle in `JobDetailSheet.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`

**Interfaces:**
- Consumes: User upload events, stage save buttons, stage transition triggers.
- Produces: Safe Inertia requests with `preserveScroll: true`, `preserveState: true`, `onFinish` callbacks, watchdog timer, emergency loader dismiss button, and clean DOM.

- [ ] **Step 1: Add Watchdog State and Timer in `JobDetailSheet.jsx`**

Add state and watchdog effect after line 498 (`const [isMoving, setIsMoving] = useState(false);`):

```javascript
    const [showStuckDismiss, setShowStuckDismiss] = useState(false);
    useEffect(() => {
        let dismissTimer;
        let hardResetTimer;
        if (isUploading || isMoving) {
            setShowStuckDismiss(false);
            dismissTimer = setTimeout(() => {
                setShowStuckDismiss(true);
            }, 5000);
            hardResetTimer = setTimeout(() => {
                setIsUploading(false);
                setIsMoving(false);
                setShowStuckDismiss(false);
            }, 15000);
        } else {
            setShowStuckDismiss(false);
        }
        return () => {
            clearTimeout(dismissTimer);
            clearTimeout(hardResetTimer);
        };
    }, [isUploading, isMoving]);
```

- [ ] **Step 2: Defensively Clear Upload & Move States in `useEffect([job])`**

In `useEffect(() => { ... }, [job])` (around line 591):
Add at the top of the effect body:
```javascript
        setIsUploading(false);
        setIsMoving(false);
        setIsSavingLink(false);
        setUploadStage(null);
        setUploadType('');
```

- [ ] **Step 3: Fix `onFileChange`, `uploadFileDirectly`, and `uploadPhoto`**

Update `onFileChange` (line 1138):
```javascript
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !uploadStage || !uploadType) return;
        if (file.size > MAX_FILE_SIZE) {
            showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB. Silakan kompres file Anda terlebih dahulu.');
            e.target.value = '';
            return;
        }
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', file); fd.append('type', uploadType); fd.append('stage', uploadStage);
        router.post(`/jobs/${job.id}/documents`, fd, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                showSuccess('Berhasil', 'Dokumen berhasil diunggah.');
            },
            onError: (errs) => {
                const msg = typeof errs === 'object' ? Object.values(errs).flat().join('\n') : '';
                showError('Gagal Mengunggah Berkas', msg || 'Format atau ukuran berkas tidak valid.');
            },
            onFinish: () => {
                setIsUploading(false);
                setUploadStage(null);
                setUploadType('');
            },
        });
        e.target.value = '';
    };
```

Update `uploadFileDirectly` (line 1161):
```javascript
    const uploadFileDirectly = (file, stageId, type, extraNotes = '') => {
        if (!file || !stageId || !type) return;
        if (!canManageStageDocs(stageId)) {
            showError('Akses Ditolak', 'Anda tidak memiliki izin untuk mengunggah dokumen pada tahap ini.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB. Silakan kompres file Anda terlebih dahulu.');
            return;
        }
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        fd.append('stage', stageId);
        if (extraNotes) fd.append('photo_notes', extraNotes);
        router.post(`/jobs/${job.id}/documents`, fd, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                showSuccess('Berhasil', 'Dokumen berhasil diunggah.');
            },
            onError: (errs) => {
                const msg = typeof errs === 'object' ? Object.values(errs).flat().join('\n') : '';
                showError('Gagal Mengunggah Berkas', msg || 'Format atau ukuran berkas tidak valid.');
            },
            onFinish: () => {
                setIsUploading(false);
                setUploadStage(null);
                setUploadType('');
            },
        });
    };
```

Update `uploadPhoto` (line 1189):
```javascript
    const uploadPhoto = (type) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '*';
        input.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            if (file.size > MAX_FILE_SIZE) {
                showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB.');
                return;
            }
            setIsUploading(true);
            const fd = new FormData();
            fd.append('file', file); fd.append('type', type); fd.append('stage', 4);
            const note = photoNotes[type] || '';
            if (note) fd.append('photo_notes', note);
            router.post(`/jobs/${job.id}/documents`, fd, {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    showSuccess('Berhasil', 'Foto berhasil diunggah.');
                },
                onError: (errs) => {
                    const msg = typeof errs === 'object' ? Object.values(errs).flat().join('\n') : '';
                    showError('Gagal Mengunggah Foto', msg || 'Gagal menyimpan foto ke server.');
                },
                onFinish: () => {
                    setIsUploading(false);
                },
            });
        };
        input.click();
    };
```

- [ ] **Step 4: Update Stage Save Handlers and Document Deletion**

Update `deleteDoc` (line 1221):
```javascript
        router.delete(`/jobs/${job.id}/documents/${docId}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => showSuccess('Berhasil', 'Dokumen berhasil dihapus.'),
            onError: (errs) => {
                const msg = typeof errs === 'object' ? Object.values(errs).flat().join('\n') : '';
                showError('Gagal Menghapus Berkas', msg || 'Gagal menghapus dokumen dari server.');
            },
        });
```

Update `handleSaveS4` through `handleSaveS15` (lines 1055, 1093, 1107, 1109-1115):
Add `preserveScroll: true, preserveState: true` to each options object.

- [ ] **Step 5: Fix Broken `post` Calls in Stage Transitions**

In `handleMoveStage` (around lines 792, 818, 845, 885):
Add `preserveScroll: true, preserveState: true, onFinish: () => setIsMoving(false)` to each `router.post`.

Replace broken `post` calls:
- Line 1774:
```javascript
router.post(`/jobs/${job.id}/move`, { ...data, next_stage: 5 }, {
    preserveScroll: true,
    preserveState: true,
    onSuccess: () => onClose(),
    onError: (errs) => showError('Gagal', typeof errs === 'object' ? Object.values(errs).flat().join('\n') : 'Gagal memindahkan tahap.'),
    onFinish: () => setIsMoving(false),
});
```
- Line 1886:
```javascript
router.post(`/jobs/${job.id}/move`, { ...data, next_stage: 5 }, {
    preserveScroll: true,
    preserveState: true,
    onSuccess: () => onClose(),
    onError: (errs) => showError('Gagal', typeof errs === 'object' ? Object.values(errs).flat().join('\n') : 'Gagal memindahkan tahap.'),
    onFinish: () => setIsMoving(false),
});
```
- Line 2603:
```javascript
router.post(`/jobs/${job.id}/move`, { ...data, next_stage: 16 }, {
    preserveScroll: true,
    preserveState: true,
    onSuccess: () => onClose(),
    onError: (errs) => showError('Gagal Mengarsipkan', typeof errs === 'object' ? Object.values(errs).flat().join('\n') : 'Gagal mengarsipkan pekerjaan.'),
    onFinish: () => setIsMoving(false),
});
```

- [ ] **Step 6: Remove Duplicate `<input type="file" ref={fileInputRef}>` and Enhance Loader Overlay**

Remove line 3369 (`<input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />`). Keep only the global one at line 3671.

Update Global Loader Overlay (around line 3674):
```javascript
                {/* Global Loader Overlay */}
                {(processing || isUploading || isMoving) && (
                    <div 
                        data-dnp-busy="true"
                        className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl"
                    >
                        <div className="bg-white p-5 rounded-xl shadow-xl flex flex-col items-center gap-3 border border-slate-100 max-w-xs text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                            <div>
                                <span className="font-semibold text-gray-800 text-sm block">Memproses...</span>
                                <span className="text-[11px] text-gray-500 block mt-0.5">Mohon tunggu sementara data disinkronkan</span>
                            </div>
                            {showStuckDismiss && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsUploading(false);
                                        setIsMoving(false);
                                    }}
                                    className="mt-2 text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
                                >
                                    Proses terlalu lama? Tutup loading
                                </button>
                            )}
                        </div>
                    </div>
                )}
```

---

### Task 3: Polling Coordination in `Kanban/Index.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Kanban/Index.jsx:83-93`

**Interfaces:**
- Consumes: Background interval timer and DOM `[data-dnp-busy="true"]` presence.
- Produces: Polling visit that yields execution when an active upload or stage mutation is underway.

- [ ] **Step 1: Guard `router.reload` against active mutations**

In `Kanban/Index.jsx` lines 83-93:
```javascript
    // Live background polling sync to keep Kanban updated across all active users
    useEffect(() => {
        const syncInterval = setInterval(() => {
            // Do not interrupt in-flight uploads, stage moves, or active modal mutations
            if (typeof document !== 'undefined' && document.querySelector('[data-dnp-busy="true"]')) {
                return;
            }
            router.reload({
                only: ['jobs'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000); // 10 seconds background refresh

        return () => clearInterval(syncInterval);
    }, []);
```

---

### Task 4: Run Verification Suite & Production Build Validation

**Files:**
- Test: `tests/upload_and_mutation_lifecycle.test.js`
- Test: all `tests/*.test.js`

- [ ] **Step 1: Run the new lifecycle test suite**

Run: `node --test tests/upload_and_mutation_lifecycle.test.js`
Expected: PASS with 7/7 tests passing.

- [ ] **Step 2: Run the full regression test suite**

Run: `node --test tests/*.test.js`
Expected: PASS across all 116 suites (305+ total tests).

- [ ] **Step 3: Run standalone production build validation test**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: PASS.

---

### Task 5: Git Commit & Production VPS Deployment Guidance

**Files:**
- Git repository status and commit.

- [ ] **Step 1: Check git diff and status**

Run: `git status` and `git diff --stat`
Expected: Clean modifications strictly in `JobDetailSheet.jsx`, `Kanban/Index.jsx`, and `tests/upload_and_mutation_lifecycle.test.js`.

- [ ] **Step 2: Commit changes**

Run:
```bash
git add tests/upload_and_mutation_lifecycle.test.js dnp-rework/resources/js/Components/JobDetailSheet.jsx dnp-rework/resources/js/Pages/Kanban/Index.jsx docs/superpowers/plans/2026-10-09-fix-upload-stuck-loader-and-kanban-mutations.md
git commit -m "fix(kanban): eliminate stuck loading after upload with onFinish callbacks and polling coordination"
```

- [ ] **Step 3: Document VPS deploy instructions**

Document the exact deployment commands:
```bash
cd /var/www/demo-dnp/demo-dnp/dnp-monitor-production
git pull origin main
cd dnp-rework && npm run build
php artisan optimize:clear
```
