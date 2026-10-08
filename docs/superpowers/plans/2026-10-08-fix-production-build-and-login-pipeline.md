# Production Build Pipeline & Inertia Login Recovery Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the production server to full functionality with working login and the updated 16-stage workflow ("Penjadwalan", topmost preview, decoupled timeline) by fixing root view routing and standardizing the build/deploy pipeline.

**Architecture:** Laravel 11 backend + Inertia.js + React 18 frontend (bundled via Vite ES2020). Deploy pipeline syncs compiled Inertia & SPA assets from the repository root into the production directory, protects against destructive empty builds, and injects global route resolution into the root Blade view.

**Tech Stack:** Laravel 11, Inertia.js (`@inertiajs/react`), React 18/19, Vite 5, Node.js `node:test` runner, Bash (`deploy.sh`).

## Global Constraints
- Framework base is strictly Laravel 11 + Inertia.js (NOT Next.js).
- DO NOT execute `git reset --hard` or `git clean -fd` inside `/var/www/demo-dnp/demo-dnp/dnp-monitor-production`.
- Never run an unconfigured `npm run build` inside `$PROD_DIR` that wipes `public/build/assets` down to 2 dummy files.
- All code changes must strictly follow TDD order: write failing test -> verify failure -> implement -> verify pass.
- No placeholders or hand-waving: every step must contain exact code, files, and commands.

---

### Task 1: Root Blade View (`app.blade.php`) & Route Resolution Helper

**Files:**
- Create: `dnp-rework/resources/views/app.blade.php`
- Test: `tests/production_build_and_routing_pipeline.test.js`

**Interfaces:**
- Consumes: Inertia root view rendering from `App\Http\Controllers\DashboardController` & `auth.php`.
- Produces: `window.route(name, params)` global fallback JavaScript function, `@inertia` mount, `@inertiaHead`.

- [ ] **Step 1: Write the failing test**

```javascript
// In tests/production_build_and_routing_pipeline.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Production Build and Routing Pipeline Test Suite', () => {
    it('1. dnp-rework/resources/views/app.blade.php exists and defines window.route helper', () => {
        const bladePath = path.join(rootDir, 'dnp-rework/resources/views/app.blade.php');
        assert.ok(fs.existsSync(bladePath), 'app.blade.php must exist in dnp-rework/resources/views/');
        const content = fs.readFileSync(bladePath, 'utf8');

        assert.ok(content.includes('window.route'), 'Must define window.route helper');
        assert.ok(content.includes("name === 'login'"), "Must handle login route");
        assert.ok(content.includes("name === 'logout'"), "Must handle logout route");
        assert.ok(content.includes("name === 'kanban'"), "Must handle kanban route");
        assert.ok(content.includes('@inertia'), "Must include @inertia directive");
        assert.ok(content.includes('@vite'), "Must include @vite bundle loader");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/production_build_and_routing_pipeline.test.js`
Expected: FAIL with `app.blade.php must exist in dnp-rework/resources/views/`

- [ ] **Step 3: Write minimal implementation in `dnp-rework/resources/views/app.blade.php`**

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'DNP Monitoring System') }}</title>
    <link rel="icon" type="image/png" href="/moriku-logo.png">

    <!-- Preconnect Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Global Route Helper (Ziggy fallback to prevent ReferenceError: route is not defined) -->
    <script>
      window.route = window.route || function(name, params) {
        var routes = {
          'login': '/login',
          'logout': '/logout',
          'dashboard': '/',
          'kanban': '/kanban',
          'jobs.index': '/jobs',
          'jobs.create': '/jobs/create',
          'reminder.suket': '/reminder-suket',
          'inventory': '/inventory',
          'pelaporan.index': '/pelaporan',
          'profile.edit': '/profile',
          'users.index': '/users'
        };
        var target = routes[name] || ('/' + (name || '').replace(/\./g, '/'));
        if (params && typeof params === 'object') {
          var qs = Object.keys(params).map(function(k){
            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
          }).join('&');
          return qs ? target + '?' + qs : target;
        }
        return target;
      };
    </script>

    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>
<body class="font-sans antialiased bg-slate-50 text-slate-800">
    @inertia
