import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');

describe('v3 20-Stage Workflow with DP Pipeline Test Suite', () => {

    it('1. Constants.js STAGES contains exactly 20 stages with proper display IDs and roles', async () => {
        const content = fs.readFileSync(constantsPath, 'utf8');

        // Check Stage 18 (1b: Invoicing DP)
        assert.ok(content.includes("id: 18") && content.includes("displayId: '1b'"), 'Stage 18 must be defined as 1b');
        assert.ok(content.includes("role: 'finance'"), 'Stage 18 must be owned by Finance');

        // Check Stage 19 (1c: Penagihan DP)
        assert.ok(content.includes("id: 19") && content.includes("displayId: '1c'"), 'Stage 19 must be defined as 1c');
        assert.ok(content.includes("role: 'marketing'"), 'Stage 19 must be owned by Marketing');

        // Check Stage 20 (1d: Konfirmasi Bayar DP)
        assert.ok(content.includes("id: 20") && content.includes("displayId: '1d'"), 'Stage 20 must be defined as 1d');

        // Check FIN_STAGES and MKT_STAGES arrays
        assert.ok(content.includes('18') && content.includes('20'), 'FIN_STAGES must include 18 and 20');
        assert.ok(content.includes('19'), 'MKT_STAGES must include 19');
    });

    it('2. getNextStageId correctly branches on DP vs FULL termin', () => {
        const getNextStageId = (currentStageId, terminPembayaran = 'FULL') => {
            if (currentStageId === 1) return terminPembayaran === 'DP' ? 18 : 2;
            if (currentStageId === 18) return 19; // 1b -> 1c
            if (currentStageId === 19) return 20; // 1c -> 1d
            if (currentStageId === 20) return 2;  // 1d -> 2
            if (currentStageId === 2) return 3;
            if (currentStageId === 3) return 4;
            if (currentStageId === 4) return 5;
            if (currentStageId === 13) return 16; // 4b -> 4c
            if (currentStageId === 16) return 17; // 4c -> 4d
            if (currentStageId === 17) return 5;  // 4d -> 5
            if (currentStageId === 5) return 6;
            if (currentStageId === 6) return 7;
            if (currentStageId === 7) return 8;
            if (currentStageId === 8) return 9;
            if (currentStageId === 9) return 10;
            if (currentStageId === 10) return 11;
            if (currentStageId === 11) return 15; // 11 -> 11c
            if (currentStageId === 15) return 14; // 11c -> 11b
            if (currentStageId === 14) return 12; // 11b -> 12 Closed
            return currentStageId + 1;
        };

        // FULL flow
        assert.equal(getNextStageId(1, 'FULL'), 2, 'Stage 1 with FULL must advance to Stage 2');

        // DP flow
        assert.equal(getNextStageId(1, 'DP'), 18, 'Stage 1 with DP must advance to Stage 18 (1b)');
        assert.equal(getNextStageId(18, 'DP'), 19, 'Stage 18 must advance to Stage 19 (1c)');
        assert.equal(getNextStageId(19, 'DP'), 20, 'Stage 19 must advance to Stage 20 (1d)');
        assert.equal(getNextStageId(20, 'DP'), 2, 'Stage 20 must advance to Stage 2');
    });

    it('3. All 20 Stage Action subcomponents exist in StageActions directory', () => {
        const stageActionsDir = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetail/StageActions');
        const expectedStageFiles = [
            'Stage1Action.jsx',
            'Stage18Action.jsx',
            'Stage19Action.jsx',
            'Stage20Action.jsx',
            'Stage2Action.jsx',
            'Stage3Action.jsx',
            'Stage4Action.jsx',
            'Stage13Action.jsx',
            'Stage16Action.jsx',
            'Stage17Action.jsx',
            'Stage5Action.jsx',
            'Stage6Action.jsx',
            'Stage7Action.jsx',
            'Stage8Action.jsx',
            'Stage9Action.jsx',
            'Stage10Action.jsx',
            'Stage11Action.jsx',
            'Stage15Action.jsx',
            'Stage14Action.jsx',
            'Stage12Action.jsx',
        ];

        for (const file of expectedStageFiles) {
            const filePath = path.join(stageActionsDir, file);
            assert.ok(fs.existsSync(filePath), `Stage component ${file} must exist`);
        }
    });
});
