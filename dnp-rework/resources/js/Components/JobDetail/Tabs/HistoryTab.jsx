import React from 'react';
import { STAGES } from '@/Constants';
import { fmt } from '../constants';

export default function HistoryTab({ job }) {
    const rawLogs = (job.historyLogs || job.history_logs || []).slice();
    const filteredLogs = rawLogs.filter((log, idx) => {
        if (idx === 0) return true;
        const prev = rawLogs[idx - 1];
        const isSameAction = (log.action || '').trim() === (prev.action || '').trim();
        const isSameStage = log.stage === prev.stage;
        const tCurrent = log.created_at ? new Date(log.created_at).getTime() : 0;
        const tPrev = prev.created_at ? new Date(prev.created_at).getTime() : 0;
        const isWithin5s = Math.abs(tCurrent - tPrev) <= 5000;
        return !(isSameAction && isSameStage && isWithin5s);
    });

    return (
        <div className="space-y-4">
            {filteredLogs.reverse().map((log, idx) => (
                <div key={log.id || `log-${idx}`} className="border-l-2 border-gray-200 pl-4 py-1 relative">
                    <div className="absolute w-2 h-2 bg-gray-400 rounded-full -left-[5px] top-3"></div>
                    <div className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-700">{log.user?.name || log.by || 'System'}</span>
                            <span className="text-xs text-gray-500">{fmt(log.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-800">{log.action}</p>
                        {log.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-2">"{log.notes}"</p>
                        )}
                        {log.returned_from_stage && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded border border-red-200">
                                DIKEMBALIKAN dari Stage {log.returned_from_stage}
                            </span>
                        )}
                        <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-800 px-2 rounded-full">
                            Stage {STAGES.find(s => s.id === log.stage)?.displayId || log.stage}
                        </span>
                    </div>
                </div>
            ))}
            {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Belum ada riwayat aktivitas.</div>
            )}
        </div>
    );
}
