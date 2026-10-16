import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Kanban Card Visual Redesign & Dual-Wave Test Suite', () => {
    const kanbanIndexPath = path.resolve('dnp-rework/resources/js/Pages/Kanban/Index.jsx');
    const rootPublicDir = path.resolve('public');
    const reworkPublicDir = path.resolve('dnp-rework/public');

    it('1. Vector 630 and Vector 632 SVG assets exist in public folders', () => {
        assert.ok(
            fs.existsSync(path.join(rootPublicDir, 'Vector 630.svg')) ||
            fs.existsSync(path.join(reworkPublicDir, 'Vector 630.svg')),
            'Vector 630.svg must exist'
        );
        assert.ok(
            fs.existsSync(path.join(rootPublicDir, 'Vector 632.svg')) ||
            fs.existsSync(path.join(reworkPublicDir, 'Vector 632.svg')),
            'Vector 632.svg must exist'
        );
    });

    it('2. Kanban/Index.jsx implements dual-layer vector wave with pointer-events-none watermark', () => {
        assert.ok(fs.existsSync(kanbanIndexPath), 'Kanban/Index.jsx must exist');
        const content = fs.readFileSync(kanbanIndexPath, 'utf8');

        // Check for dual vector wave artwork at bottom-right
        assert.match(content, /pointer-events-none/, 'Vector wave must have pointer-events-none so clicks pass through');
        assert.match(content, /absolute\s+bottom-0\s+right-0/, 'Wave must be positioned at bottom-right corner');
        assert.match(content, /#B1DFF7/i, 'Must contain Vector 630 base color (#B1DFF7)');
        assert.match(content, /#4ABFF0/i, 'Must contain Vector 632 cyan gradient color (#4ABFF0)');
    });

    it('3. Kanban cards maintain SLA / Overdue status pill on the bottom right', () => {
        assert.ok(fs.existsSync(kanbanIndexPath), 'Kanban/Index.jsx must exist');
        const content = fs.readFileSync(kanbanIndexPath, 'utf8');

        assert.match(content, /OVERDUE/, 'Must render OVERDUE badge');
        assert.match(content, /rounded-full/, 'Must render rounded pill badges');
        assert.match(content, /relative\s+z-10/, 'Card text and badges must be elevated above background wave');
    });

    it('4. Kanban cards strictly respect isINS role RBAC gating', () => {
        assert.ok(fs.existsSync(kanbanIndexPath), 'Kanban/Index.jsx must exist');
        const content = fs.readFileSync(kanbanIndexPath, 'utf8');

        assert.match(content, /!isINS\s*&&\s*job\.no_po/, 'Must mask or gate PO number when isINS is true');
    });

    it('5. Kanban cards render core job information (client, units, device, marketing owner)', () => {
        assert.ok(fs.existsSync(kanbanIndexPath), 'Kanban/Index.jsx must exist');
        const content = fs.readFileSync(kanbanIndexPath, 'utf8');

        assert.match(content, /job\.klien/, 'Must render job client name');
        assert.match(content, /job\.pesawat/, 'Must render job device name');
        assert.match(content, /job\.owner_marketing/, 'Must render marketing owner');
    });
});
