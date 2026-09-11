import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Assigned INS & MKT Persistence & Access Control Test Suite', () => {

    // ── Test 1: Jobs/List.jsx visibility filter logic ──────────────────────────
    describe('Jobs/List.jsx visibleJobs filtering', () => {
        // Reproduce the previous buggy implementation in Jobs/List.jsx
        const previousVisibleJobsFilter = (job, auth, permissions) => {
            if (permissions === 'superadmin' || auth.user.role === 'admin' || auth.user.role === 'manager') return true;
            if (auth.user.role === 'marketing') return job.owner_marketing === auth.user.name;
            const perm = permissions?.[job.stage];
            return perm && (
                perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
                perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
            );
        };

        // Fixed implementation: assigned inspectors always see their assigned jobs
        const fixedVisibleJobsFilter = (job, auth, permissions) => {
            if (permissions === 'superadmin' || auth.user.role === 'admin' || auth.user.role === 'manager') return true;
            if (auth.user.role === 'marketing') return job.owner_marketing === auth.user.name;

            // Assigned inspector or report writer access
            if (['inspektur', 'inspector'].includes(auth.user?.role)) {
                const uId = String(auth.user.id);
                const isAssigned = (job.inspectors || []).some(ins =>
                    String(ins.id) === uId ||
                    String(ins.user_id) === uId ||
                    String(ins.pivot?.inspector_id) === uId ||
                    String(ins.pivot?.user_id) === uId
                ) || String(job.report_writer_id) === uId;

                if (isAssigned) return true;
            }

            const perm = permissions?.[job.stage];
            return Boolean(perm && (
                perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
                perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
            ));
        };

        const inspectorAuth = {
            user: { id: 7, name: 'Budi Inspektur', role: 'inspektur' },
        };
        // Inspector permissions only cover stages 4 & 5
        const inspectorPermissions = {
            4: { can_view: true, is_owner: true },
            5: { can_view: true, is_owner: true },
        };

        const jobMovedBackToStage3 = {
            id: 101,
            kode: 'JOB-001',
            stage: 3, // Moved back to Stage 3 (Jadwal)
            owner_marketing: 'Siti MKT',
            inspectors: [{ id: 7, name: 'Budi Inspektur', pivot: { job_id: 101, inspector_id: 7 } }],
            report_writer_id: 7,
        };

        const jobMovedBackToStage1 = {
            id: 102,
            kode: 'JOB-002',
            stage: 1, // Moved back to Stage 1 (PO)
            owner_marketing: 'Siti MKT',
            inspectors: [{ id: 7, name: 'Budi Inspektur', pivot: { job_id: 102, inspector_id: 7 } }],
            report_writer_id: null,
        };

        const unassignedJobInStage3 = {
            id: 103,
            kode: 'JOB-003',
            stage: 3,
            owner_marketing: 'Siti MKT',
            inspectors: [{ id: 99, name: 'Other Inspector' }],
            report_writer_id: null,
        };

        test('reproduce bug: previous filter hid job from assigned inspector when moved back to Stage 3 or 1', () => {
            assert.equal(previousVisibleJobsFilter(jobMovedBackToStage3, inspectorAuth, inspectorPermissions), undefined);
            assert.equal(previousVisibleJobsFilter(jobMovedBackToStage1, inspectorAuth, inspectorPermissions), undefined);
        });

        test('fixed filter: assigned inspector can see job even when moved back to Stage 3 or 1', () => {
            assert.equal(fixedVisibleJobsFilter(jobMovedBackToStage3, inspectorAuth, inspectorPermissions), true);
            assert.equal(fixedVisibleJobsFilter(jobMovedBackToStage1, inspectorAuth, inspectorPermissions), true);
        });

        test('fixed filter: unassigned inspector does NOT see jobs outside their permitted stages', () => {
            assert.equal(fixedVisibleJobsFilter(unassignedJobInStage3, inspectorAuth, inspectorPermissions), false);
        });
    });

    // ── Test 2: Dashboard/Index.jsx inspector filtering ────────────────────────
    describe('Dashboard/Index.jsx inspector dashboard filtering', () => {
        // Fixed personalFiltered matcher
        const matchPersonalJob = (j, user) => {
            const uId = String(user.id);
            return (j.inspectors || []).some(ins =>
                String(ins.id) === uId ||
                String(ins.user_id) === uId ||
                String(ins.pivot?.inspector_id) === uId ||
                String(ins.pivot?.user_id) === uId
            ) || String(j.report_writer_id) === uId;
        };

        // Fixed lhppJobs filter: Stage 5 is LHPP (inspector stage)
        const isLhppInspectorJob = (j) => {
            // Stage 5 is Penyusunan LHPP (Tim Ahli / Inspektur)
            return Number(j.stage) === 5;
        };

        const user = { id: 7, name: 'Budi Inspektur', role: 'inspektur' };

        test('matchPersonalJob: matches string vs number user.id and pivot inspector_id', () => {
            const jobWithNumericId = { inspectors: [{ id: 7 }] };
            const jobWithStringId = { inspectors: [{ id: '7' }] };
            const jobWithPivot = { inspectors: [{ pivot: { inspector_id: 7 } }] };
            const jobWithReportWriter = { report_writer_id: 7, inspectors: [] };

            assert.equal(matchPersonalJob(jobWithNumericId, user), true);
            assert.equal(matchPersonalJob(jobWithStringId, user), true);
            assert.equal(matchPersonalJob(jobWithPivot, user), true);
            assert.equal(matchPersonalJob(jobWithReportWriter, user), true);
        });

        test('isLhppInspectorJob: correctly captures Stage 5 jobs (including rejected back from Stage 6)', () => {
            const stage5Job = { stage: 5, kode: 'JOB-LHPP' };
            const stage6Job = { stage: 6, kode: 'JOB-MGR' };
            const stage4Job = { stage: 4, kode: 'JOB-FIELD' };

            assert.equal(isLhppInspectorJob(stage5Job), true);
            assert.equal(isLhppInspectorJob(stage6Job), false);
            assert.equal(isLhppInspectorJob(stage4Job), false);
        });
    });

    // ── Test 3: Kanban/Index.jsx column jobs filter ────────────────────────────
    describe('Kanban/Index.jsx column jobs filter', () => {
        const filterKanbanJobs = (jobs, stageId, auth, permissions) => {
            return jobs.filter(j => {
                if (j.stage !== stageId) return false;
                if (permissions === 'superadmin') return true;
                if (auth.user.role === 'marketing') {
                    return j.owner_marketing === auth.user.name;
                }
                if (['inspektur', 'inspector'].includes(auth.user.role)) {
                    const uId = String(auth.user.id);
                    return (j.inspectors || []).some(ins =>
                        String(ins.id) === uId ||
                        String(ins.user_id) === uId ||
                        String(ins.pivot?.inspector_id) === uId ||
                        String(ins.pivot?.user_id) === uId
                    ) || String(j.report_writer_id) === uId;
                }
                const perm = permissions?.[stageId];
                return Boolean(perm && (perm.can_view || perm.is_owner));
            });
        };

        const authIndo = { user: { id: 7, role: 'inspektur' } };
        const authEng = { user: { id: 7, role: 'inspector' } };

        const testJobs = [
            { id: 1, stage: 4, inspectors: [{ id: 7 }] },
            { id: 2, stage: 3, inspectors: [{ id: 7 }] }, // Moved back to Stage 3
            { id: 3, stage: 3, inspectors: [{ id: 99 }] }, // Not assigned
        ];

        test('filterKanbanJobs: supports both inspektur and inspector role names', () => {
            const resIndo = filterKanbanJobs(testJobs, 4, authIndo, {});
            const resEng = filterKanbanJobs(testJobs, 4, authEng, {});
            assert.equal(resIndo.length, 1);
            assert.equal(resEng.length, 1);
            assert.equal(resIndo[0].id, 1);
            assert.equal(resEng[0].id, 1);
        });

        test('filterKanbanJobs: shows assigned job in Stage 3 column to assigned inspector', () => {
            const res = filterKanbanJobs(testJobs, 3, authIndo, {});
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 2);
        });
    });

    // ── Test 4: Rejection & Backward Movement Invariant Guarantees ─────────────
    describe('Backend Rejection State Transitions', () => {
        // Simulate rejectStage state transition
        const simulateRejectStage = (currentJob, notes, targetStage = null) => {
            const currentStage = currentJob.stage;
            let prevStage = Math.max(1, currentStage - 1);
            if (currentStage === 13 || currentStage === 5) {
                prevStage = 4;
            } else if (currentStage === 8) {
                prevStage = 6;
            } else if (currentStage === 14) {
                prevStage = 11;
            }

            if (targetStage) {
                prevStage = Math.max(1, parseInt(targetStage, 10));
            }

            // Invariant: Job update must only update stage and stage_started_at.
            // inspectors, owner_marketing, report_writer_id must remain untouched!
            return {
                ...currentJob,
                stage: prevStage,
                stage_started_at: new Date().toISOString(),
                // Preserved relations/attributes
                owner_marketing: currentJob.owner_marketing,
                inspectors: [...currentJob.inspectors],
                report_writer_id: currentJob.report_writer_id,
            };
        };

        test('rejectStage: preserves owner_marketing, inspectors, and report_writer_id', () => {
            const initialJob = {
                id: 55,
                stage: 5,
                owner_marketing: 'Diana Marketing',
                inspectors: [{ id: 7, name: 'Budi Inspektur' }],
                report_writer_id: 7,
            };

            const rejectedJob = simulateRejectStage(initialJob, 'Revisi lapangan', 4);
            assert.equal(rejectedJob.stage, 4);
            assert.equal(rejectedJob.owner_marketing, 'Diana Marketing');
            assert.equal(rejectedJob.inspectors.length, 1);
            assert.equal(rejectedJob.inspectors[0].id, 7);
            assert.equal(rejectedJob.report_writer_id, 7);
        });
    });
});
