# Smart Inspector Recommendation Engine Bugfix & Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 4 mathematical, querying, and frontend data contract flaws in the Smart Recommendation engine without altering existing business weighting (100-pt scale) or breaking existing UI components.

**Architecture:**
- Backend (`InspectorRecommendationService.php`):
  1. Include Stage 16 (Archived/Vault) alongside Stage 12 in historical experience count queries (`whereIn('dnp_jobs.stage', [12, 16])`).
  2. Implement robust multi-token equipment keyword extraction and K3 specialization domain mapping (e.g. "PUBT" -> Boiler/Bejana Tekan, "PAA/PAPA" -> Crane/Forklift/Lift) to eliminate the naive single-word and punctuation bug.
  3. Enrich the returned payload with `'is_overloaded'` boolean and `'statuses'` array (`['Overload']` or `['Available']`) so frontend consumers receive expected contract fields.
  4. Include `'inspector'` alongside `'inspektur'` and `'manager'` in candidate role queries.
- Frontend (`JobDetailSheet.jsx`):
  Update Stage 3 day chips overload check to evaluate `item.is_overloaded || (item.statuses && item.statuses.includes('Overload')) || (item.bonuses || []).some(b => b.includes('Overload'))`.
- Testing: Comprehensive automated regression test suite using Node.js test runner (`node:test`) verifying payload structure, scoring rules, keyword extraction, and Stage 16 inclusion.

**Tech Stack:** Laravel 11/13, PHP 8.3, React 19, Node.js `node:test`.

## Global Constraints
- Strict TDD order: Plan → Test → Implement → Review → Verify.
- Do NOT change the 100-point weighting distribution (Spesialisasi: 30, Workload: 25, Klien: 15, Pesawat: 15, Availability: 15).
- Do NOT break existing UI layout, styles, or SVG decorations in `SmartRecommendation.jsx` and `JobDetailSheet.jsx`.
- Preserve database transaction safety and ensure zero new migrations needed.

---

### Task 1: Write TDD Regression Tests for Recommendation Service & Frontend Integration

**Files:**
- Create: `tests/smart_recommendation_engine.test.js`

