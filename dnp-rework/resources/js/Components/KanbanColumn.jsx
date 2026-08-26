import React from 'react';

export default function KanbanColumn({ stageNumber, title, count, isLocked, children }) {
    return (
        <div className={`w-80 flex flex-col rounded-2xl bg-slate-100/90 flex-shrink-0 border border-slate-300 border-t-4 shadow-xs backdrop-blur-xs transition-all ${isLocked ? 'border-t-slate-400' : 'border-t-[#00A8E8]'}`}>
            <div className="p-3.5 flex justify-between items-center border-b border-slate-200 bg-white rounded-t-2xl">
                <div className="flex items-center gap-2 min-w-0">
                    {stageNumber && (
                        <span className="shrink-0 bg-[#0A385C] text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-2xs">
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
                <span className={`shrink-0 ml-2 px-2.5 py-0.5 rounded-full text-xs font-black border transition-colors ${
                    count > 0 
                        ? 'bg-[#00A8E8]/15 text-[#0A385C] border-[#00A8E8]/40 shadow-2xs' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                    {count}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
                {children}
            </div>
        </div>
    );
}
