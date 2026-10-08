import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Kanban Move Buttons & Live Sync Test Suite', () => {
    const sheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const kanbanPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');

    it('1. Stage 2 move button has type="button" and onClick={handleMoveStage}', () => {
        const content = fs.readFileSync(sheetPath, 'utf8');
        // Match the Stage 2 action button
        const stage2Match = content.match(/Verifikasi Selesai\s*—\s*Lanjut Penjadwalan/);
        assert.ok(stage2Match, 'Stage 2 button text must exist');

        // Verify button attributes
        assert.match(
            content,
            /<button[^>]*type="button"[^>]*onClick=\{handleMoveStage\}[^>]*>[^<]*Verifikasi Selesai/s,
            'Stage 2 button must have type="button" and onClick={handleMoveStage}'
        );
    });

    it('2. Stages 5, 6, 9, and 12 action buttons have explicit onClick handlers instead of inert type="submit"', () => {
        const content = fs.readFileSync(sheetPath, 'utf8');

        // Stage 5
        assert.match(
            content,
            /<button[^>]*type="button"[^>]*onClick=\{handleMoveStage\}[^>]*>[^<]*Kirim ke Tim Ahli/s,
            'Stage 5 button must have onClick={handleMoveStage}'
        );

        // Stage 6
        assert.match(
            content,
            /<button[^>]*type="button"[^>]*onClick=\{handleMoveStage\}[^>]*>[^<]*Lanjut ke Stage 7/s,
            'Stage 6 button must have onClick={handleMoveStage}'
        );

        // Stage 9
        assert.match(
            content,
            /<button[^>]*type="button"[^>]*onClick=\{handleMoveStage\}[^>]*>[^<]*Lanjut ke Stage 10/s,
            'Stage 9 button must have onClick={handleMoveStage}'
        );

        // Stage 12 Archive
        assert.match(
            content,
            /<button[^>]*type="button"[^>]*onClick=\{[^}]+\}[^>]*>[^<]*Selesaikan dan Arsipkan Pekerjaan/s,
            'Stage 12 archive button must be type="button" with onClick handler'
        );
    });

    it('3. JobDetailSheet does not contain orphan type="submit" buttons outside of forms', () => {
        const content = fs.readFileSync(sheetPath, 'utf8');

        // Count type="submit" occurrences
        const submitMatches = content.match(/type="submit"/g) || [];
        // Only 3 legitimate form submits exist: handleUpdateJob, handleRevisePo, handleReviseInvoice
        assert.equal(
            submitMatches.length,
            3,
            `Expected exactly 3 legitimate form submit buttons (Edit Job, Revise PO, Revise Invoice), found ${submitMatches.length}`
        );
    });

    it('4. Kanban/Index.jsx background polling interval exists and synchronizes selectedJob state', () => {
        const content = fs.readFileSync(kanbanPath, 'utf8');

        assert.ok(content.includes('router.reload'), 'Kanban must perform router.reload polling');
        assert.match(
            content,
            /useEffect\(\s*\(\)\s*=>\s*\{[^}]*setSelectedJob\(freshJob\)/s,
            'Kanban must synchronize selectedJob with fresh job data from jobs prop'
        );
    });
});
