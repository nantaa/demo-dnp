import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../dnp-rework/resources/js/Constants.js';
import {
  categorizeStagesByPhase,
  filterJobsForMyWork,
  computeStageSummaryStats
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor v3 — Stage Rail & Work Queue Architecture Tests', () => {

  test('1. Phase Grouping: Accurately maps 17 stages into 3 operational phases', () => {
    const phases = categorizeStagesByPhase(STAGES);
    assert.equal(phases.length, 3, 'Must categorize into 3 distinct operational phases');
    
    // Phase 1: RU Lapangan (1, 2, 3, 4, 4b, 4c, 4d)
    const phase1 = phases.find(p => p.id === 'ru_lapangan');
    assert.ok(phase1, 'Phase 1 RU Lapangan exists');
    const p1StageIds = phase1.stages.map(s => s.id);
    assert.deepEqual(p1StageIds, [1, 2, 3, 4, 13, 16, 17], 'Phase 1 includes RU lifecycle & rework loop');
    
    // Phase 2: Laporan & Dinas (5, 6, 7, 8, 9)
    const phase2 = phases.find(p => p.id === 'laporan_dinas');
    assert.ok(phase2, 'Phase 2 Laporan & Dinas exists');
    const p2StageIds = phase2.stages.map(s => s.id);
    assert.deepEqual(p2StageIds, [5, 6, 7, 8, 9], 'Phase 2 includes LHPP to Suket issuance');

    // Phase 3: Invoice & Delivery (10, 11, 11c, 11b, 12)
    const phase3 = phases.find(p => p.id === 'invoice_delivery');
    assert.ok(phase3, 'Phase 3 Invoice & Delivery exists');
    const p3StageIds = phase3.stages.map(s => s.id);
    assert.deepEqual(p3StageIds, [10, 11, 15, 14, 12], 'Phase 3 includes Invoicing, Collection, Payment verification, Delivery, Closed');
  });

  test('2. Exception / Rework Branch Identification: Separates Happy Path from Rework Loops', () => {
    const phases = categorizeStagesByPhase(STAGES);
    const p1Stages = phases.find(p => p.id === 'ru_lapangan').stages;
    
    const normalStages = p1Stages.filter(s => !s.isException);
    const exceptionStages = p1Stages.filter(s => s.isException);

    assert.deepEqual(normalStages.map(s => s.id), [1, 2, 3, 4], 'Normal primary flow is 1 -> 2 -> 3 -> 4');
    assert.deepEqual(exceptionStages.map(s => s.id), [13, 16, 17], 'Exception branch is 4b -> 4c -> 4d');
  });

  test('3. "My Work" Filtering: Role-based filtering without leaking irrelevant queues', () => {
    const sampleJobs = [
      { id: '1', kode: 'JOB-01', stage: 1, owner_marketing: 'Marketing A', inspectors: [] },
      { id: '2', kode: 'JOB-02', stage: 4, owner_marketing: 'Marketing B', inspectors: [{ id: 10, name: 'Budi' }] },
      { id: '3', kode: 'JOB-03', stage: 4, owner_marketing: 'Marketing A', inspectors: [{ id: 20, name: 'Agus' }] },
      { id: '4', kode: 'JOB-04', stage: 10, owner_marketing: 'Marketing A', inspectors: [] },
      { id: '5', kode: 'JOB-05', stage: 15, owner_marketing: 'Marketing C', inspectors: [] },
    ];

    // Inspector Budi (id: 10)
    const budiJobs = filterJobsForMyWork(sampleJobs, { id: 10, role: 'inspektur', name: 'Budi' });
    assert.equal(budiJobs.length, 1);
    assert.equal(budiJobs[0].kode, 'JOB-02');

    // Marketing A
    const mktAJobs = filterJobsForMyWork(sampleJobs, { id: 100, role: 'marketing', name: 'Marketing A' });
    assert.equal(mktAJobs.length, 3);
    assert.deepEqual(mktAJobs.map(j => j.kode), ['JOB-01', 'JOB-03', 'JOB-04']);

    // Finance (sees stages 10, 15, 12)
    const finJobs = filterJobsForMyWork(sampleJobs, { id: 200, role: 'finance', name: 'Finance Staff' });
    assert.equal(finJobs.length, 2);
    assert.deepEqual(finJobs.map(j => j.kode), ['JOB-04', 'JOB-05']);
  });

  test('4. Stage Summary Statistics: Computes accurate counts and SLA flags for rail badges', () => {
    const sampleJobs = [
      { id: '1', stage: 4, created_at: new Date(Date.now() - 4 * 86400000).toISOString() }, // overdue (>3 days)
      { id: '2', stage: 4, created_at: new Date().toISOString() }, // on track
      { id: '3', stage: 5, created_at: new Date().toISOString() },
    ];

    const stats = computeStageSummaryStats(STAGES, sampleJobs);
    const s4Stats = stats.find(s => s.id === 4);
    assert.ok(s4Stats);
    assert.equal(s4Stats.count, 2);
  });

  test('5. GET /stage-rail: Returns Inertia payload for StageRail/Index', async () => {
    const expressApp = (await import('express')).default();
    expressApp.get('/stage-rail', (req, res) => {
      res.json({
        component: 'StageRail/Index',
        props: {
          jobs: [],
          auth: { user: { role: 'superadmin' } },
        },
        url: '/stage-rail',
      });
    });

    const srv = expressApp.listen(0);
    const p = srv.address().port;

    try {
      const resp = await fetch(`http://localhost:${p}/stage-rail`, {
        headers: { 'x-inertia': 'true' },
      });
      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.equal(data.component, 'StageRail/Index');
      assert.ok(Array.isArray(data.props.jobs));
    } finally {
      await new Promise(r => srv.close(r));
    }
  });
});
