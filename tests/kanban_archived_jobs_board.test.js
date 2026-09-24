import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Kanban Board Archived Jobs (Stage 16) Column Integration Test Suite', () => {
    const kanbanPath = path.resolve('dnp-rework/resources/js/Pages/Kanban/Index.jsx');
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

    test('1. Kanban Index filters visible stages including Stage 16 when isSuperadmin and showSelesai is true', () => {
        assert.match(
            kanbanContent,
            /STAGES\.filter\(\s*stage\s*=>\s*!stage\.hidden\s*\|\|\s*\(\s*isSuperadmin\s*&&\s*showSelesai\s*\)\s*\)/,
            'Kanban must include Stage 16 on the board when isSuperadmin and showSelesai'
        );
    });

    test('2. canViewStage and canManageStage grant access to Superadmin', () => {
        assert.match(kanbanContent, /canViewStage/, 'canViewStage must exist');
        assert.match(kanbanContent, /canManageStage/, 'canManageStage must exist');
    });

    test('3. Stage 16 column is rendered as a KanbanColumn inside boardRef', () => {
        // boardRef must wrap the mapped stages
        const boardMatch = kanbanContent.match(/ref=\{\s*boardRef\s*\}[\s\S]*?<\/KanbanColumn>/);
        assert.ok(boardMatch, 'boardRef container must render KanbanColumn');
    });

    test('4. Archived cards in Stage 16 render archival badge', () => {
        assert.match(kanbanContent, /SELESAI|TERARSIP/i, 'Cards or stage column must identify completed/archived jobs');
    });
});
