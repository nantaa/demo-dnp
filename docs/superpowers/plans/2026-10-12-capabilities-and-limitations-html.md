# DNP Monitor System Capabilities & Scope Boundaries (HTML Matrix) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, beautifully styled, interactive HTML document (`PROJECT_CAPABILITIES_AND_BOUNDARIES.html`) that comprehensively details what DNP Monitor CAN do (supported features) and CANNOT do (explicit scope boundaries, including why the v3 20-stage experimental branch is excluded), backed by automated specification tests.

**Architecture:** A modern single-file HTML5 document with curated design (responsive glassmorphic UI, status tags, interactive category filtering, and search) paired with a Node.js verification test suite that asserts all factual claims against codebase constants.

**Tech Stack:** HTML5, CSS (Tailwind typography & responsive utility styling), Vanilla JS for interactive filtering, Node.js Test Runner.

## Global Constraints

- File Location: `public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html` and root `PROJECT_CAPABILITIES_AND_BOUNDARIES.html`.
- Strict Honesty: Must explicitly document system limits (no sugarcoating), explain the v3 branch isolation, manual bank verification limits, Disnaker API non-integration, and WebSocket vs polling reality.
- TDD Order: Write failing test in `tests/capabilities_matrix.test.js` before writing the HTML document.
- Zero External Runtime Dependencies: The HTML file must be completely self-contained and openable in any browser offline.

---

### Task 1: Write TDD Specification Test (tests/capabilities_matrix.test.js)

**Files:**
- Create: `tests/capabilities_matrix.test.js`

**Interfaces:**
- Consumes: `PROJECT_CAPABILITIES_AND_BOUNDARIES.html`
- Produces: Test assertions for file existence, capability categories, explicit limitations (v3 branch, Disnaker API, banking API), and interactive search markup.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/capabilities_matrix.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Project Capabilities & Boundaries HTML Specification', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html');

  test('HTML file exists in public directory', () => {
    assert.ok(fs.existsSync(htmlPath), 'PROJECT_CAPABILITIES_AND_BOUNDARIES.html must exist');
  });

  test('HTML documents all 16 supported stages and core capabilities', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('16-Stage'), 'Must document 16-stage architecture');
    assert.ok(content.includes('Tim RU'), 'Must document Tim RU role parity');
    assert.ok(content.includes('PPN 11%'), 'Must document PPN 11% calculation');
    assert.ok(content.includes('Daily Digest'), 'Must document Daily Digest email');
    assert.ok(content.includes('Document Preview Modal'), 'Must document preview popup modal');
  });

  test('HTML explicitly documents system limitations and what is NOT included', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('v3') || content.includes('Version 3'), 'Must explain v3 exclusion');
    assert.ok(content.includes('Disnaker') && (content.includes('API') || content.includes('External')), 'Must document lack of government API integration');
    assert.ok(content.includes('Bank') || content.includes('Payment Gateway'), 'Must document manual bank reconciliation limitation');
    assert.ok(content.includes('WebSocket') || content.includes('Polling'), 'Must document polling architecture vs WebSocket');
  });

  test('HTML contains interactive search and category filtering elements', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('filterCapability'), 'Must contain filter script function');
    assert.ok(content.includes('searchInput'), 'Must contain search input element');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/capabilities_matrix.test.js`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement the HTML document**

Write `public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html` and copy to root with rich styling, categorized tables, and vanilla JS search.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/capabilities_matrix.test.js`
Expected: PASS.

- [ ] **Step 5: Review and verify against full test suite**

Run: `node --test tests/*.test.js`
Expected: PASS (all 336+ tests passing).

---

### Task 2: Build the Comprehensive HTML Document

**Files:**
- Create: `public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html`
- Create: `PROJECT_CAPABILITIES_AND_BOUNDARIES.html`

**Sections to Include:**
1. **Header & Executive Summary:** System profile, architecture baseline (Laravel 10 + Inertia.js + React 18), active version (v16 DNP).
2. **Part 1: What DNP Monitor CAN Do (Current Capabilities):**
   - 16-Stage sequential workflow engine with evidence gating.
   - Multi-role permission matrix & security boundaries (Marketing, Admin, Tim RU, Tim Ahli, Manager, Finance, Superadmin).
   - Document management & topmost scrollable preview popup (`createPortal` to body, `z-[9999]`).
   - Tim RU confidential role masking (strictly isolated from commercial prices, PO rates, and invoices).
   - Single unified invoice upload slot in Stage 10 (`Invoice, Kwitansi & Faktur Pajak`).
   - Automated Daily Digest email reporting system (`DailyDigestService.php`).
   - Smart Inspector Recommendation Engine with adjustable overload thresholds.
   - Financial audit controls (PPN 11%, Stage 14 payment clearance gate before Stage 15 delivery).
   - Defensive background polling with `data-dnp-busy` anti-collision watchdog.
3. **Part 2: What DNP Monitor CANNOT Do (Out-of-Scope & Known Boundaries):**
   - **Experimental v3 Pipeline Excluded:** Why the 20-stage branch is locked out (circular imports, over-fragmentation of inspector field work).
   - **No Government Ministry (Disnaker/Kemnaker) API:** All Disnaker tracking is manual receipt logging; government portals do not provide public web APIs.
   - **No Automated Bank Reconciliation / Payment Gateway:** Proof of payment is handled via manual file upload (`Bukti Transfer`), not automatic mutation scraping or BCA/Mandiri API.
   - **No Real-Time WebSockets:** Uses defensive 8-second polling instead of socket server (Pusher/Soketi) to keep server resource footprints minimal.
   - **No Multi-Tenant SaaS Isolation:** Application is designed for single-company enterprise deployment; not a multi-tenant SaaS with subdomain routing.
   - **No Native Mobile App:** Responsive web UI optimized for tablet/mobile browsers; no native Android/iOS APK.
4. **Interactive Controls:**
   - Real-time search filter.
   - Category filter pills ("All", "Can Do (Supported)", "Can't Do (Limitations)", "Architecture Facts").
   - Print / Save as PDF button.
