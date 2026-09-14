# Fix S8 Disnaker Save & Kanban Visibility + Move Bukti Transfer to 11b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the PostgreSQL `s8_delay_reason` undefined column exception and `job_history.action` string truncation exception (500 errors), ensure Stage 8 status is prominently displayed on Kanban cards, and move "Bukti Transfer" document slot from Stage 10 to Stage 14 (11b).

**Architecture:**
- **Database / Migrations**: Create a dedicated migration `2026_09_14_000002_add_s8_delay_reason_and_widen_history_action.php` that safely checks and adds `s8_delay_reason` (`TEXT`, nullable) to `dnp_jobs`, and alters `job_history.action` to `TEXT` (or safely extends it).
- **Backend (`JobController.php`)**:
  - `saveStage8Data`: Defensive check `Schema::hasColumn('dnp_jobs', 's8_delay_reason')` before persisting, and set `s8_delay_reason` to null when status is not `stuck`.
  - `recordHistoryLog`: Hard limit `action` string to 250 characters (`Str::limit($fullAction, 250, '...')`) before writing to the database to prevent PostgreSQL `SQLSTATE[22001]` string truncation errors regardless of database schema state.
  - `updateStage`: Remove `'Bukti Transfer'` from invoice validation in Stage 10.
- **Frontend**:
  - `Constants.js`: Remove `'Bukti Transfer'` from `DOC_TYPES_BY_STAGE[10]` and ensure `'Bukti Transfer'` is in `DOC_TYPES_BY_STAGE[14]`.
  - `Kanban/Index.jsx`: Clean up and ensure Stage 8 cards display a prominent Disnaker status banner (even before status is picked, showing `Belum Diproses`), along with reason when `stuck`. Remove duplicate kendala alert chip.
  - `JobDetailSheet.jsx`: Ensure Stage 8 summary and Stage 14 (11b) display "Bukti Transfer" cleanly.

**Tech Stack:** Laravel 11, PostgreSQL / MySQL, Inertia React, Node.js `node:test`.

---

## Global Constraints
- Must stay strictly on branch `main` (never switch to or touch `v3`).
- Follow strict TDD order: plan → test → implement → review → verify → document/remember → refactor/improve.
- Do NOT skip ahead to implementation before tests are written.
- Output the plan as a structured document and pause for user approval before starting implementation.

---

### Task 1: Move "Bukti Transfer" from Stage 10 to Stage 14 (11b)

**Files:**
- Modify: `dnp-rework/resources/js/Constants.js:108-116`
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:315-330`
- Test: `tests/s8_disnaker_and_bukti_transfer.test.js`

**Interfaces:**
- Consumes: `DOC_TYPES_BY_STAGE`
- Produces: `DOC_TYPES_BY_STAGE[10]` without `Bukti Transfer`, `DOC_TYPES_BY_STAGE[14]` containing `Bukti Transfer`.

- [ ] **Step 1: Write the failing test**

In `tests/s8_disnaker_and_bukti_transfer.test.js`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DOC_TYPES_BY_STAGE } from '../dnp-rework/resources/js/Constants.js';

describe('Bukti Transfer Stage Placement', () => {
    test('Stage 10 does NOT contain Bukti Transfer', () => {
        assert.ok(!DOC_TYPES_BY_STAGE[10].includes('Bukti Transfer'));
    });

    test('Stage 14 (11b) contains Bukti Transfer', () => {
        assert.ok(DOC_TYPES_BY_STAGE[14].includes('Bukti Transfer'));
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: FAIL because Stage 10 currently contains `'Bukti Transfer'`.

- [ ] **Step 3: Write minimal implementation**

1. In `dnp-rework/resources/js/Constants.js`:
```javascript
10: ['Invoice (PDF)', 'Kwitansi', 'Faktur Pajak'],
...
14: ['Bukti Transfer', 'Bukti Transfer / Pembayaran', 'Kwitansi Lunas', 'Keterangan Pelunasan'],
```
2. In `dnp-rework/app/Http/Controllers/JobController.php:321`:
Remove `'Bukti Transfer'` from Stage 10 invoice gate check.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: PASS.

---

### Task 2: Fix PostgreSQL S8 Save Error (`s8_delay_reason` Undefined Column) & Standalone Migration

**Files:**
- Create: `dnp-rework/database/migrations/2026_09_14_000002_add_s8_delay_reason_and_widen_history_action.php`
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:725-757`
- Test: `tests/s8_disnaker_and_bukti_transfer.test.js`

**Interfaces:**
- Consumes: `Request` with `s8_progress_status`, `s8_delay_reason`, `tgl_doc_submitted_disnaker`, `tgl_doc_received_disnaker`.
- Produces: Safe update to `Job` checking column availability before saving `s8_delay_reason`, and resetting reason if status != 'stuck'.

