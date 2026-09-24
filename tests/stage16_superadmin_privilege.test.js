import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { STAGES, FIN_STAGES } from '../dnp-rework/resources/js/Constants.js';

describe('Stage 16 Superadmin Special Privilege Test Suite', () => {

    // ── 1. Constants.js Specification ──────────────────────────────────────────
    describe('1. Constants.js Stage 16 Definition', () => {
        test('Stage 16 exists with role superadmin, hidden: true, displayId: ✓', () => {
            const s16 = STAGES.find(s => s.id === 16);
            assert.ok(s16, 'Stage 16 must exist in STAGES');
            assert.equal(s16.name, 'Selesai');
            assert.equal(s16.role, 'superadmin', 'Stage 16 role MUST be superadmin, not finance');
            assert.equal(s16.hidden, true, 'Stage 16 must be hidden from regular Kanban');
            assert.equal(s16.displayId, '✓');
        });

        test('FIN_STAGES does NOT contain 16 (Finance only owns 10, 14, 12)', () => {
            assert.deepEqual(FIN_STAGES, [10, 14, 12], 'FIN_STAGES must strictly be [10, 14, 12]');
            assert.ok(!FIN_STAGES.includes(16), 'Stage 16 must NOT be in FIN_STAGES');
        });
    });

    // ── 2. JobDetailSheet.jsx Authorization & PIC Badge ─────────────────────────
    describe('2. JobDetailSheet.jsx Permission & PIC Rendering', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');

        test('canManage restricts finance to [10, 12, 14] excluding 16', () => {
            assert.match(sheetContent, /user\?\.role\s*===\s*'finance'\s*&&\s*\[10,\s*12,\s*14\]\.includes\(curStage\)/,
                'canManage curStage finance check must strictly be [10, 12, 14]');
        });

        test('canViewStageDocs and canManageStageDocs restrict finance to [10, 12, 14]', () => {
            assert.match(sheetContent, /user\?\.role\s*===\s*'finance'\s*&&\s*\[10,\s*12,\s*14\]\.includes\(sIdNum\)/,
                'canViewStageDocs / canManageStageDocs must strictly be [10, 12, 14]');
        });

        test('PIC badge renders stage.role which is SUPERADMIN for Stage 16', () => {
            assert.match(sheetContent, /PIC:\s*\{stage\.role\.toUpperCase\(\)\}/);
        });

        test('Stage 16 panel provides restore action exclusively to Superadmin', () => {
            assert.match(sheetContent, /Fitur Khusus Superadmin|Pulihkan Pekerjaan \(Superadmin\)/);
            assert.match(sheetContent, /handleReopenJob/);
        });
    });

    // ── 3. Kanban/Index.jsx Board & Filter ────────────────────────────────────
    describe('3. Kanban/Index.jsx Permissions & Selesai Panel', () => {
        const kanbanPath = path.resolve('dnp-rework/resources/js/Pages/Kanban/Index.jsx');
        const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

        test('canManageStage restricts finance to [10, 12, 14]', () => {
            assert.match(kanbanContent, /auth\.user\?\.role\s*===\s*'finance'\s*&&\s*\[10,\s*12,\s*14\]\.includes\(sId\)/,
                'canManageStage must not include 16 for finance');
        });

        test('Arsip Selesai toggle and board section are restricted to isSuperadmin', () => {
            assert.match(kanbanContent, /isSuperadmin\s*&&\s*\(\s*<button[\s\S]*?Arsip Selesai/);
            assert.match(kanbanContent, /isSuperadmin\s*&&\s*showSelesai/);
        });
    });

    // ── 4. Backend Controller (JobController.php) ──────────────────────────────
    describe('4. Backend JobController.php Authorization Boundaries', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');

        test('FIN_STAGES in JobController is strictly [10, 12, 14]', () => {
            assert.match(controllerContent, /private\s+const\s+FIN_STAGES\s*=\s*\[10,\s*12,\s*14\];/);
        });

        test('canActOnStage restricts finance to [10, 12, 14]', () => {
            assert.match(controllerContent, /if\s*\(in_array\(\$stage,\s*\[10,\s*12,\s*14\]\)\)\s*\{\s*return\s+true;/);
        });

        test('uploadDocument and deleteDocument restrict finance to [10, 12, 14]', () => {
            assert.match(controllerContent, /\$user->role\s*===\s*'finance'\s*&&\s*in_array\(\(int\)\$request->stage,\s*\[10,\s*12,\s*14\]\)/);
            assert.match(controllerContent, /\$user->role\s*===\s*'finance'\s*&&\s*in_array\(\(int\)\$document->stage,\s*\[10,\s*12,\s*14\]\)/);
        });

        test('Stage 12 -> 16 transition allows Finance / Superadmin to archive to vault', () => {
            assert.match(controllerContent, /\$currentStage\s*==\s*12\s*&&\s*\(int\)\$request->input\('next_stage'\)\s*===\s*16/);
        });
    });

    // ── 5. User Model Fallbacks ────────────────────────────────────────────────
    describe('5. User.php Role Fallbacks', () => {
        const userPath = path.resolve('dnp-rework/app/Models/User.php');
        const userContent = fs.readFileSync(userPath, 'utf8');

        test('canOwnStage fallback for Finance is strictly [10, 12, 14]', () => {
            assert.match(userContent, /\$this->role\s*===\s*'finance'\s*&&\s*in_array\(\$stage,\s*\[10,\s*12,\s*14\]\)/);
        });
    });

    // ── 6. Migration File ─────────────────────────────────────────────────────
    describe('6. Migration File Exclusively Seeds Superadmin Permissions', () => {
        const migrationPath = path.resolve('dnp-rework/database/migrations/2026_09_24_000001_add_stage16_selesai_permissions.php');
        const migrationContent = fs.readFileSync(migrationPath, 'utf8');

        test('Migration does NOT grant Stage 16 permissions to finance users', () => {
            assert.ok(!migrationContent.includes("where('role', 'finance')"), 'Migration must not seed stage 16 for finance role');
        });

        test('Migration grants Stage 16 permissions exclusively to superadmin users', () => {
            assert.ok(migrationContent.includes("where('role', 'superadmin')"), 'Migration must seed stage 16 for superadmin role');
        });
    });
});
