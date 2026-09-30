# Logout Confirmation, Login History Guard & PPN 11% Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Implement a SweetAlert2 confirmation dialog before logging out in `AppLayout.jsx`.
2. Prevent the browser back button from returning to `/login` after authentication by replacing history on login and enforcing an active-session redirect in `Login.jsx`.
3. In `Create.jsx` (and `JobDetailSheet.jsx`), keep the UI label displaying "PPN (12%)" but change the mathematical calculation to add 11% (`* 1.11` and `* 0.11`, `total / 1.11`).

**Architecture:**
- Frontend Layout (`AppLayout.jsx`): Replace direct `<Link method="post">` logout buttons (both desktop top bar and mobile drawer) with an explicit `handleLogout` function that triggers `showConfirm` from `@/swal` before calling `router.post(route('logout'))`.
- Frontend Auth (`Login.jsx`): 
  1. Add `{ replace: true }` to Inertia's `post(route('login'))` so `/login` is replaced by the dashboard in the browser history stack upon successful authentication.
  2. Add an auth check hook (`useEffect`) that detects if `auth?.user` is already populated and immediately replaces the location to `/` if a user navigates back to `/login`.
- Frontend Pricing (`Create.jsx` & `JobDetailSheet.jsx`): 
  1. In `Create.jsx`: calculate PPN as `Math.round(dpp * 0.11)` and total as `Math.round(dpp * 1.11)`, and transform `nilai` on submit with `1.11`, while strictly keeping the UI label text as "PPN (12%)".
  2. In `JobDetailSheet.jsx`: reverse-calculate DPP as `Math.round(total / 1.11)` while keeping the label as "PPN (12%)".
- Testing: Automated AST & regression test suite using Node.js test runner (`node:test`) verifying confirmation dialog integration, history replace behavior, and PPN 11% calculation logic.

**Tech Stack:** React 19, Inertia.js (`router`, `usePage`, `useForm`), SweetAlert2 (`@/swal`), Node.js (`node:test`).

## Global Constraints
- Strict TDD order: Plan → Test → Implement → Review → Verify.
- Do NOT alter authentication backend logic or session lifecycles.
- Keep the UI label as "PPN (12%)" exactly as instructed by the user, while changing the formula multiplier to 11% (0.11 / 1.11).
- Maintain existing visual design, SVG ulir/thread decorations, and styling.
- Zero external package installations needed (SweetAlert2 and Inertia are already installed).

---

### Task 1: Write TDD Regression Tests for Logout Confirmation, Login History Guard & PPN 11% Calculation

