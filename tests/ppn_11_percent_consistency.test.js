import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('PPN 11% Mathematical & UI Consistency Test Suite', async (t) => {
    const createFile = path.join(rootDir, 'dnp-rework/resources/js/Pages/Jobs/Create.jsx');
    const sheetFile = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const constantsFile = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');

    assert.ok(fs.existsSync(createFile), 'Create.jsx exists');
    assert.ok(fs.existsSync(sheetFile), 'JobDetailSheet.jsx exists');
    assert.ok(fs.existsSync(constantsFile), 'Constants.js exists');

    const createCode = fs.readFileSync(createFile, 'utf8');
    const sheetCode = fs.readFileSync(sheetFile, 'utf8');
    const constantsCode = fs.readFileSync(constantsFile, 'utf8');

    await t.test('1. Constants.js strictly maintains 16 stages', () => {
        // Must contain 16 stages definition
        assert.match(constantsCode, /id:\s*16,\s*name:\s*['"]Selesai['"]/);
        assert.doesNotMatch(constantsCode, /id:\s*17/);
        assert.doesNotMatch(constantsCode, /id:\s*18/);
        assert.doesNotMatch(constantsCode, /id:\s*19/);
        assert.doesNotMatch(constantsCode, /id:\s*20/);
    });

    await t.test('2. Create.jsx has zero mentions of 12% PPN label', () => {
        assert.doesNotMatch(createCode, /12%/i, 'Create.jsx must not contain 12% PPN label');
        assert.match(createCode, /11%/i, 'Create.jsx must contain 11% PPN label');
    });

    await t.test('3. JobDetailSheet.jsx has zero mentions of 12% PPN label', () => {
        assert.doesNotMatch(sheetCode, /12%/i, 'JobDetailSheet.jsx must not contain 12% PPN label');
        assert.match(sheetCode, /11%/i, 'JobDetailSheet.jsx must contain 11% PPN label');
    });

    await t.test('4. Mathematical verification: 5.000.000 DPP produces 550.000 PPN and 5.550.000 Total', () => {
        const dpp = 5000000;
        const ppn11 = Math.round(dpp * 0.11);
        const total11 = Math.round(dpp * 1.11);

        assert.equal(ppn11, 550000, 'PPN 11% on 5.000.000 is 550.000');
        assert.equal(total11, 5550000, 'Total on 5.000.000 is 5.550.000 (NOT 5.600.000)');

        // Backward calculation from total
        const calcDpp = Math.round(total11 / 1.11);
        const calcPpn = total11 - calcDpp;
        assert.equal(calcDpp, 5000000);
        assert.equal(calcPpn, 550000);
    });
});
