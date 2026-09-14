import React from 'react';
import { STAGE5_DECISIONS } from '@/Constants';
import { fmt, fmtCurrency, parseJsonArray, parseJsonObject } from '../constants';

export default function CompletedStageSummary({ job, s, canSeeNilai }) {
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
                    <div><span className="text-gray-400">Termin:</span> <span className="font-semibold text-gray-800">{job.termin_pembayaran || 'FULL'}</span></div>
                    {canSeeNilai && (
                        <div><span className="text-gray-400">Nilai Kontrak:</span> <span className="font-semibold text-gray-800">{fmtCurrency(job.nilai)}</span></div>
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

    if (s === 18) {
        return (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                <p className="font-bold text-gray-700">Detail Invoice DP (Stage 1b):</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">No. Invoice DP:</span> <span className="font-semibold text-gray-800">{job.dp_invoice_no || '-'}</span></div>
                    <div><span className="text-gray-400">Nominal DP:</span> <span className="font-semibold text-emerald-700">{fmtCurrency(job.dp_amount)}</span></div>
                </div>
                {stageNotes && (
                    <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                        <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                    </div>
                )}
            </div>
        );
    }

    if (s === 19) {
        return (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                <p className="font-bold text-gray-700">Detail Penagihan DP (Stage 1c):</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">Status Penagihan DP:</span> <span className="font-semibold text-gray-800">{job.dp_billing_status || 'Terkirim'}</span></div>
                    <div><span className="text-gray-400">Tgl Kirim:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_kirim_dp)}</span></div>
                </div>
                {stageNotes && (
                    <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                        <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                    </div>
                )}
            </div>
        );
    }

    if (s === 20) {
        return (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                <p className="font-bold text-gray-700">Konfirmasi Pembayaran DP (Stage 1d):</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">Status DP:</span> <span className="font-semibold text-emerald-700">VERIFIED / LUNAS</span></div>
                    <div><span className="text-gray-400">Tgl Bayar DP:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_dp_paid)}</span></div>
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
                {schedDays.length > 0 && (
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
                        <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                    </div>
                )}
            </div>
        );
    }

    if (s === 8) {
        return (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                <p className="font-bold text-gray-700">Detail Proses Disnaker:</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">Status Disnaker:</span> <span className="font-semibold text-gray-800">{job.s8_progress_status || '-'}</span></div>
                    <div><span className="text-gray-400">Tgl Serah Disnaker:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_doc_submitted_disnaker) || '-'}</span></div>
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
                <p className="font-bold text-gray-700">Detail Pengurusan Suket:</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">Tgl Input Suket:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_input_suket) || '-'}</span></div>
                    <div><span className="text-gray-400">Tgl Suket Selesai:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_suket_selesai) || '-'}</span></div>
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
                <p className="font-bold text-gray-700">Detail Invoice Tagihan:</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">No. Invoice:</span> <span className="font-semibold text-gray-800">{job.invoice_no || '-'}</span></div>
                    {canSeeNilai && (
                        <div><span className="text-gray-400">Total Invoice:</span> <span className="font-semibold text-gray-800">{fmtCurrency(job.total_invoice_amount || job.nilai)}</span></div>
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

    if (s === 15) {
        return (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                <p className="font-bold text-gray-700">Hasil Verifikasi Pembayaran (Stage 11c):</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">Status Pembayaran:</span> <span className="font-bold text-emerald-700">LUNAS / VERIFIED</span></div>
                    <div><span className="text-gray-400">No. Mutasi Bank:</span> <span className="font-semibold text-gray-800">{job.bank_ref || '-'}</span></div>
                </div>
                {stageNotes && (
                    <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                        <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                    </div>
                )}
            </div>
        );
    }

    if (s === 14) {
        return (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2 text-xs">
                <p className="font-bold text-gray-700">Detail Pengiriman Suket (Stage 11b):</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600 bg-gray-50/70 p-2.5 rounded border border-gray-100">
                    <div><span className="text-gray-400">No. Resi:</span> <span className="font-semibold text-gray-800">{job.no_resi || '-'}</span></div>
                    <div><span className="text-gray-400">Tgl Pengiriman:</span> <span className="font-semibold text-gray-800">{fmt(job.tgl_kirim_suket) || '-'}</span></div>
                </div>
                {stageNotes && (
                    <div className="text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 text-xs">
                        <span className="font-semibold text-amber-800">Catatan: </span> {stageNotes}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
