import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STAGE_SLAS,
    calculateBusinessDays,
    isStageOverdue,
    calculatePersonnelScorecards
} from '../dnp-rework/resources/js/Utils/performanceSla.js';

describe('Personnel Performance & SLA Monitoring Engine', () => {
    describe('1. SLA Definitions & Configuration', () => {
        it('defines appropriate working day SLA targets for actionable internal stages', () => {
            assert.equal(DEFAULT_STAGE_SLAS[2], 1, 'Stage 2 Admin verification SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[3], 1, 'Stage 3 Admin scheduling SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[5], 3, 'Stage 5 Inspektur LHPP drafting SLA is 3 days');
            assert.equal(DEFAULT_STAGE_SLAS[6], 1, 'Stage 6 Manager review SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[7], 1, 'Stage 7 Disnaker submission SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[10], 1, 'Stage 10 Finance invoice SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[14], 1, 'Stage 14 Finance payment verification SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[15], 1, 'Stage 15 Marketing dispatch SLA is 1 day');
            assert.equal(DEFAULT_STAGE_SLAS[8], null, 'Stage 8 Disnaker is exempt from internal person SLA');
            assert.equal(DEFAULT_STAGE_SLAS[11], null, 'Stage 11 Client payment terms is exempt from internal SLA');
        });
    });

    describe('2. Business Day Calculation', () => {
        it('calculates working days excluding weekends', () => {
            // Friday to next Monday = 1 working day
            const fri = new Date('2026-09-18T09:00:00Z');
            const mon = new Date('2026-09-21T09:00:00Z');
            const days = calculateBusinessDays(fri, mon);
            assert.equal(Math.round(days), 1);
        });

        it('returns zero or sub-day for same day', () => {
            const morning = new Date('2026-09-21T08:00:00Z');
            const afternoon = new Date('2026-09-21T16:00:00Z');
            const days = calculateBusinessDays(morning, afternoon);
            assert.ok(days >= 0 && days <= 1);
        });
    });

    describe('3. Stage Overdue Detection', () => {
        it('identifies overdue when elapsed business days exceed SLA target', () => {
            const entered = new Date('2026-09-14T09:00:00Z'); // Monday
            const now = new Date('2026-09-21T09:00:00Z');     // Next Monday (5 working days)
            const result = isStageOverdue(5, entered, now);   // Stage 5 SLA = 3 days
            assert.equal(result.isOverdue, true);
            assert.ok(result.daysOver >= 1.5);
        });

        it('identifies on-time when elapsed is within SLA target', () => {
            const entered = new Date('2026-09-21T09:00:00Z');
            const now = new Date('2026-09-22T09:00:00Z'); // 1 day
            const result = isStageOverdue(5, entered, now); // Stage 5 SLA = 3 days
            assert.equal(result.isOverdue, false);
            assert.equal(result.daysOver, 0);
        });

        it('returns not overdue for exempt stages (e.g. Stage 8 Disnaker)', () => {
            const entered = new Date('2026-08-01T09:00:00Z');
            const now = new Date('2026-09-21T09:00:00Z');
            const result = isStageOverdue(8, entered, now);
            assert.equal(result.isOverdue, false);
            assert.equal(result.targetDays, null);
        });
    });

    describe('4. Personnel Scorecard Aggregation', () => {
        const users = [
            { id: 10, name: 'Budi (Admin)', role: 'admin' },
            { id: 20, name: 'Joko (Inspektur)', role: 'inspektur' },
            { id: 30, name: 'Dewi (Manager)', role: 'manager' }
        ];

        const mockJobs = [
            {
                id: 'job-1',
                kode: 'DNP-001',
                client_nama: 'PT Alfa',
                stage: 5,
                updated_at: '2026-09-15T08:00:00Z', // 5+ days in stage 5
                inspectors: [{ id: 20, name: 'Joko (Inspektur)' }]
            },
            {
                id: 'job-2',
                kode: 'DNP-002',
                client_nama: 'PT Beta',
                stage: 2,
                updated_at: '2026-09-24T08:00:00Z', // fresh
                inspectors: []
            }
        ];

        const mockHistories = [
            // Budi moved stage 2 on-time (1 day)
            {
                id: 1,
                job_id: 'job-1',
                stage: 2,
                action: 'move_stage',
                action_by_user_id: 10,
                created_at: '2026-09-11T14:00:00Z'
            },
            // Joko received return/rework on job-1 from manager
            {
                id: 2,
                job_id: 'job-1',
                stage: 5,
                action: 'reject_stage',
                action_by_user_id: 30,
                created_at: '2026-09-16T10:00:00Z'
            }
        ];

        it('aggregates scorecards with on-time rate, active overdues, and rework counts', () => {
            const now = new Date('2026-09-24T09:00:00Z');
            const scorecards = calculatePersonnelScorecards({
                jobs: mockJobs,
                histories: mockHistories,
                users,
                now
            });

            assert.equal(scorecards.length, 3);
            
            // Find Joko
            const joko = scorecards.find(s => s.user_id === 20);
            assert.ok(joko, 'Joko must have a scorecard');
            assert.equal(joko.active_overdue_jobs.length, 1, 'Joko must have 1 active overdue job (job-1 in Stage 5)');
            assert.equal(joko.rework_count, 1, 'Joko must have 1 rework recorded');

            // Find Budi
            const budi = scorecards.find(s => s.user_id === 10);
            assert.ok(budi, 'Budi must have a scorecard');
            assert.ok(budi.on_time_rate >= 0);
        });
    });
});
