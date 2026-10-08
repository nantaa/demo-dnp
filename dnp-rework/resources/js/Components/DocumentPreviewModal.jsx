import React, { useEffect, useState } from 'react';
import { 
    X, 
    Download, 
    ExternalLink, 
    FileText, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw,
    FileSpreadsheet,
    FileCode,
    File
} from 'lucide-react';

/**
 * Resolves standard file download/view URL matching JobDetailSheet conventions.
 */
function resolveDocUrl(doc, jobId) {
    if (!doc) return '#';
    const jId = doc.job_id || doc.jobId || jobId;
    if (doc.id && jId) {
        const encodedName = encodeURIComponent(doc.name || 'Dokumen.pdf');
        return `/jobs/${jId}/documents/${doc.id}/file/${encodedName}`;
    }
    return doc.path ? `/storage/${doc.path}` : '#';
}

/**
 * Extracts file extension from name or path.
 */
function getExtension(doc) {
    if (!doc) return '';
    const name = doc.name || doc.path || '';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export default function DocumentPreviewModal({ doc, jobId, isOpen, onClose }) {
    const [zoom, setZoom] = useState(1);
    const [imgLoading, setImgLoading] = useState(true);

    // Reset zoom & loading when doc changes or opens
    useEffect(() => {
        setZoom(1);
        setImgLoading(true);
    }, [doc, isOpen]);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !doc) return null;

    const fileUrl = resolveDocUrl(doc, jobId);
    const ext = getExtension(doc);
    const isPdf = ext === 'pdf' || (doc.mime_type && doc.mime_type.toLowerCase().includes('pdf'));
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) || 
                    (doc.mime_type && doc.mime_type.toLowerCase().startsWith('image/'));
    const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);

    return (
        <div 
            className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[88vh] border border-slate-200 transition-transform scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Sticky Header ────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-[#0A385C] border border-blue-100 flex-shrink-0">
                            {isPdf && <FileText className="w-4 h-4 text-red-500" />}
                            {isImage && <FileText className="w-4 h-4 text-emerald-500" />}
                            {isOffice && <FileSpreadsheet className="w-4 h-4 text-blue-500" />}
                            {!isPdf && !isImage && !isOffice && <File className="w-4 h-4 text-gray-500" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-800 truncate" title={doc.name || 'Dokumen'}>
                                    {doc.name || 'Pratinjau Dokumen'}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                                    {ext || (isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC')}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                                {doc.type ? `Jenis: ${doc.type}` : 'Dokumen Terlampir'}
                            </p>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isImage && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 mr-2 shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                                    title="Perkecil"
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-mono px-1.5 text-slate-600 select-none min-w-[42px] text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoom(z => Math.min(3, Number((z + 0.25).toFixed(2))))}
                                    title="Perbesar"
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoom(1)}
                                    title="Reset Zoom"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded ml-0.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs"
                            title="Buka Dokumen di Tab Baru"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Tab Baru</span>
                        </a>

                        <a
                            href={fileUrl}
                            download={doc.name || 'Dokumen'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0A385C] hover:bg-[#072740] transition-colors shadow-xs"
                            title="Unduh File"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Unduh</span>
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-1"
                            title="Tutup (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Body Viewport ────────────────────── */}
                <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-slate-100/70 flex items-center justify-center min-h-[460px] max-h-[76vh]">
                    {isPdf && (
                        <div className="w-full h-full min-h-[580px] bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
                            <iframe 
                                src={fileUrl} 
                                title={doc.name || 'PDF Preview'} 
                                className="w-full h-full min-h-[580px] border-0" 
                            />
                        </div>
                    )}

                    {isImage && (
                        <div className="flex flex-col items-center justify-center w-full min-h-[380px] overflow-auto p-2">
                            {imgLoading && (
                                <div className="text-xs text-slate-400 animate-pulse font-medium mb-3">
                                    Memuat gambar...
                                </div>
                            )}
                            <img
                                src={fileUrl}
                                alt={doc.name || 'Preview Dokumen'}
                                onLoad={() => setImgLoading(false)}
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                                className="max-w-full max-h-[68vh] object-contain rounded-lg shadow-md transition-transform duration-150"
                            />
                        </div>
                    )}

                    {!isPdf && !isImage && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-sm space-y-4 my-auto">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                                {isOffice ? <FileSpreadsheet className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-bold text-slate-800">
                                    Pratinjau Tidak Tersedia Langsung
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Format berkas <strong>.{ext || 'file'}</strong> tidak mendukung pratinjau langsung di dalam browser peramban. Silakan klik tombol di bawah untuk mengunduh dokumen secara lengkap.
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 font-mono break-all text-left">
                                <div className="font-semibold text-slate-700">{doc.name || 'Dokumen'}</div>
                                {doc.type && <div className="text-[11px] text-slate-400 mt-0.5">{doc.type}</div>}
                            </div>
                            <div>
                                <a
                                    href={fileUrl}
                                    download={doc.name || 'Dokumen'}
                                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0A385C] hover:bg-[#072740] transition-colors shadow-xs"
                                >
                                    <Download className="w-4 h-4" />
                                    Unduh Berkas Sekarang
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
