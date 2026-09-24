import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('JobDetail Modular Architecture Test Suite', () => {
    const baseDir = path.resolve('dnp-rework/resources/js/Components/JobDetail');

    test('1. Common subcomponents directory exists with core UI units', () => {
        const commonDir = path.join(baseDir, 'Common');
        assert.ok(fs.existsSync(commonDir), 'Common directory must exist');
        assert.ok(fs.existsSync(path.join(commonDir, 'DocChip.jsx')), 'DocChip.jsx must exist');
        assert.ok(fs.existsSync(path.join(commonDir, 'UploadSlot.jsx')), 'UploadSlot.jsx must exist');
        assert.ok(fs.existsSync(path.join(commonDir, 'MoveRow.jsx')), 'MoveRow.jsx must exist');
        assert.ok(fs.existsSync(path.join(commonDir, 'NoteField.jsx')), 'NoteField.jsx must exist');
    });

    test('2. Modals directory exists with popup forms', () => {
        const modalsDir = path.join(baseDir, 'Modals');
        assert.ok(fs.existsSync(modalsDir), 'Modals directory must exist');
        assert.ok(fs.existsSync(path.join(modalsDir, 'RevisePoModal.jsx')), 'RevisePoModal.jsx must exist');
        assert.ok(fs.existsSync(path.join(modalsDir, 'ReviseInvoiceModal.jsx')), 'ReviseInvoiceModal.jsx must exist');
    });

    test('3. Tabs directory exists with auxiliary tab views', () => {
        const tabsDir = path.join(baseDir, 'Tabs');
        assert.ok(fs.existsSync(tabsDir), 'Tabs directory must exist');
        assert.ok(fs.existsSync(path.join(tabsDir, 'DocumentsTab.jsx')), 'DocumentsTab.jsx must exist');
        assert.ok(fs.existsSync(path.join(tabsDir, 'TimelineTab.jsx')), 'TimelineTab.jsx must exist');
        assert.ok(fs.existsSync(path.join(tabsDir, 'EditInfoTab.jsx')), 'EditInfoTab.jsx must exist');
    });

    test('4. StageActions directory contains all 16 stage modules', () => {
        const stagesDir = path.join(baseDir, 'StageActions');
        assert.ok(fs.existsSync(stagesDir), 'StageActions directory must exist');
        const expectedStages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        for (const s of expectedStages) {
            assert.ok(
                fs.existsSync(path.join(stagesDir, `Stage${s}Action.jsx`)),
                `Stage${s}Action.jsx must exist in StageActions/`
            );
        }
    });

    test('5. JobDetailSheet.jsx coordinates modular components and remains lean', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');
        assert.match(sheetContent, /from\s+['"]\.\/JobDetail\//, 'JobDetailSheet must import from ./JobDetail/');
        
        // Assert significant reduction from 3,637 lines
        const lineCount = sheetContent.split('\n').length;
        assert.ok(lineCount < 1200, `JobDetailSheet should be streamlined (current: ${lineCount} lines, expected < 1200)`);
    });
});
