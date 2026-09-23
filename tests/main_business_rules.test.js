import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createPath = path.resolve(__dirname, '../dnp-rework/resources/js/Pages/Jobs/Create.jsx');
const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const jobControllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/JobController.php');

describe('5 Business Rules on Main - TDD Test Suite', () => {

    describe('1. Price Display & Calculation (DPP input x 112%)', () => {
        it('Create.jsx must calculate DPP as user input, PPN as 12% of input, and Total as input * 1.12', () => {
            const createContent = fs.readFileSync(createPath, 'utf8');

            // Must NOT do Math.round(total / 1.12) which was the backwards calculation
            assert.ok(
                !createContent.includes('const dpp = Math.round(total / 1.12);'),
                'Create.jsx must not back-calculate DPP by dividing total by 1.12'
            );

            // Must calculate total from DPP * 1.12
            assert.ok(
                createContent.includes('dpp * 1.12') || createContent.includes('dpp * 0.12') || createContent.includes('nilai * 1.12'),
                'Create.jsx must calculate PPN 12% and total from DPP'
            );

            // Must label input as DPP / Sebelum PPN
            assert.ok(
                createContent.includes('DPP') || createContent.toLowerCase().includes('sebelum ppn'),
                'Create.jsx input label or breakdown must clarify DPP / Sebelum PPN'
            );
        });

        it('Mathematical helper: given DPP 3,000,000, PPN is 360,000 and Total is 3,360,000', () => {
            const dpp = 3000000;
            const ppn = Math.round(dpp * 0.12);
            const total = Math.round(dpp * 1.12);
            assert.equal(ppn, 360000);
            assert.equal(total, 3360000);
            assert.ok(total > dpp, 'Final result must be greater than user input DPP');
        });
    });

    describe('2. Lock PO Document ONLY for INS Role', () => {
        it('JobController.php downloadDocument must abort 403 for INS roles on PO/SPK documents', () => {
            const controllerContent = fs.readFileSync(jobControllerPath, 'utf8');
            
            const startIdx = controllerContent.indexOf('function downloadDocument');
            const endIdx = controllerContent.indexOf('public function reviseInvoice');
            const downloadDocSection = controllerContent.slice(startIdx, endIdx);

            assert.ok(
                downloadDocSection.includes('inspektur') || downloadDocSection.includes('inspector'),
                'downloadDocument must check for inspector/inspektur role'
            );
            assert.ok(
                downloadDocSection.includes('PO') || downloadDocSection.includes('po'),
                'downloadDocument must check for PO document type or name'
            );
            assert.ok(
                downloadDocSection.includes('403'),
                'downloadDocument must abort 403 when inspector accesses PO document'
            );
        });

        it('JobDetailSheet.jsx must lock or hide PO documents for isINS role in DocChip / doc view', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            assert.ok(
                detailContent.includes('isINS') && detailContent.includes('isPoLockedForIns'),
                'JobDetailSheet.jsx must guard PO documents specifically for isINS with isPoLockedForIns'
            );
        });
    });

    describe('3. Kembalikan Job in S7 Moves Job to S5', () => {
        it('JobController.php rejectStage must route Stage 7 to Stage 5', () => {
            const controllerContent = fs.readFileSync(jobControllerPath, 'utf8');

            const rejectStageSection = controllerContent.slice(
                controllerContent.indexOf('function rejectStage'),
                controllerContent.indexOf('function askApproval')
            );

            assert.ok(
                rejectStageSection.includes('$currentStage === 7') || rejectStageSection.includes('$currentStage == 7'),
                'rejectStage must explicitly handle currentStage 7'
            );
            assert.ok(
                rejectStageSection.match(/\$currentStage\s*===?\s*7[\s\S]*?\$prevStage\s*=\s*5/),
                'rejectStage for Stage 7 must set prevStage to 5'
            );
        });

        it('JobDetailSheet.jsx handleRejectStage must set targetStage to 5 when curStage === 7', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const rejectHandlerMatch = detailContent.match(/handleRejectStage\s*=\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\};/);
            assert.ok(rejectHandlerMatch, 'Must find handleRejectStage handler');

            const handlerCode = rejectHandlerMatch[1];
            assert.ok(
                handlerCode.includes('curStage === 7') && handlerCode.match(/curStage\s*===\s*7[\s\S]*?targetStage\s*=\s*5/),
                'handleRejectStage must target Stage 5 when curStage is 7'
            );
        });
    });

    describe('4. Faktur Pajak Price Input (Stage 10): No Calculated Value Box', () => {
        it('JobDetailSheet.jsx Stage 10 total_invoice_amount must not render calculated DPP/PPN breakdown box', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            // Look for Stage 10 total_invoice_amount input area
            const s10TotalMatch = detailContent.match(/total_invoice_amount[\s\S]*?<\/div>/);
            assert.ok(s10TotalMatch, 'Must find total_invoice_amount input in Stage 10');

            // The calculated box was checking s10.total_invoice_amount > 0 and rendering DPP / PPN
            assert.ok(
                !detailContent.includes('s10.total_invoice_amount > 0 && (() => {'),
                'Stage 10 must not show calculated DPP / PPN 12% breakdown box under total_invoice_amount'
            );
        });
    });

    describe('5. Revisi PO and Invoice Month Cutoff Rules', () => {
        it('JobController.php revisePo must enforce same calendar month as job.created_at', () => {
            const controllerContent = fs.readFileSync(jobControllerPath, 'utf8');

            const revisePoSection = controllerContent.slice(
                controllerContent.indexOf('function revisePo'),
                controllerContent.indexOf('function updateInspectorNotes')
            );

            assert.ok(
                revisePoSection.includes('created_at') && (revisePoSection.includes('format(\'Y-m\')') || revisePoSection.includes('format("Y-m")')),
                'revisePo must validate calendar month (Y-m) against created_at'
            );
            assert.ok(
                revisePoSection.includes('403'),
                'revisePo must abort 403 if outside same calendar month'
            );
        });

        it('JobController.php reviseInvoice must enforce same calendar month as invoice issue date / created_at', () => {
            const controllerContent = fs.readFileSync(jobControllerPath, 'utf8');

            const reviseInvoiceSection = controllerContent.slice(
                controllerContent.indexOf('function reviseInvoice'),
                controllerContent.indexOf('function revisePo')
            );

            assert.ok(
                (reviseInvoiceSection.includes('format(\'Y-m\')') || reviseInvoiceSection.includes('format("Y-m")')) &&
                (reviseInvoiceSection.includes('tgl_invoice_issued') || reviseInvoiceSection.includes('created_at')),
                'reviseInvoice must validate calendar month (Y-m) against invoice issue date / created_at'
            );
            assert.ok(
                reviseInvoiceSection.includes('403'),
                'reviseInvoice must abort 403 if outside same calendar month'
            );
        });

        it('JobDetailSheet.jsx must compute canRevisePoMonth and canReviseInvoiceMonth and guard revision buttons', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            assert.ok(
                detailContent.includes('canRevisePoMonth') && detailContent.includes('canReviseInvoiceMonth'),
                'JobDetailSheet.jsx must check calendar month validity for revisions using canRevisePoMonth and canReviseInvoiceMonth'
            );
        });
    });
});
