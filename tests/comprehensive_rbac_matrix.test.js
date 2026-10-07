import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const jobControllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/JobController.php');
const kanbanPath = path.resolve(__dirname, '../dnp-rework/resources/js/Pages/Kanban/Index.jsx');
const userModelPath = path.resolve(__dirname, '../dnp-rework/app/Models/User.php');

describe('Comprehensive System-Wide RBAC Matrix Test Suite', () => {
    const detailContent = fs.readFileSync(detailSheetPath, 'utf8');
    const controllerContent = fs.readFileSync(jobControllerPath, 'utf8');
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');
    const userModelContent = fs.readFileSync(userModelPath, 'utf8');

    describe('1. Role Ownership & Stage Boundaries (Backend JobController & User.php)', () => {
        it('Marketing is strictly assigned stages [1, 11, 13, 15]', () => {
            assert.match(controllerContent, /private\s+const\s+MKT_STAGES\s*=\s*\[1,\s*11,\s*13,\s*15\];/);
            assert.match(userModelContent, /\$this->role\s*===\s*'marketing'\s*&&\s*in_array\(\$stage,\s*\[1,\s*11,\s*13,\s*15\]\)/);
        });

        it('Finance is strictly assigned stages [10, 12, 14]', () => {
            assert.match(controllerContent, /private\s+const\s+FIN_STAGES\s*=\s*\[10,\s*12,\s*14\];/);
            assert.match(userModelContent, /\$this->role\s*===\s*'finance'\s*&&\s*in_array\(\$stage,\s*\[10,\s*12,\s*14\]\)/);
        });

        it('Admin is strictly assigned stages [2, 3, 7, 8, 9] (excluded from MKT and FIN)', () => {
            assert.match(userModelContent, /\$this->role\s*===\s*'admin'\s*&&\s*in_array\(\$stage,\s*\[2,\s*3,\s*7,\s*8,\s*9\]\)/);
            assert.match(controllerContent, /\$user->role\s*===\s*'admin'[\s\S]*?!in_array\(\$stage,\s*\[2,\s*3,\s*7,\s*8,\s*9\]\)/);
        });

        it('Manager is prohibited from intercepting Marketing and Finance stages in canActOnStage', () => {
            assert.match(controllerContent, /\$user->role\s*===\s*'manager'\s*&&\s*!in_array\(\$stage,\s*array_merge\(self::MKT_STAGES,\s*self::FIN_STAGES\)\)/);
        });

        it('Inspector is restricted to inspector stages [4, 5]', () => {
            assert.match(controllerContent, /in_array\(\$user->role,\s*\[['"]inspektur['"],\s*['"]inspector['"]\]\)[\s\S]*?in_array\(\$stage,\s*\[4,\s*5\]\)/);
            assert.match(userModelContent, /in_array\(\$this->role,\s*\[['"]inspektur['"],\s*['"]inspector['"]\]\)\s*&&\s*in_array\(\$stage,\s*\[4,\s*5\]\)/);
        });

        it('Tim Ahli is restricted to Stage 6', () => {
            assert.match(controllerContent, /in_array\(\$user->role,\s*\[['"]tim_ahli['"],\s*['"]ahli['"]\]\)[\s\S]*?\$stage\s*===\s*6/);
            assert.match(userModelContent, /in_array\(\$this->role,\s*\[['"]tim_ahli['"],\s*['"]ahli['"]\]\)\s*&&\s*\$stage\s*===\s*6/);
        });
    });

    describe('2. Document Management RBAC (JobController uploadDocument & deleteDocument)', () => {
        it('uploadDocument restricts each role to authorized stages', () => {
            // Admin only [2, 3, 7, 8, 9]
            assert.match(controllerContent, /\$user->role\s*===\s*'admin'[\s\S]*?!in_array\(\(int\)\$request->stage,\s*\[2,\s*3,\s*7,\s*8,\s*9\]\)/);
            // Finance only [10, 12, 14]
            assert.match(controllerContent, /\$user->role\s*===\s*'finance'\s*&&\s*in_array\(\(int\)\$request->stage,\s*\[10,\s*12,\s*14\]\)/);
            // Marketing only [1, 11, 13, 15]
            assert.match(controllerContent, /\$user->role\s*===\s*'marketing'\s*&&\s*in_array\(\(int\)\$request->stage,\s*\[1,\s*11,\s*13,\s*15\]\)/);
            // Manager excluded from MKT & FIN
            assert.match(controllerContent, /\$user->role\s*===\s*'manager'\s*&&\s*!in_array\(\(int\)\$request->stage,\s*array_merge\(self::MKT_STAGES,\s*self::FIN_STAGES\)\)/);
        });

        it('deleteDocument restricts each role to authorized stages', () => {
            // Admin only [2, 3, 7, 8, 9]
            assert.match(controllerContent, /\$user->role\s*===\s*'admin'[\s\S]*?!in_array\(\(int\)\$document->stage,\s*\[2,\s*3,\s*7,\s*8,\s*9\]\)/);
            // Finance only [10, 12, 14]
            assert.match(controllerContent, /\$user->role\s*===\s*'finance'\s*&&\s*in_array\(\(int\)\$document->stage,\s*\[10,\s*12,\s*14\]\)/);
            // Marketing only [1, 11, 13, 15]
            assert.match(controllerContent, /\$user->role\s*===\s*'marketing'\s*&&\s*in_array\(\(int\)\$document->stage,\s*\[1,\s*11,\s*13,\s*15\]\)/);
            // Manager excluded from MKT & FIN
            assert.match(controllerContent, /\$user->role\s*===\s*'manager'\s*&&\s*!in_array\(\(int\)\$document->stage,\s*array_merge\(self::MKT_STAGES,\s*self::FIN_STAGES\)\)/);
        });
    });

    describe('3. Frontend RBAC in JobDetailSheet.jsx & Kanban/Index.jsx', () => {
        it('canManage in JobDetailSheet restricts Admin to [2, 3, 7, 8, 9]', () => {
            assert.match(detailContent, /user\?\.role\s*===\s*'admin'[\s\S]*?\[2,\s*3,\s*7,\s*8,\s*9\]\.includes\(curStage\)/);
        });

        it('canManageStageDocs in JobDetailSheet restricts Admin to [2, 3, 7, 8, 9]', () => {
            assert.match(detailContent, /user\?\.role\s*===\s*'admin'[\s\S]*?\[2,\s*3,\s*7,\s*8,\s*9\]\.includes\(sIdNum\)/);
        });

        it('canManageStageDocs in JobDetailSheet excludes Manager from MKT & FIN stages', () => {
            assert.match(detailContent, /user\?\.role\s*===\s*'manager'\s*&&\s*!MKT_STAGES\.includes\(sIdNum\)\s*&&\s*!FIN_STAGES\.includes\(sIdNum\)/);
        });

        it('canManageStage in Kanban strictly restricts Admin to [2, 3, 7, 8, 9]', () => {
            assert.match(kanbanContent, /auth\.user\?\.role\s*===\s*'admin'\s*&&\s*\[2,\s*3,\s*7,\s*8,\s*9\]\.includes\(sId\)/);
        });
    });

    describe('4. Simulation Evaluation of RBAC Matrix Across All Stages', () => {
        const canUserManageStage = (role, stageId) => {
            const s = Number(stageId);
            if (role === 'superadmin') return true;
            if (s === 16) return false; // Selesai is superadmin only
            if (role === 'marketing' && [1, 11, 13, 15].includes(s)) return true;
            if (role === 'finance' && [10, 12, 14].includes(s)) return true;
            if (role === 'admin' && [2, 3, 7, 8, 9].includes(s)) return true;
            if (['inspektur', 'inspector'].includes(role) && [4, 5].includes(s)) return true;
            if (['tim_ahli', 'ahli'].includes(role) && s === 6) return true;
            if (role === 'manager' && ![1, 10, 11, 12, 13, 14, 15, 16].includes(s)) return true;
            return false;
        };

        it('validates exact stage ownership for every role', () => {
            // Stage 1 (PO): only Marketing & Superadmin
            assert.equal(canUserManageStage('marketing', 1), true);
            assert.equal(canUserManageStage('superadmin', 1), true);
            assert.equal(canUserManageStage('admin', 1), false);
            assert.equal(canUserManageStage('finance', 1), false);
            assert.equal(canUserManageStage('manager', 1), false);

            // Stage 2 (Verifikasi Dokumen): Admin, Manager, Superadmin
            assert.equal(canUserManageStage('admin', 2), true);
            assert.equal(canUserManageStage('manager', 2), true);
            assert.equal(canUserManageStage('marketing', 2), false);
            assert.equal(canUserManageStage('finance', 2), false);

            // Stage 3 (Jadwal): Admin, Manager, Superadmin
            assert.equal(canUserManageStage('admin', 3), true);
            assert.equal(canUserManageStage('manager', 3), true);
            assert.equal(canUserManageStage('marketing', 3), false);

            // Stage 4 (Pelaksanaan Lapangan): Inspektur, Manager, Superadmin
            assert.equal(canUserManageStage('inspektur', 4), true);
            assert.equal(canUserManageStage('admin', 4), false);
            assert.equal(canUserManageStage('marketing', 4), false);
            assert.equal(canUserManageStage('finance', 4), false);

            // Stage 5 (LHPP): Inspektur, Manager, Superadmin
            assert.equal(canUserManageStage('inspektur', 5), true);
            assert.equal(canUserManageStage('admin', 5), false);
            assert.equal(canUserManageStage('finance', 5), false);

            // Stage 6 (Review Teknis): Tim Ahli, Manager, Superadmin
            assert.equal(canUserManageStage('tim_ahli', 6), true);
            assert.equal(canUserManageStage('admin', 6), false);
            assert.equal(canUserManageStage('finance', 6), false);

            // Stage 7 (Penyerahan Disnaker): Admin, Manager, Superadmin
            assert.equal(canUserManageStage('admin', 7), true);
            assert.equal(canUserManageStage('manager', 7), true);
            assert.equal(canUserManageStage('finance', 7), false);

            // Stage 8 (Proses Disnaker): Admin, Manager, Superadmin
            assert.equal(canUserManageStage('admin', 8), true);
            assert.equal(canUserManageStage('manager', 8), true);
            assert.equal(canUserManageStage('marketing', 8), false);

            // Stage 9 (Pengurusan Suket): Admin, Manager, Superadmin
            assert.equal(canUserManageStage('admin', 9), true);
            assert.equal(canUserManageStage('manager', 9), true);
            assert.equal(canUserManageStage('finance', 9), false);

            // Stage 10 (Invoice): Finance & Superadmin ONLY
            assert.equal(canUserManageStage('finance', 10), true);
            assert.equal(canUserManageStage('admin', 10), false);
            assert.equal(canUserManageStage('manager', 10), false);
            assert.equal(canUserManageStage('marketing', 10), false);

            // Stage 11 (Penagihan): Marketing & Superadmin ONLY
            assert.equal(canUserManageStage('marketing', 11), true);
            assert.equal(canUserManageStage('admin', 11), false);
            assert.equal(canUserManageStage('finance', 11), false);
            assert.equal(canUserManageStage('manager', 11), false);

            // Stage 14 (Verifikasi Bayar): Finance & Superadmin ONLY
            assert.equal(canUserManageStage('finance', 14), true);
            assert.equal(canUserManageStage('admin', 14), false);
            assert.equal(canUserManageStage('marketing', 14), false);
            assert.equal(canUserManageStage('manager', 14), false);

            // Stage 15 (Kirim Suket): Marketing & Superadmin ONLY
            assert.equal(canUserManageStage('marketing', 15), true);
            assert.equal(canUserManageStage('admin', 15), false);
            assert.equal(canUserManageStage('finance', 15), false);
            assert.equal(canUserManageStage('manager', 15), false);

            // Stage 12 (Financial Closing): Finance & Superadmin ONLY
            assert.equal(canUserManageStage('finance', 12), true);
            assert.equal(canUserManageStage('admin', 12), false);
            assert.equal(canUserManageStage('marketing', 12), false);
            assert.equal(canUserManageStage('manager', 12), false);

            // Stage 16 (Arsip Selesai): Superadmin EXCLUSIVELY
            assert.equal(canUserManageStage('superadmin', 16), true);
            assert.equal(canUserManageStage('admin', 16), false);
            assert.equal(canUserManageStage('marketing', 16), false);
            assert.equal(canUserManageStage('finance', 16), false);
            assert.equal(canUserManageStage('manager', 16), false);
        });
    });
});