**Files:**
- Create: `tests/logout_confirm_and_login_history.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Logout Confirmation, Login History Guard & PPN 11% Test Suite', () => {
    const layoutPath = path.resolve('dnp-rework/resources/js/Layouts/AppLayout.jsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    const loginPath = path.resolve('dnp-rework/resources/js/Pages/Auth/Login.jsx');
    const loginContent = fs.readFileSync(loginPath, 'utf8');

    const createPath = path.resolve('dnp-rework/resources/js/Pages/Jobs/Create.jsx');
    const createContent = fs.readFileSync(createPath, 'utf8');

    const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    it('1. AppLayout.jsx does NOT contain direct unconfirmed Link method="post" for logout', () => {
        assert.doesNotMatch(
            layoutContent,
            /<Link[^>]*href=\{route\(['"]logout['"]\)\}[^>]*method=["']post["']/i,
            'AppLayout must not have unconfirmed raw Link method="post" logout buttons'
        );
    });

    it('2. AppLayout.jsx imports showConfirm and defines handleLogout confirmation handler', () => {
        assert.match(
            layoutContent,
            /showConfirm/,
            'AppLayout must import showConfirm from swal'
        );
        assert.match(
            layoutContent,
            /handleLogout/,
            'AppLayout must declare a handleLogout function'
        );
        assert.match(
            layoutContent,
            /router\.post\(\s*route\(['"]logout['"]\)/,
            'handleLogout must execute router.post for logout on confirmation'
        );
    });

    it('3. AppLayout.jsx desktop and mobile logout buttons trigger handleLogout', () => {
        const matches = layoutContent.match(/onClick=\{\s*handleLogout\s*\}/g);
        assert.ok(
            matches && matches.length >= 2,
            'Both desktop header and mobile drawer must trigger handleLogout onClick'
        );
    });

    it('4. Login.jsx uses replace: true on login post submission', () => {
        assert.match(
            loginContent,
            /post\(\s*route\(['"]login['"]\),\s*\{[^}]*replace:\s*true/s,
            'Login.jsx must specify replace: true to prevent back-button navigation to login'
        );
    });

    it('5. Login.jsx redirects already authenticated users to dashboard', () => {
        assert.match(
            loginContent,
            /auth\?\.user/,
            'Login.jsx must check if user is already authenticated'
        );
        assert.match(
            loginContent,
            /router\.replace\(['"]\/['"]\)|router\.replace\(route\(['"]dashboard['"]\)\)/,
            'Login.jsx must replace route to dashboard if already authenticated'
        );
    });

    it('6. Create.jsx calculates PPN with 11% multiplier while displaying PPN (12%) label', () => {
        // Calculation must use 0.11 and 1.11
        assert.match(
            createContent,
            /dpp\s*\*\s*0\.11/,
            'Create.jsx must calculate PPN as dpp * 0.11'
        );
        assert.match(
            createContent,
            /dpp\s*\*\s*1\.11/,
            'Create.jsx must calculate total as dpp * 1.11'
        );
        assert.match(
            createContent,
            /\*\s*1\.11/,
            'Create.jsx submit transform must multiply by 1.11'
        );
        // Label must still say PPN (12%)
        assert.match(
            createContent,
            /PPN\s*\(\s*12%\s*\)/,
            'Create.jsx must retain the label PPN (12%)'
        );
    });

    it('7. JobDetailSheet.jsx reverse-calculates DPP using 1.11 while keeping PPN 12% label', () => {
        assert.match(
            sheetContent,
            /total\s*\/\s*1\.11/,
            'JobDetailSheet.jsx must divide total by 1.11 for DPP'
        );
        assert.match(
            sheetContent,
            /PPN\s*\(?12%?\)?/,
            'JobDetailSheet.jsx must retain the label PPN 12%'
        );
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/logout_confirm_and_login_history.test.js`
Expected: FAIL on the assertions.

---

### Task 2: Implement Logout Confirmation in `AppLayout.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Layouts/AppLayout.jsx`

- [x] **Step 1: Import `showConfirm` and `router` in `AppLayout.jsx`**
- [x] **Step 2: Create `handleLogout` function in `AppLayout`**
- [x] **Step 3: Update Desktop header logout button to call `handleLogout`**
- [x] **Step 4: Update Mobile drawer logout button to call `handleLogout`**

---

### Task 3: Implement History Replace and Auth Guard in `Login.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Auth/Login.jsx`

- [x] **Step 1: Import `useEffect`, `router`, and `usePage` in `Login.jsx`**
- [x] **Step 2: Add authenticated session redirect guard**
- [x] **Step 3: Add `replace: true` to login post submission**

---

### Task 4: Implement PPN 11% Calculation with "PPN (12%)" Label in `Create.jsx` & `JobDetailSheet.jsx`

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Jobs/Create.jsx`
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx`
- Modify: `tests/main_business_rules.test.js` (update test assertions to allow 1.11 calculation)
- Modify: `tests/review_half_fixes.test.js` (update test assertions to allow 1.11 calculation)

- [x] **Step 1: Update `Create.jsx` to calculate with 0.11 / 1.11 while keeping "PPN (12%)" label**
- [x] **Step 2: Update `JobDetailSheet.jsx` to divide by 1.11 while keeping "PPN (12%)" label**
- [x] **Step 3: Update existing test suites that check 1.12 to accommodate 1.11**

---

### Task 5: Verification and Regression Testing

- [x] **Step 1: Run new test suite**
Run: `node --test tests/logout_confirm_and_login_history.test.js`
Expected: PASS (7/7 tests)

- [x] **Step 2: Run full regression test suite**
Run: `node --test tests/*.test.js`
Expected: All tests pass without errors.
