import React, { useState, useRef, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import {
    STAGES,
    MAX_FILE_SIZE,
    STAGE2_VERIFY_CHECKLIST,
    STAGE1_REQUIRED_DOCS,
    DOC_TYPES_BY_STAGE,
    daysElapsed,
    getSlaTag,
    parseJsonObject,
    parseJsonArray,
} from '@/Constants';
import SplitJobModal from './SplitJobModal';
import useJobPermissions from './JobDetail/hooks/useJobPermissions';
import ReviseInvoiceModal from './JobDetail/Modals/ReviseInvoiceModal';
import TimelineTab from './JobDetail/Tabs/TimelineTab';
import DocumentsTab from './JobDetail/Tabs/DocumentsTab';
import HistoryTab from './JobDetail/Tabs/HistoryTab';
import EditInfoTab from './JobDetail/Tabs/EditInfoTab';
import { showConfirm, showSuccess, showError, MySwal } from '@/swal';

export default function JobDetailSheet({ job, onClose, auth, inspectores = [], reportWriters = [] }) {
    if (!job) return null;

    const user = auth?.user;
    const permissions = useJobPermissions(job, auth);
    const { canManage, canSeeNilai, isMGR, isKadiv, stage1DocOk, stage2DocOk, stage2Bypass, stage2CanMove, canReviseInvoice } = permissions;

    const [activeTab, setActiveTab] = useState('timeline');
    const [isEditing, setIsEditing] = useState(false);
    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const [showReviseInvoiceModal, setShowReviseInvoiceModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Upload state
    const fileInputRef = useRef(null);
    const [uploadStage, setUploadStage] = useState(null);
    const [uploadType, setUploadType] = useState('');
    const [photoNotes, setPhotoNotes] = useState({});

    // Main move form
    const { data, setData, post, processing } = useForm({
        notes: '',
        next_stage: null,
    });

    // Edit info form
    const editForm = useForm({
        klien: job.klien || '',
        pesawat: job.pesawat || '',
        lokasi: job.lokasi || '',
        units: job.units || 1,
        nilai: job.nilai || '',
        no_po: job.no_po || '',
        tgl_po: job.tgl_po || '',
        pic_klien: job.pic_klien || '',
        pic_klien_phone: job.pic_klien_phone || '',
        termin_pembayaran: job.termin_pembayaran || 'FULL',
    });

    // Stage 1b (18): Invoicing DP
    const [s18, setS18] = useState({
        dp_invoice_no: job.dp_invoice_no || '',
        dp_amount: job.dp_amount || (job.nilai ? Math.round(job.nilai * (job.dp_percentage || 30) / 100) : 0),
        tgl_dp_invoice: job.tgl_dp_invoice || new Date().toISOString().split('T')[0],
        dp_notes: job.dp_notes || '',
    });

    // Stage 1c (19): Penagihan DP
    const [s19, setS19] = useState({
        metode_penagihan_dp: job.metode_penagihan_dp || 'Email / WA',
        tgl_penagihan_dp: job.tgl_penagihan_dp || new Date().toISOString().split('T')[0],
        catatan_penagihan_dp: job.catatan_penagihan_dp || '',
    });

    // Stage 1d (20): Konfirmasi Bayar DP
    const [s20, setS20] = useState({
        amount_received_dp: job.amount_received_dp || job.dp_amount || (job.nilai ? Math.round(job.nilai * (job.dp_percentage || 30) / 100) : 0),
        bank_ref_dp: job.bank_ref_dp || '',
        dp_verification_status: job.dp_verification_status || 'Lunas DP',
        dp_notes: job.dp_notes || '',
    });

    // Stage 2: Verification Checklist state
    const [s2Verify, setS2Verify] = useState(() => {
        const saved = parseJsonObject(job.s2_verify_data);
        const initial = {};
        STAGE2_VERIFY_CHECKLIST.forEach(item => {
            initial[item.type] = saved[item.type] || '';
        });
        return initial;
    });

    // Stage 3: Multi-day schedule
    const [scheduleDays, setScheduleDays] = useState(() => {
        const parsed = parseJsonArray(job.schedule_days);
        if (parsed.length > 0) return parsed;
        return [{
            date: job.tgl_pelaksanaan || new Date().toISOString().split('T')[0],
            inspector_ids: (job.inspectors || []).map(i => String(i.id)),
            notes: '',
        }];
    });

    // Stage 4: Execution
    const [s4, setS4] = useState({
        s4_checklist: parseJsonObject(job.s4_checklist),
        report_writer_id: job.report_writer_id || '',
        tgl_pelaksanaan: job.tgl_pelaksanaan || '',
        jam_mulai: job.jam_mulai || '',
        jam_selesai: job.jam_selesai || '',
    });

    // Stage 4b (13): Actual Units
    const [actualUnits, setActualUnits] = useState(job.actual_units ?? job.units ?? 1);

    // Stage 4c (16): Reschedule
    const [s4c, setS4c] = useState({
        reschedule_reason: job.reschedule_reason || '',
        tgl_reschedule: job.tgl_reschedule || '',
    });

    // Stage 4d (17): RU Ulang
    const [s4d, setS4d] = useState({
        ru_ulang_status: job.ru_ulang_status || 'lolos',
        ru_ulang_notes: job.ru_ulang_notes || '',
    });

    // Stage 5: LHPP & 3-Date Tracking
    const [s5Dates, setS5Dates] = useState({
        tgl_teknis_diserahkan: job.tgl_teknis_diserahkan || '',
        tgl_laporan_mulai: job.tgl_laporan_mulai || '',
        tgl_laporan_selesai: job.tgl_laporan_selesai || '',
    });
    const [s5, setS5] = useState({
        s5_review_decision: job.s5_review_decision || 'approved',
        s5_review_notes: job.s5_review_notes || '',
        stage5_reject_to: job.stage5_reject_to || 4,
    });

    // Stage 7: Penyerahan Dinas
    const [s7, setS7] = useState({
        tgl_submit_disnaker: job.tgl_submit_disnaker || '',
    });

    // Stage 8: Disnaker Progress
    const [s8, setS8] = useState({
        s8_progress_status: job.s8_progress_status || 'terima_draft',
        tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker || '',
        tgl_doc_received_disnaker: job.tgl_doc_received_disnaker || '',
        s8_notes: job.s8_notes || '',
    });

    // Stage 9: Pengurusan Suket
    const [s9Suket, setS9Suket] = useState({
        tgl_input_suket: job.tgl_input_suket || '',
        tgl_suket_selesai: job.tgl_suket_selesai || '',
    });
    const [s9, setS9] = useState({
        s9_progress_status: job.s9_progress_status || 'antrian',
        s9_no_suket: job.s9_no_suket || '',
        s9_suket_berlaku_sampai: job.s9_suket_berlaku_sampai || '',
        s9_notes: job.s9_notes || '',
    });

    // Stage 10: Pembuatan Invoice
    const [s10, setS10] = useState({
        total_invoice_amount: job.total_invoice_amount || job.nilai || '',
        tgl_invoice_issued: job.tgl_invoice_issued || '',
        invoice_no: job.invoice_no || '',
        tgl_submit_mkt: job.tgl_submit_mkt || '',
    });

    // Stage 11: Penagihan Pembayaran
    const [s11Collection, setS11Collection] = useState({
        metode_penagihan: job.metode_penagihan || 'Email / WA',
        tgl_penagihan: job.tgl_penagihan || new Date().toISOString().split('T')[0],
        catatan_penagihan: job.catatan_penagihan || '',
    });

    // Stage 11c (15): Verifikasi Pembayaran
    const [s11c, setS11c] = useState({
        amount_received: job.amount_received || job.total_invoice_amount || job.nilai || '',
        bank_ref: job.bank_ref || '',
        verification_status: job.payment_verification_status || 'Lunas',
        verification_notes: job.payment_verification_notes || '',
    });

    // Stage 11b (14): Pengiriman SUKET
    const [s11bDelivery, setS11bDelivery] = useState({
        no_resi: job.no_resi || '',
        ekspedisi: job.ekspedisi || 'Kurir Internal',
        tgl_kirim_suket: job.tgl_kirim_suket || new Date().toISOString().split('T')[0],
        batch_no: job.batch_no || 'Batch 1',
        tanda_terima_klien: job.tanda_terima_klien || '',
        delivery_notes: job.delivery_notes || '',
    });

    const [returnNotes, setReturnNotes] = useState('');

    // Handlers
    const handleMoveStage = (e, overrideData = {}) => {
        if (e && e.preventDefault) e.preventDefault();
        post(`/jobs/${job.id}/move`, {
            data: { ...data, ...overrideData },
            onSuccess: () => {
                showSuccess('Berhasil', 'Tahapan berhasil dimajukan.');
                onClose();
            },
        });
    };

    const handleRejectStage = async () => {
        const { value: text, isConfirmed } = await MySwal.fire({
            title: 'Kembalikan Tahapan',
            text: 'Masukkan alasan pengembalian tahapan:',
            input: 'textarea',
            inputPlaceholder: 'Tuliskan catatan / alasan di sini...',
            inputValidator: val => (!val || !val.trim()) && 'Catatan pengembalian wajib diisi!',
            showCancelButton: true,
            confirmButtonText: 'Kembalikan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
        });
        if (!isConfirmed || !text) return;
        const payload = { notes: text.trim() };
        if (job.stage === 7) {
            payload.target_stage = 5;
        }
        post(`/jobs/${job.id}/reject`, {
            data: payload,
            onSuccess: () => {
                showSuccess('Dikembalikan', 'Tahapan berhasil dikembalikan.');
                onClose();
            },
        });
    };

    const handleAskApproval = async () => {
        const res = await showConfirm('Minta Persetujuan', 'Minta persetujuan Kadiv/MGR untuk bypass dokumen?');
        if (!res.isConfirmed) return;
        router.post(`/jobs/${job.id}/request-peer-review`, {}, { onSuccess: () => onClose() });
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
            inputValidator: val => (!val || !val.trim()) && 'Alasan / justifikasi bypass wajib diisi!',
            showCancelButton: true,
            confirmButtonText: 'Setujui Bypass',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#10b981',
        });
        if (!isConfirmed || !text) return;
        router.post(`/api/jobs/${job.id}/bypass-stage2`, {
            justification: text.trim(),
            approver: user?.name || 'Manager',
        }, {
            onSuccess: () => {
                showSuccess('Bypass Disetujui', 'Bypass dokumen berhasil disetujui & dicatat.');
                onClose();
            },
        });
    };

    const handleReopenJob = async () => {
        const { value: text, isConfirmed } = await MySwal.fire({
            title: 'Buka Kembali Job (Reopen)',
            text: 'Masukkan alasan pembukaan kembali pekerjaan yang sudah selesai (Closed). Tindakan ini akan dicatat ke audit log.',
            input: 'textarea',
            inputPlaceholder: 'Tuliskan alasan pembukaan kembali di sini...',
            inputValidator: val => (!val || !val.trim()) && 'Alasan pembukaan kembali wajib diisi!',
            showCancelButton: true,
            confirmButtonText: 'Buka Kembali Job',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f59e0b',
        });
        if (!isConfirmed || !text) return;
        router.post(`/api/jobs/${job.id}/reopen`, {
            reason: text.trim(),
            reopened_by: user?.name || 'Authorized User',
        }, {
            onSuccess: () => {
                showSuccess('Job Dibuka Kembali', 'Job berhasil dibuka kembali ke Stage 5.');
                onClose();
            },
        });
    };

    const handleReturnToStage1 = (e) => {
        e?.preventDefault();
        if (!returnNotes.trim()) return showError('Validasi', 'Isi alasan pengembalian!');
        router.post(`/jobs/${job.id}/return-to-stage1`, { notes: returnNotes }, { onSuccess: () => onClose() });
    };

    const handleSaveS18 = () => router.post(`/jobs/${job.id}/stage18-data`, s18, { onSuccess: () => showSuccess('Berhasil', 'Data Invoicing DP tersimpan.') });
    const handleSaveS19 = () => router.post(`/jobs/${job.id}/stage19-data`, s19, { onSuccess: () => showSuccess('Berhasil', 'Data Penagihan DP tersimpan.') });
    const handleSaveS20 = (targetStatus) => {
        const finalStatus = targetStatus || s20.dp_verification_status;
        router.post(`/jobs/${job.id}/stage20-data`, { ...s20, dp_verification_status: finalStatus }, {
            onSuccess: () => {
                showSuccess('Berhasil', `Verifikasi DP tersimpan: ${finalStatus}`);
                onClose();
            },
        });
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
            },
        });
    };

    const handleSetS2Status = (type, val) => {
        const updated = { ...s2Verify, [type]: val };
        setS2Verify(updated);
        router.post(`/jobs/${job.id}/stage2-verify`, { verify_data: updated }, {
            preserveScroll: true,
            onError: () => showError('Gagal', 'Tidak dapat menyimpan status verifikasi.'),
        });
    };

    const handleSaveS2Verification = () => {
        router.post(`/jobs/${job.id}/stage2-verify`, { verify_data: s2Verify }, {
            preserveScroll: true,
            onSuccess: () => showSuccess('Berhasil', 'Checklist verifikasi tersimpan.'),
        });
    };

    const handleUpdateJob = (e) => {
        e.preventDefault();
        editForm.put(`/jobs/${job.id}`, {
            onSuccess: () => {
                setIsEditing(false);
                showSuccess('Berhasil', 'Data pekerjaan berhasil diperbarui.');
            },
        });
    };

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
                },
            });
        }
    };

    // Upload triggers
    const triggerUpload = (stageId, type) => {
        setUploadStage(stageId);
        setUploadType(type);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !uploadStage || !uploadType) return;
        uploadFileDirectly(uploadStage, uploadType, file);
    };

    const uploadFileDirectly = (stageId, type, file, extraNotes = null) => {
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB.');
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
            onSuccess: () => {
                setUploadStage(null);
                setUploadType('');
                setIsUploading(false);
            },
            onError: () => setIsUploading(false),
        });
    };

    const uploadPhoto = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > MAX_FILE_SIZE) {
                showError('Ukuran File Terlalu Besar', 'Maksimal ukuran file yang diperbolehkan adalah 25 MB.');
                return;
            }
            const fd = new FormData();
            fd.append('file', file);
            fd.append('type', type);
            fd.append('stage', 4);
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

    // SLA calculations
    const currentStageInfo = STAGES.find(s => s.id === job.stage);
    const daysInStage = daysElapsed(job.stage_started_at);
    const slaTag = getSlaTag(daysInStage, currentStageInfo?.sla);

    // Bundle state and actions for child components
    const state = {
        data,
        processing,
        editForm,
        user,
        inspectores,
        reportWriters,
        s18,
        setS18,
        s19,
        setS19,
        s20,
        setS20,
        s2Verify,
        setS2Verify,
        scheduleDays,
        setScheduleDays,
        s4,
        setS4,
        actualUnits,
        setActualUnits,
        s4c,
        setS4c,
        s4d,
        setS4d,
        s5Dates,
        setS5Dates,
        s5,
        setS5,
        s7,
        setS7,
        s8,
        setS8,
        s9Suket,
        setS9Suket,
        s9,
        setS9,
        s10,
        setS10,
        s11Collection,
        setS11Collection,
        s11c,
        setS11c,
        s11bDelivery,
        setS11bDelivery,
        returnNotes,
        setReturnNotes,
        photoNotes,
        setPhotoNotes,
        isSplitModalOpen,
        showReviseInvoiceModal,
        isUploading,
    };

    const actions = {
        setData,
        post,
        editForm,
        handleUpdateJob,
        handleDeleteJob,
        handleMoveStage,
        handleRejectStage,
        handleAskApproval,
        handleApproveAsManager,
        handleBypassStage2WithJustification,
        handleReopenJob,
        handleReturnToStage1,
        handleJobSplit: () => setIsSplitModalOpen(true),
        setIsSplitModalOpen,
        setShowReviseInvoiceModal,
        setIsUploading,
        handleSaveS18,
        handleSaveS19,
        handleSaveS20,
        handleSaveS4,
        handleSaveS4c,
        handleSaveS4d,
        handleSaveS5Dates,
        handleSaveS9Suket,
        handleSaveS5,
        handleSaveS7,
        handleSaveS8,
        handleSaveS9,
        handleSaveS10,
        handleSaveS11,
        handleSaveS11c,
        handleSetS2Status,
        handleSaveS2Verification,
        triggerUpload,
        uploadFileDirectly,
        uploadPhoto,
        deleteDoc,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col h-[92vh] sm:h-[88vh] overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <div className="min-w-0 flex-1 mr-3">
                        <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight truncate">{job.klien}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono bg-white px-2 py-0.5 rounded border shadow-xs text-xs font-semibold text-gray-600">{job.kode}</span>
                            <span className="font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Stage {currentStageInfo?.displayId || job.stage}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {((auth?.user?.role === 'finance' || auth?.user?.role === 'superadmin') && (job.stage >= 10 || [15, 14].includes(job.stage))) && (
                            <button
                                onClick={() => canReviseInvoice && setShowReviseInvoiceModal(true)}
                                disabled={!canReviseInvoice}
                                className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors ${
                                    canReviseInvoice
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                }`}
                                title={canReviseInvoice ? "Revisi Data Invoice (Finance Direct Edit)" : "Revisi Invoice terkunci karena sudah melewati bulan pembuatan/penerbitan (Tutup Buku Bulanan)"}
                            >
                                📝 Revisi Invoice {!canReviseInvoice && '🔒'}
                            </button>
                        )}
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
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-2 sm:px-6 border-b bg-white flex-shrink-0 z-10 shadow-xs overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'timeline', label: 'Status' },
                        { id: 'docs', label: 'Dokumen' },
                        { id: 'history', label: 'Riwayat' },
                        { id: 'info', label: 'Info & Edit' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`py-3 px-4 sm:py-3.5 sm:px-6 font-bold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Body */}
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

                    {activeTab === 'timeline' && (
                        <TimelineTab
                            job={job}
                            auth={auth}
                            permissions={permissions}
                            currentStageInfo={currentStageInfo}
                            daysInStage={daysInStage}
                            slaTag={slaTag}
                            actions={actions}
                            state={state}
                        />
                    )}

                    {activeTab === 'docs' && (
                        <DocumentsTab
                            job={job}
                            permissions={permissions}
                            actions={actions}
                        />
                    )}

                    {activeTab === 'history' && (
                        <HistoryTab job={job} />
                    )}

                    {activeTab === 'info' && (
                        <EditInfoTab
                            job={job}
                            permissions={permissions}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            editForm={editForm}
                            handleUpdateJob={handleUpdateJob}
                        />
                    )}
                </div>

                {/* Hidden File Input for triggerUpload */}
                <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" />

                {/* Global Loader Overlay */}
                {(processing || isUploading) && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-xl">
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

                {/* Revise Invoice Modal */}
                {showReviseInvoiceModal && (
                    <ReviseInvoiceModal
                        job={job}
                        onClose={() => setShowReviseInvoiceModal(false)}
                    />
                )}
            </div>
        </div>
    );
}
