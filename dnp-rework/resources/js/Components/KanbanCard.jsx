import React from 'react';
import { STAGES } from '@/Constants';

export default function KanbanCard({ job, isINS, onClick }) {
    const renderBadge = () => {
        if (job.stage === 4 && job.tgl_pelaksanaan) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const pelDate = new Date(job.tgl_pelaksanaan);
            pelDate.setHours(0, 0, 0, 0);
            const diffDays = Math.round((today - pelDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold border border-blue-300">HARI H</span>;
            } else if (diffDays > 0) {
                return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-extrabold border border-red-300">OVERDUE</span>;
            } else {
                return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold border border-amber-300">H {diffDays}</span>;
            }
        }

        if (job.stage === 8 && job.s8_progress_status) {
            const sMap = {
                progress: { label: 'PROSES DISNAKER', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
                stuck:    { label: 'TERKENDALA',       cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                ready:    { label: 'SELESAI DISNAKER', cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
            };
            const badge = sMap[job.s8_progress_status];
            if (badge) {
                return <span className={`px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>;
            }
        }

        if (job.stage === 9 && job.s9_progress_status) {
            const s9Map = {
                diterima:               { label: 'DITERIMA',               cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                scan:                   { label: 'SCAN',                   cls: 'bg-purple-100 text-purple-800 font-bold border-purple-300' },
                penamaan_cover:         { label: 'PENAMAAN COVER',         cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                pembuatan_tanda_terima: { label: 'TANDA TERIMA',           cls: 'bg-cyan-100 text-cyan-800 font-bold border-cyan-300' },
                selesai:                { label: 'SELESAI',                cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
                not_started:            { label: 'NOT STARTED',            cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                delayed:                { label: 'DELAYED',                cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                in_progress:            { label: 'IN PROGRESS',            cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                almost_done:            { label: 'ALMOST DONE',            cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                done:                   { label: 'DONE',                   cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
            };
            const badge = s9Map[job.s9_progress_status];
            if (badge) {
                return <span className={`px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>;
            }
        }

        if (job.stage === 16) {
            return <span className="px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 font-bold border-emerald-300">✓ SELESAI / TERARSIP</span>;
        }

        const stageInfo = STAGES.find(s => s.id === job.stage);
        if (!stageInfo?.sla) return null;
        
        let slaDays = stageInfo.sla;
        if (job.stage === 6) slaDays *= (job.units || 1);
        
        const startDate = new Date(job.stage_started_at || job.updated_at);
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status = 'ON TRACK';
        let color = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
        if (diffDays > slaDays) {
            status = 'OVERDUE';
            color = 'bg-red-100 text-red-800 font-bold border-red-300';
        } else if (diffDays >= slaDays - 1) {
            status = 'WARNING';
            color = 'bg-amber-100 text-amber-800 font-bold border-amber-300';
        }

        return (
            <span className={`px-2 py-0.5 rounded-full border ${color}`} title={`${diffDays} hari terpakai dari SLA ${slaDays} hari`}>
                {status} {diffDays}/{slaDays}d
            </span>
        );
    };

    return (
        <div 
            onClick={onClick}
            className="bg-white p-3.5 mb-2 rounded-xl shadow-xs border border-slate-200/90 cursor-pointer hover:border-[#00A8E8] hover:shadow-md transition-all group relative overflow-hidden"
        >
            {/* DNP Accent Line Indicator */}
            <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${
                job.stage === 16
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 opacity-100'
                    : 'bg-gradient-to-r from-[#0A385C] to-[#00A8E8] opacity-0 group-hover:opacity-100'
            }`} />

            {/* Dual Figma Wave Artwork (Vector 630 + Vector 632) at Bottom-Right */}
            <div className="absolute bottom-0 right-0 pointer-events-none z-0 select-none leading-none w-[140px] h-[36px] overflow-hidden">
                {/* Vector 630: light blue wave base layer */}
                <svg viewBox="0 0 178 68" fill="none" className="absolute bottom-0 right-0 w-[120px] h-auto scale-x-[-1]">
                    <path opacity="0.41" d="M0.158887 41.0282L9.18329e-06 67.9551C95.2567 18.2973 106.604 2.27715 177.059 21.0089C120.265 -10.6205 84.6216 -8.5443 0.158887 41.0282Z" fill="#B1DFF7"/>
                </svg>
                {/* Vector 632: cyan gradient wave foreground layer */}
                <svg viewBox="0 0 213 84" fill="none" className="absolute bottom-0 right-0 w-[140px] h-auto scale-x-[-1]">
                    <path d="M212.508 83.3342L212.652 58.8123C161.854 31.5198 128.227 12.2315 105.172 4.58484C57.946 -7.88466 33.6576 7.09955 -2.05659e-06 25.3391C-2.05659e-06 25.3391 51.2766 3.87579 94.6169 22.458C137.957 41.0401 212.508 83.3342 212.508 83.3342Z" fill={`url(#wg_card_${job.id})`}/>
                    <defs>
                        <linearGradient id={`wg_card_${job.id}`} x1="43.5112" y1="11.3829" x2="135.756" y2="-40.0729" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#4ABFF0"/>
                            <stop offset="1" stopColor="#4ABFF0" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <span 
                        className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-[#0A385C] border border-slate-200 truncate max-w-[170px]"
                        title={(!isINS && job.no_po) ? `No PO / SPK: ${job.no_po} | ID Sistem: ${job.kode}` : `ID Sistem: ${job.kode}`}
                    >
                        {(!isINS && job.no_po) ? `PO: ${job.no_po}` : job.kode}
                    </span>
                    {job.units > 1 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#E0F2FE] text-[#0A385C] rounded-full border border-[#00A8E8]/30">
                            {job.units} Unit
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 group-hover:text-[#0A385C] transition-colors">
                    {job.klien}
                </h3>
                <p className="text-xs text-slate-500 mb-2 truncate">
                    {job.pesawat} • {job.lokasi}
                </p>

                {/* Stage 8 Disnaker Status Banner & Delay Reason */}
                {job.stage === 8 && (() => {
                    const sMap = {
                        progress: { label: 'PROSES DISNAKER', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
                        stuck:    { label: 'TERKENDALA',       cls: 'bg-red-50 text-red-800 font-bold border-red-200' },
                        ready:    { label: 'SELESAI DISNAKER', cls: 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200' },
                    };
                    const badge = sMap[job.s8_progress_status] || { label: 'DISNAKER (BELUM DIUPDATE)', cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                    return (
                        <div className={`mt-2 mb-1 p-2 rounded-lg border text-[11px] ${badge.cls} space-y-0.5`}>
                            <div className="flex items-center justify-between font-bold">
                                <span>{badge.label}</span>
                                {job.tgl_doc_submitted_disnaker && (
                                    <span className="text-[10px] font-normal opacity-80">
                                        {Math.max(0, Math.floor((new Date() - new Date(job.tgl_doc_submitted_disnaker)) / (1000 * 60 * 60 * 24)))} hr
                                    </span>
                                )}
                            </div>
                            {job.s8_progress_status === 'stuck' && job.s8_delay_reason && (
                                <p className="text-[10px] text-red-700 italic border-t border-red-200/70 pt-1" title={job.s8_delay_reason}>
                                    Kendala: {job.s8_delay_reason}
                                </p>
                            )}
                        </div>
                    );
                })()}

                {/* Stage 9 Suket Status Banner */}
                {job.stage === 9 && (() => {
                    const s9Map = {
                        diterima:               { label: 'DITERIMA',               cls: 'bg-blue-50 text-blue-800 border-blue-200' },
                        scan:                   { label: 'SCAN',                   cls: 'bg-purple-50 text-purple-800 border-purple-200' },
                        penamaan_cover:         { label: 'PENAMAAN COVER',         cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                        pembuatan_tanda_terima: { label: 'PEMBUATAN TANDA TERIMA', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
                        selesai:                { label: 'SELESAI',                cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    };
                    const badge = s9Map[job.s9_progress_status] || { label: 'SUKET (DALAM PROSES)', cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                    return (
                        <div className={`mt-2 mb-1 p-2 rounded-lg border text-[11px] ${badge.cls} space-y-0.5`}>
                            <div className="flex items-center justify-between font-bold">
                                <span>{badge.label}</span>
                                {job.stage_started_at && (
                                    <span className="text-[10px] font-normal opacity-80">
                                        {Math.max(0, Math.floor((new Date() - new Date(job.stage_started_at)) / (1000 * 60 * 60 * 24)))} hr
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Inspector / Tim Pill Badges if assigned */}
                {job.inspectors && job.inspectors.length > 0 && (
                    <div className="flex items-center gap-1 my-2 overflow-x-auto">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-[#0A385C] text-white rounded-full">
                            TIM RIKSA UJI
                        </span>
                        {job.inspectors.slice(0, 2).map((ins, i) => (
                            <span key={i} className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full border border-slate-200 truncate max-w-[80px]">
                                {ins.name || ins}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Footer with Marketing and SLA / Overdue Badge */}
                <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200/90 pt-2 relative z-10">
                    <span className="font-medium text-slate-500">
                        MKT: <strong className="text-slate-700">{job.owner_marketing}</strong>
                    </span>
                    <div className="shrink-0">
                        {renderBadge()}
                    </div>
                </div>
            </div>
        </div>
    );
}
