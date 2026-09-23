import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const jobControllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/JobController.php');
const dashboardControllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/DashboardController.php');
const kanbanIndexPath = path.resolve(__dirname, '../dnp-rework/resources/js/Pages/Kanban/Index.jsx');
const jobListPath = path.resolve(__dirname, '../dnp-rework/resources/js/Pages/Jobs/List.jsx');

describe('INS PO/SPK Total Lock in Docs & Logs Test Suite', () => {

    describe('1. Documents Tab (renderDocuments) PO/SPK Lockdown for INS', () => {
        it('renderDocuments must filter or lock PO/SPK documents when isINS is true', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const renderDocsSection = detailContent.slice(
                detailContent.indexOf('const renderDocuments = () =>'),
                detailContent.indexOf('const renderHistory = () =>')
            );

            assert.ok(
                renderDocsSection.includes('isPoLockedForIns') || renderDocsSection.includes('isINS'),
                'renderDocuments must check isPoLockedForIns or isINS'
            );
        });
    });

    describe('2. Riwayat / History Log Tab (renderHistory) PO/SPK Masking for INS', () => {
        it('renderHistory must sanitize or mask PO/SPK references and revision logs for INS', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const renderHistorySection = detailContent.slice(
                detailContent.indexOf('const renderHistory = () =>'),
                detailContent.indexOf('const renderEditInfo = () =>')
            );

            assert.ok(
                renderHistorySection.includes('isINS'),
                'renderHistory must check isINS to guard PO/SPK log details'
            );
        });
    });

    describe('3. Header PO Badge Masking for INS', () => {
        it('Sheet header must not display raw PO number to INS users', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const headerSection = detailContent.slice(
                detailContent.indexOf('<div className="min-w-0 flex-1 mr-3">'),
                detailContent.indexOf('Stage {job.stage}')
            );

            assert.ok(
                headerSection.includes('isINS') || headerSection.includes('!isINS'),
                'Header PO badge must be gated by isINS'
            );
        });
    });

    describe('4. Stage 2 Verification Checklist (Active & Timeline) PO/SPK Lockdown for INS', () => {
        it('Active Stage 2 form must lock PO/SPK documents and row 01 for INS', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            // Find Stage 2 active form block
            const stage2ActiveBlock = detailContent.slice(
                detailContent.indexOf('{/* ── STAGE 2 ─────────────────────────────────── */}'),
                detailContent.indexOf('{/* ── STAGE 3 ─────────────────────────────────── */}')
            );

            assert.ok(
                stage2ActiveBlock.includes("isINS && item.type === 'PO/SPK'") ||
                stage2ActiveBlock.includes("isPoLockedForIns(d, isINS)"),
                'Active Stage 2 checklist must lock PO/SPK documents for INS'
            );
            assert.ok(
                stage2ActiveBlock.includes('🔒 Terkunci'),
                'Active Stage 2 checklist must display 🔒 Terkunci badge for locked docs'
            );
        });

        it('Timeline Stage 2 summary must lock PO/SPK documents and row 01 for INS', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const s2Index = detailContent.indexOf("Hasil Verifikasi Dokumen (Stage 2):");
            const stage2TimelineBlock = detailContent.slice(
                s2Index,
                s2Index + 2500
            );

            assert.ok(
                stage2TimelineBlock.includes("isINS && item.type === 'PO/SPK'") ||
                stage2TimelineBlock.includes("isPoLockedForIns(d, isINS)"),
                'Timeline Stage 2 checklist must lock PO/SPK documents for INS'
            );
            assert.ok(
                stage2TimelineBlock.includes('🔒 Terkunci'),
                'Timeline Stage 2 checklist must display 🔒 Terkunci badge for locked docs'
            );
        });
    });

    describe('5. Stage 1 Summary and Detail Pekerjaan PO Masking for INS', () => {
        it('Stage 1 summary must mask No. PO for INS', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const stage1Summary = detailContent.slice(
                detailContent.indexOf('Ringkasan Order Masuk:'),
                detailContent.indexOf('if (s === 3)')
            );

            assert.ok(
                stage1Summary.includes("isINS ? '[Terkunci]' :"),
                'Stage 1 summary must mask No. PO for INS'
            );
        });

        it('Informasi Pekerjaan box must mask No. PO for INS', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const infoIndex = detailContent.indexOf('Informasi Pekerjaan');
            const infoBox = detailContent.slice(
                infoIndex,
                infoIndex + 1200
            );

            assert.ok(
                infoBox.includes('isINS'),
                'Informasi Pekerjaan box must check isINS to mask PO number'
            );
        });
    });

    describe('6. Kanban & Job List PO Masking for INS', () => {
        it('Kanban board cards must not display raw PO to INS', () => {
            const kanbanContent = fs.readFileSync(kanbanIndexPath, 'utf8');
            assert.ok(
                kanbanContent.includes('isINS') && kanbanContent.includes('!isINS && job.no_po'),
                'KanbanIndex must mask job.no_po when isINS is true'
            );
        });

        it('Jobs List must not display raw PO to INS', () => {
            const listContent = fs.readFileSync(jobListPath, 'utf8');
            assert.ok(
                listContent.includes('isINS') && listContent.includes('!isINS && job.no_po'),
                'JobList must mask job.no_po when isINS is true'
            );
        });
    });

    describe('7. Backend Security Gate for INS PO Documents', () => {
        it('JobController::downloadDocument must abort 403 for INS downloading PO/SPK', () => {
            const jobController = fs.readFileSync(jobControllerPath, 'utf8');
            assert.ok(jobController.includes('$isIns && $isPoDoc'), 'downloadDocument must check $isIns && $isPoDoc');
            assert.ok(jobController.includes("abort(403"), 'downloadDocument must abort 403 for INS');
        });

        it('DashboardController & JobController must filter PO/SPK documents from queries for INS', () => {
            const dashController = fs.readFileSync(dashboardControllerPath, 'utf8');
            const jobController = fs.readFileSync(jobControllerPath, 'utf8');

            assert.ok(
                dashController.includes("where('type', 'NOT LIKE', '%PO%')") &&
                dashController.includes("where('name', 'NOT LIKE', '%PO%')"),
                'DashboardController must filter PO/SPK docs from query when $isIns is true'
            );

            assert.ok(
                jobController.includes("where('type', 'NOT LIKE', '%PO%')") &&
                jobController.includes("where('name', 'NOT LIKE', '%PO%')"),
                'JobController must filter PO/SPK docs from query when $isIns is true'
            );
        });
    });
});
