import React from 'react';
import { STAGES } from '@/Constants';
import { fmt } from '../helpers';

export default function HistoryTab({ job, isINS }) {
    const rawLogs = (job.historyLogs || job.history_logs || []).slice().reverse();
    const logs = isINS
        ? rawLogs.filter(log => !String(log.action || '').toLowerCase().includes('revisi po'))
        : rawLogs;

    const formatActionForIns = (action) => {
        if (!isINS || !action) return action;
        return action
            .replace(/PO\/SPK received/gi, 'Pekerjaan Terdaftar')
            .replace(/PO\/SPK/gi, 'Pekerjaan')
            .replace(/PO:\s*[^\s,)]+/gi, 'PO: [Terkunci]')
            .replace(/No\.?\s*PO\s*:[^\s,)]+/gi, 'No. PO: [Terkunci]');
    };

    const formatNotesForIns = (notes) => {
        if (!isINS || !notes) return notes;
        return notes
            .replace(/PO\/SPK/gi, 'Pekerjaan')
            .replace(/PO:\s*[^\s,)]+/gi, 'PO: [Terkunci]');
    };

    return (
        <div className="space-y-4">
            {logs.map(log => (
                <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-1 relative">
                    <div className="absolute w-2 h-2 bg-gray-400 rounded-full -left-[5px] top-3"></div>
                    <div className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-700">{log.user?.name || 'System'}</span>
                            <span className="text-xs text-gray-500">
                                {fmt(log.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm text-gray-800">{formatActionForIns(log.action)}</p>
                        {log.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-2">
                                "{formatNotesForIns(log.notes)}"
                            </p>
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
        </div>
    );
}
