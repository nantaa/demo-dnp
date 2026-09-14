import React, { useState } from 'react';
import { STAGES, MAX_FILE_SIZE } from '@/Constants';
export { showSuccess, showError, showWarning, showConfirm, MySwal } from '@/swal';
export { MAX_FILE_SIZE };

// ── Formatters ─────────────────────────────────────────────────────────────────
export const parseJsonArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
};

export const parseJsonObject = (v) => {
    if (!v) return {};
    if (typeof v === 'object' && !Array.isArray(v) && v !== null) return v;
    try {
        const parsed = JSON.parse(v);
        return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch { return {}; }
};

export const fmt = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    d ? new Date(d).toLocaleDateString('id-ID', opts) : '—';

export const fmtCurrency = (n) =>
    n != null ? 'Rp ' + Number(n).toLocaleString('id-ID') : '—';

export const fmtSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};

export const daysElapsed = (from) => {
    if (!from) return null;
    return Math.ceil((new Date() - new Date(from)) / 86400000);
};

export const getSlaTag = (days, slaLimit) => {
    if (days == null || !slaLimit) return null;
    if (days > slaLimit) return { label: 'OVERDUE', cls: 'bg-red-100 text-red-800 font-bold' };
    if (days >= slaLimit) return { label: 'LAST DAY', cls: 'bg-orange-100 text-orange-800 font-bold' };
    return { label: 'ON TRACK', cls: 'bg-green-100 text-green-800' };
};

export const getDocumentUrl = (doc) => {
    if (!doc) return '#';
    if (doc.id && (doc.job_id || doc.jobId)) {
        const filename = encodeURIComponent(doc.name || 'document.pdf');
        return `/jobs/${doc.job_id || doc.jobId}/documents/${doc.id}/file/${filename}`;
    }
    return `/storage/${doc.path || ''}`;
};

export const getDocDownloadUrl = (doc) => {
    if (!doc) return '#';
    if (doc.id && (doc.job_id || doc.jobId)) {
        const filename = encodeURIComponent(doc.name || 'document.pdf');
        return `/jobs/${doc.job_id || doc.jobId}/documents/${doc.id}/download/${filename}`;
    }
    return `/storage/${doc.path || ''}`;
};

// ── Shared UI Atoms ────────────────────────────────────────────────────────────
export const DocChip = ({ doc, canManage, onDelete }) => (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs group">
        <a
            href={getDocumentUrl(doc)}
            download={doc?.name || 'document.pdf'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium truncate max-w-[160px]"
            title={doc?.name}
        >
            {doc?.name}
        </a>
        {canManage && (
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(doc.id); }}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            >
                ✕
            </button>
        )}
    </div>
);

export const MoveRow = ({ disabled = false, disabledMsg = '', stage, processing, onReject }) => {
    const getNextLabel = () => {
        if (stage === 4) return 'Lanjut ke Stage 5 (LHPP) →';
        if (stage === 13) return 'Jadwalkan Ulang (Stage 4c) →';
        if (stage === 16) return 'Lanjut ke Riksa Uji Ulang (Stage 4d) →';
        if (stage === 17) return 'Lanjut ke Penyusunan LHPP (Stage 5) →';
        if (stage === 10) return 'Lanjut ke Penagihan Pembayaran (Stage 11) →';
        if (stage === 11) return 'Serahkan ke Verifikasi Pembayaran (Stage 11c) →';
        if (stage === 15) return 'Verifikasi Lunas & Buka Kirim SUKET (Stage 11b) →';
        if (stage === 14) return 'Selesaikan Job (Stage 12 Closed) →';
        const currIdx = STAGES.findIndex(s => s.id === stage);
        if (currIdx !== -1 && currIdx < STAGES.length - 1) {
            const next = STAGES[currIdx + 1];
            if (next) {
                return `Lanjut ke Stage ${next.displayId || next.id} (${next.short}) →`;
            }
        }
        return `Lanjut ke Stage ${stage + 1} →`;
    };

    return (
        <div className="mt-4 flex flex-col gap-2">
            {disabledMsg && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {disabledMsg}
                </div>
            )}
            <div className="flex gap-2">
                {[2, 4, 13, 16, 17, 5, 6, 7, 8, 9, 10, 11, 15, 14].includes(stage) && (
                    <button
                        type="button"
                        onClick={onReject}
                        disabled={processing}
                        className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    >
                        Tolak / Kembalikan
                    </button>
                )}
                <button
                    type="submit"
                    disabled={processing || disabled}
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
                >
                    {processing ? '...' : getNextLabel()}
                </button>
            </div>
        </div>
    );
};

export const NoteField = React.memo(function NoteField({ value, onChange }) {
    return (
        <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan / Keterangan</label>
            <textarea
                rows={2}
                value={value || ''}
                onChange={onChange}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400"
                placeholder="Tulis catatan atau keterangan..."
            />
        </div>
    );
});

export const UploadSlot = ({ type, stageId, docs, triggerUpload, uploadFileDirectly, canManageStageDocs, deleteDoc, isOptional }) => {
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
                <button
                    type="button"
                    onClick={() => triggerUpload(stageId, type)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors flex-shrink-0"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>+ Upload</span>
                </button>
            </div>

            {existing.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {existing.map((d, idx) => (
                        <DocChip
                            key={d.id || `${d.type || 'doc'}_${d.file_path || idx}`}
                            doc={d}
                            canManage={canManageStageDocs ? canManageStageDocs(d.stage) : true}
                            onDelete={deleteDoc}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-1.5 px-2 bg-gray-50/50 rounded border border-dashed border-gray-100">
                    <p className="text-[11px] text-gray-400 italic">
                        {isDragging
                            ? 'Lepaskan file di sini untuk upload'
                            : 'Belum ada dokumen • Tarik & lepas file ke sini atau klik + Upload'}
                    </p>
                </div>
            )}
        </div>
    );
};
