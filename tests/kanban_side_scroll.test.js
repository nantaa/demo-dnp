import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Kanban Top Side (Horizontal) Scrollbar Test Suite', () => {
    const kanbanPath = path.resolve('dnp-rework/resources/js/Pages/Kanban/Index.jsx');
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

    test('1. Kanban Index imports ChevronLeft and ChevronRight icons for navigation', () => {
        assert.match(kanbanContent, /ChevronLeft/, 'Must import ChevronLeft');
        assert.match(kanbanContent, /ChevronRight/, 'Must import ChevronRight');
    });

    test('2. Defines boardRef and topScrollRef hooks', () => {
        assert.match(kanbanContent, /const\s+boardRef\s*=\s*useRef\(/, 'Must define boardRef');
        assert.match(kanbanContent, /const\s+topScrollRef\s*=\s*useRef\(/, 'Must define topScrollRef');
    });

    test('3. Implements loop-safe bi-directional scroll synchronization', () => {
        assert.match(kanbanContent, /isSyncing/, 'Must use an isSyncing ref/state flag to prevent recursive scroll loops');
        assert.match(kanbanContent, /handleTopScroll|onScroll=\{\s*\(?\w*\)?\s*=>/, 'Must have scroll handler for top scrollbar');
        assert.match(kanbanContent, /boardRef\.current\.scrollLeft/, 'Must sync board scrollLeft');
        assert.match(kanbanContent, /topScrollRef\.current\.scrollLeft/, 'Must sync topScroll scrollLeft');
    });

    test('4. Renders top horizontal scrollbar directly above the Kanban columns container', () => {
        assert.match(kanbanContent, /ref=\{\s*topScrollRef\s*\}/, 'Top scrollbar container must have ref={topScrollRef}');
        assert.match(kanbanContent, /overflow-x-auto/, 'Top scrollbar container must have overflow-x-auto');
        assert.match(kanbanContent, /ref=\{\s*boardRef\s*\}/, 'Board container must have ref={boardRef}');
    });

    test('5. Dynamically measures and syncs board scroll width', () => {
        assert.match(kanbanContent, /scrollWidth/, 'Must read or track scrollWidth of the board container');
    });

    test('6. Renders quick left/right chevron scroll navigation buttons in header', () => {
        assert.match(kanbanContent, /<ChevronLeft[\s\S]*?\/>/, 'Must render ChevronLeft button');
        assert.match(kanbanContent, /<ChevronRight[\s\S]*?\/>/, 'Must render ChevronRight button');
    });
});
