import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
const kanbanPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');
const jobDetailPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const dashboardCtrlPath = path.join(rootDir, 'dnp-rework/app/Http/Controllers/DashboardController.php');
const jobCtrlPath = path.join(rootDir, 'dnp-rework/app/Http/Controllers/JobController.php');
const recoServicePath = path.join(rootDir, 'dnp-rework/app/Services/InspectorRecommendationService.php');
const digestServicePath = path.join(rootDir, 'dnp-rework/app/Services/DailyDigestService.php');
const notificationBellPath = path.join(rootDir, 'dnp-rework/resources/js/Components/NotificationBell.jsx');
const appLayoutPath = path.join(rootDir, 'dnp-rework/resources/js/Layouts/AppLayout.jsx');

describe('Comprehensive Tim RU Role Parity & Security Gating Suite', () => {
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');
    const jobDetailContent = fs.readFileSync(jobDetailPath, 'utf8');
    const dashboardCtrlContent = fs.readFileSync(dashboardCtrlPath, 'utf8');
    const jobCtrlContent = fs.readFileSync(jobCtrlPath, 'utf8');
    const recoServiceContent = fs.readFileSync(recoServicePath, 'utf8');
    const digestServiceContent = fs.readFileSync(digestServicePath, 'utf8');
    const notificationBellContent = fs.readFileSync(notificationBellPath, 'utf8');
    const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');

    it('1. Constants.js: exports RU_ROLES containing inspektur, inspector, and tim_ru', () => {
        assert.ok(constantsContent.includes('RU_ROLES'), 'Constants.js must export RU_ROLES');
        assert.ok(
            constantsContent.includes("'tim_ru'") &&
            constantsContent.includes("'inspektur'") &&
            constantsContent.includes("'inspector'"),
            'RU_ROLES must include tim_ru, inspektur, and inspector'
        );
    });

    it('2. Kanban/Index.jsx: isINS and permission checks include tim_ru', () => {
        // Line 12 isINS
        assert.match(
            kanbanContent,
            /isINS\s*=\s*\[[^\]]*'tim_ru'[^\]]*\]\.includes/,
            'Kanban/Index.jsx isINS must include tim_ru'
        );
        // canManageStage
        assert.match(
            kanbanContent,
            /canManageStage[\s\S]*?\['inspektur',\s*'inspector',\s*'tim_ru'\]\.includes/,
            'Kanban canManageStage must include tim_ru'
        );
        // canViewStage
        assert.match(
            kanbanContent,
            /canViewStage[\s\S]*?\['inspektur',\s*'inspector',\s*'tim_ru'\]\.includes/,
            'Kanban canViewStage must include tim_ru'
        );
    });

    it('3. JobDetailSheet.jsx: isINS and isInspector include tim_ru, ensuring canSeeNilai is false', () => {
        assert.match(
            jobDetailContent,
            /isINS\s*=\s*\[[^\]]*'tim_ru'[^\]]*\]\.includes/,
            'JobDetailSheet.jsx isINS must include tim_ru'
        );
        assert.match(
            jobDetailContent,
            /isInspector\s*=[\s\S]*?'tim_ru'/,
            'JobDetailSheet.jsx isInspector must include tim_ru'
        );
    });

    it('4. DashboardController.php: filters out PO/SPK documents for tim_ru role', () => {
        assert.match(
            dashboardCtrlContent,
            /\$isIns\s*=\s*\$user\s*&&\s*in_array\(\$user->role,\s*\[[^\]]*'tim_ru'[^\]]*\]\)/,
            'DashboardController.php must include tim_ru in $isIns check to filter PO/SPK docs'
        );
    });

    it('5. JobController.php: canActOnStage, downloadDocument, and uploadDocument recognize tim_ru', () => {
        // downloadDocument blocking PO
        assert.match(
            jobCtrlContent,
            /\$isIns\s*=\s*\$user\s*&&\s*in_array\(\$user->role,\s*\[[^\]]*'tim_ru'[^\]]*\]\)/,
            'JobController.php downloadDocument must include tim_ru to block PO download'
        );
        // uploadDocument
        assert.match(
            jobCtrlContent,
            /\$isInspector\s*=\s*in_array\(\$user->role,\s*\[[^\]]*'tim_ru'[^\]]*\]\)/,
            'JobController.php uploadDocument must recognize tim_ru as an inspector'
        );
    });

    it('6. Backend Services: InspectorRecommendationService and DailyDigestService include tim_ru', () => {
        assert.match(
            recoServiceContent,
            /whereIn\('role',\s*\[[^\]]*'tim_ru'[^\]]*\]\)/,
            'InspectorRecommendationService must include tim_ru in candidate pool'
        );
        assert.match(
            digestServiceContent,
            /in_array\(\$role,\s*\[[^\]]*'tim_ru'[^\]]*\]\)/,
            'DailyDigestService must recognize tim_ru role'
        );
    });

    it('7. AppLayout.jsx & NotificationBell.jsx: include tim_ru in role lists', () => {
        assert.match(
            notificationBellContent,
            /isINS\s*=\s*\[[^\]]*'tim_ru'[^\]]*\]\.includes/,
            'NotificationBell must include tim_ru in isINS check'
        );
        assert.match(
            appLayoutContent,
            /roles:\s*\[[^\]]*'tim_ru'[^\]]*\]/,
            'AppLayout inventory navigation must include tim_ru'
        );
    });
});
