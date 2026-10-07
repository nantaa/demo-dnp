import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('JobDetailSheet Stage Accordion (Dropdown) & Auto-Scroll Test Suite', () => {
    const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    it('1. JobDetailSheet imports ChevronDown icon from lucide-react', () => {
        assert.match(
            sheetContent,
            /import\s*\{[^}]*ChevronDown[^}]*\}\s*from\s*['"]lucide-react['"]/,
            'JobDetailSheet.jsx must import ChevronDown icon from lucide-react'
        );
    });

    it('2. JobDetailSheet maintains expandedStages state and toggleStage function', () => {
        assert.match(
            sheetContent,
            /expandedStages,\s*setExpandedStages/,
            'JobDetailSheet.jsx must declare expandedStages state'
        );
        assert.match(
            sheetContent,
            /const\s+toggleStage\s*=\s*\(stageId\)\s*=>/,
            'JobDetailSheet.jsx must declare toggleStage function'
        );
        assert.match(
            sheetContent,
            /const\s+expandAllStages\s*=\s*\(\)\s*=>/,
            'JobDetailSheet.jsx must declare expandAllStages function'
        );
        assert.match(
            sheetContent,
            /const\s+collapseAllStages\s*=\s*\(\)\s*=>/,
            'JobDetailSheet.jsx must declare collapseAllStages function'
        );
    });

    it('3. JobDetailSheet defines scrollToStage and stageRefs for smooth navigation', () => {
        assert.match(
            sheetContent,
            /const\s+stageRefs\s*=\s*useRef\(\{\}\)/,
            'JobDetailSheet.jsx must define stageRefs useRef dictionary'
        );
        assert.match(
            sheetContent,
            /const\s+scrollToStage\s*=\s*\(stageId/,
            'JobDetailSheet.jsx must define scrollToStage handler'
        );
        assert.match(
            sheetContent,
            /scrollIntoView\(\{\s*behavior:\s*smooth\s*\?\s*['"]smooth['"]\s*:\s*['"]auto['"]/,
            'scrollToStage must call scrollIntoView'
        );
    });

    it('4. JobDetailSheet automatically triggers auto-scroll to current stage on mount/timeline tab', () => {
        assert.match(
            sheetContent,
            /if\s*\(\s*activeTab\s*===\s*['"]timeline['"]\s*\)\s*\{[\s\S]*stageRefs\.current\[job\.stage\][\s\S]*scrollIntoView/,
            'JobDetailSheet.jsx must contain useEffect auto-scrolling to active job.stage'
        );
    });

    it('5. renderTimeline renders quick-jump dropdown and expand/collapse buttons in top toolbar', () => {
        assert.match(
            sheetContent,
            /Lompat ke:/,
            'renderTimeline must include Lompat ke: label'
        );
        assert.match(
            sheetContent,
            /<select[\s\S]*onChange=\{[\s\S]*scrollToStage\(targetId/,
            'renderTimeline must have a select dropdown that calls scrollToStage'
        );
        assert.match(
            sheetContent,
            /Buka Semua/,
            'renderTimeline must provide Buka Semua button'
        );
        assert.match(
            sheetContent,
            /Tutup Semua/,
            'renderTimeline must provide Tutup Semua button'
        );
    });

    it('6. Every stage card has ref attached and an interactive clickable header with ChevronDown', () => {
        assert.match(
            sheetContent,
            /ref=\{el\s*=>\s*stageRefs\.current\[stage\.id\]\s*=\s*el\}/,
            'Each stage card must assign its DOM element to stageRefs.current[stage.id]'
        );
        assert.match(
            sheetContent,
            /onClick=\{\(\)\s*=>\s*toggleStage\(stage\.id\)\}/,
            'Stage header must have onClick handler invoking toggleStage'
        );
        assert.match(
            sheetContent,
            /<ChevronDown\s+size=\{15\}\s*\/>/,
            'Stage header must render ChevronDown icon indicator'
        );
    });
});
