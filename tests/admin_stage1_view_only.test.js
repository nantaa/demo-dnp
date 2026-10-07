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

describe('Admin Stage 1 View-Only Permissions Test Suite', () => {

    describe('1. Frontend Permissions in JobDetailSheet.jsx', () => {
        const content = fs.readFileSync(detailSheetPath, 'utf8');

        it('canViewStageDocs grants Admin view access to Stage 1', () => {
            assert.ok(
                content.includes("['superadmin','admin','manager'].includes(user?.role)"),
                'canViewStageDocs must allow admin to view documents'
            );
        });

        it('canManageStageDocs strictly disallows Admin on Stage 1 while permitting other stages', () => {
            // Find canManageStageDocs definition
            const start = content.indexOf('const canManageStageDocs = (sid) => {');
            assert.ok(start !== -1, 'canManageStageDocs must exist');
            const end = content.indexOf('const stage1DocOk =', start);
            const body = content.slice(start, end);

            assert.ok(
                body.includes("user?.role === 'admin'") &&
                body.includes('sIdNum === 1') &&
                body.includes('return false'),
                'canManageStageDocs must return false for admin on Stage 1'
            );

            // Simulate the exact logic
            const simulateCanManageStageDocs = (userRole, sid) => {
                const sIdNum = Number(sid);
                if (['superadmin', 'manager'].includes(userRole)) return true;
                if (userRole === 'admin') {
                    if (sIdNum === 1) return false;
                    return true;
                }
                return false;
            };

            assert.equal(simulateCanManageStageDocs('admin', 1), false, 'Admin cannot manage Stage 1 docs');
            assert.equal(simulateCanManageStageDocs('admin', 2), true, 'Admin can manage Stage 2 docs');
            assert.equal(simulateCanManageStageDocs('superadmin', 1), true, 'Superadmin can manage Stage 1 docs');
        });

        it('canManage disallows Admin from moving or managing active Stage 1', () => {
            const start = content.indexOf('const canManage = (() => {');
            assert.ok(start !== -1, 'canManage must exist');
            const end = content.indexOf('const canViewStageDocs = (sid) => {', start);
            const body = content.slice(start, end);

            assert.ok(
                body.includes("user?.role === 'admin'") && body.includes('curStage !== 1'),
                'canManage must ensure admin cannot manage when curStage is 1'
            );

            // Simulate the exact logic
            const simulateCanManage = (userRole, curStage) => {
                if (userRole === 'superadmin') return true;
                if (curStage === 16) return false;
                if (userRole === 'admin') return curStage !== 1;
                return false;
            };

            assert.equal(simulateCanManage('admin', 1), false, 'Admin cannot manage Stage 1');
            assert.equal(simulateCanManage('admin', 2), true, 'Admin can manage Stage 2');
            assert.equal(simulateCanManage('superadmin', 1), true, 'Superadmin can manage Stage 1');
        });

        it('UploadSlot conditionally hides "+ Upload" button and ignores drag/drop when canManage is false', () => {
            const start = content.indexOf('const UploadSlot =');
            assert.ok(start !== -1, 'UploadSlot must exist');
            const end = content.indexOf('export default function JobDetailSheet', start);
            const body = content.slice(start, end);

            assert.ok(
                body.includes('const canManage = typeof canManageStageDocs === \'function\' ? canManageStageDocs(stageId) : true;'),
                'UploadSlot must resolve canManage from canManageStageDocs'
            );

            assert.ok(
                body.includes('{canManage && (') && body.includes('+ Upload'),
                'UploadSlot must hide + Upload button when canManage is false'
            );

            assert.ok(
                body.includes('if (!canManage) return;') && body.includes('handleDrop'),
                'UploadSlot must block drag/drop when canManage is false'
            );
        });

        it('uploadFileDirectly and deleteDoc enforce client-side permission checks', () => {
            assert.ok(
                content.includes('if (!canManageStageDocs(stageId))'),
                'uploadFileDirectly must reject if !canManageStageDocs(stageId)'
            );
            assert.ok(
                content.includes('if (doc && !canManageStageDocs(doc.stage))'),
                'deleteDoc must reject if !canManageStageDocs(doc.stage)'
            );
        });
    });

    describe('2. Backend Authorization in JobController.php', () => {
        const content = fs.readFileSync(jobControllerPath, 'utf8');

        it('canActOnStage disallows Admin on Stage 1', () => {
            const start = content.indexOf('private function canActOnStage');
            assert.ok(start !== -1, 'canActOnStage must exist');
            const end = content.indexOf('public function create()', start);
            const body = content.slice(start, end);

            assert.ok(
                body.includes("$user->role === 'admin'") &&
                body.includes('$stage === 1') &&
                body.includes('return false;'),
                'canActOnStage must return false for admin on Stage 1'
            );
        });

        it('uploadDocument explicitly blocks Admin from uploading on Stage 1 with 403', () => {
            const start = content.indexOf('public function uploadDocument');
            assert.ok(start !== -1, 'uploadDocument must exist');
            const end = content.indexOf('public function deleteDocument', start);
            const body = content.slice(start, end);

            assert.ok(
                body.includes("$user->role === 'admin' && (int)$request->stage === 1") &&
                body.includes('abort(403'),
                'uploadDocument must explicitly abort 403 for admin on Stage 1'
            );

            assert.ok(
                body.includes("($user->role === 'admin' && (int)$request->stage !== 1)"),
                'uploadDocument $canUpload must exclude Stage 1 for admin'
            );
        });

        it('deleteDocument explicitly blocks Admin from deleting Stage 1 documents with 403', () => {
            const start = content.indexOf('public function deleteDocument');
            assert.ok(start !== -1, 'deleteDocument must exist');
            const end = content.indexOf('public function getJobs', start);
            const body = content.slice(start, end);

            assert.ok(
                body.includes("$user->role === 'admin' && (int)$document->stage === 1") &&
                body.includes('abort(403'),
                'deleteDocument must explicitly abort 403 for admin on Stage 1'
            );

            assert.ok(
                body.includes("($user->role === 'admin' && (int)$document->stage !== 1)"),
                'deleteDocument $canDelete must exclude Stage 1 for admin'
            );
        });

        it('Job creation is protected for Marketing and disallows Admin', () => {
            assert.ok(
                content.includes("Unauthorized to create jobs. Stage 1 is owned by Marketing."),
                'create and store must restrict Stage 1 job creation'
            );
        });
    });

    describe('3. Kanban Stage Permissions in Kanban/Index.jsx', () => {
        const content = fs.readFileSync(kanbanPath, 'utf8');

        it('canViewStage allows Admin to view Stage 1 on Kanban board', () => {
            assert.ok(
                content.includes("auth.user?.role === 'admin'"),
                'canViewStage must allow admin to view stages'
            );
        });

        it('canManageStage restricts Admin to stages [2, 3, 7, 8, 9] (excluding Stage 1)', () => {
            assert.ok(
                content.includes("auth.user?.role === 'admin' && [2, 3, 7, 8, 9].includes(sId)"),
                'Admin cannot manage Stage 1 on Kanban'
            );
        });
    });
});
