import React, { useState, useEffect, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import KanbanColumn from '@/Components/KanbanColumn';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { STAGES, PIC_THEMES, getRoleTheme } from '@/Constants';
import { showConfirm, showSuccess } from '@/swal';
import { Trash2, Plus, Archive, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function KanbanIndex({ jobs, auth }) {
    const { permissions } = auth;
    const isINS = ['inspektur', 'inspector', 'tim_ru'].includes(auth?.user?.role);
    const isSuperadmin = auth?.user?.role === 'superadmin' || permissions === 'superadmin';
    const [selectedJob, setSelectedJob] = useState(null);
    const [showSelesai, setShowSelesai] = useState(false);
    const [cornerWaveStyle, setCornerWaveStyle] = useState('ref-subtle'); // 'ref-subtle' (user-selected alternative 4) | 'ref-large' | 'ref-high' | 'ref-standard' | 'ref-vibrant' | 'none'

    // Jira-Style Collapsible Columns state with localStorage persistence
    const [collapsedStages, setCollapsedStages] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = localStorage.getItem('dnp_kanban_collapsed_stages');
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });


    const toggleStageCollapse = (stageId) => {
        setCollapsedStages(prev => {
            const next = prev.includes(stageId)
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId];
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    localStorage.setItem('dnp_kanban_collapsed_stages', JSON.stringify(next));
                } catch (e) { }
            }
            return next;
        });
    };

    const visibleStages = STAGES.filter(stage => !stage.hidden || (isSuperadmin && showSelesai));
    const isAllCollapsed = visibleStages.length > 0 && visibleStages.every(s => collapsedStages.includes(s.id));

    const toggleAllColumns = () => {
        if (isAllCollapsed) {
            setCollapsedStages([]);
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    localStorage.setItem('dnp_kanban_collapsed_stages', JSON.stringify([]));
                } catch (e) { }
            }
        } else {
            const allIds = visibleStages.map(s => s.id);
            setCollapsedStages(allIds);
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    localStorage.setItem('dnp_kanban_collapsed_stages', JSON.stringify(allIds));
                } catch (e) { }
            }
        }
    };

    // Refs and state for horizontal (side) scrollbar synchronization
    const boardRef = useRef(null);
    const topScrollRef = useRef(null);
    const isSyncingRef = useRef(false);
    const isSyncingDriverRef = useRef(null); // 'board' | 'top' | null
    const isSyncingTimeoutRef = useRef(null);
    const [boardScrollWidth, setBoardScrollWidth] = useState(0);

    // Track scroll width of board container dynamically with threshold diffing to prevent re-render loops
    useEffect(() => {
        const updateWidth = () => {
            if (boardRef.current) {
                const sw = boardRef.current.scrollWidth;
                setBoardScrollWidth(prev => (Math.abs(prev - sw) > 2 ? sw : prev));
            }
        };
        updateWidth();

        let ro = null;
        if (typeof window !== 'undefined' && window.ResizeObserver && boardRef.current) {
            ro = new window.ResizeObserver(() => updateWidth());
            ro.observe(boardRef.current);
        }
        window.addEventListener('resize', updateWidth);

        return () => {
            if (ro) ro.disconnect();
            window.removeEventListener('resize', updateWidth);
            if (isSyncingTimeoutRef.current) {
                clearTimeout(isSyncingTimeoutRef.current);
            }
        };
    }, [jobs, showSelesai]);

    // Butter-smooth bi-directional scroll handlers with active driver lock
    // Prevents echo scroll event desync, frame drops, and backward position jumping during fast side scrolling
    const handleTopScroll = () => {
        if (isSyncingDriverRef.current === 'board') return;
        isSyncingDriverRef.current = 'top';
        isSyncingRef.current = true;

        if (boardRef.current && topScrollRef.current) {
            if (boardRef.current.scrollLeft !== topScrollRef.current.scrollLeft) {
                boardRef.current.scrollLeft = topScrollRef.current.scrollLeft;
            }
        }

        if (isSyncingTimeoutRef.current) {
            clearTimeout(isSyncingTimeoutRef.current);
        }
        isSyncingTimeoutRef.current = setTimeout(() => {
            isSyncingDriverRef.current = null;
            isSyncingRef.current = false;
        }, 100);
    };

    const handleBoardScroll = () => {
        if (isSyncingDriverRef.current === 'top') return;
        isSyncingDriverRef.current = 'board';
        isSyncingRef.current = true;

        if (boardRef.current && topScrollRef.current) {
            if (topScrollRef.current.scrollLeft !== boardRef.current.scrollLeft) {
                topScrollRef.current.scrollLeft = boardRef.current.scrollLeft;
            }
        }

        if (isSyncingTimeoutRef.current) {
            clearTimeout(isSyncingTimeoutRef.current);
        }
        isSyncingTimeoutRef.current = setTimeout(() => {
            isSyncingDriverRef.current = null;
            isSyncingRef.current = false;
        }, 100);
    };

    const scrollByStage = (direction) => {
        if (boardRef.current) {
            boardRef.current.scrollBy({ left: 340 * direction, behavior: 'smooth' });
        }
    };

    const scrollToStage = (stageDisplayId, stageId) => {
        // If the target stage is currently collapsed, uncollapse it automatically so the user can see its contents
        if (stageId && collapsedStages.includes(stageId)) {
            const next = collapsedStages.filter(id => id !== stageId);
            setCollapsedStages(next);
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    localStorage.setItem('dnp_kanban_collapsed_stages', JSON.stringify(next));
                } catch (e) { }
            }
        }

        setTimeout(() => {
            const el = document.getElementById(`col-stage-${stageDisplayId}`);
            if (el && boardRef.current) {
                const boardRect = boardRef.current.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const leftOffset = elRect.left - boardRect.left + boardRef.current.scrollLeft - 16;
                boardRef.current.scrollTo({ left: Math.max(0, leftOffset), behavior: 'smooth' });
            }
        }, 40);
    };

    // Live background polling sync to keep Kanban updated across all active users
    useEffect(() => {
        const syncInterval = setInterval(() => {
            // Do not interrupt in-flight uploads, stage moves, or active modal mutations
            if (typeof document !== 'undefined' && document.querySelector('[data-dnp-busy="true"]')) {
                return;
            }
            router.reload({
                only: ['jobs'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000); // 10 seconds background refresh

        return () => clearInterval(syncInterval);
    }, []);

    // Live update open job modal whenever jobs data updates from server
    useEffect(() => {
        if (selectedJob) {
            const freshJob = (jobs || []).find(j => j.id === selectedJob.id);
            if (freshJob) {
                setSelectedJob(freshJob);
            }
        }
    }, [jobs]);

    const canManageStage = (stageId) => {
        const sId = Number(stageId);
        if (isSuperadmin) return true;
        if (auth.user?.role === 'admin' && [2, 3, 7, 8, 9].includes(sId)) return true;
        if (['inspektur', 'inspector', 'tim_ru'].includes(auth.user?.role) && [4, 5].includes(sId)) return true;
        if (auth.user?.role === 'finance' && [10, 12, 14].includes(sId)) return true;
        if (auth.user?.role === 'marketing' && [1, 11, 13, 15].includes(sId)) return true;
        if (auth.user?.role === 'manager' && ![1, 10, 11, 12, 13, 14, 15, 16].includes(sId)) return true;
        const perm = permissions?.[sId] || permissions?.[stageId];
        return perm && (perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1');
    };

    const canViewStage = (stageId) => {
        const sId = Number(stageId);
        if (isSuperadmin || auth.user?.role === 'admin' || auth.user?.role === 'manager') return true;
        if (['inspektur', 'inspector', 'tim_ru'].includes(auth.user?.role)) return true;
        const perm = permissions?.[sId] || permissions?.[stageId];
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

            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">Kanban Board</h1>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                        Total {jobs.length} Job
                    </span>

                    {/* Quick Horizontal Scroll Nav Buttons */}
                    <div className="flex items-center ml-2 bg-white border border-slate-300 rounded-lg p-0.5 shadow-xs">
                        <button
                            type="button"
                            onClick={() => scrollByStage(-1)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                            title="Geser Kanban ke Kiri"
                            aria-label="Geser Kanban ke Kiri"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="w-[1px] h-3.5 bg-slate-200" />
                        <button
                            type="button"
                            onClick={() => scrollByStage(1)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                            title="Geser Kanban ke Kanan"
                            aria-label="Geser Kanban ke Kanan"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Jira-Style Master Collapse/Expand Toggle (Fits all 15 stages in 1 single frame) */}
                    <button
                        type="button"
                        onClick={toggleAllColumns}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-300 shadow-2xs ml-1 select-none"
                        title={isAllCollapsed ? "Buka Semua Kolom (Expand All)" : "Kecilkan Semua Kolom ke 1 Layar Penuh (Jira Collapse All)"}
                    >
                        {isAllCollapsed ? (
                            <>
                                <ChevronsRight size={14} className="text-[#00A8E8]" />
                                <span>Buka Semua</span>
                            </>
                        ) : (
                            <>
                                <ChevronsLeft size={14} className="text-[#00A8E8]" />
                                <span>Tutup Semua</span>
                            </>
                        )}
                    </button>

                </div>
                <div className="flex items-center gap-2">

                    {['marketing', 'manager'].includes(auth.user.role) && (
                        <Link href={route('jobs.create')} className="bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                            <Plus size={14} /> Job Baru
                        </Link>
                    )}
                    {isSuperadmin && (
                        <button
                            onClick={() => setShowSelesai(s => !s)}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-xs transition ${showSelesai
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                            title="Tampilkan / Sembunyikan kolom arsip job Selesai pada Kanban board"
                        >
                            <Archive size={14} />
                            {showSelesai ? 'Sembunyikan Arsip Selesai' : 'Arsip Selesai'}
                            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-black ${showSelesai ? 'bg-white text-emerald-800' : 'bg-emerald-700 text-white'
                                }`}>
                                {jobs.filter(j => j.stage === 16).length}
                            </span>
                        </button>
                    )}
                    {isSuperadmin && (
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

            {/* Quick Navigation Number Buttons Strip (v3 Style - Numbers Only, Divided by Processes) */}
            {(() => {
                const PROCESS_GROUPS = [
                    { id: 'fase-1', title: 'Fase 1: Pre-Field & RU', stageIds: [1, 2, 3, 4, 13] },
                    { id: 'fase-2', title: 'Fase 2: Laporan & Dinas', stageIds: [5, 6, 7, 8, 9] },
                    { id: 'fase-3', title: 'Fase 3: Invoice & Suket', stageIds: [10, 11, 14, 15, 12, 16] },
                ];
                return (
                    <div className="flex items-center gap-2.5 overflow-x-auto py-1.5 px-2 mb-2.5 bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-2xs select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 px-1">
                            Lompat:
                        </span>
                        {PROCESS_GROUPS.map((phase, pIdx) => {
                            const phaseStages = visibleStages.filter(s => phase.stageIds.includes(s.id));
                            if (phaseStages.length === 0) return null;

                            return (
                                <React.Fragment key={phase.id}>
                                    {pIdx > 0 && <div className="h-4 w-px bg-slate-200 shrink-0" />}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mr-0.5 shrink-0">
                                            {phase.title}:
                                        </span>
                                        {phaseStages.map((stage) => {
                                            const count = jobs.filter(j => j.stage === stage.id).length;
                                            const theme = getRoleTheme(stage.role);
                                            const displayId = stage.displayId || stage.id;
                                            const isCollapsed = collapsedStages.includes(stage.id);

                                            return (
                                                <button
                                                    key={stage.id}
                                                    type="button"
                                                    onClick={() => scrollToStage(displayId, stage.id)}
                                                    className={`group shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                                                        isCollapsed
                                                            ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-xs'
                                                    }`}
                                                    title={`Stage ${displayId}: ${stage.title || stage.name} (${count} Job)${isCollapsed ? ' — Klik untuk membuka kolom' : ''}`}
                                                >
                                                    <span
                                                        className="min-w-[20px] h-5 px-1 flex items-center justify-center rounded text-[10px] text-white font-black shadow-2xs transition-transform group-hover:scale-105"
                                                        style={{ backgroundColor: theme.primary }}
                                                    >
                                                        {displayId}
                                                    </span>
                                                    {count > 0 ? (
                                                        <span
                                                            className="text-[10px] px-1.5 py-0.2 rounded-full font-black text-white shrink-0"
                                                            style={{ backgroundColor: theme.primary }}
                                                        >
                                                            {count}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-semibold px-0.5">
                                                            0
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                );
            })()}

            {/* Top horizontal (side) scrollbar synchronized with the Kanban board */}
            <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-auto overflow-y-hidden mb-3 bg-slate-200/90 hover:bg-slate-200 border border-slate-300 rounded-lg p-0.5 sticky top-0 z-10 transition-colors shadow-xs overscroll-x-contain"
                style={{ height: '14px' }}
                title="Geser ke samping untuk melihat seluruh stage Kanban"
            >
                <div style={{ width: `${boardScrollWidth || 4500}px`, height: '1px' }} />
            </div>

            {/* Corner Wave Background Layering (Exact Reference Wave with Calibrated Proportional Scaling) */}
            {cornerWaveStyle !== 'none' && (() => {
                const configs = {
                    'ref-100': {
                        container: 'w-[1350px] h-[380px]',
                        wrapper: '-bottom-[160px] right-0 w-[1350px] h-[540px]',
                        v630: 'w-[1125px] right-[170px] bottom-0',
                        v632: 'w-[1350px] right-[-255px] -bottom-[90px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                    'ref-80': {
                        container: 'w-[1080px] h-[304px]',
                        wrapper: '-bottom-[128px] right-0 w-[1080px] h-[432px]',
                        v630: 'w-[900px] right-[136px] bottom-0',
                        v632: 'w-[1080px] right-[-204px] -bottom-[72px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                    'ref-65': {
                        container: 'w-[878px] h-[247px]',
                        wrapper: '-bottom-[104px] right-0 w-[878px] h-[351px]',
                        v630: 'w-[731px] right-[110px] bottom-0',
                        v632: 'w-[878px] right-[-166px] -bottom-[58px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                    'ref-50': {
                        container: 'w-[675px] h-[190px]',
                        wrapper: '-bottom-[80px] right-0 w-[675px] h-[270px]',
                        v630: 'w-[562px] right-[85px] bottom-0',
                        v632: 'w-[675px] right-[-128px] -bottom-[45px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                    'ref-35': {
                        container: 'w-[472px] h-[133px]',
                        wrapper: '-bottom-[56px] right-0 w-[472px] h-[189px]',
                        v630: 'w-[394px] right-[60px] bottom-0',
                        v632: 'w-[472px] right-[-89px] -bottom-[32px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                    // Legacy & Descriptive aliases
                    'ref-subtle': {
                        container: 'w-[878px] h-[247px]',
                        wrapper: '-bottom-[104px] right-0 w-[878px] h-[351px]',
                        v630: 'w-[731px] right-[110px] bottom-0',
                        v632: 'w-[878px] right-[-166px] -bottom-[58px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                    'ref-large': {
                        container: 'w-[1350px] h-[380px]',
                        wrapper: '-bottom-[160px] right-0 w-[1350px] h-[540px]',
                        v630: 'w-[1125px] right-[170px] bottom-0',
                        v632: 'w-[1350px] right-[-255px] -bottom-[90px]',
                        opacity: 'opacity-100',
                        gradStops: ['#4ABFF0', 1, '#4ABFF0', 0],
                        baseOpacity: '0.41',
                    },
                };
                const cfg = configs[cornerWaveStyle] || configs['ref-65'] || configs['ref-100'];

                return (
                    <div
                        className={`fixed bottom-0 right-0 ${cfg.container} pointer-events-none z-10 select-none overflow-hidden ${cfg.opacity}`}
                        aria-hidden="true"
                    >
                        <div className={`absolute ${cfg.wrapper} pointer-events-none z-0 select-none overflow-visible`}>
                            {/* Vector 630: Soft Base Wave (Checkmarked Position) */}
                            <svg
                                viewBox="0 0 178 68"
                                fill="none"
                                className={`absolute ${cfg.v630} h-auto max-w-none select-none`}
                            >
                                <path
                                    opacity={cfg.baseOpacity}
                                    d="M0.158887 41.0282L9.18329e-06 67.9551C95.2567 18.2973 106.604 2.27715 177.059 21.0089C120.265 -10.6205 84.6216 -8.5443 0.158887 41.0282Z"
                                    fill="#B1DFF7"
                                />
                            </svg>

                            {/* Vector 632: Cyan Gradient Wave (Shifted Right & Lowered) */}
                            <svg
                                viewBox="0 0 213 84"
                                fill="none"
                                className={`absolute ${cfg.v632} h-auto max-w-none select-none`}
                            >
                                <path
                                    d="M212.508 83.3342L212.652 58.8123C161.854 31.5198 128.227 12.2315 105.172 4.58484C57.946 -7.88466 33.6576 7.09955 -2.05659e-06 25.3391C-2.05659e-06 25.3391 51.2766 3.87579 94.6169 22.458C137.957 41.0401 212.508 83.3342 212.508 83.3342Z"
                                    fill="url(#ref_board_wave_grad)"
                                />
                                <defs>
                                    <linearGradient id="ref_board_wave_grad" x1="43.5112" y1="11.3829" x2="135.756" y2="-40.0729" gradientUnits="userSpaceOnUse">
                                        <stop stopColor={cfg.gradStops[0]} stopOpacity={cfg.gradStops[1]} />
                                        <stop offset="1" stopColor={cfg.gradStops[2]} stopOpacity={cfg.gradStops[3]} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                );
            })()}

            <div
                ref={boardRef}
                onScroll={handleBoardScroll}
                className="flex h-full overflow-x-auto space-x-4 pb-4 relative min-h-[calc(100vh-210px)] w-full min-w-full overscroll-x-contain"
            >
                {/* Render pipeline stages — include Stage 16 (Selesai / Arsip) when Superadmin enables showSelesai */}
                {STAGES.filter(stage => !stage.hidden || (isSuperadmin && showSelesai)).map((stage) => {
                    const hasViewPermission = canViewStage(stage.id);
                    const columnJobs = jobs.filter(j => {
                        if (j.stage !== stage.id) return false;
                        if (isSuperadmin) return true;
                        if (auth.user.role === 'marketing') {
                            return j.owner_marketing === auth.user.name;
                        }
                        if (['inspektur', 'inspector'].includes(auth.user?.role)) {
                            const uId = String(auth.user?.id);
                            return (j.inspectors || []).some(ins =>
                                String(ins.id) === uId ||
                                String(ins.user_id) === uId ||
                                String(ins.pivot?.inspector_id) === uId ||
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
                            role={stage.role}
                            noTopBorder={true}
                            isCollapsed={collapsedStages.includes(stage.id)}
                            onToggleCollapse={() => toggleStageCollapse(stage.id)}
                        >
                            {columnJobs.map(job => (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="bg-white p-3.5 mb-2 rounded-xl shadow-xs border border-slate-200/90 cursor-pointer hover:border-[#00A8E8] hover:shadow-md transition-all group relative z-20 overflow-hidden"
                                >
                                    {/* Aksen Kiri Bar: Role-colored solid pill indicator on card left edge */}
                                    <div
                                        className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-xl transition-all"
                                        style={{
                                            backgroundColor: job.stage === 16
                                                ? '#35B558'
                                                : (PIC_THEMES[stage.role]?.primary || '#00A8E8')
                                        }}
                                    />

                                    {/* Main Card Content */}
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
                                        <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 group-hover:text-[#0A385C] transition-colors">{job.klien}</h3>
                                        <p className="text-xs text-slate-500 mb-2 truncate">{job.pesawat} • {job.lokasi}</p>

                                        {/* Stage 8 Disnaker Status Banner & Delay Reason */}
                                        {job.stage === 8 && (() => {
                                            const sMap = {
                                                progress: { label: 'PROSES DISNAKER', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
                                                stuck: { label: 'TERKENDALA', cls: 'bg-red-50 text-red-800 font-bold border-red-200' },
                                                ready: { label: 'SELESAI DISNAKER', cls: 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200' },
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
                                                diterima: { label: 'DITERIMA', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
                                                scan: { label: 'SCAN', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
                                                penamaan_cover: { label: 'PENAMAAN COVER', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                                                pembuatan_tanda_terima: { label: 'PEMBUATAN TANDA TERIMA', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
                                                selesai: { label: 'SELESAI', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
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

                                        {/* Divider line above MKT personnel: solid color accent matching PIC role */}
                                        <div
                                            className="mt-3 flex justify-between items-center text-[10px] text-slate-400 pt-2 relative z-10 transition-colors border-t-2"
                                            style={{
                                                borderTopColor: PIC_THEMES[stage.role]?.primary || '#00A8E8'
                                            }}
                                        >
                                            <span className="font-medium text-slate-500">MKT: <strong className="text-slate-700">{job.owner_marketing}</strong></span>
                                            {(() => {
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
                                                        stuck: { label: 'TERKENDALA', cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                                                        ready: { label: 'SELESAI DISNAKER', cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
                                                    };
                                                    const badge = sMap[job.s8_progress_status];
                                                    if (badge) {
                                                        return <span className={`px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>;
                                                    }
                                                }

                                                if (job.stage === 9 && job.s9_progress_status) {
                                                    const s9Map = {
                                                        // New Operational Suket Workflow Statuses
                                                        diterima: { label: 'DITERIMA', cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                                                        scan: { label: 'SCAN', cls: 'bg-purple-100 text-purple-800 font-bold border-purple-300' },
                                                        penamaan_cover: { label: 'PENAMAAN COVER', cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                                                        pembuatan_tanda_terima: { label: 'TANDA TERIMA', cls: 'bg-cyan-100 text-cyan-800 font-bold border-cyan-300' },
                                                        selesai: { label: 'SELESAI', cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
                                                        // Legacy fallbacks
                                                        not_started: { label: 'NOT STARTED', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                                                        delayed: { label: 'DELAYED', cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                                                        in_progress: { label: 'IN PROGRESS', cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                                                        almost_done: { label: 'ALMOST DONE', cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                                                        done: { label: 'DONE', cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
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
                                            })()}
                                        </div>
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
