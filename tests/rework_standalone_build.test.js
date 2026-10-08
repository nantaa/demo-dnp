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

        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        assert.ok(allDeps['@vitejs/plugin-react'], 'Must include @vitejs/plugin-react');
        assert.ok(allDeps['laravel-vite-plugin'], 'Must include laravel-vite-plugin');
        assert.ok(allDeps['@inertiajs/react'], 'Must include @inertiajs/react');
        assert.ok(allDeps['react'], 'Must include react');
        assert.ok(allDeps['react-dom'], 'Must include react-dom');
        assert.ok(allDeps['vite'], 'Must include vite');
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
