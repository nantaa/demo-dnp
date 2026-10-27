import React from 'react';
import { PIC_THEMES, getRoleTheme } from '@/Constants';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function KanbanColumn({
    stageNumber,
    title,
    count,
    isLocked,
    role,
    noTopBorder,
    isCollapsed = false,
    onToggleCollapse,
    children,
}) {
    const theme = getRoleTheme(role);

    // Collapsed Mode: Capsule Floating Pill (z-20: wave flows behind the capsule)
    if (isCollapsed) {
        return (
            <div
                onClick={onToggleCollapse}
                className="w-14 min-w-[56px] flex flex-col items-center justify-between rounded-2xl flex-shrink-0 bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#00A8E8] transition-all relative z-20 cursor-pointer py-4 px-1.5 select-none self-start"
                style={{ height: 'min(640px, calc(100vh - 220px))' }}
                title={`${title} (${count} Job) — Klik untuk membuka kolom`}
                aria-label={`Buka kolom ${title}`}
            >
                {/* Top: Stage Number Pill in role theme color + Lock icon */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    {stageNumber && (
                        <span
                            className="min-w-[28px] h-7 px-1 flex items-center justify-center text-[11px] font-black rounded-lg shadow-2xs text-white"
                            style={{ backgroundColor: theme.primary }}
                        >
                            {stageNumber}
                        </span>
                    )}
                    {isLocked && (
                        <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>

                {/* Middle: Vertical Title reading downwards (Top to Bottom) */}
                <div className="flex-1 flex items-center justify-center overflow-hidden my-3 py-2">
                    <span
                        className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider whitespace-nowrap"
                        style={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                        }}
                    >
                        {title}
                    </span>
                </div>

                {/* Bottom: Circular Count Pill */}
                <div className="shrink-0">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-[#F0F9FF] text-[#00A8E8] border border-[#7DD3FC] shadow-2xs">
                        {count}
                    </span>
                </div>
            </div>
        );
    }

    // Expanded Mode (Normal Kanban Column: w-80 / 320px)
    return (
        <div
            className="w-80 flex flex-col rounded-2xl flex-shrink-0 border border-slate-300 border-t-4 shadow-xs transition-all relative"
            style={{ borderTopColor: isLocked ? '#94a3b8' : (noTopBorder ? '#cbd5e1' : theme.primary) }}
        >
            {/* Column Background (z-0: beneath the wave) */}
            <div className="absolute inset-0 bg-slate-100/90 rounded-2xl z-0 pointer-events-none" />

            {/* Column Header (z-20: above the wave) */}
            <div className="p-3.5 flex justify-between items-center border-b border-slate-200 bg-white rounded-t-2xl relative z-20">
                <div className="flex items-center gap-2 min-w-0">
                    {stageNumber && (
                        <span
                            className="shrink-0 text-[11px] font-black px-2 py-0.5 rounded-md shadow-2xs"
                            style={{
                                backgroundColor: theme.dark,
                                color: theme.light || '#ffffff',
                            }}
                        >
                            {stageNumber}
                        </span>
                    )}
                    {isLocked && (
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide truncate" title={title}>
                        {title}
                    </h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border transition-colors ${
                        count > 0 
                            ? 'bg-[#00A8E8]/15 text-[#0A385C] border-[#00A8E8]/40 shadow-2xs' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                        {count}
                    </span>
                    {onToggleCollapse && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCollapse();
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Kecilkan kolom (Jira Collapse)"
                            aria-label={`Kecilkan kolom ${title}`}
                        >
                            <ChevronsLeft size={16} />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Cards List (z-20: above the wave) */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3 relative z-20">
                {children}
            </div>
        </div>
    );
}
