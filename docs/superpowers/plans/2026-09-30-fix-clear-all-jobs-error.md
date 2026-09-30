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

- [x] **Step 1: Write the failing test**
...
- [x] **Step 2: Run test to verify it fails**
...
- [x] **Step 3: Commit test file**

---

### Task 2: Implement Minimal Bugfix in `JobController.php`

**Files:**
- Modify: `dnp-rework/app/Http/Controllers/JobController.php:1718-1736`

- [x] **Step 1: Update `clearAll` method in `JobController.php`**
...
- [x] **Step 2: Run test to verify it passes**
...
- [x] **Step 3: Run full test suite to ensure zero regressions**
...
- [x] **Step 4: Commit changes**

```bash
git add dnp-rework/app/Http/Controllers/JobController.php
git commit -m "fix(jobs): remove nonexistent job_alat_uji table and cleanly purge job records and files in clearAll"
```
