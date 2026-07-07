import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import SmartRecommendation from './SmartRecommendation';
import {
    DOC_TYPES_BY_STAGE, STAGES, STAGE4_PHOTO_TYPES, STAGE5_DECISIONS,
    PROGRESS_STATUSES, MKT_STAGES, FIN_STAGES, STAGE1_REQUIRED_DOCS, STAGE2_REQUIRED_DOCS
} from '@/Constants';

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseJsonArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
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
    return                        { label: 'ON TRACK', cls: 'bg-green-100 text-green-800' };
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function JobDetailSheet({ job, onClose, auth, canManage: propCanManage }) {
    // ── Forms ────────────────────────────────────────────────────────────────
    const { data, setData, post, processing, errors } = useForm({
        next_stage:      job.stage + 1,
        notes:           '',
        inspector_ids:   job.inspectors ? job.inspectors.map(i => i.id) : [],
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
    });
    const [s9,  setS9]  = useState({ s9_progress_status: job.s9_progress_status  ?? '' });
    const [s10, setS10] = useState({
        total_invoice_amount: job.total_invoice_amount ?? '',
        tgl_invoice_issued:   job.tgl_invoice_issued   ?? '',
        s10_progress_status:  job.s10_progress_status  ?? '',
    });

    // Master data & recommendations (Stage 3)
    const [masterData,       setMasterData]       = useState({ alat_uji: [], sertifikat_pjk3: [] });
    const [recommendations,  setRecommendations]  = useState({ recommended: [], eliminated: [] });

    useEffect(() => {
        if (job.stage === 3) {
            fetch('/api/master-data').then(r => r.json()).then(setMasterData).catch(console.error);
            fetch(`/api/jobs/${job.id}/recommendations`).then(r => r.json()).then(setRecommendations).catch(console.error);
        }
    }, [job.id, job.stage]);

    // ── Permissions ──────────────────────────────────────────────────────────
    const { permissions, user } = auth || {};
    const isInspector = job.inspectors?.some(i => i.id === user?.id);
    const isMGR = user?.role === 'manager';

    const canSeeNilai = user?.role === 'superadmin'
        || user?.role === 'finance'
        || (user?.role === 'marketing' && job.owner_marketing === user?.name);

    const canManage = (() => {
        if (propCanManage !== undefined) return propCanManage;
        if (!permissions) return false;
        if (permissions === 'superadmin') return true;
        if (isMGR && !MKT_STAGES.includes(job.stage) && !FIN_STAGES.includes(job.stage)) return true;
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
        if (user?.role === 'marketing' && job.owner_marketing === user?.name && [1,11].includes(sid)) return true;
        if (isInspector && [4,5,6].includes(sid) && sid === job.stage) return true;
        const p = permissions?.[sid];
        return p && p.is_owner;
    };

    // Stage 1 gate: at least one required doc uploaded
    const stage1DocOk = STAGE1_REQUIRED_DOCS.some(t =>
        (job.documents || []).some(d => d.stage === 1 && d.type === t));

    // Stage 2 gate: all required docs OR Kadiv approved
    const stage2DocOk = STAGE2_REQUIRED_DOCS.every(t =>
        (job.documents || []).some(d => d.stage === 2 && d.type === t));
    const stage2Bypass = job.peer_review_status === 'approved';
    const stage2CanMove = stage2DocOk || stage2Bypass;

    // Stage 4: unit mismatch
    const s4UnitMismatch = s4.actual_units != null && parseInt(s4.actual_units) !== parseInt(job.units);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleMoveStage = (e) => {
        e.preventDefault();
        if (job.stage === 1 && !stage1DocOk) return alert('Upload minimal satu dokumen PO/SPK, Surat Permohonan, atau Surat Kuasa!');
        if (job.stage === 2 && !stage2CanMove) return alert('Dokumen belum lengkap. Lengkapi dokumen atau minta persetujuan Kadiv/MGR.');
        if (job.stage === 3) {
            if (!data.tgl_pelaksanaan) return alert('Tanggal Pelaksanaan wajib diisi!');
            if (!data.inspector_ids?.length) return alert('Pilih minimal satu inspektur!');
        }
        if (job.stage === 4 && s4UnitMismatch) return alert('Selesaikan ketidakcocokan jumlah alat terlebih dahulu!');
        post(`/jobs/${job.id}/move`, { onSuccess: () => onClose() });
    };

    const handleRejectStage = () => {
        if (!data.notes?.trim()) return alert('Isi catatan penolakan terlebih dahulu!');
        if (!confirm(`Kembalikan ke Stage ${job.stage - 1}?`)) return;
        post(`/jobs/${job.id}/reject`, { onSuccess: () => onClose() });
    };

    const handleAskApproval = () => {
        if (!confirm('Kirim permintaan persetujuan ke Kadiv/MGR?')) return;
        router.post(`/jobs/${job.id}/ask-approval`, {}, { onSuccess: () => onClose() });
    };

    const handleApproveAsManager = () => {
        if (!confirm('Setujui permintaan ini? Admin dapat melanjutkan tanpa dokumen lengkap.')) return;
        router.post(`/jobs/${job.id}/approve`, {}, { onSuccess: () => onClose() });
    };

    const handleReturnToStage1 = (e) => {
        e.preventDefault();
        if (!returnNotes.trim()) return alert('Isi alasan pengembalian!');
        router.post(`/jobs/${job.id}/return-to-stage1`, { notes: returnNotes }, { onSuccess: () => onClose() });
    };

    const handleSaveS4  = () => router.post(`/jobs/${job.id}/stage4-data`,   s4,  { onSuccess: () => alert('Tersimpan.') });
    const handleSaveS5  = () => {
        if (!s5.s5_review_decision) return alert('Pilih keputusan review!');
        router.post(`/jobs/${job.id}/stage5-review`, s5, { onSuccess: () => alert('Keputusan disimpan.') });
    };
    const handleSaveS7  = () => router.post(`/jobs/${job.id}/stage7-data`,  s7,  { onSuccess: () => alert('Tersimpan.') });
    const handleSaveS8  = () => router.post(`/jobs/${job.id}/stage8-data`,  s8,  { onSuccess: () => alert('Tersimpan.') });
    const handleSaveS9  = () => router.post(`/jobs/${job.id}/stage9-data`,  s9,  { onSuccess: () => alert('Tersimpan.') });
    const handleSaveS10 = () => router.post(`/jobs/${job.id}/stage10-data`, s10, { onSuccess: () => alert('Tersimpan.') });

    const handleUpdateJob = (e) => {
        e.preventDefault();
        editForm.put(`/jobs/${job.id}`, { onSuccess: () => setIsEditing(false) });
    };

    // Generic document upload (for most stages)
    const triggerUpload = (stage, type) => {
        setUploadStage(stage); setUploadType(type);
        setTimeout(() => fileInputRef.current?.click(), 50);
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !uploadStage || !uploadType) return;
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

    // Photo upload (Stage 4, with per-photo notes)
    const uploadPhoto = (type) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const fd = new FormData();
            fd.append('file', file); fd.append('type', type); fd.append('stage', 4);
            const note = photoNotes[type] || '';
            if (note) fd.append('photo_notes', note);
            router.post(`/jobs/${job.id}/documents`, fd, { forceFormData: true });
        };
        input.click();
    };

    const deleteDoc = (docId) => {
        if (!confirm('Hapus dokumen ini?')) return;
        router.delete(`/jobs/${job.id}/documents/${docId}`);
    };

    // Get docs for a stage+type
    const getDocs = (stage, type = null) => {
        const docs = (job.documents || []).filter(d => d.stage === stage);
        return type ? docs.filter(d => d.type === type) : docs;
    };

    // Render a document download chip
    const DocChip = ({ doc }) => (
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs group">
            <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:underline font-medium truncate max-w-[160px]" title={doc.name}>
                📎 {doc.name}
            </a>
            {canManageStageDocs(doc.stage) && (
                <button onClick={() => deleteDoc(doc.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1">✕</button>
            )}
        </div>
    );

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

        // Common move/reject row
        const MoveRow = ({ disabled = false, disabledMsg = '' }) => (
            <div className="mt-4 flex flex-col gap-2">
                {disabledMsg && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        ⚠️ {disabledMsg}
                    </div>
                )}
                <div className="flex gap-2">
                    {[2,5,9].includes(s) && (
                        <button type="button" onClick={handleRejectStage} disabled={processing}
                            className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                            Tolak / Kembalikan
                        </button>
                    )}
                    <button type="submit" disabled={processing || disabled}
                        className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                        {processing ? '...' : `Lanjut ke Stage ${s + 1} →`}
                    </button>
                </div>
            </div>
        );

        const NoteField = () => (
            <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Catatan / Keterangan</label>
                <textarea rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400" />
            </div>
        );

        // Upload slot for a doc type in current stage
        const UploadSlot = ({ type, stageId }) => {
            const existing = getDocs(stageId, type);
            return (
                <div className="border border-dashed border-gray-200 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 truncate">{type}</span>
                        <button type="button" onClick={() => triggerUpload(stageId, type)}
                            className="text-xs text-blue-600 hover:underline ml-2 flex-shrink-0">
                            + Upload
                        </button>
                    </div>
                    {existing.length > 0
                        ? <div className="flex flex-wrap gap-1">{existing.map(d => <DocChip key={d.id} doc={d} />)}</div>
                        : <p className="text-xs text-gray-400 italic">Belum ada dokumen</p>
                    }
                </div>
            );
        };

        return (
            <form onSubmit={handleMoveStage}>
                {/* ── STAGE 1 ─────────────────────────────────── */}
                {s === 1 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Upload minimal salah satu dokumen berikut untuk melanjutkan:</p>
                        {STAGE1_REQUIRED_DOCS.map(t => <UploadSlot key={t} type={t} stageId={1} />)}
                        <p className="text-xs text-gray-400 mt-1">Dokumen opsional tambahan:</p>
                        {(DOC_TYPES_BY_STAGE[1] || []).filter(t => !STAGE1_REQUIRED_DOCS.includes(t)).map(t =>
                            <UploadSlot key={t} type={t} stageId={1} />
                        )}
                        <NoteField />
                        <MoveRow disabled={!stage1DocOk} disabledMsg={!stage1DocOk ? 'Upload minimal 1 dokumen utama (PO/SPK, Surat Permohonan, atau Surat Kuasa)' : ''} />
                    </div>
                )}

                {/* ── STAGE 2 ─────────────────────────────────── */}
                {s === 2 && (
                    <div className="space-y-3">
                        {!stage2DocOk && !stage2Bypass && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                                ⚠️ Dokumen belum lengkap. Upload semua dokumen wajib, atau minta persetujuan Kadiv/MGR.
                            </div>
                        )}
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
                        {(DOC_TYPES_BY_STAGE[2] || []).map(t => <UploadSlot key={t} type={t} stageId={2} />)}
                        <NoteField />
                        <div className="flex gap-2 mt-3">
                            <button type="button" onClick={handleRejectStage} disabled={processing}
                                className="px-3 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                                Tolak
                            </button>
                            {!stage2DocOk && !stage2Bypass && job.peer_review_status !== 'requested' && !isMGR && (
                                <button type="button" onClick={handleAskApproval}
                                    className="px-3 py-2 rounded text-sm bg-orange-500 text-white font-semibold hover:bg-orange-600">
                                    Minta Persetujuan MGR
                                </button>
                            )}
                            {job.peer_review_status === 'requested' && !isMGR && (
                                <div className="px-3 py-2 rounded text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                    🔔 Menunggu persetujuan Kadiv/MGR…
                                </div>
                            )}
                            <button type="submit" disabled={processing || !stage2CanMove}
                                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                                {processing ? '...' : 'Lanjut ke Stage 3 →'}
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
                        <NoteField />
                        <MoveRow disabled={!data.tgl_pelaksanaan || !data.inspector_ids?.length}
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
                                                ? <div className="flex flex-wrap gap-1 mb-2">{existing.map(d => <DocChip key={d.id} doc={d} />)}</div>
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
                        <NoteField />
                        {/* Move or Return to S1 */}
                        {s4UnitMismatch ? (
                            <form onSubmit={handleReturnToStage1} className="border border-red-200 rounded-lg p-3 bg-red-50">
                                <p className="text-sm font-semibold text-red-800 mb-2">
                                    ⚠️ Jumlah tidak sesuai. Kembalikan ke Stage 1 agar Marketing merevisi.
                                </p>
                                <textarea rows={2} value={returnNotes} onChange={e => setReturnNotes(e.target.value)}
                                    className="w-full text-sm border rounded px-2 py-1.5 mb-2"
                                    placeholder="Alasan pengembalian ke Stage 1 PO…" required />
                                <button type="submit" className="w-full py-2 rounded text-sm font-bold bg-red-600 text-white hover:bg-red-700">
                                    Kembalikan ke Stage 1 PO
                                </button>
                            </form>
                        ) : (
                            <MoveRow />
                        )}
                    </div>
                )}

                {/* ── STAGE 5 (Review Laporan Teknis — MGR) ───── */}
                {s === 5 && (
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
                        <NoteField />
                        <div className="flex gap-2">
                            <button type="button" onClick={handleRejectStage}
                                className="px-4 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                                Tolak / Kembalikan
                            </button>
                            <button type="submit" disabled={processing || !s5.s5_review_decision || s5.s5_review_decision === 'rejected'}
                                className="flex-1 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                                {processing ? '...' : 'Lanjut ke Stage 6 LHPP →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STAGE 6 (Penyusunan LHPP — INS) ────────── */}
                {s === 6 && (
                    <div className="space-y-3">
                        {(DOC_TYPES_BY_STAGE[6] || []).map(t => <UploadSlot key={t} type={t} stageId={6} />)}
                        <NoteField />
                        <MoveRow />
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
                        <UploadSlot type="Bukti Penyerahan ke Disnaker" stageId={7} />
                        <NoteField />
                        <MoveRow disabled={!s7.tgl_submit_disnaker} disabledMsg={!s7.tgl_submit_disnaker ? 'Isi tanggal penyerahan terlebih dahulu' : ''} />
                    </div>
                )}

                {/* ── STAGE 8 (Proses Disnaker — Admin) ──────── */}
                {s === 8 && (
                    <div className="space-y-3">
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
                        {(DOC_TYPES_BY_STAGE[8] || []).map(t => <UploadSlot key={t} type={t} stageId={8} />)}
                        <NoteField />
                        <MoveRow />
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
                        {(DOC_TYPES_BY_STAGE[9] || []).map(t => <UploadSlot key={t} type={t} stageId={9} />)}
                        <NoteField />
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
                        </div>
                        <button type="button" onClick={handleSaveS10}
                            className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800">
                            Simpan Data Penagihan
                        </button>
                        {(DOC_TYPES_BY_STAGE[10] || []).map(t => <UploadSlot key={t} type={t} stageId={10} />)}
                        <NoteField />
                        <MoveRow />
                    </div>
                )}

                {/* ── STAGE 11 (Pengiriman SUKET — MKT) ──────── */}
                {s === 11 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Upload bukti pengiriman SUKET ke klien, kemudian tandai selesai.</p>
                        {(DOC_TYPES_BY_STAGE[11] || []).map(t => <UploadSlot key={t} type={t} stageId={11} />)}
                        <NoteField />
                        <MoveRow />
                    </div>
                )}
            </form>
        );
    };

