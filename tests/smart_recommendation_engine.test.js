import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Smart Recommendation Engine Bugfix & Data Integrity Test Suite', () => {
    const servicePath = path.resolve('dnp-rework/app/Services/InspectorRecommendationService.php');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    it('1. InspectorRecommendationService counts both Stage 12 and Stage 16 for klien experience', () => {
        assert.match(
            serviceContent,
            /whereIn\(\s*['"]dnp_jobs\.stage['"]\s*,\s*\[12,\s*16\]\s*\)/,
            'klien experience query must count both Stage 12 (Completed) and Stage 16 (Archived)'
        );
    });

    it('2. InspectorRecommendationService counts both Stage 12 and Stage 16 for pesawat experience', () => {
        const matches = serviceContent.match(/whereIn\(\s*['"]dnp_jobs\.stage['"]\s*,\s*\[12,\s*16\]\s*\)/g);
        assert.ok(
            matches && matches.length >= 2,
            'Both klienExpCounts and pesawatExpCounts must include Stage 16'
        );
    });

    it('3. InspectorRecommendationService supports clean multi-word keyword extraction and K3 acronym mapping', () => {
        // Must NOT use naive explode(' ', trim($targetJob->pesawat))[0] without cleanup
        assert.doesNotMatch(
            serviceContent,
            /\$pesawatKeyword\s*=\s*explode\(\s*['"] ['"]\s*,\s*trim\(\$targetJob->pesawat\)\)\[0\];/,
            'Must not rely on naive single word explode without punctuation cleanup'
        );
        // Must support PUBT or acronym mapping helper
        assert.match(
            serviceContent,
            /PUBT|Boiler|Bejana/i,
            'Must map standard K3 specializations such as PUBT to Boiler/Bejana'
        );
    });

    it('4. InspectorRecommendationService provides statuses and is_overloaded in payload', () => {
        assert.match(
            serviceContent,
            /['"]statuses['"]\s*=>/,
            'Returned inspector item must include statuses array'
        );
        assert.match(
            serviceContent,
            /['"]is_overloaded['"]\s*=>/,
            'Returned inspector item must include is_overloaded boolean'
        );
    });

    it('5. InspectorRecommendationService includes inspector role in candidate query', () => {
        assert.match(
            serviceContent,
            /['"]inspector['"]/,
            'Candidate role query must include English role "inspector"'
        );
    });

    it('6. JobDetailSheet.jsx checks is_overloaded and statuses correctly on day chips', () => {
        assert.match(
            sheetContent,
            /item\.is_overloaded\s*\|\|\s*\(item\.statuses\s*&&\s*item\.statuses\.includes\(['"]Overload['"]\)\)/,
            'JobDetailSheet.jsx must robustly evaluate overload status from service payload'
        );
    });
});
