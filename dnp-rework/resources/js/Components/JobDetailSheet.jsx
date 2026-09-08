import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, router } from '@inertiajs/react';
import SmartRecommendation from './SmartRecommendation';
import IndonesiaLocationSelect from './IndonesiaLocationSelect';
import SplitJobModal from './SplitJobModal';
import { showError, showSuccess, showConfirm, showWarning, MySwal } from '@/swal';
import { Trash2 } from 'lucide-react';
import {
    DOC_TYPES_BY_STAGE, STAGES, STAGE4_PHOTO_TYPES, STAGE5_DECISIONS,
    PROGRESS_STATUSES, STAGE8_DISNAKER_STATUSES, MKT_STAGES, FIN_STAGES, STAGE1_REQUIRED_DOCS, STAGE2_REQUIRED_DOCS,
    STAGE2_VERIFY_CHECKLIST, INDONESIA_PROVINCES
} from '@/Constants';

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseJsonArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
};

const parseJsonObject = (v) => {
    if (!v) return {};
    if (typeof v === 'object' && !Array.isArray(v) && v !== null) return v;
    try {
        const parsed = JSON.parse(v);
        return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch { return {}; }
};

const fmt = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    d ? new Date(d).toLocaleDateString('id-ID', opts) : '—';

const fmtCurrency = (n) =>
    n != null ? 'Rp ' + Number(n).toLocaleString('id-ID') : '—';

const fmtSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};

const daysElapsed = (from) => {
    if (!from) return null;
    return Math.ceil((new Date() - new Date(from)) / 86400000);
};

const getSlaTag = (days, slaLimit) => {
    if (days == null || !slaLimit) return null;
    if (days > slaLimit) return { label: 'OVERDUE', cls: 'bg-red-100 text-red-800 font-bold' };
    if (days >= slaLimit) return { label: 'LAST DAY', cls: 'bg-orange-100 text-orange-800 font-bold' };
    return { label: 'ON TRACK', cls: 'bg-green-100 text-green-800' };
};

// ── Top-level Subcomponents (to maintain stable DOM identity across re-renders) ──
const DocChip = ({ doc, canManage, onDelete }) => (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs group">
        <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium truncate max-w-[160px]" title={doc.name}>
            {doc.name}
        </a>
        {canManage && (
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(doc.id); }}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1">✕</button>
        )}
    </div>
);

const MoveRow = ({ disabled = false, disabledMsg = '', stage, processing, onReject }) => {
    const getNextLabel = () => {
        if (stage === 4) return 'Lanjut ke Stage 5 (LHPP) →';
        if (stage === 13) return 'Jadwalkan Ulang (Stage 4c) →';
        if (stage === 16) return 'Lanjut ke Riksa Uji Ulang (Stage 4d) →';
        if (stage === 17) return 'Lanjut ke Penyusunan LHPP (Stage 5) →';
        if (stage === 10) return 'Lanjut ke Penagihan Pembayaran (Stage 11) →';
        if (stage === 11) return 'Serahkan ke Verifikasi Pembayaran (Stage 11c) →';
        if (stage === 15) return 'Verifikasi Lunas & Buka Kirim SUKET (Stage 11b) →';
        if (stage === 14) return 'Selesaikan Job (Stage 12 Closed) →';
        const currIdx = STAGES.findIndex(s => s.id === stage);
        if (currIdx !== -1 && currIdx < STAGES.length - 1) {
            const next = STAGES[currIdx + 1];
            if (next) {
                return `Lanjut ke Stage ${next.displayId || next.id} (${next.short}) →`;
            }
        }
        return `Lanjut ke Stage ${stage + 1} →`;
    };

    return (
        <div className="mt-4 flex flex-col gap-2">
            {disabledMsg && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {disabledMsg}
                </div>
            )}
            <div className="flex gap-2">
                {[2, 4, 13, 16, 17, 5, 6, 7, 8, 9, 10, 11, 15, 14].includes(stage) && (
                    <button type="button" onClick={onReject} disabled={processing}
                        className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                        Tolak / Kembalikan
                    </button>
                )}
                <button type="submit" disabled={processing || disabled}
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                    {processing ? '...' : getNextLabel()}
                </button>
            </div>
        </div>
    );
};

const NoteField = React.memo(function NoteField({ value, onChange }) {
    return (
        <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan / Keterangan</label>
            <textarea
                rows={2}
                value={value || ''}
                onChange={onChange}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400"
                placeholder="Tulis catatan atau keterangan..."
            />
        </div>
    );
});

