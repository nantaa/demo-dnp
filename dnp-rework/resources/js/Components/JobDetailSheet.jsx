import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, router } from '@inertiajs/react';
import { showError, showSuccess, showConfirm, showWarning } from '@/swal';
import Swal from 'sweetalert2';
import { Trash2 } from 'lucide-react';
import {
    DOC_TYPES_BY_STAGE, STAGES, STAGE4_PHOTO_TYPES, STAGE5_DECISIONS,
    STAGE9_SUKET_STATUSES, PROGRESS_STATUSES, STAGE8_DISNAKER_STATUSES, MKT_STAGES, FIN_STAGES, STAGE1_REQUIRED_DOCS, STAGE2_REQUIRED_DOCS,
    STAGE2_VERIFY_CHECKLIST, INDONESIA_PROVINCES
} from '@/Constants';

// ── Modular JobDetail Imports ────────────────────────────────────────────────
import {
    fmt, formatDate, daysElapsed, getSlaTag, parseJsonObject, parseJsonArray,
    parseLhppLinks, hasValidLhppLink, getDocDownloadUrl as helperGetDocDownloadUrl, isPoLockedForIns,
    sanitizeAndDeduplicateFilename, initScheduleDays, fmtCurrency
} from './JobDetail/helpers';
import RevisePoModal from './JobDetail/Modals/RevisePoModal';
import ReviseInvoiceModal from './JobDetail/Modals/ReviseInvoiceModal';
import TimelineTab from './JobDetail/Tabs/TimelineTab';
import DocumentsTab from './JobDetail/Tabs/DocumentsTab';
import EditInfoTab from './JobDetail/Tabs/EditInfoTab';
import HistoryTab from './JobDetail/Tabs/HistoryTab';
import StageActionDispatcher from './JobDetail/StageActionDispatcher';

