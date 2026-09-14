import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Database from 'better-sqlite3';
import path from 'path';

global.route = (name) => `/${name}`;

import JobDetailSheet from '../dnp-rework/resources/js/Components/JobDetailSheet.jsx';

const db = new Database(path.join('server', 'dnp.db'));
const rows = db.prepare('SELECT data FROM jobs').all();
const jobs = rows.map(r => JSON.parse(r.data));

console.log(`Testing JobDetailSheet render on ${jobs.length} REAL database jobs across 6 roles...`);

const roles = ['superadmin', 'marketing', 'admin', 'inspektur', 'manager', 'finance'];

let successCount = 0;
let failCount = 0;

for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    for (const role of roles) {
        const auth = {
            user: { id: 1, name: 'Test User', role: role },
            permissions: role,
        };

        try {
            const html = ReactDOMServer.renderToString(
                <JobDetailSheet
                    job={job}
                    auth={auth}
                    onClose={() => {}}
                />
            );
            if (!html || html.length === 0) {
                throw new Error('Produced empty HTML string');
            }
            successCount++;
        } catch (err) {
            failCount++;
            console.error(`❌ CRASH on job ${job.kode || job.id} (Stage: ${job.stage}, Role: ${role}):`, err.message);
            console.error(err.stack);
            process.exit(1);
        }
    }
}

console.log(`✅ ALL ${jobs.length} real jobs x ${roles.length} roles (${successCount} renders) passed without crash!`);