// ══ END PART B ══

// ══ BEGIN PART C ══

    // ── Timeline Tab ─────────────────────────────────────────────────────────
    const renderTimeline = () => (
        <div className="space-y-6 py-2">
            <h3 className="font-bold text-gray-800 border-b pb-2">Status Pekerjaan: Stage {job.stage} ({currentStageInfo?.name})</h3>
            
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
                    if (isPast) iconBg = 'bg-emerald-500 border-emerald-500 text-white';
                    if (isCurrent) iconBg = 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-100';

                    const stageDocs = (job.documents || []).filter(d => d.stage === stage.id);
                    
                    return (
                        <div key={stage.id} className={`relative ${isFuture ? 'opacity-50' : ''}`}>
                            {/* Connector Node */}
                            <div className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${iconBg}`}>
                                {isPast ? '✓' : stage.id}
                            </div>
                            
                            <div className="bg-white border rounded-lg shadow-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`font-bold ${isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>
                                        Stage {stage.id}: {stage.name}
                                    </h4>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                        PIC: {stage.role.toUpperCase()}
                                    </span>
                                </div>
                                
                                {isCurrent && (
                                    <div className="mt-4 pt-4 border-t border-blue-100">
                                        {renderStageAction()}
                                    </div>
                                )}

                                {!isCurrent && stageDocs.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-gray-500 font-medium">Dokumen Tersimpan:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {stageDocs.map(d => <DocChip key={d.id} doc={d} />)}
                                        </div>
                                    </div>
                                )}
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
                            Stage {stage.id}: {stage.name}
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
                            Stage {log.stage}
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
                            <label className="block text-xs font-bold text-gray-700">Lokasi</label>
                            <textarea value={editForm.data.lokasi} onChange={e => editForm.setData('lokasi', e.target.value)} rows="2" className="w-full text-sm border rounded px-2 py-1.5" />
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
                                <p className="text-xs text-yellow-800 font-bold">Nilai Kontrak</p>
                                <p className="font-bold text-lg text-yellow-900">{fmtCurrency(job.nilai)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // ── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-full">
                
                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50 rounded-t-xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{job.klien}</h2>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-600">
                            <span className="font-mono bg-white px-2.5 py-1 rounded border shadow-sm text-sm font-semibold">{job.kode}</span>
                            <span className="font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Stage {job.stage}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-200 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b bg-white sticky top-[88px] z-10 shadow-sm overflow-x-auto">
                    {[
                        { id: 'timeline',  label: 'Timeline & Status' },
                        { id: 'docs',      label: 'Dokumen' },
                        { id: 'history',   label: 'Riwayat' },
                        { id: 'info',      label: 'Info & Edit' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`py-4 px-6 font-bold text-base whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto bg-white flex-1">
                    {activeTab === 'timeline' && renderTimeline()}
                    {activeTab === 'docs'     && renderDocuments()}
                    {activeTab === 'history'  && renderHistory()}
                    {activeTab === 'info'     && renderEditInfo()}
                </div>

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
