import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('S10 Rename & Document Links Audit Test Suite', () => {
    it('1. Constants.js names Stage 10 as "Invoice & Kwitansi" and short as "Invoice"', () => {
        const constantsPath = path.resolve('dnp-rework/resources/js/Constants.js');
        const content = fs.readFileSync(constantsPath, 'utf8');
        assert.match(content, /id:\s*10,\s*name:\s*['"](Invoice & Kwitansi|Pembuatan Invoice)['"],\s*short:\s*['"]Invoice['"]/);
    });

    it('2. JobDetailSheet.jsx has zero hardcoded /documents/${...}/download links without file/{filename}', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const content = fs.readFileSync(sheetPath, 'utf8');
        // Must not contain un-named /documents/.../download links in anchor tags
        assert.doesNotMatch(content, /\/documents\/\$\{[^}]+\}\/download/);
    });

    it('3. JobDetailSheet.jsx Stage 10 labels use "Invoice & Faktur" or "Pembuatan Invoice"', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        let content = fs.readFileSync(sheetPath, 'utf8');
        const s10Path = path.resolve('dnp-rework/resources/js/Components/JobDetail/StageActions/Stage10Action.jsx');
        if (fs.existsSync(s10Path)) {
            content += '\n' + fs.readFileSync(s10Path, 'utf8');
        }
        assert.match(content, /STAGE 10 \(Pembuatan Invoice/);
        assert.match(content, /Simpan Data Invoice & Faktur/);
    });

    it('4. JobController.php logs Stage 10 auto-advance as "Pembuatan Invoice"', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const content = fs.readFileSync(controllerPath, 'utf8');
        assert.match(content, /Stage 10 \(Pembuatan Invoice\)/);
    });
});