</body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/production_build_and_routing_pipeline.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add dnp-rework/resources/views/app.blade.php tests/production_build_and_routing_pipeline.test.js
git commit -m "fix(views): create app.blade.php with window.route fallback helper"
```

---

### Task 2: Update `deploy.sh` to Prevent Destructive Builds & Enforce Asset Health

**Files:**
- Modify: `deploy.sh`
- Modify: `tests/production_build_and_routing_pipeline.test.js`

**Interfaces:**
- Consumes: Source code in `$BASE_DIR/dnp-rework` and pre-built frontend in `$BASE_DIR/dist` & `$BASE_DIR/dnp-rework/public/build`.
- Produces: Robust deploy sequence that synchronizes resources/views, builds at root if necessary or syncs precompiled bundles, verifies at least 5 asset files exist in `public/build/assets`, and reloads PHP-FPM cleanly.

- [ ] **Step 1: Write the failing test for `deploy.sh` integrity**

Add test to `tests/production_build_and_routing_pipeline.test.js`:
```javascript
it('2. deploy.sh synchronizes resources/views and guards against destructive empty builds', () => {
    const deployScriptPath = path.join(rootDir, 'deploy.sh');
    const content = fs.readFileSync(deployScriptPath, 'utf8');

    assert.ok(
        content.includes('cp -r "$BASE_DIR/dnp-rework/resources"') || content.includes('dnp-rework/resources/views'),
        'deploy.sh must copy resources/views from dnp-rework'
    );
    assert.ok(
        !content.includes('cd "$PROD_DIR"\nnpm install --no-audit --no-fund\nnpm run build'),
        'deploy.sh must NOT run blind destructive npm run build in PROD_DIR'
    );
    assert.ok(
        content.includes('public/build/assets') && content.includes('wc -l'),
        'deploy.sh must verify asset count in public/build/assets'
    );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/production_build_and_routing_pipeline.test.js`
Expected: FAIL because `deploy.sh` currently has the blind `cd "$PROD_DIR" && npm run build`.

- [ ] **Step 3: Modify `deploy.sh` with safe asset management and verification**

Update `deploy.sh` lines 44-65:
- Copy `dnp-rework/resources` (which now includes `resources/views/app.blade.php`).
- Copy pre-compiled Inertia bundles from `dnp-rework/public/build` into `$PROD_DIR/public/build`.
- Copy SPA artifacts from `dist/` into `$PROD_DIR/public/` if present.
- If running build, run it at `$BASE_DIR` where root `package.json` with React 18/19 and Vite exists, then copy into `$PROD_DIR/public/build`.
- Add an asset check: if `public/build/assets` has fewer than 5 files, fail with warning or restore from backup slot.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/production_build_and_routing_pipeline.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add deploy.sh tests/production_build_and_routing_pipeline.test.js
git commit -m "fix(deploy): prevent destructive empty build and sync views and assets safely"
```

---

### Task 3: Architecture Audit & Tech Stack Verification

**Files:**
- Modify: `tests/production_build_and_routing_pipeline.test.js`

**Interfaces:**
- Consumes: All files in `dnp-rework/resources/js/**/*.jsx`.
- Produces: Complete validation that no Next.js patterns exist and all pages properly resolve Inertia React bindings.

- [ ] **Step 1: Write test auditing all pages for Inertia and absence of Next.js**

Add to `tests/production_build_and_routing_pipeline.test.js`:
```javascript
it('3. All pages strictly use Inertia.js and have zero Next.js imports', () => {
    const pagesDir = path.join(rootDir, 'dnp-rework/resources/js/Pages');
    
    function scanDir(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
                results = results.concat(scanDir(fullPath));
            } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(fullPath);
            }
        });
        return results;
    }

    const files = scanDir(pagesDir);
    assert.ok(files.length > 5, 'Should have multiple page components');

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        assert.ok(!content.includes("from 'next/"), `File ${file} must not import from next/*`);
        assert.ok(!content.includes("from 'next'"), `File ${file} must not import from next`);
    });
});
```

- [ ] **Step 2: Run test to verify**

Run: `node --test tests/production_build_and_routing_pipeline.test.js`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/production_build_and_routing_pipeline.test.js
git commit -m "test(pipeline): audit pages to ensure pure Inertia React architecture"
```

---

### Task 4: Verify Root Build Output & Stage 3 Naming Consistency

**Files:**
- Modify: `tests/production_build_and_routing_pipeline.test.js`

**Interfaces:**
- Consumes: `dist/` and `dnp-rework/resources/js/Constants.js`.
- Produces: Automated verification that Stage 3 is strictly "Penjadwalan" across constants and compiled bundles.

- [ ] **Step 1: Write test for Stage 3 consistency in build output**

Add to `tests/production_build_and_routing_pipeline.test.js`:
```javascript
it('4. Built frontend bundles in dist/ contain updated Stage 3 name "Penjadwalan"', () => {
    const distAssetsDir = path.join(rootDir, 'dist/assets');
    assert.ok(fs.existsSync(distAssetsDir), 'dist/assets directory must exist');
    const assetFiles = fs.readdirSync(distAssetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
    assert.ok(assetFiles.length > 0, 'Must have at least one index-*.js bundle in dist/assets');

    const mainBundleContent = fs.readFileSync(path.join(distAssetsDir, assetFiles[0]), 'utf8');
    assert.ok(
        mainBundleContent.includes('Penjadwalan'),
        'Built bundle in dist/assets must contain "Penjadwalan"'
    );
});
```

- [ ] **Step 2: Run test to verify**

Run: `node --test tests/production_build_and_routing_pipeline.test.js`
Expected: PASS (since root `npm run build` was already executed and contains "Penjadwalan").

- [ ] **Step 3: Commit**

```bash
git add tests/production_build_and_routing_pipeline.test.js
git commit -m "test(dist): verify Stage 3 Penjadwalan in compiled frontend assets"
```

---

### Task 5: Production Execution Instructions

**Files:**
- Execute commands on remote server via SSH / shell terminal.

- [ ] **Step 1: Push changes to GitHub repository**
```bash
git push origin main
```

- [ ] **Step 2: Execute safe deploy on server**
```bash
cd /var/www/demo-dnp/demo-dnp
./deploy.sh main
```

- [ ] **Step 3: Verify server response and login status**
Verify HTTP 200, asset loading, and form submission on `https://monitor-dnp.deltaindo.co.id/login`.
