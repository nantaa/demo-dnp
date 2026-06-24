import React from 'react';

export default function KanbanColumn({ title, count, isLocked, children }) {
    return (
        <div className={`w-80 flex flex-col rounded-xl bg-gray-100 flex-shrink-0 border-t-4 shadow-sm ${isLocked ? 'border-gray-300' : 'border-blue-500'}`}>
            <div className="p-4 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    {isLocked && (
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    <h2 className="font-bold text-gray-700 text-sm">{title}</h2>
                </div>
                <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                    {count}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {children}
            </div>
        </div>
    );
}
