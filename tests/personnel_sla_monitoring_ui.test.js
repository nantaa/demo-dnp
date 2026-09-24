import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Personnel SLA Monitoring UI Component & Integration Suite', () => {
    const componentPath = path.resolve('dnp-rework/resources/js/Components/Dashboard/PersonnelSlaMonitoring.jsx');
    const indexPath = path.resolve('dnp-rework/resources/js/Pages/Dashboard/Index.jsx');

    it('1. PersonnelSlaMonitoring.jsx component file exists', () => {
        assert.ok(fs.existsSync(componentPath), 'PersonnelSlaMonitoring.jsx must exist');
    });

    it('2. PersonnelSlaMonitoring imports calculation engine from Utils/performanceSla', () => {
        const content = fs.readFileSync(componentPath, 'utf8');
        assert.match(content, /calculatePersonnelScorecards/, 'Must import calculatePersonnelScorecards');
        assert.match(content, /from ['"].*performanceSla['"]/, 'Must import from performanceSla');
    });

    it('3. Dashboard/Index.jsx renders PersonnelSlaMonitoring for Manager and Superadmin', () => {
        const content = fs.readFileSync(indexPath, 'utf8');
        assert.match(content, /import PersonnelSlaMonitoring/, 'Index.jsx must import PersonnelSlaMonitoring');
        assert.match(content, /<PersonnelSlaMonitoring/, 'Index.jsx must render PersonnelSlaMonitoring');
    });
});
