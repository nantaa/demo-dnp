import React from 'react';
import { Sparkles, AlertCircle, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { categorizeStagesByPhase } from '@domain/workflowEngine';

export default function StageRailNav({
    stages = [],
    selectedStageId = 1,
    onSelectStage,
    jobs = [],
    selectedPhase = 'all'
}) {
    const phases = categorizeStagesByPhase(stages);

    // Compute live stats per stage
    const getStageJobCount = (stageId) => jobs.filter(j => j.stage === stageId).length;
    const getStageOverdueCount = (stageId) => {
        return jobs.filter(j => {
            if (j.stage !== stageId) return false;
            const refDate = j.tgl_pelaksanaan || j.tgl_laporan_mulai || j.tgl_submit_disnaker || j.created_at;
            if (!refDate) return false;
            const days = Math.ceil((Date.now() - new Date(refDate).getTime()) / 86400000);
            return days > 3;
        }).length;
    };

    const isExceptionStage = (id) => [13, 16, 17].includes(id);

    const filteredPhases = phases.filter(phase => {
        if (selectedPhase === 'all') return true;
        return phase.id === selectedPhase;
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Pipeline Stages</span>
                    <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                        17 Stages Total
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Normal Flow</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <span>Rework / Loop</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {filteredPhases.map((phase) => {
                    const normalStages = phase.stages.filter(s => !isExceptionStage(s.id));
                    const exceptionStages = phase.stages.filter(s => isExceptionStage(s.id));
                    const phaseTotalJobs = phase.stages.reduce((acc, s) => acc + getStageJobCount(s.id), 0);

                    return (
                        <div
                            key={phase.id}
                            className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 tracking-tight">{phase.name}</h3>
                                        <p className="text-[10px] text-slate-500">{phase.short}</p>
                                    </div>
                                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${phaseTotalJobs > 0 ? 'bg-[#00A8E8]/10 text-[#0077A6] border border-[#00A8E8]/30' : 'bg-slate-200/60 text-slate-600'}`}>
                                        {phaseTotalJobs} Jobs
                                    </span>
                                </div>

                                {/* Primary Linear Flow */}
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {normalStages.map((stage) => {
                                            const isSelected = selectedStageId === stage.id;
                                            const count = getStageJobCount(stage.id);
                                            const overdue = getStageOverdueCount(stage.id);

                                            return (
                                                <button
                                                    key={stage.id}
                                                    type="button"
                                                    onClick={() => onSelectStage(stage.id)}
                                                    className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        isSelected
                                                            ? 'bg-[#0A385C] text-white shadow-md ring-2 ring-[#00A8E8]/50 scale-[1.02]'
                                                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs'
                                                    }`}
                                                >
                                                    <span className={`text-[10px] px-1 py-0.2 rounded font-black ${
                                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {stage.displayId || stage.id}
                                                    </span>
                                                    <span className="truncate max-w-[90px]">{stage.short || stage.name}</span>
                                                    
                                                    {count > 0 && (
                                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                                            isSelected ? 'bg-[#00A8E8] text-white' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {count}
                                                        </span>
                                                    )}

                                                    {overdue > 0 && (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title={`${overdue} job nearing SLA`} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Exception Branches (e.g. 4b -> 4c -> 4d for RU Lapangan) */}
                                    {exceptionStages.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-amber-200 bg-amber-50/50 rounded-lg p-2">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 mb-1.5">
                                                <CornerDownRight size={11} className="text-amber-600" />
                                                <span>Rework & Reschedule Loop (Branch)</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {exceptionStages.map((stage) => {
                                                    const isSelected = selectedStageId === stage.id;
                                                    const count = getStageJobCount(stage.id);

                                                    return (
                                                        <button
                                                            key={stage.id}
                                                            type="button"
                                                            onClick={() => onSelectStage(stage.id)}
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                                                                isSelected
                                                                    ? 'bg-amber-800 text-white shadow-md ring-2 ring-amber-400'
                                                                    : 'bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 shadow-2xs'
                                                            }`}
                                                        >
                                                            <span className={`text-[10px] px-1 py-0.2 rounded font-black ${
                                                                isSelected ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                                                            }`}>
                                                                {stage.displayId}
                                                            </span>
                                                            <span className="truncate max-w-[80px]">{stage.short}</span>
                                                            {count > 0 && (
                                                                <span className="text-[10px] px-1 py-0.2 rounded-full font-black bg-amber-200 text-amber-950">
                                                                    {count}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
