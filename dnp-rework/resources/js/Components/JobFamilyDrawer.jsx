import React, { useState, useEffect } from 'react';
import { STAGES } from '@/Constants';
import { X, Layers, CheckCircle2, Clock, AlertTriangle, FileText, ArrowRight, ExternalLink } from 'lucide-react';

export default function JobFamilyDrawer({ job, onClose, onSelectJob, allJobs = [] }) {
    if (!job) return null;

    const rootId = job.root_job_id || job.id;
    const poNumber = job.no_po || job.po_number || job.kode;

    // Filter all jobs that belong to this family
    const familyJobs = allJobs.filter(j => 
        j.root_job_id === rootId || j.id === rootId || j.parent_job_id === rootId
    );

    const rootJob = familyJobs.find(j => j.id === rootId) || job;
    const originalUnits = rootJob.original_po_unit_count || rootJob.units || 0;

    // Calculate total certified and active units
    let totalCertifiedUnits = 0;
    let totalActiveUnits = 0;
    let totalFailedUnits = 0;

    familyJobs.forEach(j => {
        if (j.stage === 12 || j.status === 'CLOSED') {
            totalCertifiedUnits += (j.units || 0);
        } else if (j.status === 'CLOSED_FAILED') {
            totalFailedUnits += (j.units || 0);
        } else {
            totalActiveUnits += (j.units || 0);
        }
    });

    // Determine family status
    const allTerminal = familyJobs.every(j => j.stage === 12 || j.status === 'CLOSED' || j.status === 'CLOSED_FAILED' || j.status === 'CANCELLED');
    const someTerminal = familyJobs.some(j => j.stage === 12 || j.status === 'CLOSED');
    const hasException = familyJobs.some(j => (j.reschedule_count || 0) >= 3 || (j.payment_retry_count || 0) >= 5);

    let familyStatus = 'ACTIVE';
    let statusColor = 'bg-blue-100 text-blue-800 border-blue-300';
    let statusLabel = 'ACTIVE (Dalam Proses)';

    if (hasException) {
        familyStatus = 'EXCEPTION_REVIEW';
        statusColor = 'bg-red-100 text-red-800 border-red-300';
        statusLabel = 'EXCEPTION REVIEW (Eskalasi Kadiv)';
    } else if (allTerminal) {
        familyStatus = 'FULLY_CLOSED';
        statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        statusLabel = 'FULLY CLOSED (Semua Selesai)';
    } else if (someTerminal) {
        familyStatus = 'PARTIALLY_CLOSED';
        statusColor = 'bg-purple-100 text-purple-800 border-purple-300';
        statusLabel = 'PARTIALLY CLOSED (Sebagian Selesai)';
    }

    const percentComplete = originalUnits > 0 ? Math.min(100, Math.round((totalCertifiedUnits / originalUnits) * 100)) : 0;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/60 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300">
                
                {/* Drawer Header */}
                <div className="p-4 sm:p-5 border-b bg-gradient-to-r from-[#0A385C] to-[#00A8E8] text-white flex items-center justify-between flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Layers size={18} className="text-cyan-200" />
                            <span className="text-xs font-bold tracking-wider uppercase opacity-80">Job Family Explorer</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight">{job.klien}</h2>
                        <p className="text-xs text-cyan-100 opacity-90 font-mono mt-0.5">PO: {poNumber} • Total {originalUnits} Unit Kontrak</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
                        title="Tutup"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Family Status Overview */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Keluarga PO:</span>
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${statusColor}`}>
                            {statusLabel}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                            <span>Sertifikasi Unit Terselesaikan</span>
                            <span className="font-bold text-[#0A385C]">{totalCertifiedUnits} dari {originalUnits} Unit ({percentComplete}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${percentComplete}%` }} title={`Tersertifikasi: ${totalCertifiedUnits} Unit`} />
                            {totalActiveUnits > 0 && (
                                <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${(totalActiveUnits / (originalUnits || 1)) * 100}%` }} title={`Sedang Berjalan: ${totalActiveUnits} Unit`} />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold block">TOTAL PO</span>
                            <span className="font-black text-slate-800 text-sm">{originalUnits} Unit</span>
                        </div>
                        <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                            <span className="text-[10px] text-emerald-600 font-bold block">CLOSED / SUKET</span>
                            <span className="font-black text-emerald-800 text-sm">{totalCertifiedUnits} Unit</span>
                        </div>
                        <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                            <span className="text-[10px] text-amber-600 font-bold block">AKTIF / S4c-S11</span>
                            <span className="font-black text-amber-800 text-sm">{totalActiveUnits} Unit</span>
                        </div>
                    </div>
                </div>

                {/* Family Jobs Tree List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                        Pohon Pekerjaan Terkait ({familyJobs.length} Job):
                    </h3>

                    {familyJobs.map((fJob) => {
                        const isRoot = fJob.id === rootId;
                        const isParent = fJob.job_type === 'PARENT' || (isRoot && familyJobs.length > 1);
                        const isChild = fJob.job_type === 'CHILD' || Boolean(fJob.parent_job_id);
                        const stageInfo = STAGES.find(s => s.id === fJob.stage);
                        const isClosed = fJob.stage === 12 || fJob.status === 'CLOSED';

                        return (
                            <div 
                                key={fJob.id}
                                className={`border rounded-xl p-3.5 transition-all ${
                                    fJob.id === job.id 
                                        ? 'border-[#00A8E8] bg-sky-50/40 ring-2 ring-[#00A8E8]/30' 
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono font-bold text-xs bg-slate-100 text-[#0A385C] px-2 py-0.5 rounded border border-slate-200">
                                            {fJob.kode}
                                        </span>
                                        {isParent && (
                                            <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                                                PARENT (Induk)
                                            </span>
                                        )}
                                        {isChild && (
                                            <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                                                CHILD (Anak #{fJob.split_sequence || 1})
                                            </span>
                                        )}
                                        {fJob.id === job.id && (
                                            <span className="text-[9px] font-extrabold bg-[#0A385C] text-white px-1.5 py-0.5 rounded">
                                                CURRENT
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {fJob.units || 0} Unit
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-400">Posisi Stage:</span>
                                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                            isClosed 
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                                        }`}>
                                            Stage {stageInfo?.displayId || fJob.stage}: {stageInfo?.name || `Stage ${fJob.stage}`}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectJob(fJob);
                                            onClose();
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                    >
                                        Buka Detail <ArrowRight size={12} />
                                    </button>
                                </div>

                                {fJob.reschedule_reason && (
                                    <p className="text-[11px] text-amber-800 mt-2 bg-amber-50 p-2 rounded border border-amber-200/60 italic">
                                        Alasan Reschedule: "{fJob.reschedule_reason}"
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Drawer Footer */}
                <div className="p-3.5 border-t bg-slate-50 flex justify-end flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs"
                    >
                        Tutup Panel
                    </button>
                </div>

            </div>
        </div>
    );
}
