# Daily Digest Email Reports (Enterprise Best Practices Edition) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, spam-proof daily email digest system for PT Delta Nusantara Persada sending at most two role-tailored emails per day on workdays (08:00 WIB Morning Kickoff & 16:00 WIB Afternoon Wrap-up), with smart zero-task suppression, table-based Outlook/Gmail compatible email templates, plain-text fallback, SMTP rate-throttling, CLI dry-run capabilities, and a comprehensive Google Workspace setup guide.

**Enterprise Best Practices & Anti-Spam Guardrails:**
1. **Workday-Only Scheduling:** By default, schedule only on Monday–Friday (`->weekdays()`). Sending on weekends when employees are off creates low open rates, which degrades Google Workspace sender reputation.
2. **Bulletproof Table-Based HTML:** Modern CSS (`display: flex`, CSS variables, `@apply`) fails completely on desktop Outlook and some mobile clients. The email template uses standard nested HTML tables with inline styles and explicit hex colors (`#0A385C`, `#00A8E8`).
3. **Multipart MIME (HTML + Plain Text):** Every email includes an alternative `text/plain` view to maximize spam filter deliverability scores.
4. **SMTP Throttling & Batching:** Includes a 250ms micro-pause between dispatches to avoid tripping Google Workspace SMTP concurrent socket limits.
5. **Idempotency Safeguard:** Uses Laravel Cache (`daily_digest_{user_id}_{date}_{edition}`) with a 6-hour TTL to prevent accidental duplicate sends if the scheduler triggers twice.
6. **Smart Zero-Task Suppression:** Users with 0 actionable items are automatically skipped.

---

### Task 1: Create TDD Test Suite for Daily Digest System

**Files:**
- Create: `tests/daily_digest_report.test.js`

**Test Assertions:**
- Asserts `DailyDigestService.php` exists and exposes methods (`getEligibleUsers`, `getUserTasks`, `buildDigestPayload`).
- Asserts role-specific task filtering:
  - Inspector: Only assigned field inspections and Stage 5 draft LHPPs.
  - Tim Ahli: Only Stage 6 technical review queues.
  - Finance: Only Stage 10 (invoice pending), Stage 14 (payment verification), Stage 12 (closing).
  - Marketing: Only Stage 1 proposals, Stage 11 follow-up, Stage 13 actualization, Stage 15 (11c) Kirim Suket.
  - Manager / Superadmin: Executive summary of all pending bottlenecks & overdue SLAs.
- Asserts zero-task suppression (users with 0 tasks are omitted).
- Asserts table-based HTML email template and plain-text fallback template exist.
- Asserts Artisan command supports `--time=morning`, `--time=afternoon`, `--dry-run`, and `--user={id}`.
- Asserts schedule in `routes/console.php` uses `weekdays()`.

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test and observe failure**

---

### Task 2: Build `DailyDigestService.php` & Task Aggregation Logic

**Files:**
- Create: `dnp-rework/app/Services/DailyDigestService.php`

- [x] **Step 1: Implement `DailyDigestService.php`**
  - Extract active, non-completed jobs (`stage < 16`).
  - Calculate SLA status per job.
  - Filter jobs by role / user assignment.
  - Exclude users with 0 pending jobs.
  - Build structured payload: `{ user, edition, tasks, overdueCount, dateFormatted }`.

---

### Task 3: Create Bulletproof Email Templates & Mailable Class

**Files:**
- Create: `dnp-rework/app/Mail/DailyDigestMail.php`
- Create: `dnp-rework/resources/views/emails/daily_digest.blade.php`
- Create: `dnp-rework/resources/views/emails/daily_digest_plain.blade.php`

- [x] **Step 1: Implement `DailyDigestMail.php`**
  - Dynamic subject lines:
    - Morning: `[DNP Monitor] Agenda Pekerjaan Hari Ini - {Date}`
    - Afternoon: `[DNP Monitor] Rekap Pekerjaan Tertunda - {Date}`
  - Attach plain-text alternative.
- [x] **Step 2: Implement `daily_digest.blade.php`**
  - Table-based layout compatible with Outlook, Gmail, Apple Mail.
  - DNP corporate blue palette (`#0A385C`, `#00A8E8`).
  - Job rows: No Job, Client Name, Stage Name, SLA Tag, & Direct Link.
  - Overdue warning banner if overdue items exist.
- [x] **Step 3: Implement `daily_digest_plain.blade.php`**
  - Clean text-only representation.

---

### Task 4: Implement Console Command & Workdays Schedule

**Files:**
- Create: `dnp-rework/app/Console/Commands/SendDailyDigestCommand.php`
- Modify: `dnp-rework/routes/console.php`

- [x] **Step 1: Create `SendDailyDigestCommand.php`**
  - Support `--time=morning` / `--time=afternoon`.
  - Support `--dry-run` (prints ASCII table of recipients and task counts to console).
  - Support `--user={id}` for testing specific users.
  - Add 250ms sleep between sends and idempotency cache lock.
- [x] **Step 2: Register in `routes/console.php`**
  - `Schedule::command('report:daily-digest --time=morning')->weekdays()->dailyAt('08:00');`
  - `Schedule::command('report:daily-digest --time=afternoon')->weekdays()->dailyAt('16:00');`

---

### Task 5: Create Google Workspace Setup Guide

**Files:**
- Create: `EMAIL_SETUP_GUIDE.md`

- [x] **Step 1: Write `EMAIL_SETUP_GUIDE.md`**
  - Step 1: Enable 2-Step Verification on Google Workspace Account.
  - Step 2: Generate 16-character Google App Password.
  - Step 3: Populate `.env` with exact keys (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, etc.).
  - Step 4: Run dry-run CLI test (`php artisan report:daily-digest --dry-run`).
  - Step 5: Test real send to personal email (`php artisan report:daily-digest --user=1`).

---

### Task 6: Full Verification & Build Check

**Files:**
- Test: `tests/*.test.js`
- Build: `npm run build`

- [x] **Step 1: Run complete test suite (all 267+ tests must pass)**
- [x] **Step 2: Run `npm run build` to verify clean build**
- [ ] **Step 3: Commit all changes to Git**
