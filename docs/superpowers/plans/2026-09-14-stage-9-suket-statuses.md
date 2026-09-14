# Implementation Plan: Stage 9 Suket Operational Statuses

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Stage 9 Suket progress statuses (`not_started`, `delayed`, `in_progress`, `almost_done`, `done`) with the practical operational Suket workflow statuses:
1. `diterima` (Diterima)
2. `scan` (Scan)
3. `penamaan_cover` (Penamaan Cover)
4. `pembuatan_tanda_terima` (Pembuatan Tanda Terima)
5. `selesai` (Selesai)

**Architecture:** 
- Define a dedicated `STAGE9_SUKET_STATUSES` constant in `Constants.js` representing the five operational workflow steps with appropriate badges/colors.
- Retain backward compatibility so existing jobs with legacy status strings still render readable labels rather than blank/broken badges.
- Update `JobController.php` validation rules on `saveStage9Data` to accept both new keys (`diterima`, `scan`, `penamaan_cover`, `pembuatan_tanda_terima`, `selesai`) and legacy values for backwards compatibility.
- Update `JobDetailSheet.jsx` (dropdown select & read-only preview), `Kanban/Index.jsx` (card badges), and `Jobs/List.jsx` (table row badges).

**Tech Stack:** Laravel 11 / PHP 8.3, React 19, Inertia.js, TailwindCSS, Node test runner.

## Global Constraints
- Stay strictly on branch `main` (never switch to or touch `v3`).
- Follow TDD order: write tests first, run to fail/assert, implement minimal code, verify passing, review, verify syntax/bundle.
- Pause for user approval before modifying implementation code.

---

### Task 1: Write TDD Test Suite for Stage 9 Suket Statuses

**Files:**
- Test: `tests/s9_suket_statuses.test.js`

- [ ] **Step 1: Write the failing test**
Create `tests/s9_suket_statuses.test.js` covering:
1. `STAGE9_SUKET_STATUSES` constant containing exactly the 5 new statuses in order: `diterima`, `scan`, `penamaan_cover`, `pembuatan_tanda_terima`, `selesai`.
2. Status label mapping for display (e.g. `diterima` -> "Diterima", `scan` -> "Scan", `penamaan_cover` -> "Penamaan Cover", `pembuatan_tanda_terima` -> "Pembuatan Tanda Terima", `selesai` -> "Selesai").
3. Backward compatibility helper: gracefully resolves legacy values (`in_progress`, `done`, etc.) if encountered on historical jobs.
4. Backend validation rule coverage for `s9_progress_status`.
5. Kanban badge renderer for Stage 9 cards displaying the new operational Suket badges.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/s9_suket_statuses.test.js`
Expected: FAIL (module or constants not yet defined).

---

### Task 2: Update Constants & Controllers

**Files:**
- Modify: `dnp-rework/resources/js/Constants.js`
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:806-810`

- [ ] **Step 3: Define `STAGE9_SUKET_STATUSES` in Constants.js**
Add:
```javascript
export const STAGE9_SUKET_STATUSES = [
    { value: 'diterima', label: 'Diterima' },
    { value: 'scan', label: 'Scan' },
    { value: 'penamaan_cover', label: 'Penamaan Cover' },
    { value: 'pembuatan_tanda_terima', label: 'Pembuatan Tanda Terima' },
    { value: 'selesai', label: 'Selesai' },
];
```

- [ ] **Step 4: Update validation in JobController.php**
In `JobController::saveStage9Data`:
```php
$validated = $request->validate([
    's9_progress_status' => 'required|in:diterima,scan,penamaan_cover,pembuatan_tanda_terima,selesai,not_started,delayed,in_progress,almost_done,done',
]);
```
*(Accepts the 5 new statuses while permitting legacy values so existing records don't fail validation upon editing other fields).*

---

### Task 3: Update Frontend UI Components (JobDetailSheet, Kanban, Jobs List)

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Modify: `dnp-rework/resources/js/Pages/Kanban/Index.jsx`
- Modify: `dnp-rework/resources/js/Pages/Jobs/List.jsx`

- [ ] **Step 5: Update JobDetailSheet.jsx**
- Import `STAGE9_SUKET_STATUSES` from `@/Constants`.
- In Stage 9 form select (around line 1912): replace `PROGRESS_STATUSES` with `STAGE9_SUKET_STATUSES`.
- In Stage 9 read-only section (around line 2377): resolve label using `STAGE9_SUKET_STATUSES` first, with fallback to legacy `PROGRESS_STATUSES` or raw value.

- [ ] **Step 6: Update Kanban/Index.jsx**
In Kanban badge renderer for `job.stage === 9`:
Map the new statuses to clear, professional badges:
- `diterima`: Blue (`bg-blue-100 text-blue-800 border-blue-300`)
- `scan`: Purple (`bg-purple-100 text-purple-800 border-purple-300`)
- `penamaan_cover`: Amber (`bg-amber-100 text-amber-800 border-amber-300`)
- `pembuatan_tanda_terima`: Cyan/Indigo (`bg-cyan-100 text-cyan-800 border-cyan-300`)
- `selesai`: Emerald (`bg-emerald-100 text-emerald-800 border-emerald-300`)
- Retain fallback for legacy strings.

- [ ] **Step 7: Update Jobs/List.jsx**
Update `s9Map` in table row badges to mirror the new 5 operational statuses with fallback.

---

### Task 4: Verification & Linting

- [ ] **Step 8: Run unit test suite**
Run: `node --test tests/s9_suket_statuses.test.js`
Run: `node --test tests/*.test.js`
Expected: 100% pass across all test suites.

- [ ] **Step 9: Run PHP lint & esbuild bundling**
- `php -l dnp-rework/app/Http/Controllers/JobController.php`
- `npx esbuild dnp-rework/resources/js/Pages/Kanban/Index.jsx --loader:.jsx=jsx --bundle --platform=neutral --packages=external --outfile=nul`
- `npx esbuild dnp-rework/resources/js/Components/JobDetailSheet.jsx --loader:.jsx=jsx --bundle --platform=neutral --packages=external --outfile=nul`
- `npx esbuild dnp-rework/resources/js/Pages/Jobs/List.jsx --loader:.jsx=jsx --bundle --platform=neutral --packages=external --outfile=nul`
Expected: 0 errors.
