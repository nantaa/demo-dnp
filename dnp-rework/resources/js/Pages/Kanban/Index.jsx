import React, { useState, useEffect, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import KanbanColumn from '@/Components/KanbanColumn';
import JobDetailSheet from '@/Components/JobDetailSheet';
import JobFamilyDrawer from '@/Components/JobFamilyDrawer';
import { STAGES } from '@/Constants';
import { showConfirm, showSuccess } from '@/swal';
import { Trash2, Plus, ChevronLeft, ChevronRight, Layers, Sparkles, GitFork, ArrowRight, Columns, SlidersHorizontal } from 'lucide-react';

export default function KanbanIndex({ jobs, auth }) {
    const { permissions } = auth;
    const [selectedJob, setSelectedJob] = useState(null);
    const [familyDrawerJob, setFamilyDrawerJob] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState('all');
    const boardRef = useRef(null);

    // Helper to get actionable next prompt
    const getNextActionPrompt = (job) => {
        if (job.stage === 1) return 'MKT: Lengkapi PO & Verifikasi DP';
        if (job.stage === 2) return 'Admin: Verifikasi 10 Dokumen Teknis';
        if (job.stage === 3) return 'Admin: Terbitkan Surat Tugas & Tim';
        if (job.stage === 4) return 'Inspektur: Pelaksanaan RU & Upload BAP';
        if (job.stage === 13) return 'MKT: Rekonsiliasi & Opsi Job Split';
        if (job.stage === 16) return 'Admin: Penjadwalan Ulang (S4c)';
        if (job.stage === 17) return 'Inspektur: Pelaksanaan RU Ulang (S4d)';
        if (job.stage === 5) return 'Tim Ahli: Penyusunan Konsep LHPP';
        if (job.stage === 6) return 'Kadiv/QC: Review Kelayakan Teknis';
        if (job.stage === 7) return 'Admin: Pembentukan Batch Disnaker';
        if (job.stage === 8) return 'Admin: Monitoring Proses Dinas';
        if (job.stage === 9) return 'Admin: Pengurusan Terbit SUKET';
        if (job.stage === 10) return 'Finance: Penerbitan Faktur Invoice';
        if (job.stage === 11) return 'MKT: Penagihan Pembayaran Klien';
        if (job.stage === 15) return 'Finance: Validasi Mutasi Bank (11c)';
        if (job.stage === 14) return 'MKT: Pengiriman SUKET (11b)';
        if (job.stage === 12) return 'Selesai & Closed';
        return null;
    };

    // Live background polling sync to keep Kanban updated across all active users
    useEffect(() => {
        const syncInterval = setInterval(() => {
            router.reload({
                only: ['jobs'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000); // 10 seconds background refresh

        return () => clearInterval(syncInterval);
    }, []);

    const canManageStage = (stageId) => {
        if (permissions === 'superadmin' || auth.user.role === 'superadmin') return true;
        if (auth.user.role === 'marketing' && [1, 13, 11, 14].includes(stageId)) return true;
        if (auth.user.role === 'admin' && [2, 3, 16, 5, 7, 8, 9].includes(stageId)) return true;
        if (auth.user.role === 'inspektur' && [4, 17].includes(stageId)) return true;
        if (auth.user.role === 'manager' && [6, 2, 3, 5, 7, 8, 9].includes(stageId)) return true;
        if (auth.user.role === 'finance' && [10, 15, 12].includes(stageId)) return true;
        const perm = permissions?.[stageId];
        return perm && (perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1');
    };

    const canViewStage = (stageId) => {
        if (permissions === 'superadmin' || auth.user.role === 'admin' || auth.user.role === 'manager') return true;
        if (auth.user.role === 'inspektur') return true;
        const perm = permissions?.[stageId];
        return perm && (
            perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
            perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
        );
    };

    const handleClearAllJobs = async () => {
        const res = await showConfirm(
            'Kosongkan Database Job',
            'Apakah Anda yakin ingin menghapus SELURUH data Job dari database? Tindakan ini akan menghapus semua job di Kanban board!',
            'Hapus Semua Data',
            'Batal'
        );
        if (res.isConfirmed) {
            router.delete('/jobs/clear-all', {
                onSuccess: () => {
                    showSuccess('Berhasil', 'Seluruh data Job dan Kanban berhasil dikosongkan.');
                    setSelectedJob(null);
                }
            });
        }
    };

    const handleScroll = (direction) => {
        if (boardRef.current) {
            boardRef.current.scrollBy({ left: direction * 500, behavior: 'smooth' });
        }
    };

    const scrollToStage = (stageDisplayId) => {
        const el = document.getElementById(`col-stage-${stageDisplayId}`);
        if (el && boardRef.current) {
            const boardRect = boardRef.current.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const leftOffset = elRect.left - boardRect.left + boardRef.current.scrollLeft - 16;
            boardRef.current.scrollTo({ left: Math.max(0, leftOffset), behavior: 'smooth' });
        }
    };

    const isDeltaStage = (displayId) => ['4b', '4c', '4d', '11c', '11b'].includes(String(displayId).toLowerCase());

    const filteredStages = STAGES.filter(stage => {
        if (selectedPhase === 'all') return true;
        if (selectedPhase === 'ru') return [1, 2, 3, 4, 13, 16, 17].includes(stage.id);
        if (selectedPhase === 'teknis') return [5, 6, 7, 8, 9].includes(stage.id);
        if (selectedPhase === 'finance') return [10, 11, 15, 14, 12].includes(stage.id);
        return true;
    });

    return (
        <AppLayout>
            <Head title="Kanban Board" />
            
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Columns size={20} className="text-[#00A8E8]" />
                        Kanban Board
                    </h1>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                        Total {jobs.length} Job
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-600" /> Delta v2.0 (17 Stages)
                    </span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    {/* View Switcher Toggle */}
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
                        <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-white text-[#0A385C] shadow-sm"
                            title="Active: 17-Column Kanban Board"
                        >
                            <Columns size={13} className="text-[#00A8E8]" />
                            <span>Kanban</span>
                        </button>
                        <Link
                            href="/stage-rail"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            title="Buka Stage Rail & Work Queue View"
                        >
                            <SlidersHorizontal size={13} />
                            <span>Stage Rail</span>
                        </Link>
                    </div>

                    {['marketing', 'manager'].includes(auth.user.role) && (
                        <Link href={route('jobs.create')} className="bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                            <Plus size={14} /> Job Baru
                        </Link>
                    )}
                    {(auth.user.role === 'superadmin' || permissions === 'superadmin') && (
                        <button
                            onClick={handleClearAllJobs}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-xs"
                            title="Kosongkan SELURUH database Job (Superadmin Special)"
                        >
                            <Trash2 size={14} /> Kosongkan Database Job
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Navigation & Phase Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 mb-3 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Layers size={13} className="text-[#00A8E8]" /> Filter Fase:
                        </span>
                        <button
                            onClick={() => setSelectedPhase('all')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPhase === 'all' ? 'bg-[#0A385C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Semua Stage (17)
                        </button>
                        <button
                            onClick={() => setSelectedPhase('ru')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPhase === 'ru' ? 'bg-[#0A385C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Fase 1: RU Lapangan (1 - 4d)
                        </button>
                        <button
                            onClick={() => setSelectedPhase('teknis')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPhase === 'teknis' ? 'bg-[#0A385C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Fase 2: Laporan & Dinas (5 - 9)
                        </button>
                        <button
                            onClick={() => setSelectedPhase('finance')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPhase === 'finance' ? 'bg-[#0A385C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Fase 3: Invoice & SUKET (10 - 12)
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleScroll(-1)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold px-2"
                                title="Scroll Kiri"
                            >
                                <ChevronLeft size={16} /> Geser Kiri
                            </button>
                            <button
                                onClick={() => handleScroll(1)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold px-2"
                                title="Scroll Kanan"
                            >
                                Geser Kanan <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stage Quick Jump Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase shrink-0 mr-1">Lompat ke:</span>
                    {STAGES.map(stage => {
                        const count = jobs.filter(j => j.stage === stage.id).length;
                        const isDelta = isDeltaStage(stage.displayId || stage.id);
                        return (
                            <button
                                key={stage.id}
                                onClick={() => scrollToStage(stage.displayId || stage.id)}
                                className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border transition-all ${
                                    isDelta 
                                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 ring-1 ring-amber-400/50' 
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={`Lompat ke Stage ${stage.displayId || stage.id}: ${stage.name}`}
                            >
                                <span className={`px-1.5 py-0.2 rounded text-[10px] text-white font-black ${isDelta ? 'bg-amber-600' : 'bg-[#0A385C]'}`}>
                                    {stage.displayId || stage.id}
                                </span>
                                <span className="truncate max-w-[90px]">{stage.short}</span>
                                {count > 0 ? (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isDelta ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'}`}>
                                        {count}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400">0</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div ref={boardRef} className="flex h-full overflow-x-auto space-x-4 pb-4">
                {filteredStages.map((stage) => {
                    const hasViewPermission = canViewStage(stage.id);
                    const columnJobs = jobs.filter(j => {
                        if (j.stage !== stage.id) return false;
                        if (permissions === 'superadmin') return true;
                        if (auth.user.role === 'marketing') {
                            return j.owner_marketing === auth.user.name;
                        }
                        if (auth.user.role === 'inspektur') {
                            const uId = String(auth.user.id);
                            return (j.inspectors || []).some(ins => 
                                String(ins.id) === uId || 
                                String(ins.user_id) === uId || 
                                String(ins.pivot?.user_id) === uId
                            ) || String(j.report_writer_id) === uId;
                        }
                        return hasViewPermission;
                    });
                    const isLocked = !canManageStage(stage.id);

                    return (
                        <KanbanColumn 
                            key={stage.id} 
                            id={`col-stage-${stage.displayId || stage.id}`}
                            stageNumber={stage.displayId || stage.id}
                            title={stage.name} 
                            count={columnJobs.length}
                            isLocked={isLocked}
                        >
                            {columnJobs.map(job => {
                                const isParent = job.job_type === 'PARENT' || Boolean(job.has_split);
                                const isChild = job.job_type === 'CHILD' || Boolean(job.parent_job_id);
                                const nextPrompt = getNextActionPrompt(job);

                                return (
                                    <div 
                                        key={job.id} 
                                        onClick={() => setSelectedJob(job)}
                                        className="bg-white p-3.5 mb-2 rounded-xl shadow-xs border border-slate-200/90 cursor-pointer hover:border-[#00A8E8] hover:shadow-md transition-all group relative overflow-hidden"
                                    >
                                        {/* DNP Accent Line Indicator */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A385C] to-[#00A8E8] opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Header Row: Kode & Parent/Child Badges */}
                                        <div className="flex justify-between items-start mb-2 gap-1.5 flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full text-[#0A385C] border border-slate-200">
                                                    {job.kode}
                                                </span>
                                                {isParent && (
                                                    <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                                                        PARENT
                                                    </span>
                                                )}
                                                {isChild && (
                                                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                                                        CHILD
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {(isParent || isChild) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFamilyDrawerJob(job);
                                                        }}
                                                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                        title="Buka Pohon Keluarga PO (Job Family)"
                                                    >
                                                        <GitFork size={12} className="text-indigo-600" />
                                                    </button>
                                                )}
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#E0F2FE] text-[#0A385C] rounded-full border border-[#00A8E8]/30">
                                                    {job.units || 1} Unit
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 group-hover:text-[#0A385C] transition-colors">{job.klien}</h3>
                                        <p className="text-xs text-slate-500 mb-2 truncate">{job.pesawat} • {job.lokasi}</p>

                                        {/* Next Required Action Prompter */}
                                        {nextPrompt && (
                                            <div className="my-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-semibold flex items-center gap-1.5 truncate">
                                                <ArrowRight size={12} className="text-[#00A8E8] shrink-0 font-bold" />
                                                <span className="truncate">{nextPrompt}</span>
                                            </div>
                                        )}

                                        {/* Inspector / Tim Pill Badges if assigned */}
                                        {job.inspectors && job.inspectors.length > 0 && (
                                            <div className="flex items-center gap-1 my-2 overflow-x-auto">
                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-[#0A385C] text-white rounded-full">
                                                    TIM
                                                </span>
                                                {job.inspectors.slice(0, 2).map((ins, i) => (
                                                    <span key={i} className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full border border-slate-200 truncate max-w-[80px]">
                                                        {ins.name || ins}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                                            <span className="font-medium text-slate-500">MKT: <strong className="text-slate-700">{job.owner_marketing}</strong></span>
                                            {(() => {
                                                if (job.stage === 4 && job.tgl_pelaksanaan) {
                                                    const today = new Date();
                                                    today.setHours(0,0,0,0);
                                                    const pelDate = new Date(job.tgl_pelaksanaan);
                                                    pelDate.setHours(0,0,0,0);
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
                                                        progress: { label: 'PROGRESS', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
                                                        stuck:    { label: 'STUCK',    cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                                                        ready:    { label: 'READY',    cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
                                                    };
                                                    const badge = sMap[job.s8_progress_status];
                                                    if (badge) {
                                                        return <span className={`px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>;
                                                    }
                                                }

                                                if (job.stage === 9 && job.s9_progress_status) {
                                                    const s9Map = {
                                                        not_started: { label: 'NOT STARTED', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                                                        delayed:     { label: 'DELAYED',     cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                                                        in_progress: { label: 'IN PROGRESS', cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                                                        almost_done: { label: 'ALMOST DONE', cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                                                        done:        { label: 'DONE',        cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
                                                    };
                                                    const badge = s9Map[job.s9_progress_status];
                                                    if (badge) {
                                                        return <span className={`px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>;
                                                    }
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
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </KanbanColumn>
                    );
                })}
            </div>

            {/* Job Detail Sheet Modal */}
            {selectedJob && (
                <JobDetailSheet 
                    key={selectedJob.id}
                    job={jobs.find(j => j.id === selectedJob.id) || selectedJob} 
                    onClose={() => setSelectedJob(null)} 
                    auth={auth} 
                />
            )}

            {/* Job Family Drawer Slide-over */}
            {familyDrawerJob && (
                <JobFamilyDrawer
                    job={familyDrawerJob}
                    allJobs={jobs}
                    onClose={() => setFamilyDrawerJob(null)}
                    onSelectJob={(j) => setSelectedJob(j)}
                />
            )}
        </AppLayout>
    );
}

