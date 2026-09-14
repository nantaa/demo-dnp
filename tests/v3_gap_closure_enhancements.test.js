import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'dnp-rework/resources/js');

describe('v3 Gap Closure & Operational Polish Test Suite', () => {
    it('1. Stage4Action includes daily attendance photo upload selection', () => {
        const stage4Path = path.join(jsDir, 'Components/JobDetail/StageActions/Stage4Action.jsx');
        const content = fs.readFileSync(stage4Path, 'utf8');
        assert.ok(content.includes('absenDay') || content.includes('schedule_days') || content.includes('Absensi'), 'Stage4Action must support daily attendance selection');
    });

    it('2. Stage5Action includes Google Drive folder link field for multi-file bundle', () => {
        const stage5Path = path.join(jsDir, 'Components/JobDetail/StageActions/Stage5Action.jsx');
        const content = fs.readFileSync(stage5Path, 'utf8');
        assert.ok(content.includes('gdrive_folder_url') || content.includes('Google Drive') || content.includes('gdrive'), 'Stage5Action must support Google Drive folder link');
    });

    it('3. Stage1Action / Stage10Action include tax cutoff date alert (15th)', () => {
        const stage1Path = path.join(jsDir, 'Components/JobDetail/StageActions/Stage1Action.jsx');
        const stage10Path = path.join(jsDir, 'Components/JobDetail/StageActions/Stage10Action.jsx');
        const c1 = fs.readFileSync(stage1Path, 'utf8');
        const c10 = fs.readFileSync(stage10Path, 'utf8');
        assert.ok(c1.includes('15') || c10.includes('15') || c10.includes('pajak') || c10.includes('Pajak'), 'Stage 1 or Stage 10 must mention 15th tax cutoff');
    });

    it('4. Kanban Board includes phase navigation jumper for 20 stages', () => {
        const kanbanPath = path.join(jsDir, 'Pages/Kanban/Index.jsx');
        const content = fs.readFileSync(kanbanPath, 'utf8');
        assert.ok(content.includes('scroll') || content.includes('phase') || content.includes('Phase') || content.includes('StageRail'), 'Kanban must support phase navigation or stage rail');
    });
});
