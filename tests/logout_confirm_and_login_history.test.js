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
