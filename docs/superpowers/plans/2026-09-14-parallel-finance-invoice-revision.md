# Parallel Finance Invoice Revision Without Blocking Job Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Finance and Superadmin to perform invoice revisions (including uploading replacement Invoice and Faktur Pajak PDFs) in parallel at any stage without holding, rolling back, or blocking the job's active stage progress.

**Architecture:** 
- Frontend: Inertia React (`JobDetailSheet.jsx`) with multi-part form support in the revision modal, accessible for any job with invoice data across Stage 10, 11, 14, and 12.
- Backend: Laravel 11 (`JobController.php`) handling `invoice_file` and `faktur_file` uploads in `reviseInvoice`, creating `JobDocument` records, logging audit history, and leaving `$job->stage` unchanged.
- Verification: Node.js TDD test suite (`node:test`) and PHP syntax linting.

**Tech Stack:** Laravel 11, PHP 8.3, Inertia React, Node.js `node:test`.

## Global Constraints
- Stay strictly on branch `main`.
- Follow strict TDD order: test → implement → verify.
- Zero emoticons in UI text.
- Never alter or roll back `$job->stage` during an invoice revision.

---

### Task 1: Write TDD Tests for Parallel Invoice Revision

**Files:**
- Create: `tests/parallel_invoice_revision.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Parallel Invoice Revision Test Suite', () => {
    it('1. JobController.php reviseInvoice accepts invoice_file and faktur_file uploads', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const content = fs.readFileSync(controllerPath, 'utf8');
        assert.match(content, /'invoice_file'\s*=>\s*'nullable\|file/);
        assert.match(content, /'faktur_file'\s*=>\s*'nullable\|file/);
    });

    it('2. JobController.php reviseInvoice does NOT touch $job->stage', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const content = fs.readFileSync(controllerPath, 'utf8');
        const methodMatch = content.match(/public function reviseInvoice[\s\S]*?return back/);
        assert.ok(methodMatch);
        assert.doesNotMatch(methodMatch[0], /\$job->update\(\[[^\]]*['"]stage['"]/);
    });

    it('3. JobDetailSheet.jsx revision modal supports file uploads and FormData submission', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const content = fs.readFileSync(sheetPath, 'utf8');
        assert.match(content, /id="revise-invoice-file"/);
        assert.match(content, /id="revise-faktur-file"/);
    });

    it('4. JobDetailSheet.jsx allows Revisi Invoice button access whenever invoice exists or stage >= 10', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const content = fs.readFileSync(sheetPath, 'utf8');
        assert.match(content, /canEditNilai\s*&&\s*\(\s*job\.stage\s*>=\s*10\s*\|\|\s*job\.invoice_no\s*\)/);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/parallel_invoice_revision.test.js`

---

### Task 2: Implement File Uploads & Non-Blocking Parallel Flow

**Files:**
- Modify: `dnp-rework/app/Http/Controllers/JobController.php`
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`

- [ ] **Step 1: Enhance `reviseInvoice` in `JobController.php`**
Accept `invoice_file` and `faktur_file`, store them into `JobDocument`, log the parallel revision, and return without changing stage.

- [ ] **Step 2: Enhance `JobDetailSheet.jsx` modal**
Add file inputs for revised invoice and faktur pajak, and ensure `Revisi Invoice` button is shown if `canEditNilai && (job.stage >= 10 || job.invoice_no)`.

---

### Task 3: Verification & Full Suite Run

- [ ] **Step 1: Run parallel invoice revision test suite**
Run: `node --test tests/parallel_invoice_revision.test.js`

- [ ] **Step 2: Run full repository test suite**
Run: `node --test tests/*.test.js`

- [ ] **Step 3: Check PHP syntax**
Run: `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/app/Http/Controllers/JobController.php`
