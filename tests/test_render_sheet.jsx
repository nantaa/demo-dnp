import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Let's test mock Inertia
global.route = (name) => `/${name}`;

import JobDetailSheet from '../dnp-rework/resources/js/Components/JobDetailSheet.jsx';
import TimelineTab from '../dnp-rework/resources/js/Components/JobDetail/Tabs/TimelineTab.jsx';
import DocumentsTab from '../dnp-rework/resources/js/Components/JobDetail/Tabs/DocumentsTab.jsx';
import HistoryTab from '../dnp-rework/resources/js/Components/JobDetail/Tabs/HistoryTab.jsx';
import EditInfoTab from '../dnp-rework/resources/js/Components/JobDetail/Tabs/EditInfoTab.jsx';

import Stage1Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage1Action.jsx';
import Stage18Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage18Action.jsx';
import Stage19Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage19Action.jsx';
import Stage20Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage20Action.jsx';
import Stage2Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage2Action.jsx';
import Stage3Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage3Action.jsx';
import Stage4Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage4Action.jsx';
import Stage13Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage13Action.jsx';
import Stage16Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage16Action.jsx';
import Stage17Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage17Action.jsx';
import Stage5Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage5Action.jsx';
import Stage6Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage6Action.jsx';
import Stage7Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage7Action.jsx';
import Stage8Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage8Action.jsx';
import Stage9Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage9Action.jsx';
import Stage10Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage10Action.jsx';
import Stage11Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage11Action.jsx';
import Stage15Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage15Action.jsx';
import Stage14Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage14Action.jsx';
import Stage12Action from '../dnp-rework/resources/js/Components/JobDetail/StageActions/Stage12Action.jsx';
import CompletedStageSummary from '../dnp-rework/resources/js/Components/JobDetail/CompletedSummaries/CompletedStageSummary.jsx';

const stages = [1, 18, 19, 20, 2, 3, 4, 13, 16, 17, 5, 6, 7, 8, 9, 10, 11, 15, 14, 12];
const roles = ['superadmin', 'marketing', 'admin', 'inspektur', 'manager', 'finance'];

console.log('Testing React SSR render across all 20 stages and 6 roles...');

for (const stage of stages) {
    for (const role of roles) {
        const mockJob = {
            id: `job_test_${stage}`,
            kode: `DNP/2026/000${stage}`,
            stage: stage,
            klien: 'PT Test Industry',
            pesawat: 'Genset & Lift',
            lokasi: 'Jakarta',
            units: 2,
            nilai: 10000000,
            owner_marketing: 'Marketing User',
            termin_pembayaran: 'DP',
            dp_amount: 3000000,
            dp_paid: false,
            paid: false,
            documents: [],
            inspectors: [{ id: 1, name: 'Inspector A' }],
            history: [{ stage: 1, ts: new Date().toISOString(), by: 'Marketing', action: 'Created' }],
            schedule_days: JSON.stringify([{ date: '2026-09-15', inspector_ids: ['1'] }]),
        };

        const mockAuth = {
            user: { id: 1, name: 'Test User', role: role },
            permissions: role,
        };

        try {
            const html = ReactDOMServer.renderToString(
                <JobDetailSheet
                    job={mockJob}
                    auth={mockAuth}
                    onClose={() => {}}
                />
            );
            if (!html) throw new Error('Render produced empty HTML');
        } catch (err) {
            console.error(`❌ CRASH on stage ${stage} with role ${role}:`, err);
            process.exit(1);
        }
    }
}

console.log('✅ ALL 20 STAGES & 6 ROLES RENDERED SUCCESSFULLY WITHOUT CRASH!');
