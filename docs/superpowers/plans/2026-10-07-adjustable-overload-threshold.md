# Adjustable Inspector Overload Threshold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the inspector overload threshold dynamic and configurable (defaulting to 20 concurrent jobs instead of the hardcoded 4), adjust workload score scaling proportionally, and support runtime/environment overrides.

**Architecture:** 
- In `InspectorRecommendationService.php`, replace hardcoded `OVERLOAD_THRESHOLD = 4` with `DEFAULT_OVERLOAD_THRESHOLD = 20` and fallback constant `OVERLOAD_THRESHOLD = 20`.
- Support threshold resolution in priority order: explicitly passed `$customThreshold` -> `env('INSPECTOR_OVERLOAD_THRESHOLD')` -> `DEFAULT_OVERLOAD_THRESHOLD` (20).
- Scale the 25-point Workload score dynamically (`round(25 * max(0, 1 - ($activeJobs / $threshold)))`) so inspectors with 5–19 jobs maintain a realistic workload score gradient rather than immediately zeroing out at 5 jobs.
- Update `InspectorRecommendationController.php` to accept optional `?threshold=` query parameter from API consumers.
- Maintain full frontend compatibility with `JobDetailSheet.jsx` and `SmartRecommendation.jsx`.

**Tech Stack:** PHP 8.2 (Laravel), React / Inertia.js, Node.js (`node:test` assertion test runner).

---

## Global Constraints
- Do not break existing recommendation features (specialization, domisili, SKP validity, client/pesawat experience).
- Keep `OVERLOAD_THRESHOLD` constant available for backwards-compatibility.
- Follow strict TDD: write and run failing tests first before implementing code changes.
- Ensure all 225 existing regression tests remain 100% green.

---

### Task 1: Create Failing Unit & Regression Tests for Adjustable Overload Threshold

**Files:**
- Create: `tests/adjustable_overload_threshold.test.js`
- Test: `tests/adjustable_overload_threshold.test.js`

**Interfaces:**
- Consumes: `dnp-rework/app/Services/InspectorRecommendationService.php`, `dnp-rework/app/Http/Controllers/Api/InspectorRecommendationController.php`, `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Produces: Test assertions validating dynamic threshold resolution (default 20, env override, parameter override), proportional workload scaling, and controller query support.

- [ ] **Step 1: Write the failing tests**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const servicePath = path.resolve('dnp-rework/app/Services/InspectorRecommendationService.php');
const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/Api/InspectorRecommendationController.php');

describe('Adjustable Overload Threshold Test Suite', () => {
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    it('1. InspectorRecommendationService defines default threshold as 20', () => {
        assert.match(
            serviceContent,
            /(DEFAULT_OVERLOAD_THRESHOLD\s*=\s*20|OVERLOAD_THRESHOLD\s*=\s*20)/,
            'Must define overload threshold constant as 20'
        );
    });

    it('2. InspectorRecommendationService resolves threshold from parameter, env, or default', () => {
        assert.match(
            serviceContent,
            /env\(\s*['"]INSPECTOR_OVERLOAD_THRESHOLD['"]/,
            'Service must support INSPECTOR_OVERLOAD_THRESHOLD env variable'
        );
        assert.match(
            serviceContent,
            /function\s+getRecommendations\s*\([^)]*\$customThreshold/i,
            'getRecommendations method must accept an optional custom threshold'
        );
    });

    it('3. Workload score scales dynamically with the threshold', () => {
        // Must NOT hardcode static minus 5 per active job ($activeJobs * 5)
        assert.doesNotMatch(
            serviceContent,
            /\$workloadScore\s*=\s*max\(0,\s*25\s*-\s*\(\$activeJobs\s*\*\s*5\)\);/,
            'Workload score must not hardcode static 5 points per job cliff'
        );
    });

    it('4. Controller accepts threshold query parameter', () => {
        assert.match(
            controllerContent,
            /\$request->query\(\s*['"]threshold['"]\)/,
            'Controller must accept optional threshold query parameter'
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/adjustable_overload_threshold.test.js`
Expected: FAIL (constants are still 4, method does not have `$customThreshold`, workload formula is still static `$activeJobs * 5`, controller does not accept query parameter).

---

### Task 2: Implement Dynamic Threshold & Scaled Workload in `InspectorRecommendationService.php`

**Files:**
- Modify: `dnp-rework/app/Services/InspectorRecommendationService.php`

**Interfaces:**
- Produces: `getRecommendations(Job $targetJob, ?int $customThreshold = null)` with dynamic `$overloadThreshold` and scaled `$workloadScore`.

- [ ] **Step 1: Update constants and method signature**
  - Change `const OVERLOAD_THRESHOLD = 20;` and add `const DEFAULT_OVERLOAD_THRESHOLD = 20;`.
  - Update signature: `public function getRecommendations(Job $targetJob, ?int $customThreshold = null)`.

- [ ] **Step 2: Implement threshold resolution and proportional workload scoring**
  - Resolve threshold:
    ```php
    $overloadThreshold = $customThreshold ?: (int) env('INSPECTOR_OVERLOAD_THRESHOLD', self::DEFAULT_OVERLOAD_THRESHOLD);
    if ($overloadThreshold <= 0) {
        $overloadThreshold = self::DEFAULT_OVERLOAD_THRESHOLD;
    }
    ```
  - Proportional workload scoring:
    ```php
    // 2. Workload (25) — proportional score based on active jobs vs threshold
    $workloadRatio = max(0.0, 1.0 - ($activeJobs / $overloadThreshold));
    $workloadScore = (int) round(25 * $workloadRatio);
    $score += $workloadScore;
    $details['Workload'] = "{$workloadScore}/25";
    ```
  - Availability scoring & overload penalty using `$overloadThreshold`:
    ```php
    $availScore = ($activeJobs >= $overloadThreshold) ? 0 : 15;
    $score += $availScore;
    $details['Availability'] = "{$availScore}/15";
    ...
    $isOverloaded = ($activeJobs >= $overloadThreshold);
    if ($isOverloaded) {
        $score -= 10;
        $bonuses[] = "-10 Overload ({$activeJobs} job aktif)";
    }
    ```

---

### Task 3: Update `InspectorRecommendationController.php` to Pass Query Parameter

**Files:**
- Modify: `dnp-rework/app/Http/Controllers/Api/InspectorRecommendationController.php`

- [ ] **Step 1: Update controller action to read optional threshold query parameter**
  ```php
  public function getForJob(Request $request, Job $job)
  {
      $threshold = $request->query('threshold');
      $data = $this->recommendationService->getRecommendations(
          $job,
          $threshold ? (int)$threshold : null
      );
      return response()->json($data);
  }
  ```

---

### Task 4: Run Verification & Full Regression Testing

**Files:**
- Test: `tests/adjustable_overload_threshold.test.js`
- Test: `tests/smart_recommendation_engine.test.js`
- Test: all test suites via `node --test tests/*.test.js`

- [ ] **Step 1: Run the new test suite**
  Run: `node --test tests/adjustable_overload_threshold.test.js`
  Expected: PASS.

- [ ] **Step 2: Run full regression suite**
  Run: `node --test tests/*.test.js`
  Expected: All 226+ tests across 26 suites PASS without regression.

- [ ] **Step 3: Verify frontend display**
  Confirm that inspectors with fewer than 20 concurrent jobs (such as Adi Octa Pradana with < 20 active jobs) will no longer trigger the red `!` overload badge in `JobDetailSheet.jsx` and will be marked `✓ AVAILABLE` in `SmartRecommendation.jsx`.

---
