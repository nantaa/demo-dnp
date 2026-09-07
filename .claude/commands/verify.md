# /verify — Verification & Quality Assurance Command

## Purpose
Execute systematic end-to-end verification, automated test suites, manual verification steps, and evidence collection to prove requirements have been successfully satisfied before declaring completion.

## Phase
**Verify** (Step 5 of the workflow: Plan → Test → Implement → Review → Verify → Remember → Improve)

## When to Use
- When all tasks in an implementation phase are believed to be complete.
- Before claiming success or notifying the user that a milestone is finished.
- Prior to branch finalization or release deployment.

## Workflow & Guidelines
1. **Automated Test Execution**:
   - Run full test suite: `php artisan test` (Pest / PHPUnit) and `npm run test` (if frontend test runner is configured).
   - Ensure 100% test pass rate with zero unexpected failures or skipped assertions.
2. **Build & Lint Verification**:
   - Run frontend asset compilation: `npm run build` or `vite build`. Verify zero errors or critical warnings.
   - Run linter/code style checks: `npm run lint` or `php artisan pint`.
3. **Database Integrity Verification**:
   - Verify migrations run cleanly from scratch: `php artisan migrate:fresh --seed` (in safe test environment).
   - Verify rollbacks execute without errors: `php artisan migrate:rollback`.
4. **Manual & Visual Walkthrough**:
   - Walk through critical user flows in the browser/API (e.g. Stage 1 Job creation → Stage 2 masking → Stage 4 RU → Stage 5 LHPP tracking → Stage 11c Payment verification → Stage 11b SUKET delivery).
   - Record screenshots, CLI outputs, or logs as evidence in `walkthrough.md`.
5. **Success Criteria Gate**:
   - Strictly follow evidence-before-assertions: Never state a task is fixed or complete without showing the terminal output or test results proving it.
