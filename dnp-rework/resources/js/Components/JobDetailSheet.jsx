import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, router } from '@inertiajs/react';
import SmartRecommendation from './SmartRecommendation';
import IndonesiaLocationSelect from './IndonesiaLocationSelect';
import { showError, showSuccess, showConfirm, showWarning } from '@/swal';
import { Trash2 } from 'lucide-react';
import {
    DOC_TYPES_BY_STAGE, STAGES, STAGE4_PHOTO_TYPES, STAGE5_DECISIONS,
    PROGRESS_STATUSES, STAGE8_DISNAKER_STATUSES, MKT_STAGES, FIN_STAGES, STAGE1_REQUIRED_DOCS, STAGE2_REQUIRED_DOCS,
    STAGE2_VERIFY_CHECKLIST
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
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};

const daysElapsed = (from) => {
    if (!from) return null;
    return Math.ceil((new Date() - new Date(from)) / 86400000);
};

const getSlaTag = (days, slaLimit) => {
    if (days == null || !slaLimit) return null;
    if (days > slaLimit)  return { label: 'OVERDUE',  cls: 'bg-red-100 text-red-800 font-bold' };
    if (days >= slaLimit) return { label: 'LAST DAY', cls: 'bg-orange-100 text-orange-800 font-bold' };
    return { label: 'ON TRACK', cls: 'bg-green-100 text-green-800' };
};

// ── Top-level Subcomponents (to maintain stable DOM identity across re-renders) ──
const DocChip = ({ doc, canManage, onDelete }) => (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs group">
        <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer"
           className="text-blue-600 hover:underline font-medium truncate max-w-[160px]" title={doc.name}>
            📎 {doc.name}
        </a>
        {canManage && (
            <button onClick={() => onDelete(doc.id)}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1">✕</button>
        )}
    </div>
);

