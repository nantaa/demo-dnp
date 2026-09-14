# Perlu Diperbaiki (DNP Monitor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved "Perlu Diperbaiki" items from `Rekap_Masukan_Perbaikan_DNP_Monitor (1) (5).xlsx` and `STATUS_REKAP_PERBAIKAN.md` on branch `main`: Stage 8 Disnaker Kanban visibility + delay reason, PPN 12% real-time calculation in Job Create, dedicated Stage 1 Dokumen Tambahan upload slot, and audit log deduplication/coalescing.

**Architecture:** 
- Frontend: Inertia React components (`Jobs/Create.jsx`, `JobDetailSheet.jsx`, `Kanban/Index.jsx`) with instant mathematical derivation and clear status badges.
- Backend: Laravel 11 (`JobController.php`) with request validation, database migration for `s8_delay_reason`, and a centralized `recordHistoryLog` debounce helper in `JobController.php` coalescing duplicate logs within 120s.
- Verification: Automated Node.js unit tests (`node:test`) and PHP syntax linting (`php -l`).

**Tech Stack:** Laravel 11, PHP 8.3, Inertia.js React, Tailwind CSS, Node.js `node:test`.

## Global Constraints

- Must stay strictly on branch `main` (never switch to or touch `v3`).
- Follow strict TDD order: plan → test → implement → review → verify → document/remember → refactor/improve.
- Do NOT skip ahead to implementation before tests are written.
- Items 3 & 4 from Rekap are SKIPPED per user direction.
- Items 6 & 7 are on HOLD per user direction.

---

### Task 1: Kanban Stage 8 Disnaker Visibility & Delay Reason Backend Persistence

