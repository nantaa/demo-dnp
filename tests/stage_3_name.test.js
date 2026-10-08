import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Stage 3 Name Update to Penjadwalan Test Suite', () => {
    it('1. Constants.js STAGES defines Stage 3 name strictly as "Penjadwalan"', () => {
        const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
        const content = fs.readFileSync(constantsPath, 'utf8');

        // Match stage 3 definition
        const stage3Match = content.match(/\{\s*id:\s*3,\s*name:\s*['"]([^'"]+)['"]/);
        assert.ok(stage3Match, 'Stage 3 must be defined in STAGES');
        assert.equal(
            stage3Match[1],
            'Penjadwalan',
            'Stage 3 name must be "Penjadwalan" (without "& Surat Tugas")'
        );
    });

    it('2. DailyDigestService.php defines stage 3 name strictly as "Penjadwalan"', () => {
        const servicePath = path.join(rootDir, 'dnp-rework/app/Services/DailyDigestService.php');
        const content = fs.readFileSync(servicePath, 'utf8');

        const stage3Match = content.match(/3\s*=>\s*['"]([^'"]+)['"]/);
        assert.ok(stage3Match, 'Stage 3 must be defined in $stageNames');
        assert.equal(
            stage3Match[1],
            'Penjadwalan',
            'DailyDigestService.php stage 3 must be "Penjadwalan"'
        );
    });
});
