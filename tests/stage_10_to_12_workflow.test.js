import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { STAGES, MKT_STAGES, FIN_STAGES, DOC_TYPES_BY_STAGE, getStageDisplayId } from '../dnp-rework/resources/js/Constants.js';

describe('Stage 10 to 12 Workflow Adjustment Test Suite', () => {

    // ── 1. Constants & Stage Metadata ─────────────────────────────────────────
    describe('1. Constants & Stage Sequence Definition', () => {
        test('STAGES contains the exact sequence 10 -> 11 -> 14 (11b) -> 15 (11c) -> 12', () => {
            const s10 = STAGES.find(s => s.id === 10);
            assert.ok(s10, 'Stage 10 must exist');
            assert.equal(s10.name, 'Invoice & Kwitansi');
            assert.equal(s10.role, 'finance');

            const s11 = STAGES.find(s => s.id === 11);
            assert.ok(s11, 'Stage 11 must exist');
            assert.equal(s11.name, 'Penagihan / Follow-up');
            assert.equal(s11.role, 'marketing');

            const s14 = STAGES.find(s => s.id === 14);
            assert.ok(s14, 'Stage 14 (11b) must exist');
            assert.equal(s14.name, 'Verifikasi Bayar & PPh: Lunas');
            assert.equal(s14.role, 'finance');
            assert.equal(s14.displayId, '11b');

            const s15 = STAGES.find(s => s.id === 15);
            assert.ok(s15, 'Stage 15 (11c) must exist');
            assert.equal(s15.name, 'Kirim SUKET ke Klien');
            assert.equal(s15.role, 'marketing');
            assert.equal(s15.displayId, '11c');

            const s12 = STAGES.find(s => s.id === 12);
            assert.ok(s12, 'Stage 12 must exist');
            assert.equal(s12.name, 'Final Financial Closing');
            assert.equal(s12.role, 'finance');

            // Verify order in STAGES array
            const idx10 = STAGES.findIndex(s => s.id === 10);
            const idx11 = STAGES.findIndex(s => s.id === 11);
            const idx14 = STAGES.findIndex(s => s.id === 14);
            const idx15 = STAGES.findIndex(s => s.id === 15);
            const idx12 = STAGES.findIndex(s => s.id === 12);

            assert.equal(idx11, idx10 + 1, 'Stage 11 must immediately follow Stage 10');
            assert.equal(idx14, idx11 + 1, 'Stage 14 (11b) must immediately follow Stage 11');
            assert.equal(idx15, idx14 + 1, 'Stage 15 (11c) must immediately follow Stage 14');
            assert.equal(idx12, idx15 + 1, 'Stage 12 must immediately follow Stage 15');
        });

        test('getStageDisplayId formats display IDs properly', () => {
            assert.equal(getStageDisplayId(10), '10');
            assert.equal(getStageDisplayId(11), '11');
            assert.equal(getStageDisplayId(14), '11b');
            assert.equal(getStageDisplayId(15), '11c');
            assert.equal(getStageDisplayId(12), '12');
        });

        test('Role stage buckets: MKT_STAGES and FIN_STAGES', () => {
            assert.ok(MKT_STAGES.includes(11), 'MKT_STAGES must include 11');
            assert.ok(MKT_STAGES.includes(15), 'MKT_STAGES must include 15');
            assert.ok(FIN_STAGES.includes(10), 'FIN_STAGES must include 10');
            assert.ok(FIN_STAGES.includes(14), 'FIN_STAGES must include 14');
            assert.ok(FIN_STAGES.includes(12), 'FIN_STAGES must include 12');
        });

        test('DOC_TYPES_BY_STAGE maps appropriate documents per stage', () => {
            assert.ok(DOC_TYPES_BY_STAGE[10].includes('Invoice (PDF)'));
            assert.ok(DOC_TYPES_BY_STAGE[10].includes('Kwitansi'));
            assert.ok(DOC_TYPES_BY_STAGE[10].includes('Faktur Pajak'));

            assert.ok(DOC_TYPES_BY_STAGE[11].includes('Bukti Follow-up / Penagihan'));
            assert.ok(DOC_TYPES_BY_STAGE[14].includes('Bukti Potong PPh'));
            assert.ok(DOC_TYPES_BY_STAGE[15].includes('Tanda Terima Suket'));
            assert.ok(DOC_TYPES_BY_STAGE[12].includes('Dokumen Closing Final'));
        });
    });

    // ── 2. Frontend Stage Transitions & Buttons ──────────────────────────────
    describe('2. Frontend Transitions & Button Labels in JobDetailSheet.jsx', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');

        test('getNextStageId transitions sequentially 10 -> 11 -> 14 -> 15 -> 12', () => {
            assert.match(sheetContent, /if\s*\(currentStageId\s*===\s*10\)\s*return\s*11;/);
            assert.match(sheetContent, /if\s*\(currentStageId\s*===\s*11\)\s*return\s*14;/);
            assert.match(sheetContent, /if\s*\(currentStageId\s*===\s*14\)\s*return\s*15;/);
            assert.match(sheetContent, /if\s*\(currentStageId\s*===\s*15\)\s*return\s*12;/);
        });

        test('MoveRow next labels clearly indicate stage progression', () => {
            assert.match(sheetContent, /if\s*\(stage\s*===\s*10\)\s*return\s*['"]Lanjut ke Stage 11 \(Penagihan\) →['"]/);
            assert.match(sheetContent, /if\s*\(stage\s*===\s*11\)\s*return\s*['"]Lanjut ke Stage 11b \(Verifikasi Bayar\) →['"]/);
            assert.match(sheetContent, /if\s*\(stage\s*===\s*14\)\s*return\s*['"]Lanjut ke Stage 11c \(Kirim SUKET\) →['"]/);
            assert.match(sheetContent, /if\s*\(stage\s*===\s*15\)\s*return\s*['"]Lanjut ke Stage 12 \(Final Closing\) →['"]/);
        });

        test('handleRejectStage rejection targets correctly cascade backwards', () => {
            assert.match(sheetContent, /else\s+if\s*\(curStage\s*===\s*11\)\s*targetStage\s*=\s*10;/);
            assert.match(sheetContent, /else\s+if\s*\(curStage\s*===\s*14\)\s*targetStage\s*=\s*11;/);
            assert.match(sheetContent, /else\s+if\s*\(curStage\s*===\s*15\)\s*targetStage\s*=\s*14;/);
            assert.match(sheetContent, /else\s+if\s*\(curStage\s*===\s*12\)\s*targetStage\s*=\s*15;/);
        });

        test('Stage 14 Move button is gated by Lunas (paid) status', () => {
            assert.match(sheetContent, /disabled=\{s14\.s14_payment_status\s*!==\s*['"]paid['"]\}/);
            assert.match(sheetContent, /Pekerjaan hanya dapat dilanjutkan ke Pengiriman SUKET \(11c\) setelah status pembayaran Lunas \(Paid\)\./);
        });

        test('Superadmin Reopen Job modal includes Stage 15 (11c)', () => {
            assert.match(sheetContent, /<option value="15">Stage 11c: Kirim SUKET ke Klien \(Marketing\)<\/option>/);
            assert.match(sheetContent, /<option value="14">Stage 11b: Verifikasi Bayar & PPh \(Finance\)<\/option>/);
        });
    });

    // ── 3. Backend Controller Logic ──────────────────────────────────────────
    describe('3. Backend Logic & Controller in JobController.php', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');

        test('JobController defines MKT_STAGES with 15 and FIN_STAGES with 10, 12, 14', () => {
            assert.match(controllerContent, /private\s+const\s+MKT_STAGES\s*=\s*\[1,\s*11,\s*13,\s*15\];/);
            assert.match(controllerContent, /private\s+const\s+FIN_STAGES\s*=\s*\[10,\s*12,\s*14\];/);
        });

        test('canActOnStage authorizes Marketing for Stage 15 and Finance for 10, 14, 12', () => {
            assert.match(controllerContent, /if\s*\(in_array\(\$stage,\s*\[1,\s*11,\s*13,\s*15\]\)\)/);
            assert.match(controllerContent, /if\s*\(in_array\(\$stage,\s*\[10,\s*12,\s*14\]\)\)/);
        });

        test('updateStage validates next_stage up to 15 or 16', () => {
            assert.match(controllerContent, /'next_stage'\s*=>\s*'required\|integer\|min:1\|max:1[56]'/);
        });

        test('updateStage enforces paid status on Stage 14 before moving to 15', () => {
            assert.match(controllerContent, /if\s*\(\$currentStage\s*==\s*14\)/);
            assert.match(controllerContent, /Status pembayaran harus Lunas \(paid\) sebelum SUKET dapat dikirimkan ke klien\./);
        });

        test('rejectStage maps 11 -> 10, 14 -> 11, 15 -> 14, and 12 -> 15', () => {
            assert.match(controllerContent, /elseif\s*\(\$currentStage\s*===\s*14\)\s*\{\s*\$prevStage\s*=\s*11;/);
            assert.match(controllerContent, /elseif\s*\(\$currentStage\s*===\s*15\)\s*\{\s*\$prevStage\s*=\s*14;/);
            assert.match(controllerContent, /elseif\s*\(\$currentStage\s*===\s*12\)\s*\{\s*\$prevStage\s*=\s*15;/);
        });

        test('reopenJob includes Stage 15 in target_stage validation', () => {
            assert.match(controllerContent, /'target_stage'\s*=>\s*'required\|integer\|in:1,2,3,4,5,6,7,8,9,10,11,(?:12,)?13,14,15'/);
        });

        test('saveStage15Data method exists and saves no_resi and tgl_submit_mkt', () => {
            assert.match(controllerContent, /public\s+function\s+saveStage15Data\(Request\s+\$request,\s+Job\s+\$job\)/);
            assert.match(controllerContent, /SUKET diserahkan\/dikirim ke klien/);
        });
    });

    // ── 4. Routes Registration ────────────────────────────────────────────────
    describe('4. Routes Registration in web.php', () => {
        const routesPath = path.resolve('dnp-rework/routes/web.php');
        const routesContent = fs.readFileSync(routesPath, 'utf8');

        test('web.php registers stage15-data route', () => {
            assert.match(routesContent, /Route::post\('\/jobs\/\{job\}\/stage15-data',\s*\[JobController::class,\s*'saveStage15Data'\]\)->name\('jobs\.stage15-data'\);/);
        });
    });

    // ── 5. Kanban Permissions ─────────────────────────────────────────────────
    describe('5. Kanban Permissions in Kanban/Index.jsx', () => {
        const kanbanPath = path.resolve('dnp-rework/resources/js/Pages/Kanban/Index.jsx');
        const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

        test('Marketing can manage Stage 15 and Manager is excluded from MKT & FIN stages', () => {
            assert.match(kanbanContent, /\[1,\s*11,\s*13,\s*15\]\.includes\(sId\)/);
            assert.match(kanbanContent, /!\[1,\s*10,\s*11,\s*12,\s*13,\s*14,\s*15(?:,\s*16)?\]\.includes\(sId\)/);
        });
    });

    // ── 6. Stage 15 Document Upload & Moving Permissions ──────────────────────
    describe('6. Stage 15 Document Upload & Moving Permissions', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');

        test('uploadDocument validates stage up to 15 or 16', () => {
            assert.match(controllerContent, /'stage'\s*=>\s*'required\|integer\|min:1\|max:1[56]'/);
        });

        test('uploadDocument authorizes Marketing for stage 15 and Finance for 10, 12, 14', () => {
            assert.match(controllerContent, /\$user->role\s*===\s*'marketing'\s*&&\s*in_array\(\(int\)\s*\$request->stage,\s*\[1,\s*11,\s*13,\s*15\]\)/);
            assert.match(controllerContent, /\$user->role\s*===\s*'finance'\s*&&\s*in_array\(\(int\)\s*\$request->stage,\s*\[10,\s*12,\s*14\]\)/);
        });

        test('deleteDocument authorizes Marketing for stage 15 and Finance for 10, 12, 14', () => {
            assert.match(controllerContent, /\$user->role\s*===\s*'marketing'\s*&&\s*in_array\(\(int\)\s*\$document->stage,\s*\[1,\s*11,\s*13,\s*15\]\)/);
            assert.match(controllerContent, /\$user->role\s*===\s*'finance'\s*&&\s*in_array\(\(int\)\s*\$document->stage,\s*\[10,\s*12,\s*14\]\)/);
        });

        test('updateStage allows Marketing to move from Stage 15 to 12 when paid', () => {
            assert.match(controllerContent, /if\s*\(\$currentStage\s*==\s*15\s*&&\s*\(int\)\s*\$request->input\('next_stage'\)\s*===\s*12\)/);
        });
    });

    // ── 7. Frontend Role-Based Stage Permissions ──────────────────────────────
    describe('7. Frontend Role-Based Stage Permissions in JobDetailSheet.jsx', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');

        test('canManage recognizes Marketing for [1, 11, 13, 15] and Finance for [10, 12, 14]', () => {
            assert.match(sheetContent, /user\?\.role\s*===\s*'marketing'\s*&&\s*\[1,\s*11,\s*13,\s*15\]\.includes\(curStage\)/);
            assert.match(sheetContent, /user\?\.role\s*===\s*'finance'\s*&&\s*\[10,\s*12,\s*14\]\.includes\(curStage\)/);
        });

        test('canManageStageDocs recognizes Marketing for [1, 11, 13, 15] and Finance for [10, 12, 14]', () => {
            assert.match(sheetContent, /user\?\.role\s*===\s*'marketing'\s*&&\s*\[1,\s*11,\s*13,\s*15\]\.includes\(sIdNum\)/);
            assert.match(sheetContent, /user\?\.role\s*===\s*'finance'\s*&&\s*\[10,\s*12,\s*14\]\.includes\(sIdNum\)/);
        });
    });

    // ── 8. User Model Default Stage Ownership ────────────────────────────────
    describe('8. User Model Default Stage Ownership in User.php', () => {
        const userModelPath = path.resolve('dnp-rework/app/Models/User.php');
        const userModelContent = fs.readFileSync(userModelPath, 'utf8');

        test('canOwnStage provides default ownership fallbacks for marketing and finance', () => {
            assert.match(userModelContent, /\$this->role\s*===\s*'marketing'\s*&&\s*in_array\(\$stage,\s*\[1,\s*11,\s*13,\s*15\]\)/);
            assert.match(userModelContent, /\$this->role\s*===\s*'finance'\s*&&\s*in_array\(\$stage,\s*\[10,\s*12,\s*14\]\)/);
        });
    });

    // ── 9. Database Migration File ────────────────────────────────────────────
    describe('9. Database Migration File for Stage 15 Permissions', () => {
        const migrationFile = path.resolve('dnp-rework/database/migrations/2026_09_23_000001_seed_stage15_permissions_and_workflow_updates.php');

        test('Migration file exists', () => {
            assert.ok(fs.existsSync(migrationFile), 'Migration file must exist');
        });

        test('Migration file seeds Stage 15 permissions for marketing and 14 for finance', () => {
            const content = fs.readFileSync(migrationFile, 'utf8');
            assert.match(content, /user_stage_permissions/);
            assert.match(content, /15/);
            assert.match(content, /14/);
            assert.match(content, /'role',\s*'marketing'/);
            assert.match(content, /'role',\s*'finance'/);
        });
    });
});
