import React, { useState } from 'react';
import DocChip from './DocChip';

export default function UploadSlot({ type, stageId, docs, triggerUpload, uploadFileDirectly, canManageStageDocs, deleteDoc, isOptional, isINS = false }) {
    const [isDragging, setIsDragging] = useState(false);
    const existing = (docs || []).filter(d => d.stage === stageId && (!type || d.type === type));

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (uploadFileDirectly) {
                uploadFileDirectly(file, stageId, type);
            }
        }
    };

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-2.5 transition-all duration-200 ${
                isDragging 
                    ? 'border-blue-500 bg-blue-50/80 shadow-md scale-[1.01]' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-700 truncate">{type}</span>
                    {isOptional && (
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex-shrink-0">
                            OPSIONAL
                        </span>
                    )}
                </div>
                <button type="button" onClick={() => triggerUpload(stageId, type)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>+ Upload</span>
                </button>
            </div>
            {existing.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {existing.map(d => (
                        <DocChip key={d.id} doc={d} canManage={canManageStageDocs ? canManageStageDocs(d.stage) : true} onDelete={deleteDoc} isINS={isINS} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-1.5 px-2 bg-gray-50/50 rounded border border-dashed border-gray-100">
                    <p className="text-[11px] text-gray-400 italic">
                        {isDragging ? 'Lepaskan file di sini untuk upload' : 'Belum ada dokumen • Tarik & lepas file ke sini atau klik + Upload'}
                    </p>
                </div>
            )}
        </div>
    );
}
