import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Document Scrollable Preview Modal Test Suite', () => {
    const modalPath = path.resolve('dnp-rework/resources/js/Components/DocumentPreviewModal.jsx');
    const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    it('1. DocumentPreviewModal.jsx exists and exports a React component', () => {
        assert.ok(fs.existsSync(modalPath), 'DocumentPreviewModal.jsx component file must exist');
        const modalContent = fs.readFileSync(modalPath, 'utf8');
        assert.match(modalContent, /export\s+default\s+function\s+DocumentPreviewModal/, 'Must export default DocumentPreviewModal');
    });

    it('2. DocumentPreviewModal detects file types (PDF, Image, Unsupported Office/Other)', () => {
        assert.ok(fs.existsSync(modalPath), 'DocumentPreviewModal.jsx must exist');
        const modalContent = fs.readFileSync(modalPath, 'utf8');
        
        // Checks file extension / mime detection
        assert.match(modalContent, /pdf/i, 'Must handle PDF file types');
        assert.match(modalContent, /iframe|<iframe/i, 'Must render scrollable iframe for PDF files');
        assert.match(modalContent, /img|<img/i, 'Must render responsive image element for image files');
        assert.match(modalContent, /docx|xlsx|format|tidak\s+mendukung/i, 'Must handle Office/unsupported files with an informative fallback');
    });

    it('3. DocumentPreviewModal renders scrollable viewport with max-height bounds', () => {
        assert.ok(fs.existsSync(modalPath), 'DocumentPreviewModal.jsx must exist');
        const modalContent = fs.readFileSync(modalPath, 'utf8');

        assert.match(modalContent, /overflow-(?:y-)?auto/, 'Must use scrollable viewport (overflow-auto or overflow-y-auto)');
        assert.match(modalContent, /max-h-/, 'Must enforce max-height bounds for modal dialog or viewport');
    });

    it('4. DocumentPreviewModal includes header toolbar (download, open tab, close, esc key)', () => {
        assert.ok(fs.existsSync(modalPath), 'DocumentPreviewModal.jsx must exist');
        const modalContent = fs.readFileSync(modalPath, 'utf8');

        assert.match(modalContent, /target=["']_blank["']/, 'Must provide open in new tab action');
        assert.match(modalContent, /download/i, 'Must provide download action in toolbar');
        assert.match(modalContent, /onClose/i, 'Must support onClose callback');
        assert.match(modalContent, /Escape/i, 'Must listen for Escape key to close modal');
    });

    it('5. JobDetailSheet.jsx imports and declares DocumentPreviewModal', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');
        assert.match(
            sheetContent,
            /import\s+DocumentPreviewModal\s+from\s+['"]\.\/DocumentPreviewModal['"]/,
            'JobDetailSheet.jsx must import DocumentPreviewModal'
        );
        assert.match(
            sheetContent,
            /<DocumentPreviewModal[^>]*>/,
            'JobDetailSheet.jsx must render DocumentPreviewModal'
        );
    });

    it('6. JobDetailSheet.jsx maintains previewDoc state and passes to modal', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');
        assert.match(
            sheetContent,
            /const\s*\[\s*previewDoc\s*,\s*setPreviewDoc\s*\]\s*=\s*useState/,
            'JobDetailSheet.jsx must declare previewDoc state'
        );
    });

    it('7. DocChip triggers onPreview / setPreviewDoc while preserving delete stopPropagation and RBAC lock', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');

        // Check DocChip signature and behavior
        assert.match(sheetContent, /const\s+DocChip\s*=\s*\([^)]*onPreview/, 'DocChip must accept onPreview callback prop');
        assert.match(sheetContent, /isPoLockedForIns/, 'DocChip must maintain isPoLockedForIns check');
        assert.match(sheetContent, /e\.stopPropagation\(\)/, 'DocChip delete button must call stopPropagation');
    });

    it('8. Documents Tab (renderDocuments) triggers preview modal on document click', () => {
        const sheetContent = fs.readFileSync(sheetPath, 'utf8');
        assert.match(
            sheetContent,
            /renderDocuments\s*=\s*\(\)\s*=>[\s\S]*?(?:setPreviewDoc|onPreview)\(doc\)/,
            'renderDocuments must trigger preview modal on doc click'
        );
    });
});
