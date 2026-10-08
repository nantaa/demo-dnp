# Version Refactor & Package Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the build pipeline for Vite 8 without unnecessary PostCSS configuration, update package versions cleanly to avoid deprecation warnings, and align dependencies across the project.

**Architecture:** Vite 8.1.0 (Rolldown) with `@vitejs/plugin-react` and `laravel-vite-plugin`. Zero standalone `postcss.config.js` files. Direct Tailwind integration through `tailwind.config.js` and standard CSS. Inertia.js 1.2.x + React 18.3.1.

**Tech Stack:** Laravel 11, Vite 8.1.0, React 18.3.1, `@inertiajs/react` 1.2.0, Tailwind CSS 3.4.0, Node.js `node:test` runner.

---

## Global Constraints
- Do NOT add or require standalone `postcss.config.js`. Remove any `postcss.config.js` files.
- Maintain Vite 8.1.0 in `package.json`.
- Adhere strictly to TDD order: Test (Failing) -> Implement -> Verify (Passing) -> Commit.
- Do not introduce breaking API changes in Inertia or React page components.

---

### Task 1: Remove `postcss.config.js` & Clean Up `deploy.sh` and Test Suite

**Files:**
- Delete: `dnp-rework/postcss.config.js`
- Modify: `dnp-rework/package.json`
- Modify: `deploy.sh`
- Modify: `tests/rework_standalone_build.test.js`

**Interfaces:**
- Consumes: `dnp-rework/vite.config.js`, `dnp-rework/tailwind.config.js`
- Produces: Clean pipeline that runs Vite 8 build without PostCSS config files.

- [ ] **Step 1: Write test reflecting PostCSS removal and Vite 8 package updates**

Update `tests/rework_standalone_build.test.js`:
```javascript
it('7. dnp-rework has clean build setup without standalone postcss.config.js', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'dnp-rework/tailwind.config.js')), 'tailwind.config.js must exist');
    assert.ok(!fs.existsSync(path.join(rootDir, 'dnp-rework/postcss.config.js')), 'postcss.config.js must NOT exist');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: FAIL because `dnp-rework/postcss.config.js` still exists.

- [ ] **Step 3: Delete `dnp-rework/postcss.config.js` and update `deploy.sh`**

Remove `dnp-rework/postcss.config.js` and remove its copy line from `deploy.sh`.
Update `dnp-rework/package.json` devDependencies to remove `postcss` and `autoprefixer` if not needed by user, or keep minimal Tailwind.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add deploy.sh dnp-rework/package.json tests/rework_standalone_build.test.js
git rm dnp-rework/postcss.config.js
git commit -m "refactor(build): remove postcss config and keep Vite 8 pipeline minimal"
```

---

### Task 2: Package Version Audit & Alignment

**Files:**
- Modify: `dnp-rework/package.json`
- Modify: `package.json` (root)
- Test: `tests/rework_standalone_build.test.js`

**Interfaces:**
- Consumes: `package.json`
- Produces: Aligned, stable versions across root and rework directories.

- [ ] **Step 1: Write test verifying package version consistency**

```javascript
it('8. Package dependencies are clean, aligned, and have no conflicting versions', () => {
    const reworkPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'dnp-rework/package.json'), 'utf8'));
    assert.equal(reworkPkg.devDependencies.vite, '^8.1.0', 'Vite must be ^8.1.0 in dnp-rework');
    assert.ok(reworkPkg.dependencies['@inertiajs/react'], 'Inertia must be present');
});
```

- [ ] **Step 2: Run test to verify**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: PASS.

- [ ] **Step 3: Update `package.json` in root and `dnp-rework`**

Update `axios` to `^1.7.9`, `lucide-react` to `^0.469.0`, `@vitejs/plugin-react` to `^4.3.4`, and `vite` to `^8.1.0`.

- [ ] **Step 4: Run test to verify all tests pass**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json dnp-rework/package.json tests/rework_standalone_build.test.js
git commit -m "chore(deps): update package versions to modern stable releases"
```

---

### Task 3: Regression Testing & Local Build Verification

**Files:**
- Execute test runner across all test suites.

- [ ] **Step 1: Run full regression test suite**
```bash
node --test tests/rework_standalone_build.test.js tests/stage_3_name.test.js tests/topmost_document_preview_modal.test.js tests/notification_isolation.test.js tests/ppn_11_percent_consistency.test.js
```
Expected: PASS (all tests green).

- [ ] **Step 2: Push changes to GitHub repository**
```bash
git push origin main
```