export default function JobDetailSheet({ job, auth, onClose, onUpdated, canManage: propCanManage }) {
    if (!job) return null;

    const getDocDownloadUrl = helperGetDocDownloadUrl;
    const getDocumentUrl = (doc) => getDocDownloadUrl(doc, job);

    const [activeTab, setActiveTab] = useState('timeline');
    const [isUploading, setIsUploading] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Modals
    const [showRevisePoModal, setShowRevisePoModal] = useState(false);
    const [showReviseInvoiceModal, setShowReviseInvoiceModal] = useState(false);

    const fileInputRef = useRef(null);
    const uploadContextRef = useRef({ stageId: null, type: null });

    // Primary workflow form state
    const getNextStageId = (currentStageId) => {
        currentStageId = Number(currentStageId);
        if (currentStageId === 4) return 5;
        if (currentStageId === 13) return 5;
        if (currentStageId === 10) return 11;
        if (currentStageId === 11) return 14;
        if (currentStageId === 14) return 15;
        if (currentStageId === 15) return 12;
        if (currentStageId === 12) return 16;
        const currIdx = STAGES.findIndex(s => s.id === currentStageId);
        if (currIdx !== -1 && currIdx < STAGES.length - 1) {
            let next = STAGES[currIdx + 1];
            if (next.id === 13) {
                next = STAGES[currIdx + 2];
            }
            return next ? next.id : currentStageId + 1;
        }
        return currentStageId + 1;
    };

    const { data, setData, post, processing } = useForm({
        next_stage: getNextStageId(job.stage),
        notes: '',
        jam_mulai: job.jam_mulai || '',
        disnaker_tujuan: job.disnaker_tujuan || '',
        report_writer_id: job.report_writer_id || '',
        alat_ids: parseJsonArray(job.alat_ids),
        cert_ids: parseJsonArray(job.cert_ids),
    });

    // Schedule days (Stage 3)
    const [scheduleDays, setScheduleDays] = useState(() => initScheduleDays(job));

    // Stage 4 Lapangan state
    const [s4, setS4] = useState({
        actual_units: job.actual_units ?? job.units ?? '',
        unit_count_notes: job.unit_count_notes || '',
    });
    const [photoNotes, setPhotoNotes] = useState({});

    // Stage 5 Review Kadiv state
    const [s5, setS5] = useState({
        s5_review_decision: job.s5_review_decision || '',
        s5_review_notes: job.s5_review_notes || '',
    });

    // Multi-unit LHPP links (Stage 5)
    const [lhppLinks, setLhppLinks] = useState(() => parseLhppLinks(job.link_lhpp, job.actual_units ?? job.units));
    const [isSavingLink, setIsSavingLink] = useState(false);

    // Stage 7 Disnaker submission state
    const [s7, setS7] = useState({
        tgl_submit_disnaker: job.tgl_submit_disnaker || '',
    });

    // Stage 8 Disnaker tracking state
    const [s8, setS8] = useState({
        s8_progress_status: job.s8_progress_status || '',
        s8_delay_reason: job.s8_delay_reason || '',
        tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker || '',
        tgl_doc_received_disnaker: job.tgl_doc_received_disnaker || '',
    });

    // Stage 9 Suket state
    const [s9, setS9] = useState({
        s9_progress_status: job.s9_progress_status || '',
        s9_no_suket: job.s9_no_suket || '',
        s9_suket_berlaku_sampai: job.s9_suket_berlaku_sampai || '',
    });

    // Stage 10 Invoice state
    const [s10, setS10] = useState({
        invoice_no: job.invoice_no || '',
        total_invoice_amount: job.total_invoice_amount ?? (job.nilai || ''),
        tgl_invoice_issued: job.tgl_invoice_issued || job.invoice_date || '',
        tgl_submit_mkt: job.tgl_submit_mkt || '',
        no_faktur_pajak: job.no_faktur_pajak || '',
        tgl_faktur_pajak: job.tgl_faktur_pajak || '',
        s10_progress_status: job.s10_progress_status || 'not_started',
    });

    // Stage 11 Billing follow-up state
    const [s11, setS11] = useState({
        tgl_submit_mkt: job.tgl_submit_mkt || '',
        notes: '',
    });

    // Stage 14 Payment verification state
    const [s14, setS14] = useState({
        s14_payment_status: job.s14_payment_status || (job.payment_status === 'paid' ? 'paid' : 'pending'),
        s14_payment_notes: job.s14_payment_notes || '',
    });

    // Stage 15 Suket delivery state
    const [s15, setS15] = useState({
        no_resi: job.no_resi || '',
        tgl_submit_mkt: job.tgl_submit_mkt || '',
    });

    // Edit info form
    const editForm = useForm({
        no_po: job.no_po || '',
        tgl_po: job.tgl_po || '',
        klien: job.klien || job.client_nama || '',
        pesawat: job.pesawat || '',
        lokasi: job.lokasi || '',
        units: job.units || 1,
        nilai: job.nilai || '',
        termin_pembayaran: job.termin_pembayaran ?? 'FULL',
        revision_notes: '',
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
    const [masterData, setMasterData] = useState({ alat_uji: [], sertifikat_pjk3: [] });
    const [recommendations, setRecommendations] = useState({ recommended: [], eliminated: [] });

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
                .catch(() => {});

            fetch(`/api/jobs/${job.id}/recommendations`)
                .then(r => {
                    if (!r.ok) throw new Error('Recommendations request failed');
                    return r.json();
                })
                .then(data => {
                    if (data) setRecommendations(data);
                })
                .catch(() => {});
        }
    }, [job.stage, job.id]);

    // Synchronize form states on job.id change
    useEffect(() => {
        setData({
            next_stage: job.stage + 1,
            notes: '',
            jam_mulai: job.jam_mulai || '',
            disnaker_tujuan: job.disnaker_tujuan || '',
            report_writer_id: job.report_writer_id || '',
            alat_ids: parseJsonArray(job.alat_ids),
            cert_ids: parseJsonArray(job.cert_ids),
        });
        setS4({
            actual_units: job.actual_units ?? job.units ?? '',
            unit_count_notes: job.unit_count_notes || '',
        });
        setS5({
            s5_review_decision: job.s5_review_decision || '',
            s5_review_notes: job.s5_review_notes || '',
        });
        setS7({ tgl_submit_disnaker: job.tgl_submit_disnaker || '' });
        setS8({
            s8_progress_status: job.s8_progress_status || '',
            s8_delay_reason: job.s8_delay_reason || '',
            tgl_doc_submitted_disnaker: job.tgl_doc_submitted_disnaker || '',
            tgl_doc_received_disnaker: job.tgl_doc_received_disnaker || '',
        });
        setS9({
            s9_progress_status: job.s9_progress_status || '',
            s9_no_suket: job.s9_no_suket || '',
            s9_suket_berlaku_sampai: job.s9_suket_berlaku_sampai || '',
        });
        setS10({
            invoice_no: job.invoice_no || '',
            total_invoice_amount: job.total_invoice_amount ?? (job.nilai || ''),
            tgl_invoice_issued: job.tgl_invoice_issued || job.invoice_date || '',
            tgl_submit_mkt: job.tgl_submit_mkt || '',
            no_faktur_pajak: job.no_faktur_pajak || '',
            tgl_faktur_pajak: job.tgl_faktur_pajak || '',
            s10_progress_status: job.s10_progress_status || 'not_started',
        });
        setS11({ tgl_submit_mkt: job.tgl_submit_mkt || '', notes: '' });
        setS14({
            s14_payment_status: job.s14_payment_status || (job.payment_status === 'paid' ? 'paid' : 'pending'),
            s14_payment_notes: job.s14_payment_notes || '',
        });
        setS15({
            no_resi: job.no_resi || '',
            tgl_submit_mkt: job.tgl_submit_mkt || '',
        });
        setLhppLinks(parseLhppLinks(job.link_lhpp, job.actual_units ?? job.units));
        editForm.setData({
            no_po: job.no_po || '',
            tgl_po: job.tgl_po || '',
            klien: job.klien || job.client_nama || '',
            pesawat: job.pesawat || '',
            lokasi: job.lokasi || '',
            units: job.units || 1,
            nilai: job.nilai || '',
            termin_pembayaran: job.termin_pembayaran ?? 'FULL',
            revision_notes: '',
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
    const isInspector = user?.role === 'inspektur' || user?.role === 'inspector';
    const isMGR = user?.role === 'manager';
    const isAssignedInspector = (job.inspectors || []).some(ins => 
        String(ins.id) === String(user?.id) || 
        String(ins.user_id) === String(user?.id) || 
        String(ins.pivot?.inspector_id) === String(user?.id) || 
        String(ins.pivot?.user_id) === String(user?.id)
    ) || String(job.report_writer_id) === String(user?.id);

    const isINS = isInspector;
    const canSeeNilai = !isINS;

    const canEditNilai = (() => {
        if (user?.role === 'superadmin' || permissions === 'superadmin') return true;
        if (user?.role === 'finance') return true;
        if (user?.role === 'marketing') return false;
        return false;
    })();

    const canManage = (() => {
        if (propCanManage !== undefined) return propCanManage;
        const curStage = Number(job.stage);
        if (user?.role === 'superadmin' || permissions === 'superadmin') return true;
        if (curStage === 16) return false;
        if (user?.role === 'admin') return true;
        if (user?.role === 'marketing' && [1, 11, 13, 15].includes(curStage)) return true;
        if (user?.role === 'finance' && [10, 12, 14].includes(curStage)) return true;
        if (['tim_ahli', 'ahli'].includes(user?.role) && curStage === 6) return true;
        if (isMGR && !MKT_STAGES.includes(curStage) && !FIN_STAGES.includes(curStage)) return true;
        if (isInspector || isAssignedInspector) {
            return [4, 5].includes(curStage);
        }
        if (!permissions) return false;
        const p = permissions[curStage] || permissions[job.stage];
        return p && (p.is_owner === true || p.is_owner === 1 || p.is_owner === '1');
    })();

    const canViewStageDocs = (sid) => {
        const sIdNum = Number(sid);
        if (['superadmin','admin','manager'].includes(user?.role)) return true;
        if (user?.role === 'marketing' && (job.owner_marketing === user?.name || [1, 11, 13, 15].includes(sIdNum))) return true;
        if (user?.role === 'finance' && [10, 12, 14].includes(sIdNum)) return true;
        if (isInspector || isAssignedInspector) return true;
        const p = permissions?.[sIdNum] || permissions?.[sid];
        return p && (p.can_view || p.is_owner);
    };

    const canManageStageDocs = (sid) => {
        const sIdNum = Number(sid);
        const curStageNum = Number(job.stage);
        if (['superadmin','manager'].includes(user?.role)) return true;
        if (user?.role === 'admin') return true;
        if (user?.role === 'marketing' && [1, 11, 13, 15].includes(sIdNum)) return true;
        if (user?.role === 'finance' && [10, 12, 14].includes(sIdNum)) return true;
        if ((isInspector || isAssignedInspector) && [4, 5].includes(sIdNum) && sIdNum === curStageNum) return true;
        if (isInspector || isAssignedInspector) return false;
        const p = permissions?.[sIdNum] || permissions?.[sid];
        return p && p.is_owner;
    };

    // Stage gates
    const stage1DocOk = STAGE1_REQUIRED_DOCS.some(t =>
        (job.documents || []).some(d => d.stage === 1 && d.type === t));
    const stage2DocOk = STAGE2_REQUIRED_DOCS.every(t =>
        (job.documents || []).some(d => (d.stage === 1 || d.stage === 2) && d.type === t));
    const stage2Bypass = job.peer_review_status === 'approved';
    const stage2CanMove = stage2DocOk || stage2Bypass;
    const s4UnitMismatch = s4.actual_units != null && parseInt(s4.actual_units) !== parseInt(job.units);

    const allSelectedInspectorIds = [...new Set(scheduleDays.flatMap(d => d.inspector_ids))];
    const s3ScheduleValid =
        scheduleDays.length > 0 &&
        scheduleDays.every(d => d.date?.trim()) &&
        scheduleDays.every(d => d.inspector_ids.length > 0);

    const showTgl15Warning = (() => {
        return new Date().getDate() > 15;
    })();

    const canRevisePoMonth = true;
    const canReviseInvoiceMonth = true;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleMoveStage = (e) => {
        e.preventDefault();
        const curStage = Number(job.stage);
        if (curStage === 1 && !stage1DocOk) return showError('Upload Dokumen', 'Upload minimal satu dokumen PO/SPK, Surat Permohonan, atau Surat Kuasa!');
        if (curStage === 2 && !stage2CanMove) return showError('Dokumen Belum Lengkap', 'Lengkapi dokumen atau minta persetujuan Kadiv/MGR.');
        if (curStage === 3) {
            if (!data.disnaker_tujuan) return showError('Validasi', 'Pilih Disnaker Tujuan!');
            if (!s3ScheduleValid) return showError('Validasi', 'Lengkapi tanggal dan inspektur untuk setiap hari!');
            setIsMoving(true);
            router.post(`/jobs/${job.id}/move`, {
                next_stage:      data.next_stage,
                notes:           data.notes,
                jam_mulai:       data.jam_mulai,
                disnaker_tujuan: data.disnaker_tujuan,
                report_writer_id: data.report_writer_id,
                alat_ids:        data.alat_ids,
                cert_ids:        data.cert_ids,
                schedule_days:   scheduleDays,
            }, {
                onSuccess: () => { setIsMoving(false); onClose(); },
                onError:   () => setIsMoving(false),
            });
            return;
        }
        if (curStage === 5) {
            const hasLhppDoc = (job.documents || []).some(d => Number(d.stage) === 5 || ['LHPP', 'LHPP (PDF)', 'LHPP Draft', 'LHPP Final'].includes(d.type));
            const hasValidLink = hasValidLhppLink(lhppLinks);
            if (!hasValidLink && !hasLhppDoc) {
                return showError('Link LHPP Belum Diisi', 'Silakan isi minimal satu link dokumen LHPP unit (Google Drive / Cloud) atau unggah dokumen LHPP terlebih dahulu.');
            }
            setIsMoving(true);
            router.post(`/jobs/${job.id}/move`, {
                next_stage: data.next_stage || 6,
                notes: data.notes,
                link_lhpp: lhppLinks,
            }, {
                onSuccess: () => { setIsMoving(false); onClose(); },
                onError: (errs) => {
                    setIsMoving(false);
                    const msg = Object.values(errs).flat().join('\n') || 'Gagal memindahkan stage.';
                    showError('Gagal Pindah Stage', msg);
                },
            });
            return;
        }
        if (curStage === 10) {
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
            router.post(`/jobs/${job.id}/move`, {
                next_stage: data.next_stage || 11,
                notes: data.notes,
                ...s10,
            }, {
                onSuccess: () => { setIsMoving(false); onClose(); },
                onError: (errs) => {
                    setIsMoving(false);
                    const msg = Object.values(errs).flat().join('\n') || 'Gagal memindahkan stage.';
                    showError('Gagal Pindah Stage', msg);
                },
            });
            return;
        }
        post(`/jobs/${job.id}/move`, { onSuccess: () => onClose() });
    };

    const handleBypassStage5 = async () => {
        const hasLhppDoc = (job.documents || []).some(d => Number(d.stage) === 5 || ['LHPP', 'LHPP (PDF)', 'LHPP Draft', 'LHPP Final'].includes(d.type));
        const hasValidLink = hasValidLhppLink(lhppLinks);
        if (!hasValidLink && !hasLhppDoc) {
            return showError('Link LHPP Belum Diisi', 'Silakan isi minimal satu link dokumen LHPP unit (Google Drive / Cloud) atau unggah dokumen LHPP terlebih dahulu.');
        }

        const res = await showConfirm(
            'Konfirmasi Bypass Stage 6',
            'Apakah Anda yakin ingin mem-bypass Stage 6 (Approval Tim Ahli) dan langsung menuju Stage 7 (Verifikasi ke Dinas)?',
            'Ya, Bypass ke Stage 7',
            'Batal'
        );
        if (res.isConfirmed) {
            setIsMoving(true);
            router.post(`/jobs/${job.id}/move`, {
                next_stage: 7,
                notes: data.notes ? `${data.notes} (Bypassed Stage 6)` : 'Bypassed Stage 6 langsung ke Stage 7',
                link_lhpp: lhppLinks,
            }, {
                onSuccess: () => { setIsMoving(false); onClose(); },
                onError: (errs) => {
                    setIsMoving(false);
                    const msg = Object.values(errs).flat().join('\n') || 'Gagal mem-bypass stage.';
                    showError('Gagal Bypass', msg);
                },
            });
        }
    };

    const handleRejectStage = async () => {
        const curStage = Number(job.stage);
        let targetStage = Math.max(1, curStage - 1);
        if (curStage === 13) targetStage = 4;
        else if (curStage === 5) targetStage = 4;
        else if (curStage === 7) targetStage = 5;
        else if (curStage === 8) targetStage = 6;
        else if (curStage === 10) targetStage = 9;
        else if (curStage === 11) targetStage = 10;
        else if (curStage === 14) targetStage = 11;
        else if (curStage === 15) targetStage = 14;
        else if (curStage === 12) targetStage = 15;

        let targetStageName = `Stage ${targetStage}`;
        if (curStage === 2) targetStageName = 'Stage 1 (Order Masuk / Marketing)';
        if (curStage === 6) targetStageName = 'Stage 5 (Penyusunan LHPP / Tim Ahli)';
        if (curStage === 14) targetStageName = 'Stage 11 (Penagihan / Marketing)';
        if (curStage === 15) targetStageName = 'Stage 11b (Verifikasi Bayar / Finance)';
        if (curStage === 12) targetStageName = 'Stage 11c (Pengiriman SUKET / Marketing)';

        const { value: notes, isConfirmed } = await Swal.fire({
            title: 'Kembalikan Pekerjaan?',
            text: `Pekerjaan akan dikembalikan ke ${targetStageName}. Mohon berikan catatan alasan penolakan/pengembalian:`,
            input: 'textarea',
            inputValue: data.notes || '',
            inputPlaceholder: 'Tuliskan catatan revisi atau alasan pengembalian di sini...',
            inputAttributes: { 'aria-label': 'Catatan pengembalian' },
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Kembalikan Pekerjaan',
            cancelButtonText: 'Batal',
            inputValidator: (val) => {
                if (!val || !val.trim()) {
                    return 'Alasan pengembalian wajib diisi!';
                }
            }
        });

        if (isConfirmed && notes) {
            router.post(`/jobs/${job.id}/reject`, { notes, target_stage: targetStage }, {
                onSuccess: () => {
                    showSuccess('Berhasil', 'Pekerjaan berhasil dikembalikan.');
                    onClose();
                },
                onError: () => showError('Gagal', 'Terjadi kesalahan saat mengembalikan pekerjaan.')
            });
        }
    };

    const handleAskApproval = async () => {
        const { value: notes, isConfirmed } = await Swal.fire({
            title: 'Minta Persetujuan Kadiv / MGR',
            text: 'Dokumen belum lengkap. Masukkan catatan mengapa permohonan riksa uji perlu dilanjutkan ke tahap penjadwalan tanpa dokumen lengkap:',
            input: 'textarea',
            inputPlaceholder: 'Tulis alasan dispensasi di sini...',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            confirmButtonText: 'Kirim Permintaan',
            cancelButtonText: 'Batal',
            inputValidator: (val) => (!val || !val.trim()) ? 'Catatan permohonan wajib diisi!' : null,
        });
        if (isConfirmed && notes) {
            router.post(`/jobs/${job.id}/request-approval`, { notes }, {
                onSuccess: () => showSuccess('Terkirim', 'Permintaan persetujuan telah dikirim ke Kadiv/MGR.'),
            });
        }
    };

    const handleApproveAsManager = () => {
        router.post(`/jobs/${job.id}/approve-bypass`, {}, {
            onSuccess: () => showSuccess('Disetujui', 'Dispensasi dokumen disetujui. Admin dapat melanjutkan ke penjadwalan.'),
        });
    };

    const handleRouteTo13 = () => {
        router.post(`/jobs/${job.id}/route-to-13`, {}, {
            onSuccess: () => onClose(),
        });
    };

    const handleSaveS4 = () => {
        router.post(`/jobs/${job.id}/s4-data`, s4, {
            onSuccess: () => showSuccess('Tersimpan', 'Data aktualisasi unit berhasil disimpan.'),
        });
    };

    const handleSaveS5 = () => {
        if (!s5.s5_review_decision) return showError('Validasi', 'Pilih keputusan review terlebih dahulu.');
        router.post(`/jobs/${job.id}/s5-review`, s5, {
            onSuccess: () => showSuccess('Tersimpan', 'Keputusan review berhasil disimpan.'),
        });
    };

    const handleSaveS7 = () => {
        if (!s7.tgl_submit_disnaker) return showError('Validasi', 'Isi tanggal penyerahan ke Disnaker.');
        router.post(`/jobs/${job.id}/s7-data`, s7, {
            onSuccess: () => showSuccess('Tersimpan', 'Tanggal penyerahan berhasil disimpan.'),
        });
    };

    const handleSaveS8 = () => {
        router.post(`/jobs/${job.id}/s8-data`, s8, {
            onSuccess: () => showSuccess('Tersimpan', 'Data Disnaker berhasil disimpan.'),
        });
    };

    const handleSaveS9 = () => {
        router.post(`/jobs/${job.id}/s9-data`, s9, {
            onSuccess: () => showSuccess('Tersimpan', 'Status suket berhasil disimpan.'),
        });
    };

    const handleSaveS10 = () => {
        router.post(`/jobs/${job.id}/s10-data`, s10, {
            onSuccess: () => showSuccess('Tersimpan', 'Data invoice berhasil disimpan.'),
        });
    };

    const handleSaveS11 = () => {
        router.post(`/jobs/${job.id}/s11-data`, s11, {
            onSuccess: () => showSuccess('Tersimpan', 'Catatan follow-up berhasil disimpan.'),
        });
    };

    const handleSaveS14 = () => {
        router.post(`/jobs/${job.id}/s14-data`, s14, {
            onSuccess: () => showSuccess('Tersimpan', 'Status pembayaran 11b berhasil disimpan.'),
        });
    };

    const handleSaveS15 = () => {
        router.post(`/jobs/${job.id}/s15-data`, s15, {
            onSuccess: () => showSuccess('Tersimpan', 'Informasi pengiriman SUKET berhasil disimpan.'),
        });
    };

    const handleUpdateJob = (e) => {
        e?.preventDefault?.();
        editForm.put(`/jobs/${job.id}`, {
            onSuccess: () => {
                showSuccess('Tersimpan', 'Data pekerjaan berhasil diperbarui.');
                setIsEditing(false);
            }
        });
    };

    const handleDeleteJob = async () => {
        const res = await showConfirm(
            'Hapus Job?',
            `Apakah Anda yakin ingin menghapus Job ${job.no_po || job.kode} (${job.klien})? Tindakan ini tidak dapat dibatalkan!`,
            'Ya, Hapus Job',
            'Batal'
        );
        if (res.isConfirmed) {
            router.delete(`/jobs/${job.id}`, {
                onSuccess: () => {
                    showSuccess('Berhasil', `Job ${job.no_po || job.kode} berhasil dihapus.`);
                    onClose();
                }
            });
        }
    };

    const handleReopenJob = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Buka Kembali Pekerjaan',
            html: `
                <div class="text-left space-y-3 text-xs">
                    <p class="text-gray-600">Pilih stage tujuan untuk memulihkan alur kerja pekerjaan ini:</p>
                    <div>
                        <label class="block font-bold text-gray-700 mb-1">Target Stage Pemulihan:</label>
                        <select id="swal-target-stage" class="w-full border rounded p-1.5 text-xs bg-white">
                            <option value="12">Stage 12: Final Financial Closing (Finance)</option>
                            <option value="15">Stage 11c: Kirim SUKET ke Klien (Marketing)</option>
                            <option value="14">Stage 11b: Verifikasi Bayar & PPh (Finance)</option>
                            <option value="11">Stage 11: Penagihan / Follow-up (Marketing)</option>
                            <option value="10">Stage 10: Invoice & Kwitansi (Finance)</option>
                            <option value="9">Stage 9: Pengurusan Suket (Admin)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold text-gray-700 mb-1">Alasan Pembukaan Kembali (Audit Trail):</label>
                        <textarea id="swal-reopen-notes" class="w-full border rounded p-1.5 text-xs" rows="3" placeholder="Jelaskan alasan..."></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Buka Kembali',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#d97706',
            focusConfirm: false,
            preConfirm: () => {
                const targetStage = document.getElementById('swal-target-stage').value;
                const notes = document.getElementById('swal-reopen-notes').value;
                if (!notes || !notes.trim()) {
                    Swal.showValidationMessage('Alasan pembukaan kembali wajib diisi!');
                    return false;
                }
                return { target_stage: targetStage, notes: notes };
            }
        });

        if (formValues) {
            router.post(`/jobs/${job.id}/reopen`, formValues, {
                onSuccess: () => {
                    showSuccess('Dipulihkan', 'Pekerjaan berhasil dibuka kembali ke stage yang dipilih.');
                    onClose();
                },
                onError: (errs) => {
                    const msg = Object.values(errs).flat().join('\n') || 'Gagal membuka kembali pekerjaan.';
                    showError('Gagal Membuka Kembali', msg);
                }
            });
        }
    };

    // Document Uploads
    const triggerUpload = (stageId, type) => {
        uploadContextRef.current = { stageId, type };
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const uploadFileDirectly = (stageId, type, file) => {
        if (!file) return;
        const renamedFile = sanitizeAndDeduplicateFilename(file, job.documents, type);
        const formData = new FormData();
        formData.append('document', renamedFile);
        formData.append('stage', stageId);
        formData.append('type', type);

        setIsUploading(true);
        router.post(`/jobs/${job.id}/documents`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsUploading(false);
                showSuccess('Terunggah', `Dokumen "${type}" berhasil diunggah.`);
            },
            onError: (errs) => {
                setIsUploading(false);
                const msg = Object.values(errs).flat().join('\n') || 'Gagal mengunggah dokumen.';
                showError('Gagal Unggah', msg);
            }
        });
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const { stageId, type } = uploadContextRef.current;
        uploadFileDirectly(stageId, type, file);
    };

    const uploadPhoto = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const renamedFile = sanitizeAndDeduplicateFilename(file, job.documents, type);
            const formData = new FormData();
            formData.append('document', renamedFile);
            formData.append('stage', 4);
            formData.append('type', type);
            if (photoNotes[type]) formData.append('notes', photoNotes[type]);

            setIsUploading(true);
            router.post(`/jobs/${job.id}/documents`, formData, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsUploading(false);
                    showSuccess('Terunggah', `Foto "${type}" berhasil diunggah.`);
                    setPhotoNotes(prev => ({ ...prev, [type]: '' }));
                },
                onError: (errs) => {
                    setIsUploading(false);
                    const msg = Object.values(errs).flat().join('\n') || 'Gagal mengunggah foto.';
                    showError('Gagal Unggah', msg);
                }
            });
        };
        input.click();
    };

    const deleteDoc = async (docId) => {
        const res = await showConfirm('Hapus Dokumen?', 'Apakah Anda yakin ingin menghapus dokumen ini?', 'Ya, Hapus', 'Batal');
        if (res.isConfirmed) {
            router.delete(`/jobs/${job.id}/documents/${docId}`, {
                preserveScroll: true,
                onSuccess: () => showSuccess('Dihapus', 'Dokumen berhasil dihapus.'),
                onError: () => showError('Gagal', 'Terjadi kesalahan saat menghapus dokumen.')
            });
        }
    };

    // Multi-unit LHPP links handlers
    const handleUpdateLhppLink = (idx, field, value) => {
        setLhppLinks(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const handleAddLhppLink = () => {
        setLhppLinks(prev => [
            ...prev,
            { id: `unit-${prev.length + 1}`, unit_no: prev.length + 1, label: `Unit ${prev.length + 1}`, url: '', notes: '' }
        ]);
    };

    const handleRemoveLhppLink = (idx) => {
        setLhppLinks(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSaveLhppLinks = () => {
        setIsSavingLink(true);
        router.post(`/jobs/${job.id}/lhpp-links`, { link_lhpp: lhppLinks }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingLink(false);
                showSuccess('Tersimpan', 'Daftar link dokumen LHPP berhasil disimpan.');
            },
            onError: (errs) => {
                setIsSavingLink(false);
                const msg = Object.values(errs).flat().join('\n') || 'Gagal menyimpan link LHPP.';
                showError('Gagal Simpan', msg);
            }
        });
    };

    // Stage SLA tag helper
    const currentStageInfo = STAGES.find(s => s.id === job.stage);
    const daysInStage = daysElapsed(job.updated_at || job.created_at);
    const slaTag = currentStageInfo?.sla ? getSlaTag(daysInStage, currentStageInfo.sla) : null;
    const getDocs = (stageId, type) => (job.documents || []).filter(d => d.stage === stageId && (!type || d.type === type));

    // ── Stage Action Panel Component ──────────────────────────────────────────
    const renderStageAction = () => {
        if (!canManage) return null;
        return (
            <StageActionDispatcher
                job={job}
                canManage={canManage}
                data={data}
                setData={setData}
                processing={processing}
                isMoving={isMoving}
                isINS={isINS}
                isMGR={isMGR}
                user={user}
                permissions={permissions}
                canSeeNilai={canSeeNilai}
                canEditNilai={canEditNilai}
                showTgl15Warning={showTgl15Warning}
                canReviseInvoiceMonth={canReviseInvoiceMonth}
                stage1DocOk={stage1DocOk}
                stage2DocOk={stage2DocOk}
                stage2CanMove={stage2CanMove}
                stage2Bypass={stage2Bypass}
                s2Verify={s2Verify}
                scheduleDays={scheduleDays}
                setScheduleDays={setScheduleDays}
                recommendations={recommendations}
                allSelectedInspectorIds={allSelectedInspectorIds}
                masterData={masterData}
                s3ScheduleValid={s3ScheduleValid}
                s4={s4}
                setS4={setS4}
                s4UnitMismatch={s4UnitMismatch}
                photoNotes={photoNotes}
                setPhotoNotes={setPhotoNotes}
                lhppLinks={lhppLinks}
                isSavingLink={isSavingLink}
                s5={s5}
                setS5={setS5}
                s7={s7}
                setS7={setS7}
                s8={s8}
                setS8={setS8}
                s9={s9}
                setS9={setS9}
                s10={s10}
                setS10={setS10}
                s11={s11}
                setS11={setS11}
                s14={s14}
                setS14={setS14}
                s15={s15}
                setS15={setS15}
                editForm={editForm}
                handleMoveStage={handleMoveStage}
                handleRejectStage={handleRejectStage}
                handleBypassStage5={handleBypassStage5}
                handleAskApproval={handleAskApproval}
                handleApproveAsManager={handleApproveAsManager}
                handleSetS2Status={handleSetS2Status}
                handleRouteTo13={handleRouteTo13}
                handleSaveS4={handleSaveS4}
                handleSaveS5={handleSaveS5}
                handleSaveS7={handleSaveS7}
                handleSaveS8={handleSaveS8}
                handleSaveS9={handleSaveS9}
                handleSaveS10={handleSaveS10}
                handleSaveS11={handleSaveS11}
                handleSaveS14={handleSaveS14}
                handleSaveS15={handleSaveS15}
                handleUpdateJob={handleUpdateJob}
                handleReopenJob={handleReopenJob}
                triggerUpload={triggerUpload}
                uploadFileDirectly={uploadFileDirectly}
                uploadPhoto={uploadPhoto}
                canManageStageDocs={canManageStageDocs}
                deleteDoc={deleteDoc}
                getDocs={getDocs}
                setShowReviseInvoiceModal={setShowReviseInvoiceModal}
                post={post}
                onClose={onClose}
                handleUpdateLhppLink={handleUpdateLhppLink}
                handleRemoveLhppLink={handleRemoveLhppLink}
                handleAddLhppLink={handleAddLhppLink}
                handleSaveLhppLinks={handleSaveLhppLinks}
            />
        );
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
                            <span 
                                className="font-bold bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-xs text-xs text-[#0A385C] truncate max-w-[240px]" 
                                title={`ID Internal: ${job.kode}`}
                            >
                                {(!isINS && job.no_po) ? `PO: ${job.no_po}` : job.kode}
                            </span>
                            <span className="font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                                Stage {job.stage}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {(auth?.user?.role === 'finance' || auth?.user?.role === 'superadmin' || auth?.permissions === 'superadmin') && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowRevisePoModal(true)}
                                    disabled={!canRevisePoMonth}
                                    className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors ${
                                        canRevisePoMonth
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                    }`}
                                    title={canRevisePoMonth ? "Revisi Data PO/SPK (Finance/Superadmin)" : "Batas waktu revisi PO (bulan yang sama dengan pembuatan job) telah berakhir"}
                                >
                                    Revisi PO
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReviseInvoiceModal(true)}
                                    disabled={!canReviseInvoiceMonth}
                                    className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors ${
                                        canReviseInvoiceMonth
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                    }`}
                                    title={canReviseInvoiceMonth ? "Revisi / Terbitkan Data Invoice & Faktur Pajak secara Paralel (Finance/Superadmin)" : "Batas waktu revisi invoice (bulan yang sama) telah berakhir"}
                                >
                                    Revisi Invoice
                                </button>
                            </>
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
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-2 sm:px-6 border-b bg-white flex-shrink-0 z-10 shadow-sm overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'timeline',  label: 'Status' },
                        { id: 'docs',      label: 'Dokumen' },
                        { id: 'history',   label: 'Riwayat' },
                        { id: 'info',      label: 'Info & Edit' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`py-3 px-4 sm:py-3.5 sm:px-6 font-bold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === t.id
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-white flex-1">
                    {activeTab === 'timeline' && (
                        <TimelineTab
                            job={job}
                            currentStageInfo={currentStageInfo}
                            daysInStage={daysInStage}
                            slaTag={slaTag}
                            canManage={canManage}
                            canManageStageDocs={canManageStageDocs}
                            deleteDoc={deleteDoc}
                            isINS={isINS}
                            canSeeNilai={canSeeNilai}
                            s2Verify={s2Verify}
                            renderStageAction={renderStageAction}
                        />
                    )}
                    {activeTab === 'docs' && (
                        <DocumentsTab
                            job={job}
                            canViewStageDocs={canViewStageDocs}
                            canManageStageDocs={canManageStageDocs}
                            deleteDoc={deleteDoc}
                            isINS={isINS}
                            fileInputRef={fileInputRef}
                            onFileChange={onFileChange}
                        />
                    )}
                    {activeTab === 'history' && <HistoryTab job={job} isINS={isINS} />}
                    {activeTab === 'info' && (
                        <EditInfoTab
                            job={job}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            editForm={editForm}
                            handleUpdateJob={handleUpdateJob}
                            canManage={canManage}
                            canSeeNilai={canSeeNilai}
                            showTgl15Warning={showTgl15Warning}
                            isINS={isINS}
                        />
                    )}
                </div>

                {/* Hidden File Input */}
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

                {/* Modals */}
                {showRevisePoModal && (
                    <RevisePoModal
                        job={job}
                        showModal={showRevisePoModal}
                        setShowModal={setShowRevisePoModal}
                        onSuccess={() => {}}
                    />
                )}
                {showReviseInvoiceModal && (
                    <ReviseInvoiceModal
                        job={job}
                        showModal={showReviseInvoiceModal}
                        setShowModal={setShowReviseInvoiceModal}
                        onSuccess={() => {}}
                    />
                )}
            </div>
        </div>
    );
}