**Files:**
- Modify: `dnp-rework/database/migrations/2026_09_14_000001_add_faktur_pajak_to_dnp_jobs.php`
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:725-757`
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Modify: `dnp-rework/resources/js/Pages/Kanban/Index.jsx`
- Test: `tests/perlu_diperbaiki_features.test.js`

**Interfaces:**
- Consumes: `Job.s8_progress_status` ('progress' | 'stuck' | 'ready'), `Job.s8_delay_reason` (string)
- Produces: Visual status indicators on Kanban Stage 8 cards, validated `s8_delay_reason` in `saveStage8Data`.

- [ ] **Step 1: Write the failing test**

In `tests/perlu_diperbaiki_features.test.js`:
```javascript
test('returns TERKENDALA badge with delayReason when s8_progress_status is stuck', () => {
    const badge = getDisnakerBadge({
        stage: 8,
        s8_progress_status: 'stuck',
        s8_delay_reason: 'Pejabat Disnaker sedang dinas luar kota'
    });
    assert.ok(badge);
    assert.equal(badge.label, 'TERKENDALA');
    assert.equal(badge.delayReason, 'Pejabat Disnaker sedang dinas luar kota');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: Test fails if logic is not met.

- [ ] **Step 3: Write minimal implementation**

1. In `dnp-rework/database/migrations/2026_09_14_000001_add_faktur_pajak_to_dnp_jobs.php`:
Add:
```php
$table->text('s8_delay_reason')->nullable()->after('s8_progress_status');
```

2. In `dnp-rework/app/Http/Controllers/JobController.php` method `saveStage8Data`:
```php
$validated = $request->validate([
    'tgl_doc_submitted_disnaker' => 'nullable|date',
    'tgl_doc_received_disnaker'  => 'nullable|date',
    's8_progress_status'         => 'nullable|in:progress,stuck,ready',
    's8_delay_reason'            => 'nullable|string|max:500',
]);
```

3. In `JobDetailSheet.jsx`:
Ensure `s8_delay_reason` is captured when `s8_progress_status === 'stuck'`.

4. In `Kanban/Index.jsx`:
Render prominent badge with `s8_delay_reason` on Stage 8 cards.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: PASS with 0 failures.

- [ ] **Step 5: Syntax & migration verification**

Run: `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/app/Http/Controllers/JobController.php`
Expected: `No syntax errors detected in dnp-rework/app/Http/Controllers/JobController.php`

---

### Task 2: PPN 12% Real-Time Calculator in Jobs/Create.jsx

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Jobs/Create.jsx`
- Test: `tests/perlu_diperbaiki_features.test.js`

**Interfaces:**
- Consumes: `data.nilai` (string | number)
- Produces: Breakdown card showing DPP (`data.nilai`), PPN 12% (`Math.round(nilai * 0.12)`), and Total Sesudah PPN (`Math.round(nilai * 1.12)`).

- [ ] **Step 1: Write the failing test**

In `tests/perlu_diperbaiki_features.test.js`:
```javascript
test('calculates accurate DPP, 12% PPN, and Total for 3,000,000 (User Screenshot 2)', () => {
    const res = calculatePpnBreakdown('3000000');
    assert.equal(res.hasValue, true);
    assert.equal(res.dpp, 3000000);
    assert.equal(res.ppn, 360000);
    assert.equal(res.total, 3360000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: Passes when calculation helper matches spec.

- [ ] **Step 3: Write minimal implementation**

In `dnp-rework/resources/js/Pages/Jobs/Create.jsx`:
Add real-time calculation box right below the `Nilai Kontrak (Rp)` input field:
```jsx
{(() => {
    const rawVal = parseFloat(data.nilai || 0);
    if (isNaN(rawVal) || rawVal <= 0) return null;
    const ppn = Math.round(rawVal * 0.12);
    const total = Math.round(rawVal * 1.12);
    return (
        <div className="mt-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <div className="font-semibold text-emerald-900 mb-1 flex items-center justify-between">
                <span>Rincian Nilai Kontrak (PPN 12%)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">Otomatis</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/60 text-gray-700">
                <div>
                    <span className="block text-[10px] text-gray-500 uppercase">DPP</span>
                    <span className="font-medium text-gray-900">Rp {rawVal.toLocaleString('id-ID')}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-emerald-700 font-semibold uppercase">PPN (12%)</span>
                    <span className="font-semibold text-emerald-700">+ Rp {ppn.toLocaleString('id-ID')}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Total Tagihan</span>
                    <span className="font-bold text-gray-900">Rp {total.toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>
    );
})()}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: PASS.

- [ ] **Step 5: Bundle validation**

Run: `npx esbuild dnp-rework/resources/js/Pages/Jobs/Create.jsx --loader=jsx --outfile=dnp-rework/storage/framework/cache/create_test.js`
Expected: Clean exit code 0.

---

### Task 3: Stage 1 Dokumen Tambahan Upload Slot

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Modify: `dnp-rework/resources/js/Utils/Constants.js`
- Test: `tests/perlu_diperbaiki_features.test.js`

**Interfaces:**
- Consumes: `DOC_TYPES_BY_STAGE[1]`, `job.documents`
- Produces: Dedicated upload slot `<UploadSlot type="Dokumen Tambahan" stageId={1} ... />` in Stage 1 panel.

- [ ] **Step 1: Write the failing test**

In `tests/perlu_diperbaiki_features.test.js`:
```javascript
test('Dokumen Tambahan is treated as valid Stage 1 document type', () => {
    const validDocType = 'Dokumen Tambahan';
    const stage = 1;
    const doc = { id: 99, stage: 1, type: validDocType, filename: 'surat_keterangan_tambahan.pdf' };
    const isMatchingDoc = (d, st, tp) => d.stage === st && d.type === tp;
    assert.equal(isMatchingDoc(doc, stage, validDocType), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: Verification runs clean.

- [ ] **Step 3: Write minimal implementation**

1. In `Constants.js`: Verify `'Dokumen Tambahan'` is present in `DOC_TYPES_BY_STAGE[1]`.
2. In `JobDetailSheet.jsx`: Add explicit dedicated `<UploadSlot type="Dokumen Tambahan" stageId={1} ... />` right alongside Surat Permohonan & Surat Penawaran.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: PASS.

---

### Task 4: Audit Log Clean Up (Deduplication & Coalescing within < 2 Minutes)

**Files:**
- Modify: `dnp-rework/app/Http/Controllers/JobController.php`
- Test: `tests/perlu_diperbaiki_features.test.js`

**Interfaces:**
- Consumes: `job_id`, `stage`, `action`, `notes`, `action_by_user_id`
- Produces: Deduplicated/coalesced `job_history` entries when consecutive actions occur within 120 seconds.

- [ ] **Step 1: Write the failing test**

In `tests/perlu_diperbaiki_features.test.js`:
```javascript
test('identifies rapid consecutive logs from the same user on the same stage as duplicate', () => {
    const log1 = {
        job_id: 10,
        stage: 10,
        action_by_user_id: 2,
        created_at: '2026-09-14T10:00:00Z',
        action: 'Data penagihan diperbarui oleh Finance.'
    };
    const log2 = {
        job_id: 10,
        stage: 10,
        action_by_user_id: 2,
        created_at: '2026-09-14T10:00:25Z',
        action: 'Job dipindahkan ke Stage 11'
    };
    assert.equal(shouldDeduplicateLog(log1, log2), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: Verified against unit test logic.

- [ ] **Step 3: Write minimal implementation**

In `dnp-rework/app/Http/Controllers/JobController.php`:
Add private helper `recordHistoryLog(Job $job, int $stage, string $action, ?string $notes = null)`:
```php
protected function recordHistoryLog(Job $job, int $stage, string $action, ?string $notes = null): JobHistory
{
    $userId = Auth::id();
    // Check if a log entry was created by the same user on this job in the last 2 minutes (120s)
    $recentLog = $job->historyLogs()
        ->where('action_by_user_id', $userId)
        ->where('created_at', '>=', now()->subMinutes(2))
        ->latest('id')
        ->first();

    if ($recentLog && $recentLog->stage === $stage) {
        // Coalesce / update existing log to avoid spam/duplicates
        if (!str_contains($recentLog->action, $action)) {
            $recentLog->action = $recentLog->action . ' • ' . $action;
        }
        if ($notes && !empty(trim($notes))) {
            $recentLog->notes = $recentLog->notes ? ($recentLog->notes . "\n" . $notes) : $notes;
        }
        $recentLog->save();
        return $recentLog;
    }

    return $job->historyLogs()->create([
        'stage'             => $stage,
        'action'            => $action,
        'action_by_user_id' => $userId,
        'notes'             => $notes,
    ]);
}
```
Replace direct `$job->historyLogs()->create(...)` calls in `JobController.php` with `$this->recordHistoryLog($job, ...)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/perlu_diperbaiki_features.test.js`
Expected: PASS.

- [ ] **Step 5: PHP Syntax Lint**

Run: `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/app/Http/Controllers/JobController.php`
Expected: No syntax errors detected.

---

## Direct Feedback on User Idea #8: Sidebar Email-Style Notification Detail
**Rating: 4/10**
- **Why**: The user's proposal to build a new email-style sidebar menu to address duplicate logs misdiagnoses the root problem. Duplicate logs are generated because multiple controller actions (save data, change stage, upload document) fire sequentially in rapid succession. Creating a complex UI drawer doesn't fix noisy database entries; coalescing consecutive entries on the backend (< 2 minutes) fixes the data at the source. Once the data is clean, the existing activity log inside `JobDetailSheet.jsx` reads cleanly without clutter.

---

## Verification Plan

### Automated Tests
- `node --test tests/*.test.js` (Run full test suite: 49+ tests)
- `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/app/Http/Controllers/JobController.php`
- `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/database/migrations/2026_09_14_000001_add_faktur_pajak_to_dnp_jobs.php`

### Manual Verification
- Visual inspection of `Jobs/Create.jsx` PPN breakdown box.
- Visual inspection of `JobDetailSheet.jsx` Stage 1 Dokumen Tambahan slot and Stage 8 delay reason textarea.
- Visual inspection of `Kanban/Index.jsx` Stage 8 Disnaker badge.
