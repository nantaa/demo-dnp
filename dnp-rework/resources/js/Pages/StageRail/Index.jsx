import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import StageRailNav from '@/Components/StageRailNav';
import WorkQueueList from '@/Components/WorkQueueList';
import JobDetailSheet from '@/Components/JobDetailSheet';
import JobFamilyDrawer from '@/Components/JobFamilyDrawer';
import { STAGES } from '@/Constants';
import { showConfirm, showSuccess } from '@/swal';
import {
    Columns, SlidersHorizontal, Plus, Trash2, Sparkles, Filter, CheckCircle2,
    Layers, ArrowRight
} from 'lucide-react';

export default function StageRailIndex({ jobs = [], auth = {} }) {
    const { permissions } = auth;
    const [selectedStageId, setSelectedStageId] = useState(1);
    const [selectedJob, setSelectedJob] = useState(null);
    const [familyDrawerJob, setFamilyDrawerJob] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState('all');

    // Auto-select first stage with active jobs if stage 1 is empty on initial load
    useEffect(() => {
        const stage1Jobs = jobs.filter(j => j.stage === 1);
        if (stage1Jobs.length === 0 && jobs.length > 0) {
            const firstActiveStage = STAGES.find(s => jobs.some(j => j.stage === s.id));
            if (firstActiveStage) {
                setSelectedStageId(firstActiveStage.id);
            }
        }
    }, []);

    // Live background polling sync to keep Stage Rail updated across all active users
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

    const selectedStage = STAGES.find(s => s.id === selectedStageId) || STAGES[0];

    const handleClearAllJobs = async () => {
        const res = await showConfirm(
            'Kosongkan Database Job',
            'Apakah Anda yakin ingin menghapus SELURUH data Job dari database? Tindakan ini tidak dapat dibatalkan!',
            'Hapus Semua Data',
            'Batal'
        );
        if (res.isConfirmed) {
            router.delete('/jobs/clear-all', {
                onSuccess: () => {
                    showSuccess('Berhasil', 'Seluruh data Job berhasil dikosongkan.');
                    setSelectedJob(null);
                }
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Stage Rail & Work Queue" />

            {/* Top Bar: Title, Switcher Toggle & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <SlidersHorizontal size={20} className="text-[#00A8E8]" />
                        Stage Rail & Work Queue
                    </h1>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                        {jobs.length} Job Total
                    </span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                        <Sparkles size={11} className="text-emerald-600" /> New Comparative View
                    </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    {/* View Switcher Toggle */}
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
                        <Link
                            href="/kanban"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            title="Buka 17-Column Kanban Board"
                        >
                            <Columns size={13} />
                            <span>Kanban</span>
                        </Link>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-white text-[#0A385C] shadow-sm"
                            title="Active: Stage Rail + Work Queue"
                        >
                            <SlidersHorizontal size={13} className="text-[#00A8E8]" />
                            <span>Stage Rail</span>
                        </button>
                    </div>

                    {['marketing', 'manager', 'superadmin'].includes(auth?.user?.role) && (
                        <Link
                            href="/jobs/create"
                            className="bg-black hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                            <Plus size={14} /> Job Baru
                        </Link>
                    )}

                    {(auth?.user?.role === 'superadmin' || permissions === 'superadmin') && (
                        <button
                            onClick={handleClearAllJobs}
                            className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                            title="Kosongkan database (Superadmin)"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Phase Tabs Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
                {[
                    { id: 'all', label: 'Semua Fase (All Phases)' },
                    { id: 'ru_lapangan', label: 'Fase 1: RU Lapangan (S1–S4d)' },
                    { id: 'laporan_dinas', label: 'Fase 2: Laporan & Dinas (S5–S9)' },
                    { id: 'invoice_delivery', label: 'Fase 3: Invoice & Delivery (S10–S12)' },
                ].map(p => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPhase(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                            selectedPhase === p.id
                                ? 'bg-[#0A385C] text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Stage Rail Navigation */}
            <StageRailNav
                stages={STAGES}
                selectedStageId={selectedStageId}
                onSelectStage={(stageId) => setSelectedStageId(stageId)}
                jobs={jobs}
                selectedPhase={selectedPhase}
            />

            {/* Main Stage Work Queue */}
            <div className="mt-4">
                <WorkQueueList
                    stage={selectedStage}
                    jobs={jobs}
                    auth={auth}
                    onSelectJob={(job) => setSelectedJob(job)}
                    onOpenFamilyDrawer={(job) => setFamilyDrawerJob(job)}
                />
            </div>

            {/* Job Detail Sheet (Shared with Kanban for 100% feature parity) */}
            {selectedJob && (
                <JobDetailSheet
                    job={selectedJob}
                    auth={auth}
                    onClose={() => {
                        setSelectedJob(null);
                        router.reload({ only: ['jobs'], preserveScroll: true, preserveState: true });
                    }}
                />
            )}

            {/* Job Family Drawer */}
            {familyDrawerJob && (
                <JobFamilyDrawer
                    job={familyDrawerJob}
                    onClose={() => setFamilyDrawerJob(null)}
                    onSelectJob={(job) => {
                        setFamilyDrawerJob(null);
                        setSelectedJob(job);
                    }}
                />
            )}
        </AppLayout>
    );
}