const UploadSlot = ({ type, stageId, docs, triggerUpload, uploadFileDirectly, canManageStageDocs, deleteDoc, isOptional }) => {
    const [isDragging, setIsDragging] = useState(false);
    const existing = (docs || []).filter(d => d.stage === stageId && (!type || d.type === type));

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (uploadFileDirectly) {
                uploadFileDirectly(file, stageId, type);
            }
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-2.5 transition-all duration-200 ${isDragging
                    ? 'border-blue-500 bg-blue-50/80 shadow-md scale-[1.01]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
        >
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-700 truncate">{type}</span>
                    {isOptional && (
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex-shrink-0">
                            OPSIONAL
                        </span>
                    )}
                </div>
                <button type="button" onClick={() => triggerUpload(stageId, type)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>+ Upload</span>
                </button>
            </div>
            {existing.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {existing.map(d => (
                        <DocChip key={d.id} doc={d} canManage={canManageStageDocs ? canManageStageDocs(d.stage) : true} onDelete={deleteDoc} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-1.5 px-2 bg-gray-50/50 rounded border border-dashed border-gray-100">
                    <p className="text-[11px] text-gray-400 italic">
                        {isDragging ? '📂 Lepaskan file di sini untuk upload' : 'Belum ada dokumen • Tarik & lepas file ke sini atau klik + Upload'}
                    </p>
                </div>
            )}
        </div>
    );
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function JobDetailSheet({ job, onClose, auth, canManage: propCanManage }) {
    const getNextStageId = (currentStageId) => {
        if (currentStageId === 1) return 2;
        if (currentStageId === 2) return 3;
        if (currentStageId === 3) return 4;
        if (currentStageId === 4) return 5;
        if (currentStageId === 13) return 16; // 4b Aktualisasi Unit -> 4c Penjadwalan Ulang
        if (currentStageId === 16) return 17; // 4c Penjadwalan Ulang -> 4d Riksa Uji Ulang
        if (currentStageId === 17) return 5;  // 4d RU Ulang -> 5 Penyusunan LHPP
        if (currentStageId === 5) return 6;
        if (currentStageId === 6) return 7;
        if (currentStageId === 7) return 8;
        if (currentStageId === 8) return 9;
        if (currentStageId === 9) return 10;
        if (currentStageId === 10) return 11; // 10 Pembuatan Invoice -> 11 Penagihan Pembayaran
        if (currentStageId === 11) return 15; // 11 Penagihan Pembayaran -> 11c Verifikasi Pembayaran
        if (currentStageId === 15) return 14; // 11c Verifikasi Pembayaran -> 11b Kirim SUKET ke Klien
        if (currentStageId === 14) return 12; // 11b Kirim SUKET -> 12 Selesai
        return currentStageId + 1;
    };

    // ── Forms ────────────────────────────────────────────────────────────────
    const { data, setData, post, processing, errors } = useForm({
        next_stage: getNextStageId(job.stage),
        notes: '',
        inspector_ids: job.inspectors ? job.inspectors.map(i => i.id) : [],
        report_writer_id: job.report_writer_id || '',
        tgl_pelaksanaan: job.tgl_pelaksanaan || '',
        jam_mulai: job.jam_mulai || '08:00',
        durasi_hari: job.durasi_hari || 1,
        disnaker_tujuan: job.disnaker_tujuan || '',
        alat_ids: parseJsonArray(job.alat_ids),
        cert_ids: parseJsonArray(job.cert_ids),
    });

    const editForm = useForm({
        klien: job.klien || '',
        pesawat: job.pesawat || '',
        lokasi: job.lokasi || '',
        nilai: job.nilai || '',
        units: job.units || 1,
    });

    // ── UI State ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('timeline');
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStage, setUploadStage] = useState(null);
    const [uploadType, setUploadType] = useState('');
    const [photoNotes, setPhotoNotes] = useState({});   // key: photo type
    const [returnNotes, setReturnNotes] = useState('');
    const fileInputRef = useRef(null);

    // Stage-specific form state
    const [s4, setS4] = useState({
        actual_units: job.actual_units ?? job.units,
        unit_count_notes: job.unit_count_notes ?? '',
    });
    const [s5, setS5] = useState({
        s5_review_decision: job.s5_review_decision ?? '',
        s5_review_notes: job.s5_review_notes ?? '',
    });
    const [s7, setS7] = useState({ tgl_submit_disnaker: job.tgl_submit_disnaker ?? '' });
    const [s8, setS8] = useState({
        tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker ?? '',
        tgl_doc_received_disnaker: job.tgl_doc_received_disnaker ?? '',
        s8_progress_status: job.s8_progress_status ?? '',
    });
    const [s9, setS9] = useState({ s9_progress_status: job.s9_progress_status ?? '' });
    const [s10, setS10] = useState({
        invoice_no: job.invoice_no ?? '',
        total_invoice_amount: job.total_invoice_amount ?? '',
        tgl_invoice_issued: job.tgl_invoice_issued ?? '',
        s10_progress_status: job.s10_progress_status ?? '',
        tgl_submit_mkt: job.tgl_submit_mkt ?? '',
    });
    const [s4c, setS4c] = useState({
        reschedule_reason: job.reschedule_reason ?? '',
        tgl_reschedule: job.tgl_reschedule ?? '',
        reschedule_notes: job.reschedule_notes ?? '',
    });
    const [s4d, setS4d] = useState({
        actual_units: job.actual_units ?? job.units ?? 1,
        unit_count_notes: job.unit_count_notes ?? '',
        ru_ulang_status: job.ru_ulang_status ?? 'lolos',
        ru_ulang_notes: job.ru_ulang_notes ?? '',
    });
    const [s5Dates, setS5Dates] = useState({
        tgl_teknis_diserahkan: job.tgl_teknis_diserahkan ?? '',
        tgl_laporan_mulai: job.tgl_laporan_mulai ?? '',
        tgl_laporan_selesai: job.tgl_laporan_selesai ?? '',
    });
    const [s9Suket, setS9Suket] = useState({
        tgl_input_suket: job.tgl_input_suket ?? '',
        tgl_suket_selesai: job.tgl_suket_selesai ?? '',
    });
    const [s11Collection, setS11Collection] = useState({
        metode_penagihan: job.metode_penagihan ?? 'Email & WhatsApp',
        status_penagihan: job.status_penagihan ?? 'Dalam Follow-up',
        tgl_penagihan: job.tgl_penagihan ?? new Date().toISOString().slice(0, 10),
        catatan_penagihan: job.catatan_penagihan ?? '',
    });
    const [s11c, setS11c] = useState({
        verification_status: job.payment_verification_status ?? (job.paid ? 'Lunas' : 'Partial / Pending'),
        bank_ref: job.bank_ref ?? '',
        amount_received: job.amount_received ?? (job.nilai || 0),
        verification_notes: job.payment_verification_notes ?? '',
    });
    const [s11bDelivery, setS11bDelivery] = useState({
        no_resi: job.no_resi ?? '',
        tgl_kirim_suket: job.tgl_kirim_suket ?? '',
        ekspedisi: job.ekspedisi ?? 'Kurir Internal',
        batch_no: job.batch_no ?? 'Batch 1',
        tanda_terima_klien: job.tanda_terima_klien ?? '',
    });
    const [s11, setS11] = useState({ no_resi: job.no_resi ?? '' });
    const [isMoving, setIsMoving] = useState(false);

    // ── Schedule builder state (Stage 3 & Stage 4c Reschedule) ────────────────
    const initScheduleDays = (j) => {
        const saved = j.schedule_days;
        if (Array.isArray(saved) && saved.length > 0) {
            return saved.map(d => ({
                date: d.date || '',
                inspector_ids: Array.isArray(d.inspector_ids) ? d.inspector_ids : [],
            }));
        }
        // Backward compat: single-day from flat fields
        if (j.tgl_pelaksanaan) {
            return [{
                date: j.tgl_pelaksanaan.slice(0, 10),
                inspector_ids: j.inspectors ? j.inspectors.map(i => i.id) : [],
            }];
        }
        return [{ date: '', inspector_ids: [] }];
    };
    const [scheduleDays, setScheduleDays] = useState(() => initScheduleDays(job));
    const [s14, setS14] = useState({
        s14_payment_status: job.s14_payment_status ?? 'pending',
        s14_payment_notes: job.s14_payment_notes ?? '',
    });

    // Stage 2 per-item verification status: { [type]: 'ok' | 'tidak' | 'na' | '' }
    const [s2Verify, setS2Verify] = useState(() => {
        const saved = parseJsonObject(job.s2_verify_data);
        const init = {};
        STAGE2_VERIFY_CHECKLIST.forEach(item => {
            init[item.type] = saved[item.type] || '';
        });
        return init;
    });

    const handleSetS2Status = (type, val) => {
        const updated = { ...s2Verify, [type]: val };
        setS2Verify(updated);
        router.post(`/jobs/${job.id}/s2-verify`, { s2_verify_data: updated }, { preserveScroll: true });
    };

    // Master data & recommendations (Stage 3 & Stage 4c Reschedule)
    const [masterData, setMasterData] = useState({ alat_uji: [], sertifikat_pjk3: [] });
    const [recommendations, setRecommendations] = useState({ recommended: [], eliminated: [] });
    useEffect(() => {
        if (job.stage === 3 || job.stage === 16) {
            fetch('/api/master-data')
                .then(r => {
                    if (!r.ok) throw new Error('Master data request failed');
                    return r.json();
                })
                .then(data => {
                    if (data && Array.isArray(data.alat_uji) && Array.isArray(data.sertifikat_pjk3)) {
                        setMasterData(data);
                    }
                })
                .catch(console.error);

            fetch(`/api/jobs/${job.id}/recommendations`)
                .then(r => {
                    if (!r.ok) throw new Error('Recommendations request failed');
                    return r.json();
                })
                .then(data => {
                    if (data && Array.isArray(data.recommended) && Array.isArray(data.eliminated)) {
                        setRecommendations(data);
                    }
                })
                .catch(console.error);
        }
    }, [job.id, job.stage]);

    // Keep local form states synchronized when job prop updates
    useEffect(() => {
        setData({
            next_stage: getNextStageId(job.stage),
            notes: '',
            inspector_ids: job.inspectors ? job.inspectors.map(i => i.id) : [],
            report_writer_id: job.report_writer_id || '',
            tgl_pelaksanaan: job.tgl_pelaksanaan || '',
            jam_mulai: job.jam_mulai || '08:00',
            durasi_hari: job.durasi_hari || 1,
            disnaker_tujuan: job.disnaker_tujuan || '',
            alat_ids: parseJsonArray(job.alat_ids),
            cert_ids: parseJsonArray(job.cert_ids),
        });
        editForm.setData({
            klien: job.klien || '',
            pesawat: job.pesawat || '',
            lokasi: job.lokasi || '',
            nilai: job.nilai || '',
            units: job.units || 1,
        });
        setS4({
            actual_units: job.actual_units ?? job.units,
            unit_count_notes: job.unit_count_notes ?? '',
        });
        setS5({
            s5_review_decision: job.s5_review_decision ?? '',
            s5_review_notes: job.s5_review_notes ?? '',
        });
        setS7({ tgl_submit_disnaker: job.tgl_submit_disnaker ?? '' });
        setS8({
            tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker ?? '',
            tgl_doc_received_disnaker: job.tgl_doc_received_disnaker ?? '',
            s8_progress_status: job.s8_progress_status ?? '',
        });
        setS9({ s9_progress_status: job.s9_progress_status ?? '' });
        setS10({
            invoice_no: job.invoice_no ?? '',
            total_invoice_amount: job.total_invoice_amount ?? '',
            tgl_invoice_issued: job.tgl_invoice_issued ?? '',
            s10_progress_status: job.s10_progress_status ?? '',
            tgl_submit_mkt: job.tgl_submit_mkt ?? '',
        });
        setS4c({
            reschedule_reason: job.reschedule_reason ?? '',
            tgl_reschedule: job.tgl_reschedule ?? '',
            reschedule_notes: job.reschedule_notes ?? '',
        });
        setS4d({
            actual_units: job.actual_units ?? job.units ?? 1,
            unit_count_notes: job.unit_count_notes ?? '',
            ru_ulang_status: job.ru_ulang_status ?? 'lolos',
            ru_ulang_notes: job.ru_ulang_notes ?? '',
        });
        setS11({ no_resi: job.no_resi ?? '' });
        setS14({
            s14_payment_status: job.s14_payment_status ?? 'pending',
            s14_payment_notes: job.s14_payment_notes ?? '',
        });
        setScheduleDays(initScheduleDays(job));

        const saved = parseJsonObject(job.s2_verify_data);
        const init = {};
        STAGE2_VERIFY_CHECKLIST.forEach(item => {
            init[item.type] = saved[item.type] || '';
        });
        setS2Verify(init);
    }, [job.id]);

    // ── Permissions ──────────────────────────────────────────────────────────
    const { permissions, user } = auth || {};
    const isInspector = user?.role === 'inspektur';
    const isMGR = user?.role === 'manager';
    const isAssignedInspector = (job.inspectors || []).some(ins =>
        String(ins.id) === String(user?.id) ||
        String(ins.user_id) === String(user?.id) ||
        String(ins.pivot?.user_id) === String(user?.id)
    ) || String(job.report_writer_id) === String(user?.id);

    const canSeeNilai = user?.role === 'superadmin'
        || user?.role === 'finance'
        || (user?.role === 'marketing' && job.owner_marketing === user?.name);

    const canManage = (() => {
        if (propCanManage !== undefined) return propCanManage;
        if (!user) return false;
        if (user.role === 'superadmin') return true;
        if (user.role === 'marketing' && [1, 13, 11, 14].includes(job.stage)) return true;
        if (user.role === 'admin' && [2, 3, 16, 5, 7, 8, 9].includes(job.stage)) return true;
        if (user.role === 'finance' && [10, 15, 12].includes(job.stage)) return true;
        if (isMGR && !MKT_STAGES.includes(job.stage) && !FIN_STAGES.includes(job.stage)) return true;
        if (isInspector) {
            return [4, 17].includes(job.stage) && (isAssignedInspector || !job.inspectors || job.inspectors.length === 0);
        }
        if (permissions && typeof permissions === 'object') {
            const p = permissions[job.stage];
            if (p && (p.is_owner === true || p.is_owner === 1 || p.is_owner === '1')) return true;
        }
        return false;
    })();

    const canViewStageDocs = (sid) => {
        if (['superadmin', 'admin', 'manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && job.owner_marketing === user?.name) return true;
        if (isInspector) return true;
        const p = permissions?.[sid];
        return p && (p.can_view || p.is_owner);
    };

    const canManageStageDocs = (sid) => {
        if (['superadmin', 'manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && job.owner_marketing === user?.name && [1, 11, 13, 14].includes(sid)) return true;
        if (user?.role === 'finance' && [10, 15, 12].includes(sid)) return true;
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
    const s4UnitMismatch = s4.actual_units != null && parseInt(s4.actual_units) !== parseInt(job.units);
    const s4dUnitMismatch = s4d.actual_units != null && parseInt(s4d.actual_units) !== parseInt(job.units);

    // ── Stage 3 schedule validity ────────────────────────────────────────────
    const allSelectedInspectorIds = [...new Set(scheduleDays.flatMap(d => d.inspector_ids))];
    const s3ScheduleValid =
        scheduleDays.length > 0 &&
        scheduleDays.every(d => d.date?.trim()) &&
        scheduleDays.every(d => d.inspector_ids.length > 0);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleMoveStage = (e) => {
        e.preventDefault();
        if (job.stage === 1 && !stage1DocOk) return showError('Upload Dokumen', 'Upload minimal satu dokumen PO/SPK, Surat Permohonan, atau Surat Kuasa!');
        if (job.stage === 2 && !stage2CanMove) return showError('Dokumen Belum Lengkap', 'Lengkapi dokumen atau minta persetujuan Kadiv/MGR.');
        if (job.stage === 3) {
            if (!data.disnaker_tujuan) return showError('Validasi', 'Pilih Disnaker Tujuan!');
            if (!s3ScheduleValid) return showError('Validasi', 'Lengkapi tanggal dan inspektur untuk setiap hari!');
            setIsMoving(true);
            router.post(`/jobs/${job.id}/move`, {
                next_stage: data.next_stage,
                notes: data.notes,
                jam_mulai: data.jam_mulai,
                disnaker_tujuan: data.disnaker_tujuan,
                report_writer_id: data.report_writer_id,
                alat_ids: data.alat_ids,
                cert_ids: data.cert_ids,
                schedule_days: scheduleDays,
            }, {
                onSuccess: () => { setIsMoving(false); onClose(); },
                onError: () => setIsMoving(false),
            });
            return;
        }
        if (job.stage === 10) {
            if (!s10.invoice_no?.trim()) return showError('Validasi', 'Nomor Invoice wajib diisi.');
            if (!s10.total_invoice_amount || parseFloat(s10.total_invoice_amount) <= 0) return showError('Validasi', 'Total Invoice (Nilai Tagihan) wajib diisi dengan benar.');
            const invDate = s10.tgl_invoice_issued || s10.invoice_date;
            if (!invDate) return showError('Validasi', 'Tanggal Invoice Diterbitkan wajib diisi.');

            const hasInvoiceDoc = (job.documents || []).some(d =>
                ['Invoice (PDF)', 'Invoice', 'Faktur / Invoice', 'Faktur', 'Faktur Pajak', 'Kwitansi', 'Bukti Transfer'].includes(d.type) ||
                d.stage === 10
            );
            if (!hasInvoiceDoc) return showError('Dokumen Belum Lengkap', 'Dokumen "Invoice (PDF)" atau dokumen penagihan wajib diunggah sebelum melanjutkan.');

            setIsMoving(true);
            router.post(`/jobs/${job.id}/stage10-data`, s10, {
                onSuccess: () => {
                    router.post(`/jobs/${job.id}/move`, {
                        next_stage: data.next_stage || 11,
                        notes: data.notes,
                    }, {
                        onSuccess: () => { setIsMoving(false); onClose(); },
                        onError: (errs) => {
                            setIsMoving(false);
                            const msg = Object.values(errs).flat().join('\n') || 'Gagal memindahkan stage.';
                            showError('Gagal Pindah Stage', msg);
                        },
                    });
                },
                onError: (errs) => {
                    setIsMoving(false);
                    const msg = Object.values(errs).flat().join('\n') || 'Gagal menyimpan data penagihan.';
                    showError('Gagal Simpan', msg);
                },
            });
            return;
        }
        post(`/jobs/${job.id}/move`, { onSuccess: () => onClose() });
    };

    const handleRouteTo13 = (e) => {
        e.preventDefault();
        router.post(`/jobs/${job.id}/move`, { ...data, next_stage: 13 }, { onSuccess: () => onClose() });
    };

    const handleRejectStage = async () => {
        if (!data.notes?.trim()) return showError('Validasi', 'Isi catatan penolakan terlebih dahulu!');
        let targetStage = Math.max(1, job.stage - 1);
        if (job.stage === 13) targetStage = 4;       // 4b -> 4
        else if (job.stage === 16) targetStage = 13; // 4c -> 4b
        else if (job.stage === 17) targetStage = 16; // 4d -> 4c
        else if (job.stage === 5) targetStage = 4;
        else if (job.stage === 6) targetStage = 5;
        else if (job.stage === 7) targetStage = 6;
        else if (job.stage === 8) targetStage = 7;
        else if (job.stage === 9) targetStage = 8;
        else if (job.stage === 10) targetStage = 9;
        else if (job.stage === 11) targetStage = 10;
        else if (job.stage === 15) targetStage = 11; // 11c -> 11 (Loopback penagihan ulang)
        else if (job.stage === 14) targetStage = 15; // 11b -> 11c
        const res = await showConfirm('Tolak / Kembalikan Job', `Kembalikan job ini ke Stage ${targetStage}?`);
        if (!res.isConfirmed) return;
        post(`/jobs/${job.id}/reject`, {
            data: { notes: data.notes, target_stage: targetStage },
            onSuccess: () => onClose()
        });
    };

    const handleAskApproval = async () => {
        const res = await showConfirm('Minta Persetujuan', 'Kirim permintaan persetujuan ke Kadiv/MGR?');
        if (!res.isConfirmed) return;
        router.post(`/jobs/${job.id}/ask-approval`, {}, { onSuccess: () => onClose() });
    };

    const handleApproveAsManager = async () => {
        const res = await showConfirm('Setujui Permintaan', 'Setujui permintaan ini? Admin dapat melanjutkan tanpa dokumen lengkap.');
        if (!res.isConfirmed) return;
        router.post(`/jobs/${job.id}/approve`, {}, { onSuccess: () => onClose() });
    };

    const handleBypassStage2WithJustification = async () => {
        const { value: text, isConfirmed } = await MySwal.fire({
            title: 'Bypass Dokumen Teknis (Kadiv/MGR)',
            text: 'Masukkan alasan / justifikasi tertulis mengapa dokumen dapat di-bypass. Catatan ini akan dicatat dalam audit trail dan tercatat sebagai hutang dokumen.',
            input: 'textarea',
            inputPlaceholder: 'Tuliskan justifikasi bypass dokumen di sini...',
            inputValidator: (val) => {
                if (!val || !val.trim()) {
                    return 'Alasan / justifikasi bypass wajib diisi!';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Setujui Bypass',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#10b981',
        });
        if (!isConfirmed || !text) return;
        router.post(`/api/jobs/${job.id}/bypass-stage2`, {
            justification: text.trim(),
            approver: user?.name || 'Manager'
        }, {
            onSuccess: () => {
                showSuccess('Bypass Disetujui', 'Bypass dokumen berhasil disetujui & dicatat.');
                onClose();
            }
        });
    };

    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const handleJobSplit = () => {
        setIsSplitModalOpen(true);
    };

    const handleReopenJob = async () => {
        const { value: text, isConfirmed } = await MySwal.fire({
            title: 'Buka Kembali Job (Reopen)',
            text: 'Masukkan alasan pembukaan kembali pekerjaan yang sudah selesai (Closed). Tindakan ini akan dicatat ke audit log.',
            input: 'textarea',
            inputPlaceholder: 'Tuliskan alasan pembukaan kembali di sini...',
            inputValidator: (val) => {
                if (!val || !val.trim()) {
                    return 'Alasan pembukaan kembali wajib diisi!';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Buka Kembali Job',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f59e0b',
        });
        if (!isConfirmed || !text) return;
        router.post(`/api/jobs/${job.id}/reopen`, {
            reason: text.trim(),
            reopened_by: user?.name || 'Authorized User'
        }, {
            onSuccess: () => {
                showSuccess('Job Dibuka Kembali', 'Job berhasil dibuka kembali ke Stage 5.');
                onClose();
            }
        });
    };

    const handleReturnToStage1 = (e) => {
        e.preventDefault();
        if (!returnNotes.trim()) return showError('Validasi', 'Isi alasan pengembalian!');
        router.post(`/jobs/${job.id}/return-to-stage1`, { notes: returnNotes }, { onSuccess: () => onClose() });
    };

    const handleSaveS4 = () => router.post(`/jobs/${job.id}/stage4-data`, s4, { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS4c = () => router.post(`/jobs/${job.id}/stage4c-data`, s4c, { onSuccess: () => showSuccess('Berhasil', 'Data Reschedule tersimpan.') });
    const handleSaveS4d = () => router.post(`/jobs/${job.id}/stage4d-data`, s4d, { onSuccess: () => showSuccess('Berhasil', 'Data RU Ulang tersimpan.') });
    const handleSaveS5Dates = () => router.post(`/jobs/${job.id}/stage5-dates`, s5Dates, { onSuccess: () => showSuccess('Berhasil', 'Tracking Tanggal LHPP tersimpan.') });
    const handleSaveS9Suket = () => router.post(`/jobs/${job.id}/stage9-suket`, s9Suket, { onSuccess: () => showSuccess('Berhasil', 'Tracking Durasi SUKET tersimpan.') });
    const handleSaveS5 = () => {
        if (!s5.s5_review_decision) return showError('Validasi', 'Pilih keputusan review!');
        router.post(`/jobs/${job.id}/stage5-review`, s5, { onSuccess: () => showSuccess('Berhasil', 'Keputusan disimpan.') });
    };
    const handleSaveS7 = () => router.post(`/jobs/${job.id}/stage7-data`, s7, { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS8 = () => router.post(`/jobs/${job.id}/stage8-data`, s8, { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS9 = () => router.post(`/jobs/${job.id}/stage9-data`, s9, { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS10 = () => router.post(`/jobs/${job.id}/stage10-data`, s10, { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS11 = () => router.post(`/jobs/${job.id}/stage11-data`, s11, { onSuccess: () => showSuccess('Berhasil', 'No. Resi tersimpan.') });
    const handleSaveS11c = (targetStatus) => {
        const finalStatus = targetStatus || s11c.verification_status;
        if (finalStatus === 'Partial / Pending' && !s11c.verification_notes?.trim()) {
            return showError('Catatan Diperlukan', 'Harap isi alasan / catatan jika status Partial / Pending untuk tindak lanjut Marketing.');
        }
        router.post(`/jobs/${job.id}/payment-verification`, {
            status: finalStatus,
            bank_ref: s11c.bank_ref,
            amount_received: s11c.amount_received,
            notes: s11c.verification_notes,
            verifier: auth?.user?.name || 'Finance Admin',
        }, {
            onSuccess: () => {
                showSuccess('Verifikasi Berhasil', `Status verifikasi pembayaran: ${finalStatus}`);
                onClose();
            }
        });
    };
    const handleSaveS14 = () => router.post(`/jobs/${job.id}/stage14-data`, s14, { onSuccess: () => showSuccess('Berhasil', 'Status Pembayaran 11b Tersimpan.') });

    const handleUpdateJob = (e) => {
        e.preventDefault();
        router.post(`/jobs/${job.id}`, {
            _method: 'PUT',
            ...editForm.data
        }, {
            onSuccess: () => {
                setIsEditing(false);
                showSuccess('Berhasil', 'Informasi Job berhasil diperbarui.');
            }
        });
    };

    // Generic document upload (for most stages)
    const triggerUpload = (stage, type) => {
        setUploadStage(stage); setUploadType(type);
        setTimeout(() => fileInputRef.current?.click(), 50);
    };

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !uploadStage || !uploadType) return;
        if (file.size > MAX_FILE_SIZE) {
            showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB. Silakan kompres file Anda terlebih dahulu.');
            e.target.value = '';
            return;
        }
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', file); fd.append('type', uploadType); fd.append('stage', uploadStage);
        router.post(`/jobs/${job.id}/documents`, fd, {
            forceFormData: true,
            onSuccess: () => { setUploadStage(null); setUploadType(''); setIsUploading(false); },
            onError: () => setIsUploading(false),
        });
        e.target.value = '';
    };

    const uploadFileDirectly = (file, stageId, type, extraNotes = '') => {
        if (!file || !stageId || !type) return;
        if (file.size > MAX_FILE_SIZE) {
            showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB. Silakan kompres file Anda terlebih dahulu.');
            return;
        }
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        fd.append('stage', stageId);
        if (extraNotes) fd.append('photo_notes', extraNotes);
        router.post(`/jobs/${job.id}/documents`, fd, {
            forceFormData: true,
            onSuccess: () => { setUploadStage(null); setUploadType(''); setIsUploading(false); },
            onError: () => setIsUploading(false),
        });
    };

    // Photo upload (Stage 4, with per-photo notes)
    const uploadPhoto = (type) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '*';
        input.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            if (file.size > MAX_FILE_SIZE) {
                showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB.');
                return;
            }
            const fd = new FormData();
            fd.append('file', file); fd.append('type', type); fd.append('stage', 4);
            const note = photoNotes[type] || '';
            if (note) fd.append('photo_notes', note);
            router.post(`/jobs/${job.id}/documents`, fd, { forceFormData: true });
        };
        input.click();
    };

    const deleteDoc = async (docId) => {
        const res = await showConfirm('Hapus Dokumen', 'Hapus dokumen ini?');
        if (!res.isConfirmed) return;
        router.delete(`/jobs/${job.id}/documents/${docId}`, { preserveScroll: true });
    };

    // Get docs for a stage+type
    const getDocs = (stage, type = null) => {
        const docs = (job.documents || []).filter(d => d.stage === stage);
        return type ? docs.filter(d => d.type === type) : docs;
    };

    // Compute SLA for current stage
    const currentStageInfo = STAGES.find(s => s.id === job.stage);
    const daysInStage = daysElapsed(job.stage_started_at);
    const slaTag = getSlaTag(daysInStage, currentStageInfo?.sla);

    // ══ END PART A ══ (DO NOT ADD MORE CODE BELOW THIS LINE — combine with part_b then part_c)

    // ══ BEGIN PART B ══

    // ── Stage Action Panel ────────────────────────────────────────────────────
    const renderStageAction = () => {
        if (!canManage) return null;
        const s = job.stage;

        return (
            <form onSubmit={handleMoveStage}>
                {/* ── STAGE 1 ─────────────────────────────────── */}
                {s === 1 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Upload minimal salah satu dokumen berikut untuk melanjutkan:</p>
                        {STAGE1_REQUIRED_DOCS.map(t => (
                            <UploadSlot key={t} type={t} stageId={1} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />
                        ))}
                        <p className="text-xs text-gray-400 mt-1">Dokumen opsional tambahan:</p>
                        {(DOC_TYPES_BY_STAGE[1] || []).filter(t => !STAGE1_REQUIRED_DOCS.includes(t)).map(t => (
                            <UploadSlot key={t} type={t} stageId={1} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                        ))}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} disabled={!stage1DocOk} disabledMsg={!stage1DocOk ? 'Upload minimal 1 dokumen utama (PO/SPK, Surat Permohonan, atau Surat Kuasa)' : ''} />
                    </div>
                )}

                {/* ── STAGE 2 ─────────────────────────────────── */}
                {s === 2 && (
                    <div className="space-y-3">
                        {/* Status banners */}
                        {stage2Bypass && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800 font-medium">
                                Kadiv/MGR sudah menyetujui. Admin dapat melanjutkan.
                            </div>
                        )}
                        {job.peer_review_status === 'requested' && isMGR && (
                            <div className="bg-blue-50 border border-blue-300 rounded p-3 flex items-center justify-between">
                                <span className="text-sm text-blue-800 font-medium">Admin meminta persetujuan Anda.</span>
                                <button type="button" onClick={handleApproveAsManager}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">
                                    Setujui
                                </button>
                            </div>
                        )}
                        {job.peer_review_status === 'requested' && !isMGR && (
                            <div className="px-3 py-2 rounded text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                Menunggu persetujuan Kadiv/MGR…
                            </div>
                        )}

                        {/* ── Verification Checklist Table ── */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                            {/* Table Header */}
                            <div className="grid bg-gray-100 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wide"
                                style={{ gridTemplateColumns: '2.5rem 1fr 7rem 10.5rem' }}>
                                <div className="px-2 py-2 text-center">NO</div>
                                <div className="px-3 py-2">DOKUMEN</div>
                                <div className="px-2 py-2 text-center">FILE</div>
                                <div className="px-2 py-2 text-center">STATUS VERIFIKASI</div>
                            </div>

                            {/* Rows */}
                            {STAGE2_VERIFY_CHECKLIST.map((item) => {
                                // Check stage 1 AND 2 — docs are uploaded by Marketing at Stage 1,
                                // but Admin can also add/replace them at Stage 2 during verification.
                                const docs = (job.documents || []).filter(d =>
                                    (d.stage === 1 || d.stage === 2) && d.type === item.type
                                );
                                const hasFile = docs.length > 0;
                                const status = s2Verify[item.type];
                                const setStatus = (v) => handleSetS2Status(item.type, v);

                                return (
                                    <div key={item.type}
                                        className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors items-start"
                                        style={{ gridTemplateColumns: '2.5rem 1fr 7rem 10.5rem' }}>

                                        {/* NO */}
                                        <div className="px-2 py-3 text-center font-bold text-gray-400">{item.no}</div>

                                        {/* DOKUMEN */}
                                        <div className="px-3 py-3">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                <span className="font-medium text-gray-800">{item.label}</span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${item.badge === 'WAJIB'
                                                        ? 'border-red-400 text-red-600'
                                                        : 'border-gray-400 text-gray-500'
                                                    }`}>{item.badge}</span>
                                                {item.badge2 && (
                                                    <span className="px-1.5 py-0.5 rounded border border-blue-400 text-blue-600 text-[10px] font-bold">
                                                        {item.badge2}
                                                    </span>
                                                )}
                                            </div>
                                            {item.hint && (
                                                <p className="text-[10px] text-gray-400 italic mt-0.5">{item.hint}</p>
                                            )}
                                        </div>

                                        {/* FILE */}
                                        <div className="px-2 py-3 flex flex-col items-center gap-1">
                                            {item.noVerify ? (
                                                <span className="px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-[10px] flex items-center gap-1 cursor-not-allowed" title="Dokumen bersifat privat & tidak perlu dibaca Admin">
                                                    Privat / Unreadable
                                                </span>
                                            ) : item.isManual ? (
                                                <span className="px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-[10px]">MANUAL</span>
                                            ) : hasFile ? (
                                                docs.map(d => (
                                                    <a key={d.id} href={`/storage/${d.path}`} target="_blank" rel="noopener noreferrer"
                                                        className="px-2 py-1 rounded bg-green-50 border border-green-300 text-green-700 font-semibold text-[10px] hover:underline truncate max-w-[80px]" title={d.name}>
                                                        {d.name.split('.').pop().toUpperCase()}
                                                    </a>
                                                ))
                                            ) : (
                                                <button type="button"
                                                    onClick={() => triggerUpload(2, item.type)}
                                                    className="px-2 py-1 rounded bg-red-50 border border-red-300 text-red-600 font-semibold text-[10px] hover:bg-red-100 flex items-center gap-1">
                                                    KOSONG
                                                </button>
                                            )}
                                            {hasFile && !item.noVerify && canManageStageDocs(2) && (
                                                <button type="button" onClick={() => triggerUpload(2, item.type)}
                                                    className="text-[10px] text-blue-500 hover:underline">+ ganti</button>
                                            )}
                                        </div>

                                        {/* STATUS VERIFIKASI */}
                                        <div className="px-2 py-3 flex items-center justify-center gap-1 flex-wrap">
                                            {item.noVerify ? (
                                                <span className="text-[10px] text-gray-400 italic">-</span>
                                            ) : (
                                                <>
                                                    <button type="button" onClick={() => setStatus(status === 'ok' ? '' : 'ok')}
                                                        className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${status === 'ok'
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                                                : 'border-gray-300 text-gray-600 bg-white hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700'
                                                            }`} title="Mark OK / Verified">
                                                        OK
                                                    </button>
                                                    <button type="button" onClick={() => setStatus(status === 'tidak' ? '' : 'tidak')}
                                                        className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${status === 'tidak'
                                                                ? 'bg-red-600 text-white border-red-600 shadow-xs scale-105'
                                                                : 'border-gray-300 text-gray-600 bg-white hover:bg-red-50 hover:border-red-400 hover:text-red-700'
                                                            }`} title="Mark TIDAK / Rejected">
                                                        TIDAK
                                                    </button>
                                                    {item.hasNa && (
                                                        <button type="button" onClick={() => setStatus(status === 'na' ? '' : 'na')}
                                                            className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${status === 'na'
                                                                    ? 'bg-gray-600 text-white border-gray-600 shadow-xs scale-105'
                                                                    : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-100 hover:border-gray-400'
                                                                }`} title="Not Applicable">
                                                            N/A
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        {/* Action row */}
                        <div className="flex gap-2 mt-1 flex-wrap">
                            <button type="button" onClick={handleRejectStage} disabled={processing}
                                className="px-3 py-2 rounded text-sm bg-red-600 text-white font-semibold hover:bg-red-700">
                                Kembalikan ke Marketing
                            </button>
                            {!stage2DocOk && !stage2Bypass && (isMGR || auth?.user?.role === 'superadmin') && (
                                <button type="button" onClick={handleBypassStage2WithJustification}
                                    className="px-3 py-2 rounded text-sm bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1">
                                    Bypass Dokumen (Kadiv/MGR)
                                </button>
                            )}
                            {!stage2DocOk && !stage2Bypass && job.peer_review_status !== 'requested' && !isMGR && auth?.user?.role !== 'superadmin' && (
                                <button type="button" onClick={handleAskApproval}
                                    className="px-3 py-2 rounded text-sm bg-orange-500 text-white font-semibold hover:bg-orange-600">
                                    Minta Persetujuan MGR
                                </button>
                            )}
                            <button type="submit" disabled={processing || !stage2CanMove}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                                {processing ? '...' : 'Verifikasi Selesai — Lanjut Penjadwalan →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 3 ─────────────────────────────────── */}
                {s === 3 && (() => {
                    const isDpUnpaid = job.termin_pembayaran === 'DP' && !job.dp_paid && !job.paid;
                    const dpAmt = job.dp_amount || (job.nilai * (job.dp_percentage || 30) / 100);
                    return (
                        <div className="space-y-4">
                            {isDpUnpaid && (
                                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-xs text-red-900 font-semibold space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <span>Surat Tugas Diblokir (DP Hard-Gate)</span>
                                    </div>
                                    <p>
                                        Skema pembayaran job ini adalah <strong>Uang Muka (DP)</strong> senilai <strong>{fmtCurrency(dpAmt)}</strong>. Penerbitan Surat Tugas diblokir sampai Finance mengonfirmasi penerimaan DP.
                                    </p>
                                </div>
                            )}

                            {/* Row 1: Jam Mulai + Disnaker */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Jam Mulai *</label>
                                    <input type="time" value={data.jam_mulai} onChange={e => setData('jam_mulai', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Disnaker Tujuan *</label>
                                    <select
                                        value={data.disnaker_tujuan}
                                        onChange={e => setData('disnaker_tujuan', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-400"
                                        required
                                    >
                                        <option value="">-- Pilih Disnaker Provinsi --</option>
                                        {data.disnaker_tujuan &&
                                            !INDONESIA_PROVINCES.includes(data.disnaker_tujuan) &&
                                            !INDONESIA_PROVINCES.map(p => `Disnaker Prov. ${p}`).includes(data.disnaker_tujuan) && (
                                                <option value={data.disnaker_tujuan}>{data.disnaker_tujuan}</option>
                                            )}
                                        {INDONESIA_PROVINCES.map(prov => {
                                            const val = `Disnaker Prov. ${prov}`;
                                            return <option key={prov} value={val}>{val}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            {/* ── Schedule Builder ── */}
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-3">
                                {/* Header: title + add/remove day controls */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-900">Jadwal Pelaksanaan</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-indigo-700">Hari:</span>
                                        <button type="button"
                                            onClick={() => scheduleDays.length > 1 && setScheduleDays(prev => prev.slice(0, -1))}
                                            disabled={scheduleDays.length <= 1}
                                            className="w-6 h-6 rounded border border-indigo-300 bg-white text-indigo-700 font-bold text-sm leading-none flex items-center justify-center hover:bg-indigo-100 disabled:opacity-40">−</button>
                                        <span className="text-sm font-bold text-indigo-900 w-5 text-center">{scheduleDays.length}</span>
                                        <button type="button"
                                            onClick={() => setScheduleDays(prev => [...prev, { date: '', inspector_ids: [] }])}
                                            className="w-6 h-6 rounded border border-indigo-300 bg-white text-indigo-700 font-bold text-sm leading-none flex items-center justify-center hover:bg-indigo-100">+</button>
                                    </div>
                                </div>

                                {/* Day rows */}
                                {scheduleDays.map((day, dayIdx) => {
                                    const allInspectors = [
                                        ...(recommendations.recommended || []),
                                        ...(recommendations.eliminated || []),
                                    ];
                                    return (
                                        <div key={dayIdx} className="bg-white border border-indigo-200 rounded-lg p-3">
                                            {/* Day header: label + date picker + remove */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded shrink-0">
                                                    Hari {dayIdx + 1}
                                                </span>
                                                <input
                                                    type="date"
                                                    value={day.date}
                                                    onChange={e => {
                                                        const updated = scheduleDays.map((d, i) =>
                                                            i === dayIdx ? { ...d, date: e.target.value } : d
                                                        );
                                                        setScheduleDays(updated);
                                                    }}
                                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-400"
                                                />
                                                {scheduleDays.length > 1 && (
                                                    <button type="button"
                                                        onClick={() => setScheduleDays(prev => prev.filter((_, i) => i !== dayIdx))}
                                                        className="text-red-400 hover:text-red-600 text-base leading-none px-1 shrink-0" title="Hapus hari ini">✕</button>
                                                )}
                                            </div>

                                            {/* Inspector chips */}
                                            <p className="text-[10px] text-gray-500 mb-1.5">Inspektur pada Hari {dayIdx + 1}:</p>
                                            {allInspectors.length === 0 ? (
                                                <p className="text-[11px] text-gray-400 italic">Memuat data inspektur...</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {allInspectors.map(item => {
                                                        const uid = item.user.id;
                                                        const isSelected = day.inspector_ids.includes(uid);
                                                        const isOverloaded = item.statuses
                                                            ? item.statuses.some(st => st === 'Overload')
                                                            : false;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={uid}
                                                                onClick={() => {
                                                                    const updated = scheduleDays.map((d, i) => {
                                                                        if (i !== dayIdx) return d;
                                                                        const ids = d.inspector_ids.includes(uid)
                                                                            ? d.inspector_ids.filter(id => id !== uid)
                                                                            : [...d.inspector_ids, uid];
                                                                        return { ...d, inspector_ids: ids };
                                                                    });
                                                                    setScheduleDays(updated);
                                                                }}
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${isSelected
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                        : isOverloaded
                                                                            ? 'bg-gray-50 text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500'
                                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                                    }`}
                                                            >
                                                                {item.user.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {!day.date && (
                                                <p className="text-[10px] text-red-500 mt-1">Pilih tanggal untuk hari ini</p>
                                            )}
                                            {day.inspector_ids.length === 0 && (
                                                <p className="text-[10px] text-red-500 mt-0.5">Pilih minimal 1 inspektur untuk hari ini</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Smart Recommendation — quick-fill to all days */}
                            <SmartRecommendation
                                job={job}
                                selectedInspectorIds={allSelectedInspectorIds}
                                onSelectInspector={(insUser) => {
                                    const uid = insUser.id;
                                    const isInAll = scheduleDays.every(d => d.inspector_ids.includes(uid));
                                    setScheduleDays(scheduleDays.map(d => ({
                                        ...d,
                                        inspector_ids: isInAll
                                            ? d.inspector_ids.filter(id => id !== uid)
                                            : d.inspector_ids.includes(uid)
                                                ? d.inspector_ids
                                                : [...d.inspector_ids, uid],
                                    })));
                                }}
                            />

                            {/* Penanggung Jawab Laporan / Penyusun LHPP */}
                            <div className="bg-white border rounded-lg p-3">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Penanggung Jawab Laporan / Penyusun LHPP
                                </label>
                                <select
                                    value={data.report_writer_id || ''}
                                    onChange={e => setData('report_writer_id', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-400"
                                >
                                    <option value="">-- Pilih Penanggung Jawab Laporan (Opsional) --</option>
                                    {[
                                        ...(recommendations.recommended || []),
                                        ...(recommendations.eliminated || [])
                                    ].map(item => (
                                        <option key={item.user.id} value={item.user.id}>
                                            {item.user.name} ({item.user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Alat Uji */}
                            {masterData.alat_uji.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Alat Uji yang Digunakan</label>
                                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded p-2">
                                        {masterData.alat_uji.map(a => (
                                            <label key={a.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input type="checkbox" checked={data.alat_ids.includes(a.id)}
                                                    onChange={() => {
                                                        const ids = data.alat_ids.includes(a.id) ? data.alat_ids.filter(x => x !== a.id) : [...data.alat_ids, a.id];
                                                        setData('alat_ids', ids);
                                                    }} className="rounded" />
                                                {a.nama}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Download Surat Tugas (DISABLED - STILL ERROR)
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between shadow-sm mb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                    ST
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-950">Surat Tugas Riksa Uji</p>
                                    <p className="text-[11px] text-blue-700 font-medium">
                                        {job.no_surat_tugas ? `No: ${job.no_surat_tugas}` : 'Auto-generated otomatis dari Sistem'}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`/jobs/${job.id}/download-surat-tugas`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-sm transition flex items-center gap-1 cursor-pointer"
                            >
                                Download Surat Tugas (.docx)
                            </a>
                        </div>
                        */}

                            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                            <MoveRow stage={s} processing={processing || isMoving} onReject={handleRejectStage}
                                disabled={!s3ScheduleValid || !data.disnaker_tujuan || isDpUnpaid}
                                disabledMsg={isDpUnpaid ? 'Surat Tugas diblokir sampai DP terverifikasi' : !data.disnaker_tujuan ? 'Pilih Disnaker Tujuan' : !s3ScheduleValid ? 'Lengkapi jadwal dan inspektur tiap hari' : ''} />
                        </div>
                    );
                })()}

                {/* ── STAGE 4 ─────────────────────────────────── */}
                {s === 4 && (
                    <div className="space-y-4">
                        {/* Unit Count */}
                        <div className="bg-gray-50 border rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Jumlah Alat yang Benar-benar Diperiksa</p>
                            <div className="flex items-center gap-3">
                                <input type="number" min="0" value={s4.actual_units}
                                    onChange={e => setS4({ ...s4, actual_units: e.target.value })}
                                    className="w-24 text-sm border rounded px-2 py-1.5" />
                                <span className="text-xs text-gray-500">dari {job.units} unit dalam Job</span>
                                {s4UnitMismatch && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">TIDAK COCOK</span>
                                )}
                            </div>
                            {s4UnitMismatch && (
                                <div className="mt-2">
                                    <label className="block text-xs text-gray-600 mb-1">Alasan / Catatan *</label>
                                    <textarea rows={2} value={s4.unit_count_notes}
                                        onChange={e => setS4({ ...s4, unit_count_notes: e.target.value })}
                                        className="w-full text-sm border rounded px-2 py-1.5"
                                        placeholder="Jelaskan mengapa jumlah berbeda…" />
                                </div>
                            )}
                            <button type="button" onClick={handleSaveS4}
                                className="mt-2 px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded font-medium">
                                Simpan Data Lapangan
                            </button>
                        </div>
                        {/* Photo Uploads */}
                        <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Foto Dokumentasi Wajib</p>
                            <div className="space-y-2">
                                {STAGE4_PHOTO_TYPES.map(type => {
                                    const existing = getDocs(4, type);
                                    return (
                                        <div key={type} className="border border-dashed rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-700">{type}</span>
                                                {existing.length > 0 && <span className="text-xs text-green-600 font-bold">Terupload</span>}
                                            </div>
                                            {existing.length > 0
                                                ? <div className="flex flex-wrap gap-1 mb-2">{existing.map(d => <DocChip key={d.id} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} />)}</div>
                                                : null
                                            }
                                            <input type="text" placeholder="Catatan foto (opsional)"
                                                value={photoNotes[type] || ''}
                                                onChange={e => setPhotoNotes({ ...photoNotes, [type]: e.target.value })}
                                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 mb-1" />
                                            <button type="button" onClick={() => uploadPhoto(type)}
                                                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-semibold">
                                                Upload Foto
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        {/* Stage 4 Routing & Direct Job Split */}
                        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50 space-y-2.5">
                            <p className="text-xs font-bold text-gray-800">
                                Pilih Hasil & Jalur Lanjutan RU Lapangan:
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        post(`/jobs/${job.id}/move`, {
                                            data: { ...data, next_stage: 5 },
                                            onSuccess: () => onClose()
                                        });
                                    }}
                                    disabled={processing}
                                    className="w-full px-4 py-2.5 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    Path A: Lolos Penuh (Semua Unit Sesuai) → Lanjut ke Stage 5 (LHPP)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleJobSplit}
                                    className="w-full px-4 py-2 rounded text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    Pecah Job
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRouteTo13}
                                    disabled={processing}
                                    className="w-full px-4 py-2 rounded text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    Path B: Unit Belum Siap / Mismatch Logistik → Stage 4b (Aktualisasi MKT)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        post(`/jobs/${job.id}/move`, {
                                            data: { ...data, next_stage: 6, s5_review_decision: 'tidak_laik' },
                                            onSuccess: () => onClose()
                                        });
                                    }}
                                    disabled={processing}
                                    className="w-full px-4 py-2 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    Path C: Unit Rusak / Temuan Teknis → Stage 6 (Review Laporan / Tidak Laik)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STAGE 13 (Aktualisasi Unit — 4b MKT) ──────── */}
                {s === 13 && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-amber-900 mb-1">
                                Stage 4b: Aktualisasi Unit (Marketing)
                            </h4>
                            <p className="text-xs text-amber-800">
                                Hasil pemeriksaan lapangan: <strong>{job.actual_units ?? job.units} Unit</strong> (Unit awal: {job.units} Unit).
                                {job.unit_count_notes && <span className="block mt-1 italic font-medium">Catatan: "{job.unit_count_notes}"</span>}
                            </p>
                        </div>

                        <div className="bg-white border rounded-lg p-3 space-y-3">
                            <h5 className="text-xs font-semibold text-gray-700">Penyesuaian Detail Job</h5>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-gray-600 mb-1">Jumlah Unit Baru</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editForm.data.units}
                                        onChange={e => editForm.setData('units', e.target.value)}
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                    />
                                </div>
                                {canSeeNilai && (
                                    <div>
                                        <label className="block text-gray-600 mb-1">Nilai Kontrak / Invoice (Rp)</label>
                                        <input
                                            type="number"
                                            value={editForm.data.nilai}
                                            onChange={e => editForm.setData('nilai', e.target.value)}
                                            className="w-full border rounded px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleUpdateJob}
                                disabled={editForm.processing}
                                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
                            >
                                Simpan Penyesuaian Job
                            </button>
                        </div>

                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                                type="button"
                                onClick={handleRejectStage}
                                disabled={processing}
                                className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            >
                                Tolak / Kembali ke Stage 4
                            </button>
                            <button
                                type="button"
                                onClick={handleJobSplit}
                                className="px-3 py-2 rounded text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1"
                            >
                                Pecah Job
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    post(`/jobs/${job.id}/move`, {
                                        data: { ...data, next_stage: 16 },
                                        onSuccess: () => onClose()
                                    });
                                }}
                                disabled={processing}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                            >
                                {processing ? '...' : 'Jadwalkan Ulang (Stage 4c) →'}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    post(`/jobs/${job.id}/move`, {
                                        data: { ...data, next_stage: 5 },
                                        onSuccess: () => onClose()
                                    });
                                }}
                                disabled={processing}
                                className="px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                            >
                                {processing ? '...' : 'Bypass ke Stage 5 (LHPP) →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 16 (Penjadwalan Ulang — 4c ADM) ──────── */}
                {s === 16 && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-amber-900 mb-1">
                                    Stage 4c: Penjadwalan Ulang / Reschedule (Admin)
                                </h4>
                                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">
                                    Reschedule Loop: {job.reschedule_count || 0} / 3
                                </span>
                            </div>
                            <p className="text-xs text-amber-800">
                                Terdapat unit yang tertunda/rusak saat Riksa Uji. Tentukan tanggal inspeksi ulang, tim ahli, dan alat uji untuk Riksa Uji Ulang (Stage 4d).
                            </p>
                        </div>

                        {/* Exceeded Max Reschedule Alert & Job Split Option */}
                        {(job.reschedule_count || 0) >= 3 && (
                            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3.5 space-y-2">
                                <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                                    <span>Batas Reschedule Tercapai ({job.reschedule_count || 3}/3)</span>
                                </div>
                                <p className="text-xs text-red-800">
                                    Berdasarkan SOP v2.0, Kadiv / Manager Teknis wajib memutuskan tindak lanjut unit yang tertunda:
                                </p>
                                <div className="flex gap-2 pt-1 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={handleJobSplit}
                                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs"
                                    >
                                        Opsi A: Pecah Job (Job Split)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.post(`/jobs/${job.id}/move`, { data: { ...data, next_stage: 12, notes: 'Ditutup sebagai Gagal Uji (Closed as Failed)' } })}
                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-xs"
                                    >
                                        Opsi B: Tutup Job Gagal
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Informasi Reschedule */}
                        <div className="bg-white border rounded-lg p-3 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Penjadwalan Ulang *</label>
                                <select
                                    value={s4c.reschedule_reason}
                                    onChange={e => setS4c({ ...s4c, reschedule_reason: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-amber-400"
                                >
                                    <option value="">-- Pilih Alasan Reschedule --</option>
                                    <option value="Unit belum siap / rusak di lokasi">Unit belum siap / rusak di lokasi</option>
                                    <option value="Permintaan Klien (operasional pabrik berjalan)">Permintaan Klien (operasional pabrik berjalan)</option>
                                    <option value="Cuaca ekstrim / kendala teknis lapangan">Cuaca ekstrim / kendala teknis lapangan</option>
                                    <option value="Penambahan unit baru hasil aktualisasi">Penambahan unit baru hasil aktualisasi</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Tanggal Jadwal Baru RU Ulang *</label>
                                    <input
                                        type="date"
                                        value={s4c.tgl_reschedule}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setS4c({ ...s4c, tgl_reschedule: val });
                                            if (scheduleDays.length > 0 && !scheduleDays[0].date) {
                                                setScheduleDays(scheduleDays.map((d, i) => i === 0 ? { ...d, date: val } : d));
                                            }
                                        }}
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Catatan Tambahan</label>
                                    <input
                                        type="text"
                                        placeholder="Catatan inspektur / perlengkapan..."
                                        value={s4c.reschedule_notes}
                                        onChange={e => setS4c({ ...s4c, reschedule_notes: e.target.value })}
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Schedule Builder (Same as Stage 3) */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Jam Mulai RU Ulang *</label>
                                    <input type="time" value={data.jam_mulai} onChange={e => setData('jam_mulai', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Disnaker Tujuan *</label>
                                    <select
                                        value={data.disnaker_tujuan}
                                        onChange={e => setData('disnaker_tujuan', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-400"
                                        required
                                    >
                                        <option value="">-- Pilih Disnaker Provinsi --</option>
                                        {data.disnaker_tujuan &&
                                            !INDONESIA_PROVINCES.includes(data.disnaker_tujuan) &&
                                            !INDONESIA_PROVINCES.map(p => `Disnaker Prov. ${p}`).includes(data.disnaker_tujuan) && (
                                                <option value={data.disnaker_tujuan}>{data.disnaker_tujuan}</option>
                                            )}
                                        {INDONESIA_PROVINCES.map(prov => {
                                            const val = `Disnaker Prov. ${prov}`;
                                            return <option key={prov} value={val}>{val}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            {/* Jadwal Pelaksanaan Multi-Day */}
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-900">Jadwal Pelaksanaan RU Ulang</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-indigo-700">Hari:</span>
                                        <button type="button"
                                            onClick={() => scheduleDays.length > 1 && setScheduleDays(prev => prev.slice(0, -1))}
                                            disabled={scheduleDays.length <= 1}
                                            className="w-6 h-6 rounded border border-indigo-300 bg-white text-indigo-700 font-bold text-sm leading-none flex items-center justify-center hover:bg-indigo-100 disabled:opacity-40">−</button>
                                        <span className="text-sm font-bold text-indigo-900 w-5 text-center">{scheduleDays.length}</span>
                                        <button type="button"
                                            onClick={() => setScheduleDays(prev => [...prev, { date: '', inspector_ids: [] }])}
                                            className="w-6 h-6 rounded border border-indigo-300 bg-white text-indigo-700 font-bold text-sm leading-none flex items-center justify-center hover:bg-indigo-100">+</button>
                                    </div>
                                </div>

                                {scheduleDays.map((day, dayIdx) => {
                                    const allInspectors = [
                                        ...(recommendations.recommended || []),
                                        ...(recommendations.eliminated || []),
                                    ];
                                    return (
                                        <div key={dayIdx} className="bg-white border border-indigo-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded shrink-0">
                                                    Hari {dayIdx + 1}
                                                </span>
                                                <input
                                                    type="date"
                                                    value={day.date}
                                                    onChange={e => {
                                                        const updated = scheduleDays.map((d, i) =>
                                                            i === dayIdx ? { ...d, date: e.target.value } : d
                                                        );
                                                        setScheduleDays(updated);
                                                    }}
                                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-400"
                                                />
                                                {scheduleDays.length > 1 && (
                                                    <button type="button"
                                                        onClick={() => setScheduleDays(prev => prev.filter((_, i) => i !== dayIdx))}
                                                        className="text-red-400 hover:text-red-600 text-base leading-none px-1 shrink-0" title="Hapus hari ini">✕</button>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-gray-500 mb-1.5">Inspektur pada Hari {dayIdx + 1}:</p>
                                            {allInspectors.length === 0 ? (
                                                <p className="text-[11px] text-gray-400 italic">Memuat data inspektur...</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {allInspectors.map(item => {
                                                        const uid = item.user.id;
                                                        const isSelected = day.inspector_ids.includes(uid);
                                                        const isOverloaded = item.statuses
                                                            ? item.statuses.some(st => st === 'Overload')
                                                            : false;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={uid}
                                                                onClick={() => {
                                                                    const updated = scheduleDays.map((d, i) => {
                                                                        if (i !== dayIdx) return d;
                                                                        const ids = d.inspector_ids.includes(uid)
                                                                            ? d.inspector_ids.filter(id => id !== uid)
                                                                            : [...d.inspector_ids, uid];
                                                                        return { ...d, inspector_ids: ids };
                                                                    });
                                                                    setScheduleDays(updated);
                                                                }}
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${isSelected
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                        : isOverloaded
                                                                            ? 'bg-gray-50 text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500'
                                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                                    }`}
                                                            >
                                                                {item.user.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Smart Recommendation */}
                            <SmartRecommendation
                                job={job}
                                selectedInspectorIds={allSelectedInspectorIds}
                                onSelectInspector={(insUser) => {
                                    const uid = insUser.id;
                                    const isInAll = scheduleDays.every(d => d.inspector_ids.includes(uid));
                                    setScheduleDays(scheduleDays.map(d => ({
                                        ...d,
                                        inspector_ids: isInAll
                                            ? d.inspector_ids.filter(id => id !== uid)
                                            : d.inspector_ids.includes(uid)
                                                ? d.inspector_ids
                                                : [...d.inspector_ids, uid],
                                    })));
                                }}
                            />

                            {/* Penanggung Jawab Laporan */}
                            <div className="bg-white border rounded-lg p-3">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Penanggung Jawab Laporan / Penyusun LHPP
                                </label>
                                <select
                                    value={data.report_writer_id || ''}
                                    onChange={e => setData('report_writer_id', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-400"
                                >
                                    <option value="">-- Pilih Penanggung Jawab Laporan (Opsional) --</option>
                                    {[
                                        ...(recommendations.recommended || []),
                                        ...(recommendations.eliminated || [])
                                    ].map(item => (
                                        <option key={item.user.id} value={item.user.id}>
                                            {item.user.name} ({item.user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Alat Uji */}
                            {masterData.alat_uji.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Alat Uji yang Digunakan</label>
                                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded p-2 bg-white">
                                        {masterData.alat_uji.map(a => (
                                            <label key={a.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input type="checkbox" checked={data.alat_ids.includes(a.id)}
                                                    onChange={() => {
                                                        const ids = data.alat_ids.includes(a.id) ? data.alat_ids.filter(x => x !== a.id) : [...data.alat_ids, a.id];
                                                        setData('alat_ids', ids);
                                                    }} className="rounded" />
                                                {a.nama}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(DOC_TYPES_BY_STAGE[16] || []).map(t => (
                            <UploadSlot key={t} type={t} stageId={16} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                        ))}

                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                                type="button"
                                onClick={handleRejectStage}
                                disabled={processing}
                                className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            >
                                Kembalikan ke 4b (Aktualisasi)
                            </button>
                            <button
                                type="button"
                                onClick={handleJobSplit}
                                className="px-3 py-2 rounded text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1"
                            >
                                Pecah Job
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!s4c.reschedule_reason?.trim()) return showError('Validasi', 'Pilih alasan penjadwalan ulang terlebih dahulu!');
                                    if (!s4c.tgl_reschedule) return showError('Validasi', 'Tentukan tanggal jadwal baru RU Ulang!');
                                    post(`/jobs/${job.id}/move`, {
                                        data: {
                                            ...data,
                                            ...s4c,
                                            schedule_days: scheduleDays,
                                            next_stage: 17
                                        },
                                        onSuccess: () => onClose()
                                    });
                                }}
                                disabled={processing}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                            >
                                {processing ? '...' : 'Lanjut ke Riksa Uji Ulang (Stage 4d) →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 17 (Riksa Uji Ulang — 4d INS) ──────── */}
                {s === 17 && (
                    <div className="space-y-4">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-indigo-900 mb-1">
                                Stage 4d: Riksa Uji Ulang (Tim Ahli / Inspektur)
                            </h4>
                            <p className="text-xs text-indigo-800">
                                Pelaksanaan inspeksi ulang untuk unit yang sebelumnya tertunda/dijadwalkan ulang. Unggah BAP dan Foto RU Ulang.
                            </p>
                        </div>

                        <div className="bg-white border rounded-lg p-3 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Hasil Riksa Uji Ulang *</label>
                                <div className="flex gap-4 text-xs font-semibold">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="ru_ulang_status"
                                            value="lolos"
                                            checked={s4d.ru_ulang_status === 'lolos'}
                                            onChange={() => setS4d({ ...s4d, ru_ulang_status: 'lolos' })}
                                        />
                                        <span className="text-emerald-700">Lolos Riksa Uji Ulang</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="ru_ulang_status"
                                            value="gagal"
                                            checked={s4d.ru_ulang_status === 'gagal'}
                                            onChange={() => setS4d({ ...s4d, ru_ulang_status: 'gagal' })}
                                        />
                                        <span className="text-red-700">Gagal / Perlu Reschedule Lanjutan</span>
                                    </label>
                                </div>
                            </div>

                            {/* Jumlah Alat yang Benar-benar Diperiksa */}
                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Jumlah Alat yang Benar-benar Diperiksa
                                </label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max={job.units}
                                        value={s4d.actual_units}
                                        onChange={e => setS4d({ ...s4d, actual_units: e.target.value })}
                                        className="w-24 border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold text-gray-800 text-center focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <span className="text-xs text-gray-600 font-medium">
                                        dari {job.units} unit dalam Job
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveS4d}
                                    className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition"
                                >
                                    Simpan Data Lapangan
                                </button>

                                {s4dUnitMismatch && (
                                    <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1.5">
                                        <p className="font-semibold">
                                            Jumlah alat yang diperiksa ({s4d.actual_units}) belum sesuai dengan jumlah total unit ({job.units}).
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Catatan selisih / kendala sisa unit..."
                                            value={s4d.unit_count_notes}
                                            onChange={e => setS4d({ ...s4d, unit_count_notes: e.target.value })}
                                            className="w-full border border-amber-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-amber-400"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Teknis RU Ulang</label>
                                <textarea
                                    rows={2}
                                    value={s4d.ru_ulang_notes}
                                    onChange={e => setS4d({ ...s4d, ru_ulang_notes: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-400"
                                    placeholder="Kondisi pengujian unit ulang, temuan teknis..."
                                />
                            </div>
                        </div>

                        {(DOC_TYPES_BY_STAGE[17] || []).map(t => (
                            <UploadSlot key={t} type={t} stageId={17} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={false} />
                        ))}

                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        <div className="space-y-2 mt-4">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleRejectStage}
                                    disabled={processing}
                                    className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                >
                                    Kembalikan ke 4c
                                </button>
                                {s4d.ru_ulang_status === 'gagal' ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            post(`/jobs/${job.id}/move`, {
                                                data: { ...data, ...s4d, next_stage: 16 },
                                                onSuccess: () => onClose()
                                            });
                                        }}
                                        disabled={processing}
                                        className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                                    >
                                        {processing ? '...' : 'Gagal RU — Kembali ke Penjadwalan Ulang (Stage 4c) →'}
                                    </button>
                                ) : !s4dUnitMismatch ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            post(`/jobs/${job.id}/move`, {
                                                data: { ...data, ...s4d, next_stage: 5 },
                                                onSuccess: () => onClose()
                                            });
                                        }}
                                        disabled={processing}
                                        className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                                    >
                                        {processing ? '...' : 'Lolos Penuh — Lanjut ke Stage 5 (LHPP) →'}
                                    </button>
                                ) : null}
                            </div>

                            {/* Rekonsiliasi Loop when Lolos but Unit Mismatch */}
                            {s4d.ru_ulang_status === 'lolos' && s4dUnitMismatch && (
                                <div className="border border-amber-300 rounded-lg p-3 bg-amber-50/90 space-y-2.5">
                                    <p className="text-xs font-semibold text-amber-900">
                                        Jumlah unit yang diperiksa ({s4d.actual_units}) tidak sesuai dengan unit dalam Job ({job.units}). Pilih alur rekonsiliasi:
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                post(`/jobs/${job.id}/move`, {
                                                    data: { ...data, ...s4d, next_stage: 13 },
                                                    onSuccess: () => onClose()
                                                });
                                            }}
                                            disabled={processing}
                                            className="w-full px-3 py-2 rounded text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs"
                                        >
                                            Perbarui Unit di Stage 4b (Aktualisasi Unit MKT) →
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                post(`/jobs/${job.id}/move`, {
                                                    data: { ...data, ...s4d, next_stage: 16 },
                                                    onSuccess: () => onClose()
                                                });
                                            }}
                                            disabled={processing}
                                            className="w-full px-3 py-2 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
                                        >
                                            Jadwalkan Sisa Unit di Stage 4c (Reschedule ADM) →
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                post(`/jobs/${job.id}/move`, {
                                                    data: { ...data, ...s4d, next_stage: 5 },
                                                    onSuccess: () => onClose()
                                                });
                                            }}
                                            disabled={processing}
                                            className="w-full px-3 py-2 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                                        >
                                            Sepakat Selesai & Lanjut ke Stage 5 (LHPP) →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STAGE 5 (Penyusunan LHPP — ADM) ────────── */}
                {s === 5 && (
                    <div className="space-y-4">
                        {/* 3-Date Milestone Tracking per v5-2-2 & Rev6 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-blue-900">
                                    Milestone Tracking Penyusunan LHPP (Per-Unit)
                                </h4>
                                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-black">
                                    Delta v5-2-2
                                </span>
                            </div>
                            <p className="text-xs text-blue-800">
                                Catat 3 tanggal penting untuk tracking due date dan perhitungan otomatis lead time sub-fase laporan.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">1. Data Teknis Diserahkan</label>
                                    <input
                                        type="date"
                                        value={s5Dates.tgl_teknis_diserahkan}
                                        onChange={e => setS5Dates({ ...s5Dates, tgl_teknis_diserahkan: e.target.value })}
                                        className="w-full border border-blue-300 rounded px-2 py-1.5 bg-white text-xs"
                                    />
                                    <span className="text-[10px] text-gray-500">Diterima dari inspektur</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">2. Pengerjaan Laporan Mulai</label>
                                    <input
                                        type="date"
                                        value={s5Dates.tgl_laporan_mulai}
                                        onChange={e => setS5Dates({ ...s5Dates, tgl_laporan_mulai: e.target.value })}
                                        className="w-full border border-blue-300 rounded px-2 py-1.5 bg-white text-xs"
                                    />
                                    <span className="text-[10px] text-gray-500">Admin mulai susun LHPP</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">3. Laporan Selesai</label>
                                    <input
                                        type="date"
                                        value={s5Dates.tgl_laporan_selesai}
                                        onChange={e => setS5Dates({ ...s5Dates, tgl_laporan_selesai: e.target.value })}
                                        className="w-full border border-blue-300 rounded px-2 py-1.5 bg-white text-xs"
                                    />
                                    <span className="text-[10px] text-gray-500">Siap review Stage 6</span>
                                </div>
                            </div>

                            {/* Lead Time calculation badges */}
                            {s5Dates.tgl_teknis_diserahkan && s5Dates.tgl_laporan_selesai && (
                                <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                                    <span className="text-[11px] font-extrabold text-blue-900">Lead Time LHPP:</span>
                                    <span className="text-[11px] font-bold bg-white text-blue-800 border border-blue-300 px-2 py-0.5 rounded shadow-2xs">
                                        Total Durasi: {Math.max(0, Math.round((new Date(s5Dates.tgl_laporan_selesai) - new Date(s5Dates.tgl_teknis_diserahkan)) / 86400000))} Hari
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-500">Unggah dokumen LHPP dan BAP untuk penyusunan laporan teknis.</p>
                        {(DOC_TYPES_BY_STAGE[5] || []).map(t => <UploadSlot key={t} type={t} stageId={5} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />)}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                    </div>
                )}

                {/* ── STAGE 6 (Review Laporan Teknis — MGR) ───── */}
                {s === 6 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2.5">
                            <p className="text-xs text-blue-900 font-medium">Sebagai Kadiv/MGR, tinjau laporan teknis dari Tim Ahli.</p>
                            <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-black shrink-0">
                                Revisi: {job.revision_count || 0} / 2
                            </span>
                        </div>

                        {job.s5_review_decision && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                                Keputusan sebelumnya: <strong>{STAGE5_DECISIONS.find(d => d.value === job.s5_review_decision)?.label}</strong>
                                {job.s5_review_notes && <span> — {job.s5_review_notes}</span>}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Keputusan Review *</label>
                            <select value={s5.s5_review_decision} onChange={e => setS5({ ...s5, s5_review_decision: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-semibold">
                                <option value="">-- Pilih Keputusan --</option>
                                <option value="approved">Setuju - Laik (Lanjut ke Stage 7 Dinas)</option>
                                <option value="revision">Tolak / Revisi Teknis (Kembalikan ke Stage 5)</option>
                                <option value="tidak_laik">Tidak Laik (Perbaikan Klien & Retest Stage 4c)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan MGR / Revisi Teknis</label>
                            <textarea rows={3} value={s5.s5_review_notes} onChange={e => setS5({ ...s5, s5_review_notes: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                                placeholder="Catatan kondisi, syarat, temuan kerusakan, atau instruksi revisi…" />
                        </div>
                        <button type="button" onClick={handleSaveS5}
                            className="w-full py-2 rounded text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
                            Simpan Keputusan Review
                        </button>
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        {/* 3-Path Action Buttons for Stage 6 */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!s5.s5_review_notes?.trim()) return showError('Catatan Diperlukan', 'Isi catatan revisi teknis terlebih dahulu.');
                                    router.post(`/api/jobs/${job.id}/stage5-review`, {
                                        s5_review_decision: 'revision',
                                        s5_review_notes: s5.s5_review_notes
                                    }, {
                                        onSuccess: () => {
                                            showSuccess('Revisi Dikembalikan', 'Laporan dikembalikan ke Stage 5 untuk revisi.');
                                            onClose();
                                        }
                                    });
                                }}
                                className="px-3 py-2 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                            >
                                Kembalikan ke Stage 5 (Revisi)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    router.post(`/api/jobs/${job.id}/stage5-review`, {
                                        s5_review_decision: 'tidak_laik',
                                        s5_review_notes: s5.s5_review_notes || 'Unit Tidak Laik - dialihkan untuk perbaikan dan RU Ulang'
                                    }, {
                                        onSuccess: () => {
                                            showSuccess('Unit Tidak Laik', 'Job dialihkan ke Stage 4c untuk penjadwalan retest.');
                                            onClose();
                                        }
                                    });
                                }}
                                className="px-3 py-2 rounded text-xs font-bold bg-red-50 text-red-900 border border-red-300 hover:bg-red-100"
                            >
                                Tidak Laik → Retest (Stage 4c)
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !s5.s5_review_decision || s5.s5_review_decision !== 'approved'}
                                className="flex-1 py-2 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 shadow-xs"
                            >
                                {processing ? '...' : 'Approve Laik → Lanjut ke Stage 7 →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 7 (Penyerahan ke Dinas — MGR) ────── */}
                {s === 7 && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Penyerahan ke Disnaker *</label>
                            <input type="date" value={s7.tgl_submit_disnaker}
                                onChange={e => setS7({ tgl_submit_disnaker: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                        </div>
                        <button type="button" onClick={handleSaveS7}
                            className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800">
                            Simpan Tanggal Penyerahan
                        </button>
                        <UploadSlot type="Bukti Penyerahan ke Disnaker" stageId={7} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} disabled={!s7.tgl_submit_disnaker} disabledMsg={!s7.tgl_submit_disnaker ? 'Isi tanggal penyerahan terlebih dahulu' : ''} />
                    </div>
                )}

                {/* ── STAGE 8 (Proses Disnaker — Admin) ──────── */}
                {s === 8 && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status Disnaker (Progress)</label>
                            <select value={s8.s8_progress_status} onChange={e => setS8({ ...s8, s8_progress_status: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-medium">
                                <option value="">-- Pilih Status Disnaker --</option>
                                {STAGE8_DISNAKER_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Dokumen Diserahkan ke Disnaker</label>
                                <input type="date" value={s8.tgl_doc_submitted_disnaker}
                                    onChange={e => setS8({ ...s8, tgl_doc_submitted_disnaker: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Dokumen Diterima Kembali</label>
                                <input type="date" value={s8.tgl_doc_received_disnaker}
                                    onChange={e => setS8({ ...s8, tgl_doc_received_disnaker: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                            </div>
                        </div>
                        {/* SLA indicator */}
                        {s8.tgl_doc_submitted_disnaker && (() => {
                            const d = daysElapsed(s8.tgl_doc_submitted_disnaker);
                            const tag = getSlaTag(d, 30);
                            return (
                                <div className={`rounded p-2 text-xs font-semibold ${tag?.cls}`}>
                                    {d} hari dari penyerahan dokumen (SLA: 30 hari) — {tag?.label}
                                </div>
                            );
                        })()}
                        <button type="button" onClick={handleSaveS8}
                            className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800">
                            Simpan Data Disnaker
                        </button>
                        {(DOC_TYPES_BY_STAGE[8] || []).map(t => <UploadSlot key={t} type={t} stageId={8} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />)}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                    </div>
                )}

                {/* ── STAGE 9 (Pengurusan SUKET — Admin) ─────────────────────────── */}
                {s === 9 && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-emerald-900">
                                    Tracking Durasi Pengurusan SUKET Disnaker
                                </h4>
                                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-black">
                                    Delta v5-2-2
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">Tanggal Input SUKET *</label>
                                    <input
                                        type="date"
                                        value={s9Suket.tgl_input_suket}
                                        onChange={e => setS9Suket({ ...s9Suket, tgl_input_suket: e.target.value })}
                                        className="w-full border border-emerald-300 rounded px-2 py-1.5 bg-white text-xs"
                                    />
                                    <span className="text-[10px] text-gray-500">Titik awal pencatatan waktu</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">Tanggal SUKET Terbit / Selesai</label>
                                    <input
                                        type="date"
                                        value={s9Suket.tgl_suket_selesai}
                                        onChange={e => setS9Suket({ ...s9Suket, tgl_suket_selesai: e.target.value })}
                                        className="w-full border border-emerald-300 rounded px-2 py-1.5 bg-white text-xs"
                                    />
                                    <span className="text-[10px] text-gray-500">SUKET fisik diterima</span>
                                </div>
                            </div>
                            {s9Suket.tgl_input_suket && (
                                <div className="pt-2 border-t border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                    <span>Durasi Pengurusan:</span>
                                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                                        {s9Suket.tgl_suket_selesai
                                            ? `${Math.max(0, Math.round((new Date(s9Suket.tgl_suket_selesai) - new Date(s9Suket.tgl_input_suket)) / 86400000))} Hari Kalender (Selesai)`
                                            : `${Math.max(0, Math.round((new Date() - new Date(s9Suket.tgl_input_suket)) / 86400000))} Hari Berjalan`}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status Progress</label>
                            <select value={s9.s9_progress_status} onChange={e => setS9({ s9_progress_status: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5">
                                <option value="">-- Pilih Status --</option>
                                {PROGRESS_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={handleSaveS9}
                            className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800">
                            Simpan Status
                        </button>
                        {(DOC_TYPES_BY_STAGE[9] || []).map(t => <UploadSlot key={t} type={t} stageId={9} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />)}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <div className="flex gap-2 mt-2">
                            <button type="button" onClick={handleRejectStage}
                                className="px-3 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200">Tolak</button>
                            <button type="submit" disabled={processing}
                                className="flex-1 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                                {processing ? '...' : 'Lanjut ke Pembuatan Invoice (Stage 10) →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 10 (Pembuatan Invoice — Finance) ──── */}
                {s === 10 && (() => {
                    const hasInvoiceDoc10 = (job.documents || []).some(d => ['Invoice (PDF)', 'Invoice', 'Faktur / Invoice', 'Kwitansi Tagihan'].includes(d.type));
                    const s10CanMove = s10.invoice_no?.trim() && s10.total_invoice_amount && parseFloat(s10.total_invoice_amount) > 0 && s10.tgl_invoice_issued && hasInvoiceDoc10;
                    const s10DisabledMsg = !s10.invoice_no?.trim() ? 'Isi Nomor Invoice terlebih dahulu' :
                        (!s10.total_invoice_amount || parseFloat(s10.total_invoice_amount) <= 0) ? 'Isi Total Invoice (Nilai Tagihan) dengan benar' :
                            !s10.tgl_invoice_issued ? 'Isi Tanggal Invoice Diterbitkan terlebih dahulu' :
                                !hasInvoiceDoc10 ? 'Upload Dokumen "Invoice (PDF)" terlebih dahulu' : '';

                    return (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Invoice</label>
                                    <input type="text" value={s10.invoice_no}
                                        placeholder="Contoh: INV/2026/001"
                                        onChange={e => setS10({ ...s10, invoice_no: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Invoice (Rp)</label>
                                    <input type="number" value={s10.total_invoice_amount}
                                        onChange={e => setS10({ ...s10, total_invoice_amount: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Invoice Diterbitkan</label>
                                    <input type="date" value={s10.tgl_invoice_issued}
                                        onChange={e => setS10({ ...s10, tgl_invoice_issued: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Submit ke MKT</label>
                                    <input type="date" value={s10.tgl_submit_mkt}
                                        onChange={e => setS10({ ...s10, tgl_submit_mkt: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Status Progress</label>
                                    <select value={s10.s10_progress_status} onChange={e => setS10({ ...s10, s10_progress_status: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5">
                                        <option value="">-- Pilih Status --</option>
                                        {PROGRESS_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="button" onClick={handleSaveS10}
                                className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800">
                                Simpan Data Penagihan
                            </button>
                            {(DOC_TYPES_BY_STAGE[10] || []).map(t => <UploadSlot key={t} type={t} stageId={10} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />)}
                            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                            <MoveRow stage={s} processing={processing || isMoving} onReject={handleRejectStage} disabled={!s10CanMove} disabledMsg={s10DisabledMsg} />
                        </div>
                    );
                })()}

                {/* ── STAGE 11 (Penagihan Pembayaran — MKT) ──── */}
                {s === 11 && (
                    <div className="space-y-4">
                        {job.payment_retry_count > 0 && (
                            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-xs text-red-900 font-medium animate-pulse">
                                <strong>Hasil Verifikasi Finance: Pembayaran Belum Lunas / Pending!</strong><br />
                                Job dikembalikan dari Stage 11c untuk follow-up penagihan ulang oleh Marketing (Penagihan Ulang ke-{job.payment_retry_count}).
                                {job.payment_verification_notes && (
                                    <span className="block mt-1 bg-white p-2 rounded border border-red-200 font-semibold text-red-800">
                                        Catatan Finance: "{job.payment_verification_notes}"
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-blue-900">
                                    Penagihan & Follow-up Pembayaran (Marketing)
                                </h4>
                                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-black">
                                    Delta v5-2-2
                                </span>
                            </div>
                            <p className="text-xs text-blue-800">
                                Lakukan penagihan kepada PIC Klien ({job.pic_klien || job.klien}) untuk pelunasan invoice senilai <strong>{fmtCurrency(job.nilai)}</strong>. Unggah bukti tagihan dan bukti transfer jika ada.
                            </p>
                        </div>

                        <div className="bg-white border rounded-lg p-3 space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Metode Follow-up Penagihan</label>
                                    <input
                                        type="text"
                                        value={s11Collection.metode_penagihan}
                                        onChange={e => setS11Collection({ ...s11Collection, metode_penagihan: e.target.value })}
                                        placeholder="Email / Telepon / WhatsApp / Visit..."
                                        className="w-full border rounded px-2 py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Tanggal Terakhir Ditagih</label>
                                    <input
                                        type="date"
                                        value={s11Collection.tgl_penagihan}
                                        onChange={e => setS11Collection({ ...s11Collection, tgl_penagihan: e.target.value })}
                                        className="w-full border rounded px-2 py-1.5"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Catatan Penagihan / Konfirmasi Klien</label>
                                <textarea
                                    rows={2}
                                    value={s11Collection.catatan_penagihan}
                                    onChange={e => setS11Collection({ ...s11Collection, catatan_penagihan: e.target.value })}
                                    className="w-full border rounded px-2.5 py-1.5"
                                    placeholder="Contoh: Klien mengonfirmasi transfer hari ini via Mandiri..."
                                />
                            </div>
                        </div>

                        {(DOC_TYPES_BY_STAGE[11] || []).map(t => (
                            <UploadSlot key={t} type={t} stageId={11} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                        ))}

                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                onClick={handleRejectStage}
                                disabled={processing}
                                className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            >
                                Kembalikan ke Invoice (Stage 10)
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    post(`/jobs/${job.id}/move`, {
                                        data: { ...data, ...s11Collection, next_stage: 15 },
                                        onSuccess: () => onClose()
                                    });
                                }}
                                disabled={processing}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                            >
                                {processing ? '...' : 'Serahkan ke Verifikasi Pembayaran (Stage 11c) →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 15 (Verifikasi Pembayaran — 11c FIN) ─ */}
                {s === 15 && (
                    <div className="space-y-4">
                        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                                    <span>Stage 11c: Verifikasi Pembayaran (Finance)</span>
                                </h4>
                                <div className="flex items-center gap-1.5">
                                    <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        Retry: {job.payment_retry_count || 0} / 5
                                    </span>
                                    <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        HARD GATE v2.0
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-purple-800">
                                Finance memvalidasi mutasi bank dan kepastian dana masuk sebelum SUKET dapat dirilis ke klien. Jika belum lunas, kembalikan ke Stage 11.
                            </p>
                        </div>

                        {(job.payment_retry_count || 0) >= 5 && (
                            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 text-xs text-red-900">
                                <p className="font-extrabold text-sm mb-1">Eskalasi Pembayaran Macet (Maksimal 5x Terlampaui)!</p>
                                <p>
                                    Penagihan telah gagal / partial sebanyak 5 kali. Sistem telah mengeskalasi kasus ini ke Kepala Divisi dan Manager untuk pembekuan job / tindakan penanganan khusus.
                                </p>
                            </div>
                        )}

                        {/* Rekonsiliasi Tagihan vs Penerimaan */}
                        <div className="bg-white border rounded-lg p-3 space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-gray-500 font-semibold block mb-1">Nilai Kontrak / Invoice</span>
                                    <span className="text-sm font-bold text-gray-900">{fmtCurrency(job.nilai)}</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Dana Masuk Rekening (Rp) *</label>
                                    <input
                                        type="number"
                                        value={s11c.amount_received}
                                        onChange={e => setS11c({ ...s11c, amount_received: e.target.value })}
                                        className="w-full border rounded px-2 py-1.5 text-sm font-bold text-emerald-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">No. Referensi / Mutasi Bank *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: BCA-TRF-98234710..."
                                        value={s11c.bank_ref}
                                        onChange={e => setS11c({ ...s11c, bank_ref: e.target.value })}
                                        className="w-full border rounded px-2 py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Keputusan Status Pembayaran *</label>
                                    <select
                                        value={s11c.verification_status}
                                        onChange={e => setS11c({ ...s11c, verification_status: e.target.value })}
                                        className="w-full border rounded px-2 py-1.5 font-bold"
                                    >
                                        <option value="Lunas">Lunas (Dana Diterima Penuh)</option>
                                        <option value="Partial / Pending">Partial / Pending (Belum Lunas)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">
                                    Catatan Verifikasi Keuangan {s11c.verification_status === 'Partial / Pending' && <span className="text-red-500">* (Wajib diisi jika Partial/Pending)</span>}
                                </label>
                                <textarea
                                    rows={2}
                                    value={s11c.verification_notes}
                                    onChange={e => setS11c({ ...s11c, verification_notes: e.target.value })}
                                    className="w-full border rounded px-2.5 py-1.5"
                                    placeholder={s11c.verification_status === 'Partial / Pending' ? 'Sebutkan kekurangan transfer atau alasan penolakan...' : 'Keterangan mutasi / rekening koran...'}
                                />
                            </div>
                        </div>

                        {(DOC_TYPES_BY_STAGE[15] || []).map(t => (
                            <UploadSlot key={t} type={t} stageId={15} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                        ))}

                        {/* Decision Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => handleSaveS11c('Partial / Pending')}
                                disabled={processing}
                                className="px-4 py-2 rounded text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1"
                            >
                                Partial/Pending (Loop ke Stage 11)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveS11c('Lunas')}
                                disabled={processing}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1"
                            >
                                Verifikasi Lunas & Buka Kirim SUKET (Stage 11b) →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 14 (Pengiriman SUKET ke Klien — 11b MKT) ── */}
                {s === 14 && (() => {
                    const isPaymentVerified = job.payment_verification_status === 'Lunas' || job.paid === true;
                    const hasBankStatement = job.bank_statement_attached === true || (job.documents || []).some(d => d.stage === 15 || d.type?.toLowerCase().includes('mutasi') || d.type?.toLowerCase().includes('bank') || d.type?.toLowerCase().includes('rekening') || d.type === 'Bukti Bayar / Mutasi Rekening');
                    const hasDocumentDebt = job.document_debt && job.document_debt.length > 0;
                    const canDeliver = isPaymentVerified && hasBankStatement && !hasDocumentDebt;

                    return (
                        <div className="space-y-4">
                            {!canDeliver ? (
                                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-xs text-red-900 space-y-3">
                                    <div className="font-extrabold text-sm flex items-center gap-1.5 text-red-950">
                                        Pengiriman SUKET Terkunci (Triple Hard-Gate v2.0)!
                                    </div>
                                    <p>
                                        Berdasarkan SOP resmi dan spesifikasi v2.0, SUKET tidak dapat diserahkan/dikirim kepada klien sebelum 3 syarat gerbang berikut terpenuhi:
                                    </p>
                                    <div className="space-y-2 bg-white/80 p-3 rounded-lg border border-red-200">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPaymentVerified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                                {isPaymentVerified ? "Terpenuhi" : "Belum"}
                                            </span>
                                            <span className={isPaymentVerified ? "text-gray-700 font-medium" : "text-red-800 font-bold"}>
                                                1. Pembayaran Diverifikasi Lunas di Stage 11c ({isPaymentVerified ? "Terverifikasi" : "Belum Lunas"})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasBankStatement ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                                {hasBankStatement ? "Terpenuhi" : "Belum"}
                                            </span>
                                            <span className={hasBankStatement ? "text-gray-700 font-medium" : "text-red-800 font-bold"}>
                                                2. Lampiran Bukti Mutasi Bank / Rekening Koran ({hasBankStatement ? "Terlampir" : "Belum Ada"})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${!hasDocumentDebt ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                                {!hasDocumentDebt ? "Terpenuhi" : "Belum"}
                                            </span>
                                            <span className={!hasDocumentDebt ? "text-gray-700 font-medium" : "text-red-800 font-bold"}>
                                                3. Bebas Hutang Dokumen Stage 2 ({!hasDocumentDebt ? "Lengkap" : `Ada ${job.document_debt.length} Dokumen Tertunda: ${job.document_debt.join(', ')}`})
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRejectStage}
                                        className="px-3 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                                    >
                                        Kembalikan ke Verifikasi Keuangan (Stage 11c)
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                        <h4 className="text-xs font-bold text-emerald-900 mb-1">
                                            Stage 11b: Pengiriman SUKET ke Klien (Marketing)
                                        </h4>
                                        <p className="text-xs text-emerald-800">
                                            Pembayaran terverifikasi LUNAS, rekening koran terlampir, dan seluruh dokumen lengkap. Kirimkan SUKET fisik/digital ke klien secara bertahap atau sekaligus.
                                        </p>
                                    </div>

                                    <div className="bg-white border rounded-lg p-3 space-y-3 text-xs">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-1">No. Resi / Tracking Ekspedisi</label>
                                                <input
                                                    type="text"
                                                    value={s11bDelivery.no_resi}
                                                    onChange={e => setS11bDelivery({ ...s11bDelivery, no_resi: e.target.value })}
                                                    placeholder="Contoh: JNE-9827361928"
                                                    className="w-full border rounded px-2 py-1.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-1">Nama Ekspedisi / Kurir</label>
                                                <input
                                                    type="text"
                                                    value={s11bDelivery.ekspedisi}
                                                    onChange={e => setS11bDelivery({ ...s11bDelivery, ekspedisi: e.target.value })}
                                                    placeholder="Kurir Internal / JNE / SiCepat..."
                                                    className="w-full border rounded px-2 py-1.5"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-1">Tanggal Pengiriman</label>
                                                <input
                                                    type="date"
                                                    value={s11bDelivery.tgl_kirim_suket}
                                                    onChange={e => setS11bDelivery({ ...s11bDelivery, tgl_kirim_suket: e.target.value })}
                                                    className="w-full border rounded px-2 py-1.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-semibold mb-1">Pengiriman Batch ke-</label>
                                                <input
                                                    type="text"
                                                    value={s11bDelivery.batch_no}
                                                    onChange={e => setS11bDelivery({ ...s11bDelivery, batch_no: e.target.value })}
                                                    placeholder="Batch 1 (Semua Unit) / Batch 1 (20 Unit)..."
                                                    className="w-full border rounded px-2 py-1.5"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-1">Penerima di Klien / Tanda Terima</label>
                                            <input
                                                type="text"
                                                value={s11bDelivery.tanda_terima_klien}
                                                onChange={e => setS11bDelivery({ ...s11bDelivery, tanda_terima_klien: e.target.value })}
                                                placeholder="Nama PIC Penerima & Tanda Tangan Tanda Terima..."
                                                className="w-full border rounded px-2 py-1.5"
                                            />
                                        </div>
                                    </div>

                                    {(DOC_TYPES_BY_STAGE[14] || []).map(t => (
                                        <UploadSlot key={t} type={t} stageId={14} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                                    ))}

                                    <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            type="button"
                                            onClick={handleRejectStage}
                                            disabled={processing}
                                            className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                        >
                                            Kembalikan ke Stage 11c
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                post(`/jobs/${job.id}/move`, {
                                                    data: { ...data, ...s11bDelivery, next_stage: 12 },
                                                    onSuccess: () => onClose()
                                                });
                                            }}
                                            disabled={processing}
                                            className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                                        >
                                            {processing ? '...' : 'Selesaikan & Tutup Job (Stage 12 Closed) →'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* ── STAGE 12 (Selesai / Closed) ────────── */}
                {s === 12 && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                            <h4 className="text-sm font-bold text-emerald-900 mt-1">Pekerjaan Selesai & Ditutup (Closed)</h4>
                            <p className="text-xs text-emerald-700 mt-0.5">
                                Seluruh proses sertifikasi, penyerahan Suket, dan pelunasan pembayaran telah selesai.
                            </p>
                        </div>

                        {/* Reopen Button for Superadmin / Manager / Kadiv */}
                        {['superadmin', 'manager', 'kadiv'].includes(user?.role?.toLowerCase()) && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleReopenJob}
                                    className="w-full px-4 py-2.5 rounded text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                    Buka Kembali Job (Reopen) ke Stage 5
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </form>
        );
    };

    // ══ END PART B ══

    // ══ BEGIN PART C ══

    // ── Completed Stage Summary ────────────────────────────────────────────────
    const renderCompletedStageSummary = (s) => {
        const logs = (job.historyLogs || job.history_logs || []);
        const stageLog = logs.find(l => l.from_stage === s || l.to_stage === s);
        const stageNotes = stageLog?.notes;

        if (s === 1) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Ringkasan Order Masuk:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Klien:</span> <span className="font-semibold text-gray-800">{job.klien || '-'}</span></div>
                        <div><span className="text-gray-400">Pesawat / Alat:</span> <span className="font-semibold text-gray-800">{job.pesawat || '-'}</span></div>
                        <div><span className="text-gray-400">Lokasi:</span> <span className="font-semibold text-gray-800">{job.lokasi || '-'}</span></div>
                        <div><span className="text-gray-400">Jumlah Unit:</span> <span className="font-semibold text-gray-800">{job.units || 1} Unit</span></div>
                        <div><span className="text-gray-400">Nilai Kontrak:</span> <span className="font-semibold text-gray-800">{job.nilai ? `Rp ${Number(job.nilai).toLocaleString('id-ID')}` : '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 3) {
            const schedDays = parseJsonArray(job.schedule_days);
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Penjadwalan:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Jam Mulai:</span> <span className="font-semibold text-gray-800">{job.jam_mulai || '-'}</span></div>
                        <div><span className="text-gray-400">Total Hari:</span> <span className="font-semibold text-gray-800">{job.durasi_hari ? `${job.durasi_hari} Hari` : '-'}</span></div>
                        <div className="col-span-2"><span className="text-gray-400">Disnaker Tujuan:</span> <span className="font-semibold text-gray-800">{job.disnaker_tujuan || '-'}</span></div>
                    </div>
                    {schedDays.length > 0 ? (
                        <div className="space-y-1.5">
                            {schedDays.map((day, idx) => {
                                const dayInspectors = (job.inspectors || []).filter(ins =>
                                    (day.inspector_ids || []).map(String).includes(String(ins.id))
                                );
                                return (
                                    <div key={idx} className="flex gap-2 items-start text-xs bg-white border border-gray-200 rounded px-2.5 py-1.5">
                                        <span className="font-bold text-indigo-700 shrink-0">Hari {idx + 1} ({fmt(day.date)}):</span>
                                        <span className="text-gray-700">
                                            {dayInspectors.length > 0
                                                ? dayInspectors.map(i => i.name).join(', ')
                                                : (day.inspector_ids?.length > 0 ? `${day.inspector_ids.length} inspektur` : '-')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Backward compat: old flat format */
                        <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600 space-y-1">
                            <div><span className="text-gray-400">Tgl Pelaksanaan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_pelaksanaan) || '-'}</span></div>
                            <div><span className="text-gray-400">Inspektur Bertugas:</span> <span className="font-semibold text-gray-800">{job.inspectors?.length > 0 ? job.inspectors.map(i => i.name).join(', ') : '-'}</span></div>
                        </div>
                    )}
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 4) {
            const s4Checklist = parseJsonObject(job.s4_checklist);
            const checkedCount = Object.values(s4Checklist).filter(Boolean).length;
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Pelaksanaan RU:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Tgl Pelaksanaan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_pelaksanaan) || '-'}</span></div>
                        <div><span className="text-gray-400">Tim Inspektur:</span> <span className="font-semibold text-gray-800">{job.inspectors?.length > 0 ? job.inspectors.map(i => i.name).join(', ') : '-'}</span></div>
                        <div><span className="text-gray-400">Report Writer:</span> <span className="font-semibold text-gray-800">{job.report_writer ? job.report_writer.name : '-'}</span></div>
                        <div><span className="text-gray-400">Checklist Lapangan:</span> <span className="font-semibold text-emerald-700">{checkedCount > 0 ? `${checkedCount} Item Terverifikasi` : '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Inspeksi: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 13) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Aktualisasi Unit (Stage 4b):</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Unit Aktual:</span> <span className="font-semibold text-gray-800">{job.actual_units ?? job.units} Unit (Awal: {job.units} Unit)</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 16) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Penjadwalan Ulang (Stage 4c):</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Alasan Reschedule:</span> <span className="font-semibold text-gray-800">{job.reschedule_reason || '-'}</span></div>
                        <div><span className="text-gray-400">Tgl Jadwal Baru:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_reschedule) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 17) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Hasil Riksa Uji Ulang (Stage 4d):</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Status RU Ulang:</span> <span className="font-semibold text-emerald-700">{job.ru_ulang_status === 'lolos' ? 'Lolos RU Ulang' : (job.ru_ulang_status || 'Selesai RU Ulang')}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 5) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Penyusunan LHPP:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Data Teknis Diserahkan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_teknis_diserahkan) || '-'}</span></div>
                        <div><span className="text-gray-400">Pengerjaan Laporan Mulai:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_laporan_mulai) || '-'}</span></div>
                        <div><span className="text-gray-400">Laporan Selesai:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_laporan_selesai) || '-'}</span></div>
                        <div><span className="text-gray-400">Status Dokumen:</span> <span className="font-semibold text-emerald-700">Selesai Disusun</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Penyusunan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 6) {
            const decisionObj = STAGE5_DECISIONS.find(d => d.value === job.s5_review_decision);
            const decisionLabel = decisionObj ? decisionObj.label : job.s5_review_decision;
            const badgeCls = job.s5_review_decision === 'approved'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : job.s5_review_decision === 'conditional'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-red-100 text-red-800 border-red-300';
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Hasil Review Manager:</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Keputusan Review:</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeCls}`}>
                                {decisionLabel || 'Approved'}
                            </span>
                        </div>
                        {job.s5_review_notes && (
                            <div>
                                <span className="text-gray-400">Catatan Reviewer:</span>{' '}
                                <span className="font-medium text-gray-800">{job.s5_review_notes}</span>
                            </div>
                        )}
                    </div>
                    {stageNotes && !job.s5_review_notes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 7) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Penyerahan ke Dinas:</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Tgl Penyerahan ke Disnaker:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_submit_disnaker) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Penyerahan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 8) {
            const statusObj = STAGE8_DISNAKER_STATUSES.find(p => p.value === job.s8_progress_status);
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Proses Disnaker:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Status Progress:</span> <span className="font-semibold text-gray-800">{statusObj ? statusObj.label : (job.s8_progress_status || '-')}</span></div>
                        <div><span className="text-gray-400">Tgl Diserahkan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_doc_submitted_disnaker) || '-'}</span></div>
                        <div><span className="text-gray-400">Tgl Diterima Kembali:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_doc_received_disnaker) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 9) {
            const s9StatusObj = PROGRESS_STATUSES.find(p => p.value === job.s9_progress_status);
            const duration = (job.tgl_input_suket && job.tgl_suket_selesai)
                ? `${Math.max(0, Math.round((new Date(job.tgl_suket_selesai) - new Date(job.tgl_input_suket)) / 86400000))} Hari`
                : null;
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Informasi Suket Disnaker (Stage 9):</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Status Progress:</span> <span className="font-semibold text-gray-800">{s9StatusObj ? s9StatusObj.label : (job.s9_progress_status || '-')}</span></div>
                        <div><span className="text-gray-400">Durasi Pengurusan:</span> <span className="font-semibold text-emerald-700">{duration || '-'}</span></div>
                        <div><span className="text-gray-400">No Suket:</span> <span className="font-semibold text-gray-800">{job.s9_no_suket || '-'}</span></div>
                        <div><span className="text-gray-400">Masa Berlaku:</span> <span className="font-semibold text-gray-800">{fmt(job.s9_suket_berlaku_sampai) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 10) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Pembuatan Invoice (Stage 10):</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Total Invoice:</span> <span className="font-semibold text-gray-800">{job.total_invoice_amount ? `Rp ${Number(job.total_invoice_amount).toLocaleString('id-ID')}` : '-'}</span></div>
                        <div><span className="text-gray-400">Tgl Invoice Diterbitkan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_invoice_issued) || '-'}</span></div>
                        <div><span className="text-gray-400">Nomor Invoice:</span> <span className="font-semibold text-gray-800">{job.invoice_no || '-'}</span></div>
                        <div><span className="text-gray-400">Tgl Submit MKT:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_submit_mkt) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Penagihan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 11) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Penagihan Pembayaran (Stage 11 - Marketing):</p>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Metode Penagihan:</span> <span className="font-semibold text-gray-800">{job.metode_penagihan || 'Email / WA'}</span></div>
                        <div><span className="text-gray-400">Tanggal Ditagih:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_penagihan) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Penagihan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 15) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Verifikasi Pembayaran (Stage 11c - Finance):</p>
                    <div className="grid grid-cols-2 gap-2 bg-purple-50/70 p-2.5 rounded border border-purple-200 text-gray-600">
                        <div><span className="text-gray-400">Status Verifikasi:</span> <span className="font-bold text-emerald-700">{job.payment_verification_status || (job.paid ? 'Lunas' : 'Partial / Pending')}</span></div>
                        <div><span className="text-gray-400">Mutasi / Ref Bank:</span> <span className="font-semibold text-gray-800">{job.bank_ref || '-'}</span></div>
                        <div><span className="text-gray-400">Dana Masuk:</span> <span className="font-semibold text-gray-800">{fmtCurrency(job.amount_received || job.nilai)}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Keuangan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 14) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Pengiriman SUKET ke Klien (Stage 11b - Marketing):</p>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">No. Resi / Kurir:</span> <span className="font-semibold text-blue-700 font-mono">{job.no_resi || job.ekspedisi || '-'}</span></div>
                        <div><span className="text-gray-400">Tanggal Kirim:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_kirim_suket) || '-'}</span></div>
                        <div><span className="text-gray-400">Pengiriman Batch:</span> <span className="font-semibold text-gray-800">{job.batch_no || 'Batch 1'}</span></div>
                        <div><span className="text-gray-400">Tanda Terima:</span> <span className="font-semibold text-emerald-700">{job.tanda_terima_klien || 'Diterima Klien'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Pengiriman: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 12) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-emerald-700">Pekerjaan Selesai (Closed):</p>
                    <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 text-emerald-900">
                        <span>Seluruh tahapan RU, LHPP, Disnaker, Pelunasan Keuangan, dan Pengiriman SUKET telah selesai sempurna.</span>
                    </div>
                </div>
            );
        }

        if (stageNotes) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                        <span className="font-semibold text-amber-800">Catatan Stage: </span> {stageNotes}
                    </div>
                </div>
            );
        }

        return null;
    };

    // ── Timeline Tab ─────────────────────────────────────────────────────────
    const renderTimeline = () => (
        <div className="space-y-6 py-2">
            <h3 className="font-bold text-gray-800 border-b pb-2">Status Pekerjaan: Stage {currentStageInfo?.displayId || job.stage} ({currentStageInfo?.name})</h3>

            {/* SLA Badge for current stage */}
            {slaTag && (
                <div className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${slaTag.cls}`}>
                    {daysInStage} hari di stage ini {currentStageInfo?.sla ? `(SLA: ${currentStageInfo.sla} hari)` : ''} — {slaTag.label}
                </div>
            )}

            <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-8">
                {STAGES.map(stage => {
                    const currentStageIdx = STAGES.findIndex(s => s.id === job.stage);
                    const stageIdx = STAGES.findIndex(s => s.id === stage.id);
                    const isPast = currentStageIdx > stageIdx;
                    const isCurrent = currentStageIdx === stageIdx;
                    const isFuture = currentStageIdx < stageIdx;

                    let iconBg = 'bg-gray-100 border-gray-300';
                    if (isPast) iconBg = 'bg-emerald-500 border-emerald-600 text-white shadow-2xs';
                    if (isCurrent) iconBg = 'bg-gradient-to-tr from-[#0A385C] to-[#00A8E8] border-2 border-white text-white ring-4 ring-[#00A8E8]/30 shadow-md scale-110 font-extrabold';

                    const stageDocs = (job.documents || []).filter(d => d.stage === stage.id);

                    return (
                        <div key={stage.id} className={`relative ${isFuture ? 'opacity-40' : ''}`}>
                            {/* Connector Node */}
                            <div className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-transform ${iconBg}`}>
                                {isPast ? 'Selesai' : (stage.displayId || stage.id)}
                            </div>

                            <div className={`bg-white border rounded-xl shadow-xs p-4 transition-all ${isCurrent ? 'border-[#00A8E8] ring-1 ring-[#00A8E8]/40 shadow-sm' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`font-extrabold text-sm ${isCurrent ? 'text-[#0A385C]' : 'text-slate-800'}`}>
                                        Stage {stage.displayId || stage.id}: {stage.name}
                                    </h4>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isCurrent ? 'bg-[#0A385C] text-[#00A8E8]' : 'bg-slate-100 text-slate-600'}`}>
                                        PIC: {stage.role.toUpperCase()}
                                    </span>
                                </div>

                                {isCurrent && (
                                    <div className="mt-4 pt-4 border-t border-[#00A8E8]/20 bg-[#F8FAFC] -mx-4 -mb-4 p-4 rounded-b-xl">
                                        {canManage ? (
                                            renderStageAction()
                                        ) : (
                                            <div className="space-y-3">
                                                {renderCompletedStageSummary(stage.id)}
                                                {stageDocs.length > 0 && (
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-xs text-gray-500 font-medium">Dokumen Tersimpan:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {stageDocs.map(d => <DocChip key={d.id} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} />)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isCurrent && stage.id === 2 && (
                                    <div className="mt-3 space-y-2 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-700">Hasil Verifikasi Dokumen (Stage 2):</p>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden text-xs bg-gray-50/50 divide-y divide-gray-100">
                                            {STAGE2_VERIFY_CHECKLIST.map((item) => {
                                                const docs = (job.documents || []).filter(d =>
                                                    (d.stage === 1 || d.stage === 2) && d.type === item.type
                                                );
                                                const hasFile = docs.length > 0;
                                                const savedData = parseJsonObject(job.s2_verify_data);
                                                const status = savedData[item.type] || s2Verify[item.type];
                                                return (
                                                    <div key={item.type} className="flex items-center justify-between px-3 py-1.5 hover:bg-white transition-colors">
                                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                                            <span className="font-mono text-gray-400 text-[10px] w-4">{item.no}</span>
                                                            <span className="font-medium text-gray-800 truncate">{item.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {item.isManual ? (
                                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Manual</span>
                                                            ) : hasFile ? (
                                                                <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                                                    Ada File
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Kosong</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status === 'ok' ? 'bg-green-600 text-white' :
                                                                    status === 'tidak' ? 'bg-red-600 text-white' :
                                                                        status === 'na' ? 'bg-gray-500 text-white' :
                                                                            'bg-gray-200 text-gray-600'
                                                                }`}>
                                                                {status === 'ok' ? 'OK' : status === 'tidak' ? 'Tidak' : status === 'na' ? 'N/A' : 'Belum Set'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {!isCurrent && stageDocs.length > 0 && stage.id !== 2 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-gray-500 font-medium">Dokumen Tersimpan:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {stageDocs.map(d => <DocChip key={d.id} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} />)}
                                        </div>
                                    </div>
                                )}

                                {!isCurrent && isPast && renderCompletedStageSummary(stage.id)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ── Documents Tab ────────────────────────────────────────────────────────
    const renderDocuments = () => (
        <div className="space-y-4">
            {STAGES.map(stage => {
                if (!canViewStageDocs(stage.id)) return null;
                const docs = getDocs(stage.id);
                if (docs.length === 0) return null;
                return (
                    <div key={stage.id} className="border rounded-lg p-4">
                        <h4 className="font-bold text-sm text-gray-700 mb-3 pb-2 border-b">
                            Stage {stage.displayId || stage.id}: {stage.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {docs.map(doc => (
                                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-gray-50 border rounded text-sm">
                                    <div>
                                        <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-2">
                                            {doc.name}
                                        </a>
                                        <div className="text-xs text-gray-500 mt-1 ml-6">
                                            {doc.type} • Uploaded by {doc.uploaded_by_user_id} • {fmt(doc.created_at)}
                                        </div>
                                    </div>
                                    {canManageStageDocs(doc.stage) && (
                                        <button onClick={() => deleteDoc(doc.id)} className="text-red-500 hover:text-red-700 font-medium px-2 py-1 sm:mt-0 mt-2 text-xs border border-red-200 rounded">
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {(!job.documents || job.documents.length === 0) && (
                <div className="text-center py-10 text-gray-400">Belum ada dokumen yang diunggah.</div>
            )}

            {/* Hidden generic file input for non-photo uploads */}
            <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
        </div>
    );

    // ── History Tab ──────────────────────────────────────────────────────────
    const renderHistory = () => (
        <div className="space-y-4">
            {(job.historyLogs || job.history_logs || []).slice().reverse().map(log => (
                <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-1 relative">
                    <div className="absolute w-2 h-2 bg-gray-400 rounded-full -left-[5px] top-3"></div>
                    <div className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-700">{log.user?.name || 'System'}</span>
                            <span className="text-xs text-gray-500">{fmt(log.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-800">{log.action}</p>
                        {log.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-2">"{log.notes}"</p>
                        )}
                        {log.returned_from_stage && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded border border-red-200">
                                DIKEMBALIKAN dari Stage {log.returned_from_stage}
                            </span>
                        )}
                        <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-800 px-2 rounded-full">
                            Stage {STAGES.find(s => s.id === log.stage)?.displayId || log.stage}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    // ── Edit Info Tab ────────────────────────────────────────────────────────
    const renderEditInfo = () => (
        <div className="space-y-4">
            {isEditing ? (
                <form onSubmit={handleUpdateJob} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Klien</label>
                            <input type="text" value={editForm.data.klien} onChange={e => editForm.setData('klien', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Jenis Alat</label>
                            <input type="text" value={editForm.data.pesawat} onChange={e => editForm.setData('pesawat', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                        </div>
                        <div className="col-span-2">
                            <IndonesiaLocationSelect
                                value={editForm.data.lokasi}
                                onChange={val => editForm.setData('lokasi', val)}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Jumlah Unit</label>
                            <input type="number" min="1" value={editForm.data.units} onChange={e => editForm.setData('units', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                        </div>
                        {canSeeNilai && (
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-700">Nilai Kontrak</label>
                                <input type="number" value={editForm.data.nilai} onChange={e => editForm.setData('nilai', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm bg-gray-200 rounded">Batal</button>
                        <button type="submit" disabled={editForm.processing} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 border-b w-full pb-2 mb-2">Informasi Pekerjaan</h4>
                        {canManage && (
                            <button onClick={() => setIsEditing(true)} className="text-xs font-medium text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 ml-2">
                                Edit
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div><p className="text-xs text-gray-500">Kode Job</p><p className="font-semibold">{job.kode}</p></div>
                        <div><p className="text-xs text-gray-500">Marketing</p><p className="font-medium">{job.owner_marketing}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-500">Klien</p><p className="font-semibold text-base">{job.klien}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-500">PIC Klien</p><p className="font-medium">{job.pic_klien || '—'} {job.pic_klien_phone ? `(${job.pic_klien_phone})` : ''}</p></div>
                        <div><p className="text-xs text-gray-500">Jenis Alat</p><p className="font-medium">{job.pesawat}</p></div>
                        <div><p className="text-xs text-gray-500">Jumlah Unit</p><p className="font-bold">{job.units} Unit</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-500">Lokasi</p><p>{job.lokasi}</p></div>
                        {canSeeNilai && (
                            <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                                <p className="text-xs text-yellow-800 font-bold">
                                    Nilai Kontrak <span className="font-normal opacity-80">(belum termasuk PPN)</span>
                                </p>
                                <p className="font-bold text-lg text-yellow-900">{fmtCurrency(job.nilai)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const handleDeleteJob = async () => {
        const res = await showConfirm(
            'Hapus Job',
            `Apakah Anda yakin ingin menghapus Job ${job.kode} (${job.klien})? Tindakan ini tidak dapat dibatalkan!`,
            'Ya, Hapus Job',
            'Batal'
        );
        if (res.isConfirmed) {
            router.delete(`/jobs/${job.id}`, {
                onSuccess: () => {
                    showSuccess('Berhasil', `Job ${job.kode} berhasil dihapus.`);
                    onClose();
                }
            });
        }
    };

    // ── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col h-[92vh] sm:h-[88vh] overflow-hidden">

                {/* Header — Fixed at top */}
                <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <div className="min-w-0 flex-1 mr-3">
                        <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight truncate">{job.klien}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono bg-white px-2 py-0.5 rounded border shadow-sm text-xs font-semibold text-gray-600">{job.kode}</span>
                            <span className="font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Stage {job.stage}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {(auth?.user?.role === 'superadmin' || auth?.permissions === 'superadmin') && (
                            <button
                                onClick={handleDeleteJob}
                                className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Hapus Job Ini (Superadmin Special)"
                            >
                                <Trash2 size={13} /> Hapus Job
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Tabs — Fixed immediately below header, clear text and spacing */}
                <div className="flex px-2 sm:px-6 border-b bg-white flex-shrink-0 z-10 shadow-sm overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'timeline', label: 'Status' },
                        { id: 'docs', label: 'Dokumen' },
                        { id: 'history', label: 'Riwayat' },
                        { id: 'info', label: 'Info & Edit' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`py-3 px-4 sm:py-3.5 sm:px-6 font-bold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Area — Scrollable body */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-white flex-1">
                    {/* Document Debt Warning Banner */}
                    {job.document_debt && job.document_debt.length > 0 && (
                        <div className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-lg p-3 text-xs text-amber-900 shadow-xs">
                            <div className="font-extrabold flex items-center gap-1.5 text-sm text-amber-950 mb-1">
                                Hutang Dokumen (Document Debt) Aktif!
                            </div>
                            <p className="mb-1">
                                Pekerjaan ini memiliki dokumen yang di-bypass di Stage 2 dan <strong>wajib dilengkapi sebelum SUKET dapat dikirim ke klien (Stage 11b)</strong>:
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {job.document_debt.map((docName, idx) => (
                                    <span key={idx} className="bg-amber-200/80 border border-amber-400 text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold">
                                        {docName}
                                    </span>
                                ))}
                            </div>
                            {job.stage2_bypass_justification && (
                                <p className="mt-2 text-[11px] text-amber-800 italic">
                                    Alasan Bypass: "{job.stage2_bypass_justification}" (oleh {job.stage2_bypass_approved_by || 'Manager'})
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'timeline' && renderTimeline()}
                    {activeTab === 'docs' && renderDocuments()}
                    {activeTab === 'history' && renderHistory()}
                    {activeTab === 'info' && renderEditInfo()}
                </div>

                {/* Hidden File Input for triggerUpload */}
                <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" />

                {/* Global Loader Overlay */}
                {(processing || isUploading) && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
                        <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="font-semibold text-gray-700">Memproses...</span>
                        </div>
                    </div>
                )}

                {/* Split Job Wizard Modal */}
                {isSplitModalOpen && (
                    <SplitJobModal
                        job={job}
                        auth={auth}
                        onClose={() => {
                            setIsSplitModalOpen(false);
                            onClose();
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// ══ END PART C ══
