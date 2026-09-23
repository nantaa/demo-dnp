import { useMemo } from 'react';
import { MKT_STAGES, FIN_STAGES, STAGE1_REQUIRED_DOCS, STAGE2_REQUIRED_DOCS } from '@/Constants';

export function useJobPermissions(arg1, arg2) {
    // Support both useJobPermissions(job, auth) and useJobPermissions({ job, auth, ... })
    const { job, auth, propCanManage, s4, s4d, scheduleDays } = (arg1 && arg1.job)
        ? arg1
        : { job: arg1 || {}, auth: arg2 || {} };

    const { permissions, user } = auth || {};
    const isInspector = user?.role === 'inspektur';
    const isMGR = user?.role === 'manager';

    const isAssignedInspector = useMemo(() => {
        return (job.inspectors || []).some(ins =>
            String(ins.id) === String(user?.id) ||
            String(ins.user_id) === String(user?.id) ||
            String(ins.pivot?.user_id) === String(user?.id)
        ) || String(job.report_writer_id) === String(user?.id);
    }, [job.inspectors, job.report_writer_id, user?.id]);

    const canSeeNilai = useMemo(() => {
        return user?.role === 'superadmin'
            || user?.role === 'finance'
            || (user?.role === 'marketing' && job.owner_marketing === user?.name);
    }, [user?.role, user?.name, job.owner_marketing]);

    const canManage = useMemo(() => {
        if (propCanManage !== undefined) return propCanManage;
        if (!user) return false;
        if (user.role === 'superadmin') return true;
        if (user.role === 'marketing' && [1, 19, 13, 11, 14].includes(job.stage)) return true;
        if (user.role === 'admin' && [2, 3, 16, 5, 7, 8, 9].includes(job.stage)) return true;
        if (user.role === 'finance' && [18, 20, 10, 15, 12].includes(job.stage)) return true;
        if (isMGR && !MKT_STAGES.includes(job.stage) && !FIN_STAGES.includes(job.stage)) return true;
        if (isInspector) {
            return [4, 17].includes(job.stage) && (isAssignedInspector || !job.inspectors || job.inspectors.length === 0);
        }
        if (permissions && typeof permissions === 'object') {
            const p = permissions[job.stage];
            if (p && (p.is_owner === true || p.is_owner === 1 || p.is_owner === '1')) return true;
        }
        return false;
    }, [propCanManage, user, job.stage, isMGR, isInspector, isAssignedInspector, permissions]);

    const canViewStageDocs = (sid) => {
        if (['superadmin', 'admin', 'manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && job.owner_marketing === user?.name) return true;
        if (isInspector) return true;
        const p = permissions?.[sid];
        return p && (p.can_view || p.is_owner);
    };

    const canManageStageDocs = (sid) => {
        if (['superadmin', 'manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && job.owner_marketing === user?.name && [1, 19, 11, 13, 14].includes(sid)) return true;
        if (user?.role === 'finance' && [18, 20, 10, 15, 12].includes(sid)) return true;
        if (isInspector && [4, 17].includes(sid) && sid === job.stage) return isAssignedInspector;
        if (isInspector) return false;
        const p = permissions?.[sid];
        return p && p.is_owner;
    };

    // Stage 1 gate: at least one required doc uploaded
    const stage1DocOk = STAGE1_REQUIRED_DOCS.some(t =>
        (job.documents || []).some(d => d.stage === 1 && d.type === t));

    // Stage 2 gate: all required docs OR Kadiv approved
    const stage2DocOk = STAGE2_REQUIRED_DOCS.every(t =>
        (job.documents || []).some(d => (d.stage === 1 || d.stage === 2) && d.type === t));
    const stage2Bypass = job.peer_review_status === 'approved';
    const stage2CanMove = stage2DocOk || stage2Bypass;

    // Stage 4 & 4d: unit mismatch
    const s4UnitMismatch = s4?.actual_units != null && parseInt(s4.actual_units) !== parseInt(job.units);
    const s4dUnitMismatch = s4d?.actual_units != null && parseInt(s4d.actual_units) !== parseInt(job.units);

    // Stage 3 schedule validity
    const s3ScheduleValid = (scheduleDays || []).length > 0 &&
        scheduleDays.every(d => d.date?.trim()) &&
        scheduleDays.every(d => (d.inspector_ids || []).length > 0);

    const canViewDoc = (doc) => {
        if (!doc) return false;
        const isPo = ['PO/SPK', 'PO / SPK', 'PO / SPK / Proposal'].includes(doc.type);
        if (isInspector && isPo) return false;
        return true;
    };

    const isSameMonthDate = (dStr) => {
        if (!dStr) return false;
        const d = new Date(dStr);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };

    const canRevisePO = useMemo(() => {
        if (!['superadmin', 'marketing', 'admin', 'finance'].includes(user?.role)) return false;
        return isSameMonthDate(job.created_at);
    }, [user?.role, job.created_at]);

    const canReviseInvoice = useMemo(() => {
        if (!['superadmin', 'finance'].includes(user?.role)) return false;
        const refDate = job.tgl_invoice_issued || job.created_at;
        return isSameMonthDate(refDate);
    }, [user?.role, job.tgl_invoice_issued, job.created_at]);

    return {
        user,
        authPermissions: permissions,
        isInspector,
        isMGR,
        isKadiv: isMGR,
        isAssignedInspector,
        canSeeNilai,
        canManage,
        canViewStageDocs: canViewStageDocs || (() => false),
        canManageStageDocs: canManageStageDocs || (() => false),
        canViewDoc,
        canRevisePO,
        canReviseInvoice,
        stage1DocOk,
        stage2DocOk,
        stage2Bypass,
        stage2CanMove,
        s4UnitMismatch,
        s4dUnitMismatch,
        s3ScheduleValid,
    };
}

export default useJobPermissions;
