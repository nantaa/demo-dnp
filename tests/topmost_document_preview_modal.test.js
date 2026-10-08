import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Topmost Document Preview & Stage 2 Instant Preview Test Suite', () => {
    const modalPath = path.resolve('dnp-rework/resources/js/Components/DocumentPreviewModal.jsx');
    const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    it('1. DocumentPreviewModal.jsx imports createPortal from react-dom', () => {
        assert.ok(fs.existsSync(modalPath), 'DocumentPreviewModal.jsx must exist');
        const content = fs.readFileSync(modalPath, 'utf8');
        assert.match(content, /import\s*\{[^}]*createPortal[^}]*\}\s*from\s*['"]react-dom['"]/, 'Must import createPortal from react-dom');
    });

    it('2. DocumentPreviewModal.jsx wraps modal in createPortal targeting document.body with z-[9999]', () => {
        const content = fs.readFileSync(modalPath, 'utf8');
        assert.match(content, /createPortal\s*\(/, 'Must invoke createPortal');
        assert.match(content, /document\.body/, 'createPortal must target document.body');
        assert.match(content, /z-\[(?:9999|99999)\]/, 'Backdrop container must use topmost z-index class z-[9999]');
    });

    it('3. JobDetailSheet.jsx Stage 2 checklist table uses preview buttons instead of <a download>', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');
        
        // Find Stage 2 verify checklist section
        const s2SectionMatch = sheetContent.match(/STAGE2_VERIFY_CHECKLIST\.map[\s\S]*?STATUS VERIFIKASI/);
        assert.ok(s2SectionMatch, 'Must find Stage 2 checklist section in JobDetailSheet.jsx');
        const s2Section = s2SectionMatch[0];

        // Must NOT have <a download> in the file slot
        assert.doesNotMatch(
            s2Section,
            /<a\s+[^>]*download[^>]*>/,
            'Stage 2 checklist must NOT render <a download> links in the file column'
        );

        // Must trigger setPreviewDoc(d) or onPreview(d) on button click
        assert.match(
            s2Section,
            /<button\s+[^>]*onClick=\{\(\)\s*=>\s*setPreviewDoc\([a-zA-Z0-9_]+\)\}[^>]*>/,
            'Stage 2 checklist file slot must render a button triggering setPreviewDoc'
        );
    });

    it('4. JobDetailSheet.jsx Stage 2 summary card uses preview buttons instead of <a download>', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');

        // Look for the second STAGE2_VERIFY_CHECKLIST block (completed stage summary)
        const allMatches = [...sheetContent.matchAll(/STAGE2_VERIFY_CHECKLIST\.map/g)];
        assert.ok(allMatches.length >= 2, 'Must have at least 2 STAGE2_VERIFY_CHECKLIST maps (active and summary)');

        // Extract around line 3220-3270 (encompass the full summary card checklist block)
        const summaryArea = sheetContent.slice(sheetContent.indexOf('Hasil Verifikasi Dokumen (Stage 2):'), sheetContent.indexOf('Hasil Verifikasi Dokumen (Stage 2):') + 5000);
        assert.doesNotMatch(
            summaryArea,
            /<a\s+[^>]*download[^>]*>/,
            'Stage 2 summary card must NOT render <a download> links'
        );
        assert.match(
            summaryArea,
            /setPreviewDoc\([a-zA-Z0-9_]+\)/,
            'Stage 2 summary card must trigger setPreviewDoc on click'
        );
    });

    it('5. JobDetailSheet.jsx decouples <form onSubmit={handleMoveStage}> from wrapping timeline to prevent incidental stage moves', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');
        
        // renderStageAction should not wrap the entire multi-stage panel in <form onSubmit={handleMoveStage}>
        assert.doesNotMatch(
            sheetContent,
            /<form\s+onSubmit=\{handleMoveStage\}>/,
            'Timeline panel must NOT be wrapped in <form onSubmit={handleMoveStage}> which triggers incidental stage moves on Enter key'
        );
    });
});
