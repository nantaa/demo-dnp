import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const constantsPath = path.resolve(__dirname, '../dnp-rework/resources/js/Constants.js');
const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');

describe('Stage 2 Admin Document Verification for Dokumen Tambahan', () => {
    it('1. Constants.js STAGE2_VERIFY_CHECKLIST must include Dokumen Tambahan item', () => {
        const content = fs.readFileSync(constantsPath, 'utf8');
        const match = content.match(/\{\s*no:\s*['"]10['"],\s*type:\s*['"]Dokumen Tambahan['"][^}]*\}/);
        assert.ok(match, 'STAGE2_VERIFY_CHECKLIST must have an entry for Dokumen Tambahan');
        const itemStr = match[0];
        assert.match(itemStr, /badge:\s*['"]OPSIONAL['"]/);
        assert.match(itemStr, /hasNa:\s*true/);
    });

    it('2. Constants.js DOC_TYPES_BY_STAGE[2] must include Dokumen Tambahan', () => {
        const content = fs.readFileSync(constantsPath, 'utf8');
        const stage2Match = content.match(/2:\s*\[([^\]]+)\]/);
        assert.ok(stage2Match, 'DOC_TYPES_BY_STAGE[2] must exist');
        assert.ok(stage2Match[1].includes("'Dokumen Tambahan'"), 'DOC_TYPES_BY_STAGE[2] must contain Dokumen Tambahan');
    });

    it('3. STAGE2_VERIFY_CHECKLIST retains 11 items with Catatan Verifikasi numbered 11', () => {
        const content = fs.readFileSync(constantsPath, 'utf8');
        const verifyChecklistMatch = content.match(/export const STAGE2_VERIFY_CHECKLIST = \[([\s\S]*?)\];/);
        assert.ok(verifyChecklistMatch, 'STAGE2_VERIFY_CHECKLIST definition must exist');
        const block = verifyChecklistMatch[1];
        assert.ok(block.includes("no: '10', type: 'Dokumen Tambahan'"), 'Dokumen Tambahan must be item 10');
        assert.ok(block.includes("no: '11', type: 'Catatan Verifikasi'"), 'Catatan Verifikasi must be item 11');
    });

    it('4. JobDetailSheet.jsx renders STAGE2_VERIFY_CHECKLIST with document download/upload and verification actions', () => {
        const content = fs.readFileSync(detailSheetPath, 'utf8');
        assert.ok(content.includes('STAGE2_VERIFY_CHECKLIST.map'), 'JobDetailSheet must map over STAGE2_VERIFY_CHECKLIST');
        assert.ok(content.includes('s2-verify'), 'JobDetailSheet must post verification data to s2-verify');
    });
});
