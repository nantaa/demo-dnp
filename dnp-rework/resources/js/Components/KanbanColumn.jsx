import React from 'react';

export default function KanbanColumn({ title, count, isLocked, children }) {
    return (
        <div className={`w-80 flex flex-col rounded-2xl bg-slate-100/80 flex-shrink-0 border-t-4 shadow-sm backdrop-blur-xs transition-all ${isLocked ? 'border-slate-300' : 'border-[#00A8E8]'}`}>
            <div className="p-3.5 flex justify-between items-center border-b border-slate-200/80 bg-white/70 rounded-t-2xl">
                <div className="flex items-center space-x-2">
                    {isLocked && (
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    <h2 className="font-extrabold text-[#0A385C] text-xs uppercase tracking-wider">{title}</h2>
                </div>
                <span className="bg-[#0A385C] px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#00A8E8] shadow-2xs border border-[#00A8E8]/30">
                    {count}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
                {children}
            </div>
        </div>
    );
}
