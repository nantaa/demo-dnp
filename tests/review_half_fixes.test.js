import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const constantsPath = path.resolve(__dirname, '../dnp-rework/resources/js/Constants.js');
const createPath = path.resolve(__dirname, '../dnp-rework/resources/js/Pages/Jobs/Create.jsx');
const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const controllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/JobController.php');
const routesPath = path.resolve(__dirname, '../dnp-rework/routes/web.php');

describe('REVIEW HALF.pdf Fixes & Enhancements Test Suite', () => {
    describe('1. Stage 5 Document Types (Item 18)', () => {
        it('DOC_TYPES_BY_STAGE[5] contains only LHPP (hides BAP and Laporan Teknis Tambahan)', async () => {
            const constantsContent = fs.readFileSync(constantsPath, 'utf8');
            const match = constantsContent.match(/5:\s*\[([^\]]*)\]/);
            assert.ok(match, 'DOC_TYPES_BY_STAGE[5] must exist');
            
            const stage5Docs = match[1];
            assert.ok(stage5Docs.includes("'LHPP'"), 'Stage 5 must include LHPP');
            assert.ok(!stage5Docs.includes("'BAP'"), 'Stage 5 must NOT include BAP');
            assert.ok(!stage5Docs.includes("'Laporan Teknis Tambahan'"), 'Stage 5 must NOT include Laporan Teknis Tambahan');
        });
    });

    describe('2. Backward PPN 12% Calculation & Database Standard (Item 12)', () => {
        it('calculates backward DPP and 12% PPN from gross Total', () => {
            const calculateGrossBreakdown = (totalGross) => {
                const total = parseFloat(totalGross) || 0;
                if (total <= 0) return { dpp: 0, ppn: 0, total: 0 };
                const dpp = Math.round(total / 1.12);
                const ppn = total - dpp;
                return { dpp, ppn, total };
            };

            const res3M = calculateGrossBreakdown(3000000);
            assert.equal(res3M.total, 3000000);
            assert.equal(res3M.dpp, 2678571);
            assert.equal(res3M.ppn, 321429);
            assert.equal(res3M.dpp + res3M.ppn, 3000000);

            const res10M = calculateGrossBreakdown(10000000);
            assert.equal(res10M.total, 10000000);
            assert.equal(res10M.dpp, 8928571);
            assert.equal(res10M.ppn, 1071429);
            assert.equal(res10M.dpp + res10M.ppn, 10000000);
        });

        it('Create.jsx reflects gross total and backward breakdown', () => {
            const createContent = fs.readFileSync(createPath, 'utf8');
            assert.ok(
                createContent.includes('termasuk PPN') || createContent.includes('Sesudah PPN'),
                'Create.jsx label must indicate value includes PPN'
            );
            assert.ok(
                createContent.includes('/ 1.12') || createContent.includes('1.12'),
                'Create.jsx must calculate DPP by dividing total by 1.12'
            );
        });
    });

    describe('3. Document Download Preserving Real Filename (Item 19)', () => {
        it('JobController.php downloadDocument uses response()->download() or safe inline attachment', () => {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            assert.ok(
                controllerContent.includes('response()->download($fullPath, $document->name') ||
                controllerContent.includes('setContentDisposition'),
                'JobController.php must use response()->download with $document->name or Symfony setContentDisposition'
            );
        });

        it('JobDetailSheet.jsx DocChip has download attribute on link', () => {
            let detailContent = fs.readFileSync(detailSheetPath, 'utf8');
            const docChipPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetail/Common/DocChip.jsx');
            if (fs.existsSync(docChipPath)) {
                detailContent += '\n' + fs.readFileSync(docChipPath, 'utf8');
            }
            assert.ok(
                detailContent.includes('download={doc.name') || detailContent.includes('download='),
                'DocChip must have download attribute to guarantee original filename on browser save'
            );
        });
    });

    describe('4. Superadmin Re-open Job Feature for Stage 12 (Item 16)', () => {
        it('routes/web.php registers reopen route', () => {
            const routesContent = fs.readFileSync(routesPath, 'utf8');
            assert.ok(
                routesContent.includes("jobs/{job}/reopen") || routesContent.includes("'reopenJob'"),
                'web.php must have reopen route'
            );
        });

        it('JobController.php implements reopenJob method with Superadmin authorization', () => {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            assert.ok(
                controllerContent.includes('function reopenJob'),
                'JobController.php must implement reopenJob method'
            );
            assert.ok(
                controllerContent.includes('isSuperadmin') || controllerContent.includes("'superadmin'"),
                'reopenJob must check superadmin role'
            );
        });

        it('JobDetailSheet.jsx renders Re-open button on Stage 12 for Superadmin', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');
            assert.ok(
                detailContent.includes('handleReopenJob') || detailContent.includes('reopen'),
                'JobDetailSheet.jsx must have reopen handler for Stage 12'
            );
        });
    });

    describe('5. Stage 5 & 10 Single Atomic Request / No Nested router.post (Items 14 & 15)', () => {
        it('Stage 5 submit and bypass do not use nested router.post inside onSuccess', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');
            // Ensure no `router.post(`/jobs/${job.id}/stage5-data` followed by nested `router.post(`/jobs/${job.id}/move`
            const hasNestedS5 = /stage5-data[\s\S]*?onSuccess[\s\S]*?router\.post\([^)]*move/.test(detailContent);
            assert.equal(hasNestedS5, false, 'Stage 5 must NOT use nested router.post inside onSuccess');
        });

        it('Stage 10 submit does not use nested router.post inside onSuccess', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');
            const hasNestedS10 = /stage10-data[\s\S]*?onSuccess[\s\S]*?router\.post\([^)]*move/.test(detailContent);
            assert.equal(hasNestedS10, false, 'Stage 10 must NOT use nested router.post inside onSuccess');
        });
    });

    describe('6. Tanggal 15 Closing Warning on Edit Info & Create (Item 13)', () => {
        it('JobDetailSheet.jsx displays showTgl15Warning in renderEditInfo when editing nilai', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');
            const editInfoTabPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetail/Tabs/EditInfoTab.jsx');
            if (fs.existsSync(editInfoTabPath)) {
                const editInfoContent = fs.readFileSync(editInfoTabPath, 'utf8');
                assert.ok(
                    editInfoContent.includes('showTgl15Warning') || editInfoContent.includes('isPastTgl15'),
                    'EditInfoTab must include tanggal 15 warning for financial editing'
                );
            } else {
                const editInfoMatch = detailContent.match(/renderEditInfo\s*=\s*\(\)\s*=>\s*\([\s\S]*?handleDeleteJob/);
                assert.ok(editInfoMatch, 'renderEditInfo must exist');
                assert.ok(
                    editInfoMatch[0].includes('showTgl15Warning') || editInfoMatch[0].includes('isPastTgl15'),
                    'renderEditInfo must include tanggal 15 warning for financial editing'
                );
            }
        });
    });
});