- [x] **Step 1: Write the failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Smart Recommendation Engine Bugfix & Data Integrity Test Suite', () => {
    const servicePath = path.resolve('dnp-rework/app/Services/InspectorRecommendationService.php');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    it('1. InspectorRecommendationService counts both Stage 12 and Stage 16 for klien experience', () => {
        assert.match(
            serviceContent,
            /whereIn\(\s*['"]dnp_jobs\.stage['"]\s*,\s*\[12,\s*16\]\s*\)/,
            'klien experience query must count both Stage 12 (Completed) and Stage 16 (Archived)'
        );
    });

    it('2. InspectorRecommendationService counts both Stage 12 and Stage 16 for pesawat experience', () => {
        const matches = serviceContent.match(/whereIn\(\s*['"]dnp_jobs\.stage['"]\s*,\s*\[12,\s*16\]\s*\)/g);
        assert.ok(
            matches && matches.length >= 2,
            'Both klienExpCounts and pesawatExpCounts must include Stage 16'
        );
    });

    it('3. InspectorRecommendationService supports clean multi-word keyword extraction and K3 acronym mapping', () => {
        // Must NOT use naive explode(' ', trim($targetJob->pesawat))[0] without cleanup
        assert.doesNotMatch(
            serviceContent,
            /\$pesawatKeyword\s*=\s*explode\(\s*['"] ['"]\s*,\s*trim\(\$targetJob->pesawat\)\)\[0\];/,
            'Must not rely on naive single word explode without punctuation cleanup'
        );
        // Must support PUBT or acronym mapping helper
        assert.match(
            serviceContent,
            /PUBT|Boiler|Bejana/i,
            'Must map standard K3 specializations such as PUBT to Boiler/Bejana'
        );
    });

    it('4. InspectorRecommendationService provides statuses and is_overloaded in payload', () => {
        assert.match(
            serviceContent,
            /['"]statuses['"]\s*=>/,
            'Returned inspector item must include statuses array'
        );
        assert.match(
            serviceContent,
            /['"]is_overloaded['"]\s*=>/,
            'Returned inspector item must include is_overloaded boolean'
        );
    });

    it('5. InspectorRecommendationService includes inspector role in candidate query', () => {
        assert.match(
            serviceContent,
            /['"]inspector['"]/,
            'Candidate role query must include English role "inspector"'
        );
    });

    it('6. JobDetailSheet.jsx checks is_overloaded and statuses correctly on day chips', () => {
        assert.match(
            sheetContent,
            /item\.is_overloaded\s*\|\|\s*\(item\.statuses\s*&&\s*item\.statuses\.includes\(['"]Overload['"]\)\)/,
            'JobDetailSheet.jsx must robustly evaluate overload status from service payload'
        );
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/smart_recommendation_engine.test.js`
Expected: FAIL on all assertions.

---

### Task 2: Implement Fixes in `InspectorRecommendationService.php`

**Files:**
- Modify: `dnp-rework/app/Services/InspectorRecommendationService.php`

- [x] **Step 1: Update candidate query to include `'inspector'` role**

In `getRecommendations`:
```php
        $inspectors = User::where('name', 'NOT LIKE', '%Diba Aini%')
            ->where(function ($query) {
                $query->whereIn('role', ['inspektur', 'inspector', 'manager'])
                      ->orWhereHas('inspectorProfile');
            })
            ->with(['inspectorProfile'])
            ->get();
```

- [x] **Step 2: Update experience queries to count Stage 12 and Stage 16**

In `klienExpCounts`:
```php
        $klienExpCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->where('dnp_jobs.klien', $targetJob->klien)
            ->whereIn('dnp_jobs.stage', [12, 16]) // stage 12 = closed, stage 16 = archived
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');
```

- [x] **Step 3: Implement clean keyword extraction & K3 domain mapping for Pesawat Experience & Specialization**

Replace naive `explode(' ', ...)[0]` with:
```php
        // ── Clean Keyword Extraction & K3 Domain Mapping ─────────────────────
        $keywords = $this->extractPesawatKeywords($targetJob->pesawat);

        $pesawatExpQuery = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->whereIn('dnp_jobs.stage', [12, 16]);

        if (!empty($keywords)) {
            $pesawatExpQuery->where(function ($q) use ($keywords) {
                foreach ($keywords as $kw) {
                    $q->orWhere('dnp_jobs.pesawat', 'ILIKE', "%{$kw}%");
                }
            });
        }

        $pesawatExpCounts = $pesawatExpQuery
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');
```

Add helper methods:
```php
    /**
     * Extract meaningful search keywords from a pesawat string.
     */
    protected function extractPesawatKeywords(?string $pesawat): array
    {
        if (empty($pesawat)) return [];

        // Split by punctuation and parenthesis
        $parts = preg_split('/[,()\/\-&]/', $pesawat, -1, PREG_SPLIT_NO_EMPTY);
        $cleanWords = [];
        $stopWords = ['form', 'dan', 'atau', 'unit', 'instalasi', 'pesawat', 'pp', 'ptp', 'papa', 'dll'];

        foreach ($parts as $part) {
            $words = explode(' ', trim($part));
            foreach ($words as $w) {
                $wClean = trim(preg_replace('/[^a-zA-Z0-9]/', '', $w));
                if (strlen($wClean) >= 3 && !in_array(strtolower($wClean), $stopWords) && !is_numeric($wClean)) {
                    $cleanWords[] = $wClean;
                }
            }
        }

        return array_unique($cleanWords);
    }

    /**
     * Check if an inspector specialization matches the target pesawat,
     * including Indonesian K3 acronym mapping (PUBT, PAA, etc).
     */
    protected function matchesSpecialization($profileSpecs, string $targetPesawat): bool
    {
        if (empty($profileSpecs)) return false;

        $specs = is_array($profileSpecs)
            ? $profileSpecs
            : json_decode($profileSpecs, true) ?? [];

        // K3 standard domain mapping
        $k3Mapping = [
            'PUBT'    => ['Boiler', 'Uap', 'Bejana', 'Tekan', 'Tangki', 'PV'],
            'PAA'     => ['Lift', 'Crane', 'Forklift', 'Eskalator', 'Angkat', 'Angkut', 'Gondola'],
            'PAPA'    => ['Lift', 'Crane', 'Forklift', 'Eskalator', 'Angkat', 'Angkut', 'Gondola'],
            'LISTRIK' => ['Listrik', 'Petir', 'Elektris', 'Genset'],
            'DAMKAR'  => ['Kebakaran', 'Hydrant', 'Alarm', 'APAR', 'Proteksi Kebakaran'],
            'PTP'     => ['Compressor', 'Genset', 'Tenaga', 'Produksi', 'Motor'],
        ];

        foreach ((array)$specs as $spec) {
            if (!$spec) continue;
            $specUpper = strtoupper(trim($spec));

            // Direct substring match
            if (stripos($targetPesawat, $spec) !== false || stripos($spec, $targetPesawat) !== false) {
                return true;
            }

            // Acronym domain match
            if (isset($k3Mapping[$specUpper])) {
                foreach ($k3Mapping[$specUpper] as $keyword) {
                    if (stripos($targetPesawat, $keyword) !== false) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
```

- [x] **Step 4: Update returned payload with `'is_overloaded'` and `'statuses'`**

In `getRecommendations`:
```php
            $isOverloaded = ($activeJobs >= self::OVERLOAD_THRESHOLD);

            $results[] = [
                'user'          => $inspector,
                'profile'       => $profile,
                'score'         => $score,
                'details'       => $details,
                'bonuses'       => $bonuses,
                'statuses'      => $isOverloaded ? ['Overload'] : ['Available'],
                'is_overloaded' => $isOverloaded,
                'active_jobs'   => $activeJobs,
                'klien_exp'     => $klienExp,
                'pesawat_exp'   => $pesawatExp,
            ];
```

---

### Task 3: Update `JobDetailSheet.jsx` Day Chips Overload Condition

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:1406-1408`

- [x] **Step 1: Replace brittle `item.statuses` check with robust overload check**

Replace:
```javascript
const isOverloaded = item.statuses
    ? item.statuses.some(st => st === 'Overload')
    : false;
```
With:
```javascript
const isOverloaded = item.is_overloaded || (item.statuses && item.statuses.includes('Overload')) || (item.bonuses || []).some(b => b.includes('Overload'));
```

---

### Task 4: Verification and Regression Testing

- [x] **Step 1: Run new test suite**
Run: `node --test tests/smart_recommendation_engine.test.js`
Expected: PASS (6/6 tests)

- [x] **Step 2: Run full regression test suite**
Run: `node --test tests/*.test.js`
Expected: All 208/208 tests pass without errors.
