# Recheck of Recent Work & Rename Stage 10 to "Pembuatan Invoice" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 3 remaining hardcoded document download links in `JobDetailSheet.jsx` that cause browser tabs to display "download", and rename Stage 10 to "Pembuatan Invoice" (short: "Invoice") across constants, UI components, and controller messages.

**Architecture:** 
- Frontend: Inertia React components (`Constants.js`, `JobDetailSheet.jsx`) using `getDocDownloadUrl` for all document anchors and updated stage 10 terminology.
- Backend: Laravel 11 (`JobController.php`) updated stage transition history log string.
- Verification: Node.js TDD test suite (`node:test`) and PHP syntax linting.

**Tech Stack:** Laravel 11, PHP 8.3, Inertia React, Node.js `node:test`.

## Global Constraints
- Stay strictly on branch `main`.
- Follow strict TDD order: test → implement → verify.
- Zero emoticons in UI text.
- No database migrations needed (stage ID 10 is unchanged; only display label is updated).

---

### Task 1: Write TDD Tests for S10 Rename and Document Link Audit

**Files:**
- Create: `tests/s10_rename_and_doc_links_audit.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('S10 Rename & Document Links Audit Test Suite', () => {
    it('1. Constants.js names Stage 10 as "Pembuatan Invoice" and short as "Invoice"', () => {
        const constantsPath = path.resolve('dnp-rework/resources/js/Constants.js');
        const content = fs.readFileSync(constantsPath, 'utf8');
        assert.match(content, /id:\s*10,\s*name:\s*['"]Pembuatan Invoice['"],\s*short:\s*['"]Invoice['"]/);
    });

    it('2. JobDetailSheet.jsx has zero hardcoded /documents/${...}/download links', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const content = fs.readFileSync(sheetPath, 'utf8');
        assert.doesNotMatch(content, /\/documents\/\$\{[^}]+\}\/download/);
    });

    it('3. JobDetailSheet.jsx Stage 10 labels use "Invoice & Faktur"', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const content = fs.readFileSync(sheetPath, 'utf8');
        assert.match(content, /Pembuatan Invoice/);
        assert.match(content, /Simpan Data Invoice & Faktur/);
    });

    it('4. JobController.php logs Stage 10 auto-advance as "Pembuatan Invoice"', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const content = fs.readFileSync(controllerPath, 'utf8');
        assert.match(content, /Stage 10 \(Pembuatan Invoice\)/);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/s10_rename_and_doc_links_audit.test.js`

---

### Task 2: Implement Fixes in Constants.js, JobDetailSheet.jsx, and JobController.php

**Files:**
- Modify: `dnp-rework/resources/js/Constants.js`
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Modify: `dnp-rework/app/Http/Controllers/JobController.php`

- [ ] **Step 1: Update Constants.js line 12**
Change name to `'Pembuatan Invoice'` and short to `'Invoice'`.

- [ ] **Step 2: Update JobDetailSheet.jsx document links**
Replace line 1135, line 2666, and line 2729 with `getDocDownloadUrl(d)`.

- [ ] **Step 3: Update JobDetailSheet.jsx Stage 10 labels**
Update headers and buttons to "Pembuatan Invoice" and "Simpan Data Invoice & Faktur".

- [ ] **Step 4: Update JobController.php**
Update auto-advance log string in `saveStage9Data`.

---

### Task 3: Verification & Full Suite Run

- [ ] **Step 1: Run S10 audit test suite**
Run: `node --test tests/s10_rename_and_doc_links_audit.test.js`

- [ ] **Step 2: Run full repository test suite**
Run: `node --test tests/*.test.js`

- [ ] **Step 3: Check PHP syntax**
Run: `& "D:\wamp64\bin\php\php8.3.28\php.exe" -l dnp-rework/app/Http/Controllers/JobController.php`
