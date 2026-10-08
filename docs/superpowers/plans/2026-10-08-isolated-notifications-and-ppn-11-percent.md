# Job-Isolated Notifications & 11% PPN Alignment Implementation Plan

## Problem Analysis & Assessment

### 1. Stage Version Clarification (16 vs 20 Stages)
* **Direct Answer:** The current version on `main` is strictly **16 stages** (15 visible workflow columns + 1 hidden Stage 16 Selesai/Archive).
* **Proof:** `dnp-rework/resources/js/Constants.js` defines `STAGES` with IDs 1..16. `Kanban/Index.jsx` renders exactly these 16 stages with the badge "16 Stages". All 20-stage experimental branches and broken `@domain/workflowEngine` references remain isolated in `v3`.

### 2. Finance Dashboard & Database PPN (12% vs 11%)
* **Finding:** You are correct that `DNP/2026/0013` displays `Rp 5.600.000` because it was stored with 12% PPN on a DPP of `Rp 5.000.000` (`5.000.000 * 1.12 = 5.600.000`).
* **Root Cause:**
  1. `Create.jsx` and `JobDetailSheet.jsx` had mismatched logic: parts calculated with `0.11` while labels and old jobs used `12%` (`5.600.000`).
  2. In `Create.jsx`, the user entered DPP, but the field was saved directly to `nilai` in `JobController.php`, creating confusion between whether `nilai` is DPP or Total.
  3. UI labels across `JobDetailSheet.jsx` and `Create.jsx` still explicitly state `PPN (12%)` and `Sesudah PPN 12%`.
  4. An existing job seeded/stored with 12% will continue displaying `5.600.000` unless recalculated or updated to 11% (`5.550.000`).

### 3. Notification Spam for Unrelated Personnel
* **Finding:** When a job moves to Stage 1, 11, 13, 15 (Marketing stages) or Stage 4, 6 (Inspector stages), or is rejected, `NotificationService::getStageOwnerUserIds()` fetches **ALL** users who have permission on that stage.
* **Impact:** Every marketing user (e.g. Atikah) receives notifications for jobs belonging to other marketing users (e.g. Intang). Every inspector receives notifications for jobs they were never assigned to.
* **Fix Required:**
  1. `NotificationService::getRelatedUserIds()` must enforce:
     - Marketing users only receive notifications if `$job->owner_marketing === $user->name`.
     - Inspector users only receive notifications if assigned in `$job->inspectors` or `$job->report_writer_id`.
  2. `NotificationController::index()` must filter out and purge legacy unrelated notifications so Atikah's 36 unread notifications drop to only her actual jobs.

---

## Proposed Changes

### Component 1: Job-Isolated Notification Routing
* Modify `dnp-rework/app/Services/NotificationService.php`:
  - In `getRelatedUserIds(Job $job, ?int $targetStage)`: When querying stage owners, filter out marketing users whose name does not match `$job->owner_marketing`, and filter out inspectors not in `$job->inspectors` or `$job->report_writer_id`.
  - In `JobController.php` (line 658): Replace direct `getStageOwnerUserIds` with `getRelatedUserIds`.
* Modify `dnp-rework/app/Http/Controllers/NotificationController.php`:
  - Purge or hide existing unrelated job notifications for the authenticated user so their notification hub immediately reflects only their actual assignments.
* Modify `dnp-rework/app/Services/DailyDigestService.php`:
  - Align marketing digest to only include jobs where `owner_marketing` matches the user.

### Component 2: 11% PPN Standardization & Database Recalculation
* Update `dnp-rework/resources/js/Pages/Jobs/Create.jsx`:
  - Change all UI labels from `PPN (12%)` to `PPN (11%)`.
  - Standardize calculation formula to `Math.round(dpp * 0.11)`.
* Update `dnp-rework/resources/js/Components/JobDetailSheet.jsx`:
  - Change all labels from `12%` to `11%`.
  - Ensure breakdown uses `total / 1.11` and `total - dpp` consistently.
* Create Database Migration / Artisan Command to fix existing 12% jobs:
  - Provide an option to recalculate jobs where `nilai` was computed as `dpp * 1.12` to `dpp * 1.11` (e.g. converting `5.600.000` back to `5.550.000`).

---

## TDD Verification Plan

### Test 1: Notification Isolation Test (`tests/notification_isolation.test.js`)
* Verify `NotificationService::getRelatedUserIds`:
  - Marketing user A receives notification when Job owned by A moves to Stage 1/11.
  - Marketing user B does NOT receive notification for Job owned by A.
  - Inspector A receives notification when assigned to Job.
  - Inspector B does NOT receive notification if not assigned to Job.

### Test 2: PPN 11% Mathematical & UI Consistency Test (`tests/ppn_11_percent_consistency.test.js`)
* Verify that no files contain `12%` labels for PPN in `Create.jsx` and `JobDetailSheet.jsx`.
* Verify that all DPP and PPN calculations strictly use factor `0.11` / `1.11`.
* Verify that test fixture `5.000.000` DPP yields `550.000` PPN and `5.550.000` total.

---

## Execution Phases
1. **Phase 1 (Tests First):** Write `tests/notification_isolation.test.js` and `tests/ppn_11_percent_consistency.test.js`. Confirm failure on current codebase.
2. **Phase 2 (Implementation):**
   - Update `NotificationService.php` and `NotificationController.php`.
   - Update `DailyDigestService.php`.
   - Update `Create.jsx` and `JobDetailSheet.jsx` to 11% PPN.
   - Add database adjustment artisan command/migration for existing 12% jobs.
3. **Phase 3 (Review & Verification):** Run tests, build frontend assets, verify clean build.
4. **Phase 4 (Deployment):** Commit and push to `main` with deployment verification.
