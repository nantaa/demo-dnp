# Fix "Kosongkan Database Job" Error & Enforce Pure Job-Scoped Purging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 500 `SQLSTATE[42P01]` undefined table error when clicking "Kosongkan Database Job" (`DELETE /jobs/clear-all`), ensure it purges all Job records and dependent job artifacts without touching any master data (`alat_ujis`, `users`, `regulasi_k3`, `form_disnaker`, `sertifikat_pjk3`).

**Architecture:**
- Backend: Update `JobController::clearAll` in `dnp-rework/app/Http/Controllers/JobController.php` to remove the non-existent `job_alat_uji` query, explicitly purge physical files for `JobDocument`, cleanly purge child records (`job_inspectors`, `job_documents`, `job_history`, `job_evaluations`, `units_tracking`, `disnaker_followups`), and delete `Job` rows. Ensure master tables (`alat_ujis`, `users`, etc.) are untouched.
- Testing: Automated AST & regression test using Node.js test runner (`node:test`) verifying query integrity, table scope constraints, and Superadmin authorization boundaries.

**Tech Stack:** Laravel 11/13, PHP 8.3, PostgreSQL, Node.js (`node:test`).

## Global Constraints
- Strictly adhere to TDD order: Plan → Test → Implement → Review → Verify.
- Do NOT touch or delete master tables (`alat_ujis`, `users`, `user_stage_permissions`, `regulasi_k3`, `form_disnaker`, `sertifikat_pjk3`, `app_states`).
- Do NOT perform database migrations (the schema for `dnp_jobs` and its children is already correct; `alat_ids` is a JSON column on `dnp_jobs`).
- Ensure Superadmin-only gate remains strictly enforced.

---

### Task 1: Write TDD Regression Test for Job Purging Scope

**Files:**
- Create: `tests/clear_all_jobs_purging.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Job Purging Scope & clearAll Bugfix Test Suite', () => {
    const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    it('1. JobController::clearAll does NOT query non-existent table "job_alat_uji"', () => {
        assert.doesNotMatch(
            controllerContent,
            /DB::table\(['"]job_alat_uji['"]\)/,
            'JobController::clearAll must not reference nonexistent job_alat_uji table'
        );
    });

    it('2. JobController::clearAll does NOT touch master data table "alat_ujis"', () => {
        assert.doesNotMatch(
            controllerContent,
            /(DB::table\(['"]alat_ujis['"]\)->delete|AlatUji::(query\(\)->)?delete|AlatUji::truncate)/,
            'JobController::clearAll must NEVER delete or truncate master table alat_ujis'
        );
    });

    it('3. JobController::clearAll does NOT touch master users or permissions', () => {
        assert.doesNotMatch(
            controllerContent,
            /(DB::table\(['"]users['"]\)->delete|User::(query\(\)->)?delete|user_stage_permissions)/,
            'JobController::clearAll must NEVER delete users or stage permissions'
        );
    });

    it('4. JobController::clearAll purges job-scoped child records and files', () => {
        // Must contain clearAll method with Superadmin authorization check
        assert.match(controllerContent, /public function clearAll\(/, 'clearAll method must exist');
        assert.match(controllerContent, /isSuperadmin/, 'clearAll must require Superadmin privilege');
        // Must delete Job records
        assert.match(controllerContent, /Job::query\(\)->delete\(\)/, 'Must delete Job records');
        // Must clean up documents / files
        assert.match(controllerContent, /JobDocument/, 'Must handle JobDocument cleanup');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/clear_all_jobs_purging.test.js`
Expected: FAIL because `DB::table('job_alat_uji')` currently exists on line 1730 of `JobController.php`.

- [ ] **Step 3: Commit test file**

```bash
git add tests/clear_all_jobs_purging.test.js
git commit -m "test: add regression test for clearAll job purging scope"
```

---

### Task 2: Implement Minimal Bugfix in `JobController.php`

**Files:**
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:1718-1736`

- [ ] **Step 1: Update `clearAll` method in `JobController.php`**

Replace:
```php
        \Illuminate\Support\Facades\DB::transaction(function() {
            JobDocument::query()->delete();
            \Illuminate\Support\Facades\DB::table('job_inspectors')->delete();
            \Illuminate\Support\Facades\DB::table('job_alat_uji')->delete();
            Job::query()->delete();
        });
```

With:
```php
        \Illuminate\Support\Facades\DB::transaction(function() {
            // 1. Delete associated physical files for job documents
            foreach (JobDocument::all() as $doc) {
                $filePath = $doc->path ?? $doc->file_path;
                if ($filePath && Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                }
            }

            // 2. Delete job child records (cascaded, but explicitly cleared for clean state)
            JobDocument::query()->delete();
            \Illuminate\Support\Facades\DB::table('job_inspectors')->delete();
            \Illuminate\Support\Facades\DB::table('job_history')->delete();
            \Illuminate\Support\Facades\DB::table('job_evaluations')->delete();
            \Illuminate\Support\Facades\DB::table('units_tracking')->delete();
            \Illuminate\Support\Facades\DB::table('disnaker_followups')->delete();

            // 3. Delete all jobs from database
            Job::query()->delete();
        });
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/clear_all_jobs_purging.test.js`
Expected: PASS with 4/4 passing tests.

- [ ] **Step 3: Run full test suite to ensure zero regressions**

Run: `node --test tests/*.test.js`
Expected: 195/195 tests pass.

- [ ] **Step 4: Commit changes**

```bash
git add dnp-rework/app/Http/Controllers/JobController.php
git commit -m "fix(jobs): remove nonexistent job_alat_uji table and cleanly purge job records and files in clearAll"
```
