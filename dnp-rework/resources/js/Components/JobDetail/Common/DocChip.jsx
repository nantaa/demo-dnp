import React from 'react';
import { getDocumentUrl, isPoLockedForIns } from '../helpers';

export default function DocChip({ doc, canManage, onDelete, jobId, isINS }) {
    if (!doc) return null;
    if (isPoLockedForIns(doc, isINS)) {
        return (
            <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs text-gray-400 italic cursor-not-allowed" title="Dokumen PO/SPK terkunci untuk Inspektur">
                <span>🔒</span>
                <span className="font-medium text-gray-500">Dokumen PO/SPK (Terkunci)</span>
            </div>
        );
    }
    const fileUrl = getDocumentUrl(doc, jobId);
    return (
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs group">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={doc.name || 'Dokumen'}
               className="text-blue-600 hover:underline font-medium truncate max-w-[160px]" title={doc.name || 'Dokumen'}>
                {doc.name || 'Dokumen'}
            </a>
            {canManage && (
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(doc.id); }}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1">x</button>
            )}
        </div>
    );
}