const MoveRow = ({ disabled = false, disabledMsg = '', stage, processing, onReject }) => {
    const getNextLabel = () => {
        if (stage === 11) return 'Lanjut ke Stage 11b (Pembayaran) →';
        if (stage === 14) return 'Lanjut ke Stage 12 (Closed) →';
        const currIdx = STAGES.findIndex(s => s.id === stage);
        if (currIdx !== -1 && currIdx < STAGES.length - 1) {
            const next = STAGES[currIdx + 1];
            return `Lanjut ke Stage ${next.displayId || next.id} (${next.short}) →`;
        }
        return `Lanjut ke Stage ${stage + 1} →`;
    };

    return (
        <div className="mt-4 flex flex-col gap-2">
            {disabledMsg && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    ⚠️ {disabledMsg}
                </div>
            )}
            <div className="flex gap-2">
                {[2,4,5,8,9].includes(stage) && (
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
            className={`border-2 border-dashed rounded-lg p-2.5 transition-all duration-200 ${
                isDragging 
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
        if (currentStageId === 11) return 14;
        if (currentStageId === 14) return 12;
        const currIdx = STAGES.findIndex(s => s.id === currentStageId);
        if (currIdx !== -1 && currIdx < STAGES.length - 1) {
            return STAGES[currIdx + 1].id;
        }
        return currentStageId + 1;
    };

    // ── Forms ────────────────────────────────────────────────────────────────
    const { data, setData, post, processing, errors } = useForm({
        next_stage:      getNextStageId(job.stage),
        notes:           '',
        inspector_ids:   job.inspectors ? job.inspectors.map(i => i.id) : [],
        report_writer_id: job.report_writer_id || '',
        tgl_pelaksanaan: job.tgl_pelaksanaan || '',
        jam_mulai:       job.jam_mulai || '08:00',
        durasi_hari:     job.durasi_hari || 1,
        disnaker_tujuan: job.disnaker_tujuan || '',
        alat_ids:        parseJsonArray(job.alat_ids),
        cert_ids:        parseJsonArray(job.cert_ids),
    });

    const editForm = useForm({
        klien:   job.klien   || '',
        pesawat: job.pesawat || '',
        lokasi:  job.lokasi  || '',
        nilai:   job.nilai   || '',
        units:   job.units   || 1,
    });

    // ── UI State ─────────────────────────────────────────────────────────────
    const [activeTab,    setActiveTab]    = useState('timeline');
    const [isEditing,    setIsEditing]    = useState(false);
    const [isUploading,  setIsUploading]  = useState(false);
    const [uploadStage,  setUploadStage]  = useState(null);
    const [uploadType,   setUploadType]   = useState('');
    const [photoNotes,   setPhotoNotes]   = useState({});   // key: photo type
    const [returnNotes,  setReturnNotes]  = useState('');
    const fileInputRef = useRef(null);

    // Stage-specific form state
    const [s4, setS4] = useState({
        actual_units:     job.actual_units     ?? job.units,
        unit_count_notes: job.unit_count_notes ?? '',
    });
    const [s5, setS5] = useState({
        s5_review_decision: job.s5_review_decision ?? '',
        s5_review_notes:    job.s5_review_notes    ?? '',
    });
    const [s7, setS7] = useState({ tgl_submit_disnaker: job.tgl_submit_disnaker ?? '' });
    const [s8, setS8] = useState({
        tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker ?? '',
        tgl_doc_received_disnaker:  job.tgl_doc_received_disnaker  ?? '',
        s8_progress_status:         job.s8_progress_status         ?? '',
    });
    const [s9,  setS9]  = useState({ s9_progress_status: job.s9_progress_status  ?? '' });
    const [s10, setS10] = useState({
        total_invoice_amount: job.total_invoice_amount ?? '',
        tgl_invoice_issued:   job.tgl_invoice_issued   ?? '',
        s10_progress_status:  job.s10_progress_status  ?? '',
        tgl_submit_mkt:       job.tgl_submit_mkt       ?? '',
    });
    const [s14, setS14] = useState({
        s14_payment_status: job.s14_payment_status ?? 'pending',
        s14_payment_notes:  job.s14_payment_notes  ?? '',
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

    // Master data & recommendations (Stage 3)
    const [masterData,       setMasterData]       = useState({ alat_uji: [], sertifikat_pjk3: [] });
    const [recommendations,  setRecommendations]  = useState({ recommended: [], eliminated: [] });
    useEffect(() => {
        if (job.stage === 3) {
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
            next_stage:      getNextStageId(job.stage),
            notes:           '',
            inspector_ids:   job.inspectors ? job.inspectors.map(i => i.id) : [],
            report_writer_id: job.report_writer_id || '',
            tgl_pelaksanaan: job.tgl_pelaksanaan || '',
            jam_mulai:       job.jam_mulai || '08:00',
            durasi_hari:     job.durasi_hari || 1,
            disnaker_tujuan: job.disnaker_tujuan || '',
            alat_ids:        parseJsonArray(job.alat_ids),
            cert_ids:        parseJsonArray(job.cert_ids),
        });
        editForm.setData({
            klien:   job.klien   || '',
            pesawat: job.pesawat || '',
            lokasi:  job.lokasi  || '',
            nilai:   job.nilai   || '',
            units:   job.units   || 1,
        });
        setS4({
            actual_units:     job.actual_units     ?? job.units,
            unit_count_notes: job.unit_count_notes ?? '',
        });
        setS5({
            s5_review_decision: job.s5_review_decision ?? '',
            s5_review_notes:    job.s5_review_notes    ?? '',
        });
        setS7({ tgl_submit_disnaker: job.tgl_submit_disnaker ?? '' });
        setS8({
            tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker ?? '',
            tgl_doc_received_disnaker:  job.tgl_doc_received_disnaker  ?? '',
            s8_progress_status:         job.s8_progress_status         ?? '',
        });
        setS9({ s9_progress_status: job.s9_progress_status ?? '' });
        setS10({
            total_invoice_amount: job.total_invoice_amount ?? '',
            tgl_invoice_issued:   job.tgl_invoice_issued   ?? '',
            s10_progress_status:  job.s10_progress_status  ?? '',
            tgl_submit_mkt:       job.tgl_submit_mkt       ?? '',
        });
        setS14({
            s14_payment_status: job.s14_payment_status ?? 'pending',
            s14_payment_notes:  job.s14_payment_notes  ?? '',
        });

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
        if (!permissions) return false;
        if (permissions === 'superadmin') return true;
        if (isMGR && !MKT_STAGES.includes(job.stage) && !FIN_STAGES.includes(job.stage)) return true;
        if (isInspector) {
            return [4, 6].includes(job.stage) && isAssignedInspector;
        }
        const p = permissions[job.stage];
        return p && (p.is_owner === true || p.is_owner === 1 || p.is_owner === '1');
    })();

    const canViewStageDocs = (sid) => {
        if (['superadmin','admin','manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && job.owner_marketing === user?.name) return true;
        if (isInspector) return true;
        const p = permissions?.[sid];
        return p && (p.can_view || p.is_owner);
    };

    const canManageStageDocs = (sid) => {
        if (['superadmin','manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && job.owner_marketing === user?.name && [1,11,13].includes(sid)) return true;
        if (isInspector && [4,5,6].includes(sid) && sid === job.stage) return isAssignedInspector;
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

    // Stage 4: unit mismatch
    const s4UnitMismatch = s4.actual_units != null && parseInt(s4.actual_units) !== parseInt(job.units);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleMoveStage = (e) => {
        e.preventDefault();
        if (job.stage === 1 && !stage1DocOk) return showError('Upload Dokumen', 'Upload minimal satu dokumen PO/SPK, Surat Permohonan, atau Surat Kuasa!');
        if (job.stage === 2 && !stage2CanMove) return showError('Dokumen Belum Lengkap', 'Lengkapi dokumen atau minta persetujuan Kadiv/MGR.');
        if (job.stage === 3) {
            if (!data.tgl_pelaksanaan) return showError('Validasi', 'Tanggal Pelaksanaan wajib diisi!');
            if (!data.inspector_ids?.length) return showError('Validasi', 'Pilih minimal satu inspektur!');
        }
        
        post(`/jobs/${job.id}/move`, { onSuccess: () => onClose() });
    };

    const handleRouteTo13 = (e) => {
        e.preventDefault();
        router.post(`/jobs/${job.id}/move`, { ...data, next_stage: 13 }, { onSuccess: () => onClose() });
    };

    const handleRejectStage = async () => {
        if (!data.notes?.trim()) return showError('Validasi', 'Isi catatan penolakan terlebih dahulu!');
        const targetStage = job.stage === 8 ? 6 : Math.max(1, job.stage - 1);
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

    const handleReturnToStage1 = (e) => {
        e.preventDefault();
        if (!returnNotes.trim()) return showError('Validasi', 'Isi alasan pengembalian!');
        router.post(`/jobs/${job.id}/return-to-stage1`, { notes: returnNotes }, { onSuccess: () => onClose() });
    };

    const handleSaveS4  = () => router.post(`/jobs/${job.id}/stage4-data`,   s4,  { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS5  = () => {
        if (!s5.s5_review_decision) return showError('Validasi', 'Pilih keputusan review!');
        router.post(`/jobs/${job.id}/stage5-review`, s5, { onSuccess: () => showSuccess('Berhasil', 'Keputusan disimpan.') });
    };
    const handleSaveS7  = () => router.post(`/jobs/${job.id}/stage7-data`,  s7,  { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS8  = () => router.post(`/jobs/${job.id}/stage8-data`,  s8,  { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS9  = () => router.post(`/jobs/${job.id}/stage9-data`,  s9,  { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS10 = () => router.post(`/jobs/${job.id}/stage10-data`, s10, { onSuccess: () => showSuccess('Berhasil', 'Tersimpan.') });
    const handleSaveS14 = () => router.post(`/jobs/${job.id}/stage14-data`, s14, { onSuccess: () => showSuccess('Berhasil', 'Status Pembayaran 11b Tersimpan.') });

    const handleUpdateJob = (e) => {
        e.preventDefault();
        editForm.put(`/jobs/${job.id}`, { onSuccess: () => setIsEditing(false) });
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
            onError:   () => setIsUploading(false),
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
            onError:   () => setIsUploading(false),
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
        router.delete(`/jobs/${job.id}/documents/${docId}`);
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
                                ✅ Kadiv/MGR sudah menyetujui. Admin dapat melanjutkan.
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
                                🔔 Menunggu persetujuan Kadiv/MGR…
                            </div>
                        )}

                        {/* ── Verification Checklist Table ── */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                            {/* Table Header */}
                            <div className="grid bg-gray-100 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wide"
                                style={{ gridTemplateColumns: '2.5rem 1fr 7rem 8.5rem' }}>
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
                                        style={{ gridTemplateColumns: '2.5rem 1fr 7rem 8.5rem' }}>

                                        {/* NO */}
                                        <div className="px-2 py-3 text-center font-bold text-gray-400">{item.no}</div>

                                        {/* DOKUMEN */}
                                        <div className="px-3 py-3">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                <span className="font-medium text-gray-800">{item.label}</span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                                                    item.badge === 'WAJIB'
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
                                            {item.isManual ? (
                                                <span className="px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-[10px]">MANUAL</span>
                                            ) : hasFile ? (
                                                docs.map(d => (
                                                    <a key={d.id} href={`/storage/${d.path}`} target="_blank" rel="noopener noreferrer"
                                                        className="px-2 py-1 rounded bg-green-50 border border-green-300 text-green-700 font-semibold text-[10px] hover:underline truncate max-w-[80px]" title={d.name}>
                                                        📎 {d.name.split('.').pop().toUpperCase()}
                                                    </a>
                                                ))
                                            ) : (
                                                <button type="button"
                                                    onClick={() => triggerUpload(2, item.type)}
                                                    className="px-2 py-1 rounded bg-red-50 border border-red-300 text-red-600 font-semibold text-[10px] hover:bg-red-100 flex items-center gap-1">
                                                    <span>✕</span> KOSONG
                                                </button>
                                            )}
                                            {hasFile && canManageStageDocs(2) && (
                                                <button type="button" onClick={() => triggerUpload(2, item.type)}
                                                    className="text-[10px] text-blue-500 hover:underline">+ ganti</button>
                                            )}
                                        </div>

                                        {/* STATUS VERIFIKASI */}
                                        <div className="px-2 py-3 flex items-center justify-center gap-1">
                                            <button type="button" onClick={() => setStatus('ok')}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold transition-colors ${
                                                    status === 'ok'
                                                        ? 'bg-green-500 text-white border-green-500'
                                                        : 'border-green-400 text-green-600 hover:bg-green-50'
                                                }`}>✓ OK</button>
                                            <button type="button" onClick={() => setStatus('tidak')}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold transition-colors ${
                                                    status === 'tidak'
                                                        ? 'bg-red-500 text-white border-red-500'
                                                        : 'border-red-400 text-red-600 hover:bg-red-50'
                                                }`}>✕ Tidak</button>
                                            {item.hasNa && (
                                                <button type="button" onClick={() => setStatus('na')}
                                                    className={`px-2 py-1 rounded border text-[10px] font-bold transition-colors ${
                                                        status === 'na'
                                                            ? 'bg-gray-500 text-white border-gray-500'
                                                            : 'border-gray-400 text-gray-500 hover:bg-gray-50'
                                                    }`}>N/A</button>
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
                            {!stage2DocOk && !stage2Bypass && job.peer_review_status !== 'requested' && !isMGR && (
                                <button type="button" onClick={handleAskApproval}
                                    className="px-3 py-2 rounded text-sm bg-orange-500 text-white font-semibold hover:bg-orange-600">
                                    Minta Persetujuan MGR
                                </button>
                            )}
                            <button type="submit" disabled={processing || !stage2CanMove}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                                {processing ? '...' : '✓ Verifikasi Selesai — Lanjut Penjadwalan →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 3 ─────────────────────────────────── */}
                {s === 3 && (
                    <div className="space-y-4">
                        {/* Scheduling fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Pelaksanaan *</label>
                                <input type="date" value={data.tgl_pelaksanaan} onChange={e => setData('tgl_pelaksanaan', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Jam Mulai *</label>
                                <input type="time" value={data.jam_mulai} onChange={e => setData('jam_mulai', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Durasi (hari) *</label>
                                <input type="number" min="1" value={data.durasi_hari} onChange={e => setData('durasi_hari', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Disnaker Tujuan *</label>
                                <input type="text" value={data.disnaker_tujuan} onChange={e => setData('disnaker_tujuan', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" placeholder="Contoh: Disnaker Kab. Bekasi" />
                            </div>
                        </div>
                        {/* Smart Recommendation */}
                        <SmartRecommendation
                            job={job}
                            selectedInspectorIds={data.inspector_ids}
                            onSelectInspector={(insUser) => {
                                const ids = data.inspector_ids.includes(insUser.id)
                                    ? data.inspector_ids.filter(id => id !== insUser.id)
                                    : [...data.inspector_ids, insUser.id];
                                setData('inspector_ids', ids);
                            }}
                        />

                        {/* Penanggung Jawab Laporan / Penyusun LHPP */}
                        <div className="bg-white border rounded-lg p-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                📝 Penanggung Jawab Laporan / Penyusun LHPP
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
                        {/* Alat & Sertifikat */}
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
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} disabled={!data.tgl_pelaksanaan || !data.inspector_ids?.length}
                            disabledMsg={!data.inspector_ids?.length ? 'Pilih minimal satu inspektur' : ''} />
                    </div>
                )}

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
                                                {existing.length > 0 && <span className="text-xs text-green-600 font-bold">✓ Terupload</span>}
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
                                                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">
                                                📷 Upload Foto
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        {/* Move to Stage 13 */}
                        {s4UnitMismatch ? (
                            <form onSubmit={handleRouteTo13} className="border border-red-200 rounded-lg p-3 bg-red-50">
                                <p className="text-sm font-semibold text-red-800 mb-2">
                                    ⚠️ Jumlah alat tidak sesuai. Lanjutkan ke Stage Perubahan Unit agar Marketing dapat merevisi PO/Invoice.
                                </p>
                                <textarea rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                                    className="w-full text-sm border rounded px-2 py-1.5 mb-2"
                                    placeholder="Catatan untuk Marketing (opsional)…" />
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleRejectStage} disabled={processing}
                                        className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                                        Tolak / Kembalikan
                                    </button>
                                    <button type="submit" className="flex-1 py-2 rounded text-sm font-bold bg-red-600 text-white hover:bg-red-700">
                                        Lanjut ke Perubahan Unit (MKT)
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                        )}
                    </div>
                )}

                {/* ── STAGE 5 (Penyusunan LHPP — INS) ────────── */}
                {s === 5 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Unggah dokumen LHPP dan BAP untuk penyusunan laporan teknis.</p>
                        {(DOC_TYPES_BY_STAGE[5] || []).map(t => <UploadSlot key={t} type={t} stageId={5} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />)}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                    </div>
                )}

                {/* ── STAGE 6 (Review Laporan Teknis — MGR) ───── */}
                {s === 6 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Sebagai Kadiv/MGR, tinjau laporan teknis dari Tim Ahli.</p>
                        {job.s5_review_decision && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                                Keputusan sebelumnya: <strong>{STAGE5_DECISIONS.find(d => d.value === job.s5_review_decision)?.label}</strong>
                                {job.s5_review_notes && <span> — {job.s5_review_notes}</span>}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Keputusan Review *</label>
                            <select value={s5.s5_review_decision} onChange={e => setS5({ ...s5, s5_review_decision: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5">
                                <option value="">-- Pilih Keputusan --</option>
                                {STAGE5_DECISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan MGR</label>
                            <textarea rows={3} value={s5.s5_review_notes} onChange={e => setS5({ ...s5, s5_review_notes: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                                placeholder="Catatan kondisi, syarat, atau alasan penolakan…" />
                        </div>
                        <button type="button" onClick={handleSaveS5}
                            className="w-full py-2 rounded text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
                            Simpan Keputusan Review
                        </button>
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <div className="flex gap-2">
                            <button type="button" onClick={handleRejectStage}
                                className="px-4 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                                Tolak / Kembalikan
                            </button>
                            <button type="submit" disabled={processing || !s5.s5_review_decision || s5.s5_review_decision === 'rejected'}
                                className="flex-1 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                                {processing ? '...' : 'Lanjut ke Stage 7 Penyerahan →'}
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

                {/* ── STAGE 9 (Pengurusan Suket — Admin) ──────── */}
                {s === 9 && (
                    <div className="space-y-3">
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
                                {processing ? '...' : 'Lanjut ke Stage 10 →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 10 (Penagihan — Finance) ──────────── */}
                {s === 10 && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
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
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Status Progress</label>
                                <select value={s10.s10_progress_status} onChange={e => setS10({ ...s10, s10_progress_status: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5">
                                    <option value="">-- Pilih Status --</option>
                                    {PROGRESS_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Submit ke MKT</label>
                                <input type="date" value={s10.tgl_submit_mkt}
                                    onChange={e => setS10({ ...s10, tgl_submit_mkt: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                            </div>
                        </div>
                        <button type="button" onClick={handleSaveS10}
                            className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800">
                            Simpan Data Penagihan
                        </button>
                        {(DOC_TYPES_BY_STAGE[10] || []).map(t => <UploadSlot key={t} type={t} stageId={10} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} />)}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                    </div>
                )}

                {/* ── STAGE 11 (Pengiriman SUKET — MKT) ──────── */}
                {s === 11 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Upload dokumen (Opsional), kemudian tandai selesai.</p>
                        {(DOC_TYPES_BY_STAGE[11] || []).map(t => (
                            <UploadSlot key={t} type={t} stageId={11} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                        ))}
                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                    </div>
                )}

                {/* ── STAGE 14 (Pembayaran / Pelunasan — 11b FIN) ── */}
                {s === 14 && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-blue-900 mb-1">
                                💳 Verifikasi Pembayaran / Pelunasan (Finance)
                            </h4>
                            <p className="text-xs text-blue-700">
                                Verifikasi status pelunasan pembayaran dari klien sebelum proyek ditutup (Closed).
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Status Pembayaran 11b *</label>
                            <select
                                value={s14.s14_payment_status || 'pending'}
                                onChange={e => setS14({ ...s14, s14_payment_status: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 font-medium"
                            >
                                <option value="pending">⏳ Pending (Belum Lunas)</option>
                                <option value="partial">🌗 Partial (Dibayar Sebagian)</option>
                                <option value="paid">✅ Paid (Lunas Sempurna)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Pembayaran / Transfer</label>
                            <textarea
                                rows={2}
                                value={s14.s14_payment_notes || ''}
                                onChange={e => setS14({ ...s14, s14_payment_notes: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5"
                                placeholder="Contoh: Transfer via BCA tgl 20 Aug, lunas 100%..."
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveS14}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-sm"
                        >
                            💾 Simpan Status Pembayaran 11b
                        </button>

                        <p className="text-xs font-semibold text-gray-700 mt-3 mb-1">Dokumen Pendukung Pembayaran (Opsional)</p>
                        {(DOC_TYPES_BY_STAGE[14] || []).map(t => (
                            <UploadSlot key={t} type={t} stageId={14} docs={job.documents} triggerUpload={triggerUpload} uploadFileDirectly={uploadFileDirectly} canManageStageDocs={canManageStageDocs} deleteDoc={deleteDoc} isOptional={true} />
                        ))}

                        <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        <MoveRow stage={s} processing={processing} onReject={handleRejectStage} />
                    </div>
                )}

                {/* ── STAGE 12 (Selesai / Closed) ────────── */}
                {s === 12 && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                            <span className="text-2xl">🎉</span>
                            <h4 className="text-sm font-bold text-emerald-900 mt-1">Pekerjaan Selesai & Ditutup (Closed)</h4>
                            <p className="text-xs text-emerald-700 mt-0.5">
                                Seluruh proses sertifikasi, penyerahan Suket, dan pelunasan pembayaran telah selesai.
                            </p>
                        </div>
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
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Penjadwalan:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Tgl Pelaksanaan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_pelaksanaan) || '-'}</span></div>
                        <div><span className="text-gray-400">Jam:</span> <span className="font-semibold text-gray-800">{job.jam_mulai || '-'}</span></div>
                        <div><span className="text-gray-400">Durasi:</span> <span className="font-semibold text-gray-800">{job.durasi_hari ? `${job.durasi_hari} Hari` : '-'}</span></div>
                        <div><span className="text-gray-400">Disnaker Tujuan:</span> <span className="font-semibold text-gray-800">{job.disnaker_tujuan || '-'}</span></div>
                        <div className="col-span-2"><span className="text-gray-400">Inspektur Bertugas:</span> <span className="font-semibold text-gray-800">{job.inspectors?.length > 0 ? job.inspectors.map(i => i.name).join(', ') : '-'}</span></div>
                    </div>
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
                        <div><span className="text-gray-400">Checklist Lapangan:</span> <span className="font-semibold text-emerald-700">{checkedCount > 0 ? `✓ ${checkedCount} Item Terverifikasi` : '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Inspeksi: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 42) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Aktualisasi Unit:</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Status Update Unit:</span> <span className="font-semibold text-gray-800">Selesai diperbarui</span></div>
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
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Status LHPP & BAP:</span> <span className="font-semibold text-emerald-700">✓ Dokumen Selesai Diunggah & Disusun</span></div>
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
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Informasi Suket:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Status Progress:</span> <span className="font-semibold text-gray-800">{job.s9_progress_status || '-'}</span></div>
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
                    <p className="font-bold text-gray-700">Detail Penagihan / Invoice:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Total Invoice:</span> <span className="font-semibold text-gray-800">{job.total_invoice_amount ? `Rp ${Number(job.total_invoice_amount).toLocaleString('id-ID')}` : '-'}</span></div>
                        <div><span className="text-gray-400">Tgl Invoice Diterbitkan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_invoice_issued) || '-'}</span></div>
                        <div><span className="text-gray-400">Status Progress:</span> <span className="font-semibold text-gray-800">{job.s10_progress_status || '-'}</span></div>
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
                    <p className="font-bold text-gray-700">Pengiriman Suket ke Klien:</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Status Pengiriman:</span> <span className="font-semibold text-emerald-700">✓ Suket telah diserahkan ke Klien</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Pengiriman: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 14 || s === 12) {
            const statusLabel = job.s14_payment_status === 'paid' ? '✅ Paid (Lunas Sempurna)' : job.s14_payment_status === 'partial' ? '🌗 Partial (Dibayar Sebagian)' : '⏳ Pending';
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Status Pelunasan Pembayaran:</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600 space-y-1">
                        <div><span className="text-gray-400">Status Pembayaran 11b:</span> <span className="font-bold text-gray-800">{statusLabel}</span></div>
                        {job.s14_payment_notes && (
                            <div><span className="text-gray-400">Catatan Pembayaran:</span> <span className="font-medium text-gray-800">{job.s14_payment_notes}</span></div>
                        )}
                    </div>
                    {stageNotes && !job.s14_payment_notes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                        </div>
                    )}
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
                    ⏱ {daysInStage} hari di stage ini {currentStageInfo?.sla ? `(SLA: ${currentStageInfo.sla} hari)` : ''} — {slaTag.label}
                </div>
            )}

            <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-8">
                {STAGES.map(stage => {
                    const isPast = job.stage > stage.id;
                    const isCurrent = job.stage === stage.id;
                    const isFuture = job.stage < stage.id;
                    
                    let iconBg = 'bg-gray-100 border-gray-300';
                    if (isPast) iconBg = 'bg-emerald-500 border-emerald-600 text-white shadow-2xs';
                    if (isCurrent) iconBg = 'bg-gradient-to-tr from-[#0A385C] to-[#00A8E8] border-2 border-white text-white ring-4 ring-[#00A8E8]/30 shadow-md scale-110 font-extrabold';

                    const stageDocs = (job.documents || []).filter(d => d.stage === stage.id);
                    
                    return (
                        <div key={stage.id} className={`relative ${isFuture ? 'opacity-40' : ''}`}>
                            {/* Connector Node */}
                            <div className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-transform ${iconBg}`}>
                                {isPast ? '✓' : (stage.displayId || stage.id)}
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
                                        {renderStageAction()}
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
                                                                    📎 Ada File
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Kosong</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                status === 'ok' ? 'bg-green-600 text-white' :
                                                                status === 'tidak' ? 'bg-red-600 text-white' :
                                                                status === 'na' ? 'bg-gray-500 text-white' :
                                                                'bg-gray-200 text-gray-600'
                                                            }`}>
                                                                {status === 'ok' ? '✓ OK' : status === 'tidak' ? '✕ Tidak' : status === 'na' ? 'N/A' : 'Belum Set'}
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
                                            <span>📄</span> {doc.name}
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
                                🔄 DIKEMBALIKAN dari Stage {log.returned_from_stage}
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
                                ✏️ Edit
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
                        { id: 'timeline',  label: 'Status' },
                        { id: 'docs',      label: 'Dokumen' },
                        { id: 'history',   label: 'Riwayat' },
                        { id: 'info',      label: 'Info & Edit' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`py-3 px-4 sm:py-3.5 sm:px-6 font-bold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Area — Scrollable body */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-white flex-1">
                    {activeTab === 'timeline' && renderTimeline()}
                    {activeTab === 'docs'     && renderDocuments()}
                    {activeTab === 'history'  && renderHistory()}
                    {activeTab === 'info'     && renderEditInfo()}
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
            </div>
        </div>
    );
}

// ══ END PART C ══
