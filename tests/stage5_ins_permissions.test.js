// @ts-check
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Replicates the PREVIOUS (flawed) frontend logic to verify that it fails on the reported cases.
 */
function previousCanManage(auth, job) {
    const { permissions, user } = auth || {};
    const isInspector = user?.role === 'inspektur';
    const isMGR = user?.role === 'manager';
    const MKT_STAGES = [1, 11, 13];
    const FIN_STAGES = [10, 14, 12];

    if (!permissions) return false;
    if (permissions === 'superadmin') return true;
    if (user?.role === 'admin' && [2, 3, 7, 8, 9].includes(job.stage)) return true;
    if (isMGR && !MKT_STAGES.includes(job.stage) && !FIN_STAGES.includes(job.stage)) return true;
    if (isInspector) {
        return [4, 5].includes(job.stage);
    }
    const p = permissions[job.stage];
    return p && (p.is_owner === true || p.is_owner === 1 || p.is_owner === '1');
}

/**
 * The NEW (fixed) frontend logic that must pass all cases.
 */
export function canManage(auth, job) {
    const { permissions, user } = auth || {};
    const isInspector = user?.role === 'inspektur' || user?.role === 'inspector';
    const isMGR = user?.role === 'manager';
    const MKT_STAGES = [1, 11, 13];
    const FIN_STAGES = [10, 14, 12];

    const curStage = Number(job?.stage);
    const isAssignedInspector = (job?.inspectors || []).some(ins =>
        String(ins.id) === String(user?.id) ||
        String(ins.user_id) === String(user?.id) ||
        String(ins.pivot?.user_id) === String(user?.id)
    ) || String(job?.report_writer_id) === String(user?.id);

    if (user?.role === 'superadmin' || permissions === 'superadmin') return true;
    if (user?.role === 'admin' && [2, 3, 7, 8, 9].includes(curStage)) return true;
    if (isMGR && !MKT_STAGES.includes(curStage) && !FIN_STAGES.includes(curStage)) return true;
    if (isInspector || isAssignedInspector) {
        return [4, 5].includes(curStage);
    }
    if (!permissions) return false;
    const p = permissions[curStage] || permissions[job?.stage];
    return p && (p.is_owner === true || p.is_owner === 1 || p.is_owner === '1');
}

/**
 * The NEW (fixed) canManageStageDocs logic.
 */
export function canManageStageDocs(auth, job, sid) {
    const { permissions, user } = auth || {};
    const isInspector = user?.role === 'inspektur' || user?.role === 'inspector';
    const sIdNum = Number(sid);
    const curStageNum = Number(job?.stage);

    const isAssignedInspector = (job?.inspectors || []).some(ins =>
        String(ins.id) === String(user?.id) ||
        String(ins.user_id) === String(user?.id) ||
        String(ins.pivot?.user_id) === String(user?.id)
    ) || String(job?.report_writer_id) === String(user?.id);

    if (['superadmin', 'manager'].includes(user?.role)) return true;
    if (user?.role === 'admin' && [2, 3, 7, 8, 9].includes(sIdNum)) return true;
    if (user?.role === 'marketing' && job?.owner_marketing === user?.name && [1, 11, 13].includes(sIdNum)) return true;
    if ((isInspector || isAssignedInspector) && [4, 5].includes(sIdNum) && sIdNum === curStageNum) return true;
    if (isInspector) return false;
    const p = permissions?.[sIdNum] || permissions?.[sid];
    return p && p.is_owner;
}

/**
 * The backend canActOnStage logic.
 */
export function canActOnStage(user, job, stage) {
    const stageNum = Number(stage);
    if (user?.role === 'superadmin') return true;
    if (user?.role === 'manager' && ![1, 10, 11, 12, 13, 14].includes(stageNum)) {
        return true;
    }

    if (user?.role === 'inspektur' || user?.role === 'inspector') {
        if ([4, 5].includes(stageNum)) {
            return true;
        }
        return false;
    }

    if (job && [4, 5].includes(stageNum)) {
        const isAssigned = (job.inspectors || []).some(ins =>
            String(ins.id) === String(user?.id) ||
            String(ins.user_id) === String(user?.id) ||
            String(ins.pivot?.user_id) === String(user?.id)
        ) || String(job.report_writer_id) === String(user?.id);

        if (isAssigned) return true;
    }

    return false;
}

describe('Stage 5 Assigned Personnel Permissions Test Matrix', () => {
    const assignedUser = { id: 10, name: 'Rendi Pratama', role: 'inspektur' };
    const reportWriterUser = { id: 11, name: 'Sri Mulyani', role: 'inspektur' };
    const unassignedInspector = { id: 99, name: 'Bambang', role: 'inspektur' };

    const jobStage5 = {
        id: 'job-123',
        stage: 5,
        inspectors: [{ id: 10, name: 'Rendi Pratama' }],
        report_writer_id: 11,
    };

    const jobStage5String = {
        id: 'job-124',
        stage: '5',
        inspectors: [{ id: 10, name: 'Rendi Pratama' }],
        report_writer_id: 11,
    };

    test('reproduce previous failure: previousCanManage fails when permissions is null/empty or stage is string', () => {
        // When auth has null permissions
        const authNullPerms = { user: assignedUser, permissions: null };
        assert.equal(previousCanManage(authNullPerms, jobStage5), false, 'previous logic failed on null permissions');

        // When stage is string "5"
        const authWithPerms = { user: assignedUser, permissions: {} };
        assert.equal(previousCanManage(authWithPerms, jobStage5String), false, 'previous logic failed on string stage');
    });

    test('new canManage: assigned inspector can manage Stage 5 with integer stage', () => {
        const auth = { user: assignedUser, permissions: null };
        assert.equal(canManage(auth, jobStage5), true);
    });

    test('new canManage: assigned inspector can manage Stage 5 with string stage', () => {
        const auth = { user: assignedUser, permissions: {} };
        assert.equal(canManage(auth, jobStage5String), true);
    });

    test('new canManage: report writer can manage Stage 5', () => {
        const auth = { user: reportWriterUser, permissions: null };
        assert.equal(canManage(auth, jobStage5), true);
        assert.equal(canManage(auth, jobStage5String), true);
    });

    test('new canManage: any inspector can manage Stage 5 if role is inspektur/inspector', () => {
        const auth = { user: unassignedInspector, permissions: null };
        assert.equal(canManage(auth, jobStage5), true);
    });

    test('new canManageStageDocs: inspector can upload/manage documents on Stage 5', () => {
        const auth = { user: assignedUser, permissions: null };
        assert.equal(canManageStageDocs(auth, jobStage5, 5), true);
        assert.equal(canManageStageDocs(auth, jobStage5String, 5), true);
        assert.equal(canManageStageDocs(auth, jobStage5, '5'), true);
    });

    test('new canManageStageDocs: cannot manage past stage docs', () => {
        const auth = { user: assignedUser, permissions: null };
        // Trying to manage stage 4 docs while job is on stage 5
        assert.equal(canManageStageDocs(auth, jobStage5, 4), false);
    });

    test('backend canActOnStage: assigned personnel and report writer authorized for Stage 5', () => {
        assert.equal(canActOnStage(assignedUser, jobStage5, 5), true);
        assert.equal(canActOnStage(reportWriterUser, jobStage5, 5), true);
        assert.equal(canActOnStage(assignedUser, jobStage5String, '5'), true);
    });
});
