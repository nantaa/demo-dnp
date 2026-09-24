import React from 'react';
import {
    STAGES,
    STAGE2_VERIFY_CHECKLIST,
    STAGE5_DECISIONS,
    STAGE8_DISNAKER_STATUSES,
    STAGE9_SUKET_STATUSES,
    PROGRESS_STATUSES
} from '../../../Constants';
import {
    getDocDownloadUrl,
    isPoLockedForIns,
    parseJsonObject,
    parseJsonArray,
    parseLhppLinks,
    hasValidLhppLink,
    fmt
} from '../helpers';
import DocChip from '../Common/DocChip';

export default function TimelineTab({
    job,
    currentStageInfo,
    daysInStage,
    slaTag,
    canManage,
    canManageStageDocs,
    deleteDoc,
    isINS,
    canSeeNilai,
    s2Verify,
    renderStageAction
}) {
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
                        <div><span className="text-gray-400">No. PO / SPK:</span> <span className="font-semibold text-gray-800">{isINS ? '[Terkunci]' : (job.no_po || '-')}</span></div>
                        <div><span className="text-gray-400">{isINS ? 'Tgl Registrasi:' : 'Tgl PO:'}</span> <span className="font-semibold text-gray-800">{isINS ? fmt(job.created_at) : (job.tgl_po ? fmt(job.tgl_po, { day: 'numeric', month: 'short', year: 'numeric' }) : '-')}</span></div>
                        <div><span className="text-gray-400">Klien:</span> <span className="font-semibold text-gray-800">{job.klien || '-'}</span></div>
                        <div><span className="text-gray-400">Pesawat / Alat:</span> <span className="font-semibold text-gray-800">{job.pesawat || '-'}</span></div>
                        <div><span className="text-gray-400">Lokasi:</span> <span className="font-semibold text-gray-800">{job.lokasi || '-'}</span></div>
                        <div><span className="text-gray-400">Jumlah Unit:</span> <span className="font-semibold text-gray-800">{job.units || 1} Unit</span></div>
                        {canSeeNilai && (
                            <div className="col-span-2"><span className="text-gray-400">Nilai Kontrak:</span> <span className="font-semibold text-gray-800">{job.nilai ? `Rp ${Number(job.nilai).toLocaleString('id-ID')}` : '-'}</span></div>
                        )}
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
            const links = parseLhppLinks(job.link_lhpp, job.actual_units ?? job.units);
            const hasLinks = hasValidLhppLink(links);
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Detail Penyusunan LHPP:</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600 space-y-2">
                        <div><span className="text-gray-400">Status LHPP:</span> <span className="font-semibold text-emerald-700">Dokumen Selesai Disusun</span></div>
                        {hasLinks && (
                            <div className="space-y-1.5 pt-1 border-t border-gray-200/60">
                                <span className="text-gray-500 font-semibold block">Daftar Link LHPP per Unit:</span>
                                <div className="space-y-1.5">
                                    {links.filter(item => item.url && item.url.trim()).map((item, idx) => (
                                        <div key={item.id || idx} className="bg-white p-2 rounded border border-gray-200 shadow-2xs space-y-0.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                                        Unit {item.unit_no || idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-gray-800 truncate">
                                                        {item.label || `Unit ${idx + 1}`}
                                                    </span>
                                                </div>
                                                <a
                                                    href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 font-semibold text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex-shrink-0"
                                                >
                                                    Buka ↗
                                                </a>
                                            </div>
                                            {item.notes && (
                                                <p className="text-[11px] text-gray-500 italic pl-1">
                                                    Catatan: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
            const s9StatusObj = STAGE9_SUKET_STATUSES.find(p => p.value === job.s9_progress_status)
                || PROGRESS_STATUSES.find(p => p.value === job.s9_progress_status);
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Informasi Suket:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <div><span className="text-gray-400">Status Progress:</span> <span className="font-semibold text-gray-800">{s9StatusObj ? s9StatusObj.label : (job.s9_progress_status || '-')}</span></div>
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
                    <p className="font-bold text-gray-700">Detail Invoice & Faktur:</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        {canSeeNilai && (
                            <div><span className="text-gray-400">Total Invoice:</span> <span className="font-semibold text-gray-800">{job.total_invoice_amount ? `Rp ${Number(job.total_invoice_amount).toLocaleString('id-ID')}` : '-'}</span></div>
                        )}
                        <div><span className="text-gray-400">Tgl Invoice Diterbitkan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_invoice_issued) || '-'}</span></div>
                        <div><span className="text-gray-400">Status Progress:</span> <span className="font-semibold text-gray-800">{job.s10_progress_status || '-'}</span></div>
                        <div><span className="text-gray-400">Tgl Submit MKT:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_submit_mkt) || '-'}</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Invoice: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 11) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Penagihan / Follow-up (Marketing):</p>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div><span className="text-gray-400">Tgl Follow-up / Submit:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_submit_mkt) || '-'}</span></div>
                        <div className="col-span-2"><span className="text-gray-400">Status:</span> <span className="font-semibold text-blue-700">Invoice telah ditagihkan ke Klien</span></div>
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Penagihan: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 14) {
            const statusLabel = job.s14_payment_status === 'paid' ? 'Paid (Lunas Sempurna)' : job.s14_payment_status === 'partial' ? 'Partial (Dibayar Sebagian)' : 'Pending';
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Verifikasi Pembayaran & PPh (Finance):</p>
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600 space-y-1">
                        <div><span className="text-gray-400">Status Pembayaran 11b:</span> <span className="font-bold text-gray-800">{statusLabel}</span></div>
                        {job.s14_payment_notes && (
                            <div><span className="text-gray-400">Catatan Pembayaran & PPh:</span> <span className="font-medium text-gray-800">{job.s14_payment_notes}</span></div>
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

        if (s === 15) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">Pengiriman SUKET ke Klien (Marketing):</p>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-2.5 rounded border border-gray-100 text-gray-600">
                        <div className="col-span-2"><span className="text-gray-400">Status Pengiriman:</span> <span className="font-semibold text-emerald-700">SUKET telah diserahkan / dikirimkan ke Klien</span></div>
                        {job.no_resi && (
                            <div className="col-span-2"><span className="text-gray-400">No. Resi:</span> <span className="font-semibold text-blue-700 font-mono">{job.no_resi}</span></div>
                        )}
                        {job.tgl_submit_mkt && (
                            <div><span className="text-gray-400">Tgl Penyerahan:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_submit_mkt)}</span></div>
                        )}
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
                    <p className="font-bold text-gray-700">Final Financial Closing (Finance):</p>
                    <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-100 text-emerald-800 text-xs font-semibold">
                        Pekerjaan Selesai dan Ditutup Penuh.
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-amber-800">Catatan Closing: </span> {stageNotes}
                        </div>
                    )}
                </div>
            );
        }

        if (s === 16) {
            return (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                    <p className="font-bold text-gray-700">✅ Selesai & Diarsipkan:</p>
                    <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        Pekerjaan telah diselesaikan dan diarsipkan oleh Finance.
                    </div>
                    {stageNotes && (
                        <div className="text-gray-600 bg-teal-50/60 border border-teal-200/60 rounded p-2 text-xs">
                            <span className="font-semibold text-teal-800">Catatan Pengarsipan: </span> {stageNotes}
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

    return (
        <div className="space-y-6 py-2">
            <h3 className="font-bold text-gray-800 border-b pb-2">
                Status Pekerjaan: Stage {currentStageInfo?.displayId || job.stage} ({currentStageInfo?.name})
            </h3>
            
            {/* SLA Badge for current stage */}
            {slaTag && (
                <div className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${slaTag.cls}`}>
                    ⏱ {daysInStage} hari di stage ini {currentStageInfo?.sla ? `(SLA: ${currentStageInfo.sla} hari)` : ''} — {slaTag.label}
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
                                        {canManage ? (
                                            renderStageAction()
                                        ) : (
                                            <div className="space-y-3">
                                                {renderCompletedStageSummary(stage.id)}
                                                {stageDocs.length > 0 && (
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-xs text-gray-500 font-medium">Dokumen Tersimpan:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {stageDocs.map(d => <DocChip key={d.id} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} isINS={isINS} />)}
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
                                                            ) : (isINS && item.type === 'PO/SPK') ? (
                                                                <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 inline-flex items-center gap-1 italic cursor-not-allowed" title="Dokumen PO/SPK terkunci untuk Inspektur">
                                                                    🔒 Terkunci
                                                                </span>
                                                            ) : hasFile ? (
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {docs.map(d => {
                                                                        if (isINS && (item.type === 'PO/SPK' || isPoLockedForIns(d, isINS))) {
                                                                            return (
                                                                                <span
                                                                                    key={d.id}
                                                                                    className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 inline-flex items-center gap-1 italic cursor-not-allowed"
                                                                                    title="Dokumen PO/SPK terkunci untuk Inspektur"
                                                                                >
                                                                                    🔒 Terkunci
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <a
                                                                                key={d.id}
                                                                                href={getDocDownloadUrl(d)}
                                                                                download
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-[10px] text-green-700 font-semibold bg-green-50 hover:bg-green-100 hover:underline px-1.5 py-0.5 rounded border border-green-200 inline-flex items-center gap-1"
                                                                                title={`Unduh / Lihat ${d.name}`}
                                                                            >
                                                                                {d.name ? (d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name) : 'Ada File'}
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Kosong</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                status === 'ok' ? 'bg-green-600 text-white' :
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
                                            {stageDocs.map(d => <DocChip key={d.id} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} isINS={isINS} />)}
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
}