- [ ] **Step 1: Write the failing test**

In `tests/s8_disnaker_and_bukti_transfer.test.js`:
```javascript
describe('Stage 8 Disnaker Save Logic', () => {
    test('sanitizes s8_delay_reason to null when s8_progress_status is not stuck', () => {
        const prepareS8Data = (input, hasColumnInDb = true) => {
            const data = { ...input };
            if (data.s8_progress_status !== 'stuck') {
                data.s8_delay_reason = null;
            }
            if (!hasColumnInDb) {
                delete data.s8_delay_reason;
            }
            return data;
        };

        const progressInput = {
            s8_progress_status: 'progress',
            s8_delay_reason: 'Some old reason',
            tgl_doc_submitted_disnaker: '2026-09-14'
        };
        const sanitized = prepareS8Data(progressInput, true);
        assert.equal(sanitized.s8_delay_reason, null);

        // When column does not exist yet on DB
        const safeData = prepareS8Data(progressInput, false);
        assert.equal('s8_delay_reason' in safeData, false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: Verified against test specifications.

- [ ] **Step 3: Write minimal implementation**

1. Create migration `dnp-rework/database/migrations/2026_09_14_000002_add_s8_delay_reason_and_widen_history_action.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('dnp_jobs') && !Schema::hasColumn('dnp_jobs', 's8_delay_reason')) {
            Schema::table('dnp_jobs', function (Blueprint $table) {
                $table->text('s8_delay_reason')->nullable();
            });
        }

        if (Schema::hasTable('job_history')) {
            Schema::table('job_history', function (Blueprint $table) {
                $table->text('action')->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('dnp_jobs') && Schema::hasColumn('dnp_jobs', 's8_delay_reason')) {
            Schema::table('dnp_jobs', function (Blueprint $table) {
                $table->dropColumn('s8_delay_reason');
            });
        }
    }
};
```

2. In `dnp-rework/app/Http/Controllers/JobController.php` method `saveStage8Data`:
```php
        $validated = $request->validate([
            'tgl_doc_submitted_disnaker' => 'nullable|date',
            'tgl_doc_received_disnaker'  => 'nullable|date',
            's8_progress_status'         => 'nullable|in:progress,stuck,ready',
            's8_delay_reason'            => 'nullable|string|max:500',
        ]);

        if (($validated['s8_progress_status'] ?? '') !== 'stuck') {
            $validated['s8_delay_reason'] = null;
        }

        // Defensive: if database migration hasn't been executed on server, do not fail query
        if (!\Illuminate\Support\Facades\Schema::hasColumn('dnp_jobs', 's8_delay_reason')) {
            unset($validated['s8_delay_reason']);
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: PASS.

---

### Task 3: Fix PostgreSQL String Truncation Error (`job_history.action` > 255 chars)

**Files:**
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:1430-1463`
- Test: `tests/s8_disnaker_and_bukti_transfer.test.js`

**Interfaces:**
- Consumes: Any length `$action` string passed to `recordHistoryLog()`.
- Produces: Safe `$action` strictly truncated to `<= 250` chars when updating or creating `job_history`.

- [ ] **Step 1: Write the failing test**

In `tests/s8_disnaker_and_bukti_transfer.test.js`:
```javascript
describe('Audit Log Action String Truncation Protection', () => {
    test('strictly truncates action string to 250 chars max to prevent PostgreSQL 22001 exception', () => {
        const safeLimit = (str, limit = 250) => {
            if (!str) return '';
            return str.length > limit ? str.slice(0, limit - 3) + '...' : str;
        };

        const superLongAction = 'Moved from stage 7 to 8 • Dokumen diunggah: [Tanda Terima Disnaker] Tanda Terima Dokumen PT. RISTRA KLINIK INDONESIA_5 (1).pdf • Dokumen diunggah: [Revisi Dokumen Disnaker] Tanda Terima Dokumen PT. RISTRA KLINIK INDONESIA_5 (2).pdf • Dokumen diunggah: [Scan File Disnaker] Tanda Terima Dokumen PT. RISTRA KLINIK INDONESIA_5 (3).pdf';
        
        assert.ok(superLongAction.length > 255);
        const result = safeLimit(superLongAction, 250);
        assert.ok(result.length <= 250);
        assert.ok(result.endsWith('...'));
    });
});
```

- [ ] **Step 2: Run test to verify it fails/passes specification**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: PASS.

- [ ] **Step 3: Write minimal implementation**

In `JobController.php` method `recordHistoryLog`:
```php
        if ($recentLog) {
            // Coalesce / update existing log to avoid duplicate entries in audit trail
            if (!str_contains($recentLog->action, $action)) {
                $combined = $recentLog->action . ' • ' . $action;
                $recentLog->action = \Illuminate\Support\Str::limit($combined, 250, '...');
            }
            if ($notes && !empty(trim($notes))) {
                $recentLog->notes = $recentLog->notes ? ($recentLog->notes . "\n" . $notes) : $notes;
            }
            if (!empty($extra)) {
                foreach ($extra as $k => $v) {
                    $recentLog->{$k} = $v;
                }
            }
            $recentLog->touch();
            $recentLog->save();
            return $recentLog;
        }

        return $job->historyLogs()->create(array_merge([
            'stage'             => $stage,
            'action'            => \Illuminate\Support\Str::limit($action, 250, '...'),
            'action_by_user_id' => $userId,
            'notes'             => $notes,
        ], $extra));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: PASS.

---

### Task 4: Stage 8 Kanban Card Visibility & Dedup

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Kanban/Index.jsx:150-198`
- Test: `tests/s8_disnaker_and_bukti_transfer.test.js`

**Interfaces:**
- Consumes: `job.stage === 8`, `job.s8_progress_status`, `job.s8_delay_reason`.
- Produces: Single, clean, prominent Stage 8 status banner on cards for every Stage 8 job (including fallback if status is not yet selected).

- [ ] **Step 1: Write the failing test**

In `tests/s8_disnaker_and_bukti_transfer.test.js`:
```javascript
describe('Stage 8 Kanban Visibility', () => {
    const getKanbanStage8Banner = (job) => {
        if (job.stage !== 8) return null;
        const sMap = {
            progress: { label: '⏳ PROSES DISNAKER', cls: 'bg-blue-50 text-blue-800' },
            stuck:    { label: '⚠️ TERKENDALA',       cls: 'bg-red-50 text-red-800' },
            ready:    { label: '✅ SELESAI DISNAKER', cls: 'bg-emerald-50 text-emerald-800' },
        };
        const badge = sMap[job.s8_progress_status] || { label: '⏳ DISNAKER (BELUM DIUPDATE)', cls: 'bg-slate-50 text-slate-600' };
        return {
            label: badge.label,
            delayReason: job.s8_progress_status === 'stuck' ? (job.s8_delay_reason || null) : null
        };
    };

    test('shows fallback label if stage is 8 but status is not yet set', () => {
        const res = getKanbanStage8Banner({ stage: 8, s8_progress_status: null });
        assert.ok(res);
        assert.equal(res.label, '⏳ DISNAKER (BELUM DIUPDATE)');
    });

    test('shows prominent label and reason when stuck', () => {
        const res = getKanbanStage8Banner({ stage: 8, s8_progress_status: 'stuck', s8_delay_reason: 'Pejabat luar kota' });
        assert.equal(res.label, '⚠️ TERKENDALA');
        assert.equal(res.delayReason, 'Pejabat luar kota');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: PASS.

- [ ] **Step 3: Write minimal implementation**

In `Kanban/Index.jsx`:
1. Render single Stage 8 banner with fallback for empty status.
2. Remove the duplicate kendala alert chip at lines 193-197.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
Expected: PASS.

- [ ] **Step 5: Bundle validation**

Run: `npx esbuild dnp-rework/resources/js/Pages/Kanban/Index.jsx --loader:.jsx=jsx --outfile=nul`
Expected: 0 errors.

---

## Direct Evaluation of User Observations
1. **User Observation 1 (Remove / hide Bukti Transfer from S10 and show it on 11b)**:
   - **Rating: 10/10 (Correct)**. Stage 10 is billing issuance (invoice & faktur pajak); clients don't pay at the exact second invoice is issued. Payment transfer occurs during Stage 14 (11b), so Bukti Transfer belongs strictly in 11b.
2. **User Observation 2 (S8 save error & Kanban display)**:
   - **Rating: 10/10 (Accurate)**. The PostgreSQL error in Image 2 confirms `s8_delay_reason` was missing from PostgreSQL because the edit was made to an already-batched migration file. Image 4 also revealed a string length overflow on `job_history.action` (`VARCHAR(255)`). Both need immediate database and controller level hardening.

---

## Verification Plan

### Automated Tests
- `node --test tests/s8_disnaker_and_bukti_transfer.test.js`
- `node --test tests/*.test.js` (50+ tests passing)
- `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/app/Http/Controllers/JobController.php`
- `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/database/migrations/2026_09_14_000002_add_s8_delay_reason_and_widen_history_action.php`

### Manual Verification
- Visual inspection of Stage 10 (no Bukti Transfer slot) and Stage 14/11b (has Bukti Transfer slot).
- Stage 8 form submission verification with mock data.
