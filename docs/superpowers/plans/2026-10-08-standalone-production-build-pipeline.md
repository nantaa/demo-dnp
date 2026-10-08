# Standalone Production Build Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable native `npm run build` execution directly inside `dnp-monitor-production` (and `dnp-rework`) on the server without any reliance on legacy folder copies, generating all 50+ Inertia React page chunks and manifest cleanly.

**Architecture:** Standard Laravel 11 + Inertia.js React Vite pipeline. Pack `dnp-rework` with its own `package.json`, `vite.config.js`, `resources/js/app.jsx`, `resources/css/app.css`, and `resources/views/app.blade.php`. Update `deploy.sh` to copy the build configurations and enforce that `npm run build` produces > 10 assets in `public/build/assets`.

**Tech Stack:** Laravel 11, Inertia.js (`@inertiajs/react`), React 18/19, `@vitejs/plugin-react`, `laravel-vite-plugin`, Vite 5, Node.js `node:test` runner.

---

## Global Constraints
- Do NOT copy assets from `dnp-monitor-production.legacy.1791384521`. All assets must originate from fresh `npm run build`.
- Framework base is strictly Laravel 11 + Inertia.js React (entry point `resources/js/app.jsx`).
- Follow TDD phase order strictly: Plan -> Test (Failing) -> Implement -> Verify (Passing) -> Commit.
- Never run an unconfigured build in production that wipes assets.

---

### Task 1: Create Build Configuration & Entry Points in `dnp-rework`

**Files:**
- Create: `dnp-rework/package.json`
- Create: `dnp-rework/vite.config.js`
- Create: `dnp-rework/resources/js/app.jsx`
- Create: `dnp-rework/resources/css/app.css`
- Create: `dnp-rework/resources/views/app.blade.php`
- Test: `tests/rework_standalone_build.test.js`

