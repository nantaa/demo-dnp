import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const constantsPath = path.resolve(__dirname, '../dnp-rework/resources/js/Constants.js');
const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const timelineTabPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetail/Tabs/TimelineTab.jsx');
const editInfoTabPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetail/Tabs/EditInfoTab.jsx');

const getDetailContent = () => {
    let content = fs.readFileSync(detailSheetPath, 'utf8');
    if (fs.existsSync(timelineTabPath)) {
        content += '\n' + fs.readFileSync(timelineTabPath, 'utf8');
    }
    if (fs.existsSync(editInfoTabPath)) {
        content += '\n' + fs.readFileSync(editInfoTabPath, 'utf8');
    }
    return content;
};

describe('PO/SPK Admin Visibility & INS Pricing PO Gating Test Suite', () => {
    describe('1. Constants.js STAGE2_VERIFY_CHECKLIST PO/SPK definition', () => {
        it('PO/SPK item in STAGE2_VERIFY_CHECKLIST must not be privat or noVerify', async () => {
            const constantsContent = fs.readFileSync(constantsPath, 'utf8');
            
            // Check that noVerify: true is removed or false
            const poSpkMatch = constantsContent.match(/\{[^}]*type:\s*'PO\/SPK'[^}]*\}/);
            assert.ok(poSpkMatch, 'STAGE2_VERIFY_CHECKLIST must contain PO/SPK item');
            
            const itemString = poSpkMatch[0];
            assert.ok(!itemString.includes('noVerify: true'), 'PO/SPK must NOT have noVerify: true');
            assert.ok(!itemString.includes("badge: 'PRIVAT'"), 'PO/SPK must NOT have badge: PRIVAT');
            assert.ok(!itemString.includes('bersifat privat'), 'PO/SPK hint must not say privat');
        });
    });

    describe('2. JobDetailSheet.jsx Stage 1 Summary Pricing Gating (canSeeNilai)', () => {
        it('Stage 1 completed summary (s === 1) must gate Nilai Kontrak with canSeeNilai', () => {
            const detailContent = getDetailContent();
            
            // Look for renderCompletedStageSummary when s === 1 until s === 3
            const stage1SummaryMatch = detailContent.match(/if\s*\(\s*s\s*===\s*1\s*\)\s*\{([\s\S]*?)if\s*\(\s*s\s*===\s*3\s*\)/);
            assert.ok(stage1SummaryMatch, 'Must find stage 1 completed summary section');
            
            const stage1Code = stage1SummaryMatch[1];
            assert.ok(stage1Code.includes('canSeeNilai'), 'Nilai Kontrak in Stage 1 summary MUST be guarded by canSeeNilai');
            assert.ok(stage1Code.includes('Nilai Kontrak:'), 'Must contain Nilai Kontrak label');
        });

        it('Stage 10 completed summary (s === 10) must gate Total Invoice with canSeeNilai', () => {
            const detailContent = getDetailContent();
            
            // Look for renderCompletedStageSummary when s === 10 until s === 11
            const stage10SummaryMatch = detailContent.match(/if\s*\(\s*s\s*===\s*10\s*\)\s*\{([\s\S]*?)if\s*\(\s*s\s*===\s*11\s*\)/);
            assert.ok(stage10SummaryMatch, 'Must find stage 10 completed summary section');
            
            const stage10Code = stage10SummaryMatch[1];
            assert.ok(stage10Code.includes('canSeeNilai'), 'Total Invoice in Stage 10 summary MUST be guarded by canSeeNilai');
            assert.ok(stage10Code.includes('Total Invoice:'), 'Must contain Total Invoice label');
        });
    });

    describe('3. JobDetailSheet.jsx Stage 2 Timeline Checklist File Download Link', () => {
        it('Stage 2 timeline checklist renders clickable download links when hasFile is true', () => {
            const detailContent = getDetailContent();
            
            // In the timeline checklist rendering, hasFile must render an <a> link, not just a static span
            // We search in the s2Verify / timeline checklist loop area
            const timelineChecklistArea = detailContent.match(/savedData\[item\.type\]\s*\|\|\s*s2Verify\[item\.type\][\s\S]*?<\/div>\s*<\/div>/);
            assert.ok(timelineChecklistArea, 'Must find Stage 2 timeline checklist block');
            
            const blockCode = timelineChecklistArea[0];
            assert.ok(
                blockCode.includes('<a') && blockCode.includes('download'),
                'Timeline checklist hasFile MUST render a clickable <a> download link'
            );
        });
    });
});
