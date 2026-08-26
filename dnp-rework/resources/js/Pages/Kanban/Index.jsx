import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import KanbanColumn from '@/Components/KanbanColumn';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { STAGES } from '@/Constants';
import { showConfirm, showSuccess } from '@/swal';
import { Trash2, Plus } from 'lucide-react';

export default function KanbanIndex({ jobs, auth }) {
    const { permissions } = auth;
    const [selectedJob, setSelectedJob] = useState(null);

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
        if (permissions === 'superadmin') return true;
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

    return (
        <AppLayout>
            <Head title="Kanban Board" />
            
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">Kanban Board</h1>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                        Total {jobs.length} Job
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {['marketing', 'manager', 'superadmin'].includes(auth.user.role) && (
                        <Link href={route('jobs.create')} className="bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                            <Plus size={14} /> + Job Baru
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

            <div className="flex h-full overflow-x-auto space-x-4 pb-4">
                {STAGES.map((stage) => {
                    const hasViewPermission = canViewStage(stage.id);
                    const columnJobs = jobs.filter(j => {
                        if (j.stage !== stage.id) return false;
                        if (permissions === 'superadmin') return true;
                        if (auth.user.role === 'marketing' && j.owner_marketing === auth.user.name) {
                            return true;
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
                            stageNumber={stage.displayId || stage.id}
                            title={stage.name} 
                            count={columnJobs.length}
                            isLocked={isLocked}
                        >
                            {columnJobs.map(job => (
                                <div 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className="bg-white p-3.5 mb-2 rounded-xl shadow-xs border border-slate-200/90 cursor-pointer hover:border-[#00A8E8] hover:shadow-md transition-all group relative overflow-hidden"
                                >
                                    {/* DNP Accent Line Indicator */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A385C] to-[#00A8E8] opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full text-[#0A385C] border border-slate-200">
                                            {job.kode}
                                        </span>
                                        {job.units > 1 && (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#E0F2FE] text-[#0A385C] rounded-full border border-[#00A8E8]/30">
                                                {job.units} Unit
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 group-hover:text-[#0A385C] transition-colors">{job.klien}</h3>
                                    <p className="text-xs text-slate-500 mb-2 truncate">{job.pesawat} • {job.lokasi}</p>

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
                            ))}
                        </KanbanColumn>
                    );
                })}
            </div>

            {selectedJob && (
                <JobDetailSheet 
                    key={selectedJob.id}
                    job={jobs.find(j => j.id === selectedJob.id) || selectedJob} 
                    onClose={() => setSelectedJob(null)} 
                    auth={auth} 
                />
            )}
        </AppLayout>
    );
}