**Interfaces:**
- Consumes: `dnp-rework/resources/js/Pages/**/*.jsx`
- Produces: Vite build configuration targeting `resources/js/app.jsx`, generating Inertia page chunks into `public/build/assets/` and `public/build/manifest.json`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/rework_standalone_build.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Standalone Production Build Suite', () => {
    it('1. dnp-rework has complete package.json with React and Inertia dependencies', () => {
        const pkgPath = path.join(rootDir, 'dnp-rework/package.json');
        assert.ok(fs.existsSync(pkgPath), 'dnp-rework/package.json must exist');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        assert.ok(pkg.devDependencies['@vitejs/plugin-react'] || pkg.dependencies['@vitejs/plugin-react'], 'Must include @vitejs/plugin-react');
        assert.ok(pkg.devDependencies['laravel-vite-plugin'] || pkg.dependencies['laravel-vite-plugin'], 'Must include laravel-vite-plugin');
        assert.ok(pkg.devDependencies['@inertiajs/react'] || pkg.dependencies['@inertiajs/react'], 'Must include @inertiajs/react');
        assert.ok(pkg.devDependencies['react'] || pkg.dependencies['react'], 'Must include react');
    });

    it('2. dnp-rework has vite.config.js with laravel plugin and react plugin', () => {
        const vitePath = path.join(rootDir, 'dnp-rework/vite.config.js');
        assert.ok(fs.existsSync(vitePath), 'dnp-rework/vite.config.js must exist');
        const content = fs.readFileSync(vitePath, 'utf8');

        assert.ok(content.includes('laravel('), 'Must configure laravel-vite-plugin');
        assert.ok(content.includes('resources/js/app.jsx'), 'Must specify resources/js/app.jsx as input');
        assert.ok(content.includes('react('), 'Must configure react() plugin');
    });

    it('3. dnp-rework has resources/js/app.jsx initializing Inertia with glob imports', () => {
        const appJsxPath = path.join(rootDir, 'dnp-rework/resources/js/app.jsx');
        assert.ok(fs.existsSync(appJsxPath), 'dnp-rework/resources/js/app.jsx must exist');
        const content = fs.readFileSync(appJsxPath, 'utf8');

        assert.ok(content.includes('createInertiaApp'), 'Must call createInertiaApp');
        assert.ok(content.includes('./Pages/**/*.jsx'), 'Must resolve pages with import.meta.glob');
    });

    it('4. dnp-rework has resources/views/app.blade.php with route helper and @inertia', () => {
        const bladePath = path.join(rootDir, 'dnp-rework/resources/views/app.blade.php');
        assert.ok(fs.existsSync(bladePath), 'dnp-rework/resources/views/app.blade.php must exist');
        const content = fs.readFileSync(bladePath, 'utf8');

        assert.ok(content.includes('@inertia'), 'Must include @inertia tag');
        assert.ok(content.includes('@vite'), 'Must include @vite loader');
        assert.ok(content.includes('window.route'), 'Must define window.route helper');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: FAIL with missing `dnp-rework/package.json`.

- [ ] **Step 3: Implement `dnp-rework/package.json`**

```json
{
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "dependencies": {
        "@inertiajs/react": "^1.2.0",
        "axios": "^1.6.4",
        "lucide-react": "^0.469.0",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "sweetalert2": "^11.15.10",
        "sweetalert2-react-content": "^5.1.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.3.1",
        "autoprefixer": "^10.4.16",
        "laravel-vite-plugin": "^1.0.0",
        "postcss": "^8.4.31",
        "tailwindcss": "^3.4.0",
        "vite": "^5.4.11"
    }
}
```

- [ ] **Step 4: Implement `dnp-rework/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
```

- [ ] **Step 5: Implement `dnp-rework/resources/js/app.jsx`**

```javascript
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'DNP Monitoring System';

// Global route fallback helper to prevent ReferenceError: route is not defined
if (typeof window !== 'undefined') {
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
}

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#00A8E8',
    },
});
```

- [ ] **Step 6: Implement `dnp-rework/resources/css/app.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Implement `dnp-rework/resources/views/app.blade.php`**

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'DNP Monitoring System') }}</title>
    <link rel="icon" type="image/png" href="/moriku-logo.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Global Route Fallback Helper -->
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

- [ ] **Step 8: Run tests to verify they pass**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: PASS (4/4 tests passing).

- [ ] **Step 9: Commit**

```bash
git add dnp-rework/package.json dnp-rework/vite.config.js dnp-rework/resources/js/app.jsx dnp-rework/resources/css/app.css dnp-rework/resources/views/app.blade.php tests/rework_standalone_build.test.js
git commit -m "feat(build): add standalone package.json, vite.config.js, and app.jsx to dnp-rework"
```

---

### Task 2: Update `deploy.sh` to Synchronize Build Configs & Enforce Asset Health

**Files:**
- Modify: `deploy.sh`
- Test: `tests/rework_standalone_build.test.js`

**Interfaces:**
- Consumes: `dnp-rework/package.json`, `dnp-rework/vite.config.js`, `dnp-rework/resources/`
- Produces: Execution of `npm install && npm run build` inside `$PROD_DIR`, asserting > 10 files in `public/build/assets`.

- [ ] **Step 1: Write failing test for `deploy.sh` sync**

Add test to `tests/rework_standalone_build.test.js`:
```javascript
it('5. deploy.sh synchronizes package.json and vite.config.js to PROD_DIR', () => {
    const deployPath = path.join(rootDir, 'deploy.sh');
    const content = fs.readFileSync(deployPath, 'utf8');

    assert.ok(content.includes('package.json') && content.includes('$PROD_DIR'), 'Must copy package.json to PROD_DIR');
    assert.ok(content.includes('vite.config.js') && content.includes('$PROD_DIR'), 'Must copy vite.config.js to PROD_DIR');
    assert.ok(content.includes('public/build/assets') && content.includes('wc -l'), 'Must verify asset count');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: FAIL because `deploy.sh` does not yet explicitly copy `package.json` and `vite.config.js` to `$PROD_DIR`.

- [ ] **Step 3: Modify `deploy.sh`**

Update `deploy.sh` section 3 & 4:
```bash
# 3. Copy source folders and build configuration from dnp-rework
echo "📦 3/6 Copying updated source files and build config from dnp-rework..."
cp -r "$BASE_DIR/dnp-rework/app"       "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/database"  "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/resources" "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/routes"    "$PROD_DIR/"
[ -d "$BASE_DIR/dnp-rework/config" ] && cp -r "$BASE_DIR/dnp-rework/config" "$PROD_DIR/"
cp "$BASE_DIR/dnp-rework/package.json"  "$PROD_DIR/"
cp "$BASE_DIR/dnp-rework/vite.config.js" "$PROD_DIR/"
echo "   -> Source files and build configs updated."

# 4. npm install + build directly in production
echo "🔨 4/6 npm install & build in $PROD_DIR..."
cd "$PROD_DIR"
npm install --no-audit --no-fund
npm run build

ASSET_COUNT=$(ls "$PROD_DIR/public/build/assets/" 2>/dev/null | wc -l)
echo "   -> Build complete: $ASSET_COUNT assets generated."
if [ "$ASSET_COUNT" -lt 5 ]; then
    echo "   ❌ ERROR: Build generated fewer than 5 assets! Build may have failed."
    exit 1
fi
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rework_standalone_build.test.js`
Expected: PASS (5/5 tests passing).

- [ ] **Step 5: Commit**

```bash
git add deploy.sh tests/rework_standalone_build.test.js
git commit -m "fix(deploy): sync package.json, vite.config.js, and assert asset count after npm run build"
```

---

### Task 3: Local Build Dry-Run Verification

**Files:**
- Execute `npm run build` locally to verify zero build errors.

- [ ] **Step 1: Run root build verification**
```bash
npm run build
```
Verify exit code 0 and pristine output.

- [ ] **Step 2: Commit any build artifacts if needed**
```bash
git status
```

---

### Task 4: Server Execution & Verification

**Files:**
- Remote execution on `delta@RiksaUjiServer`.

- [ ] **Step 1: Push changes to GitHub repository**
```bash
git push origin main
```

- [ ] **Step 2: Execute `./deploy.sh main` on server**
```bash
cd /var/www/demo-dnp/demo-dnp
./deploy.sh main
```

- [ ] **Step 3: Verify server logs and web browser**
Confirm `public/build/assets` contains 50+ files and `https://monitor-dnp.deltaindo.co.id/login` renders and logs in without issues.
