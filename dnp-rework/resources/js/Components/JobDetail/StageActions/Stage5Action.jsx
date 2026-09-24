import React from 'react';
import DocChip from '../Common/DocChip';
import NoteField from '../Common/NoteField';
import { hasValidLhppLink } from '../helpers';

export default function Stage5Action({
    job,
    canManage,
    lhppLinks,
    handleUpdateLhppLink,
    handleRemoveLhppLink,
    handleAddLhppLink,
    handleSaveLhppLinks,
    isSavingLink,
    canManageStageDocs,
    deleteDoc,
    isINS,
    data,
    setData,
    processing,
    isMoving,
    handleRejectStage,
    handleBypassStage5
}) {
    return (
        <div className="space-y-4">
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                    <span>Penyusunan Dokumen LHPP (Tim Ahli / Inspektur)</span>
                </div>
                <p className="text-blue-700">
                    Personil / Tim Ahli dapat mengisi link Google Drive / OneDrive / Cloud Storage folder atau dokumen LHPP di bawah ini.
                </p>
            </div>

            {/* Multi-Unit Link Drive / Cloud Storage for LHPP */}
            <div className="bg-white border-2 border-indigo-200 rounded-lg p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-800">
                            Link Dokumen / Folder LHPP per Unit ({lhppLinks.length} Unit) *
                        </label>
                        <p className="text-[11px] text-gray-500">
                            Masukkan link cloud untuk tiap unit. Anda dapat menamai label dan memberikan catatan per unit.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasValidLhppLink(lhppLinks) && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Link Terisi
                            </span>
                        )}
                        {canManage && (
                            <button
                                type="button"
                                onClick={handleAddLhppLink}
                                className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded transition"
                            >
                                + Tambah Unit
                            </button>
                        )}
                    </div>
                </div>

                {/* Units List */}
                <div className="space-y-2.5">
                    {lhppLinks.map((item, idx) => (
                        <div key={item.id || idx} className="bg-gray-50/70 border border-gray-200 rounded-lg p-2.5 space-y-2 transition-all hover:border-indigo-300">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 flex-shrink-0">
                                    Unit {item.unit_no || idx + 1}
                                </span>
                                <input
                                    type="text"
                                    value={item.label || ''}
                                    onChange={e => handleUpdateLhppLink(idx, 'label', e.target.value)}
                                    placeholder={`Nama / Label Unit ${idx + 1} (misal: Boiler Utama)`}
                                    className="flex-1 min-w-0 text-xs font-semibold text-gray-800 border border-gray-300 rounded px-2.5 py-1 bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    disabled={!canManage}
                                />
                                {canManage && lhppLinks.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLhppLink(idx)}
                                        className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-0.5 rounded border border-red-200 bg-white hover:bg-red-50 flex-shrink-0"
                                        title="Hapus baris unit ini"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="url"
                                    value={item.url || ''}
                                    onChange={e => handleUpdateLhppLink(idx, 'url', e.target.value)}
                                    placeholder="https://drive.google.com/... (Link Google Drive / Cloud)"
                                    className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 font-mono text-[11px]"
                                    disabled={!canManage}
                                />
                                {item.url && item.url.trim() && (
                                    <a
                                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition flex-shrink-0"
                                    >
                                        ↗ Buka
                                    </a>
                                )}
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={item.notes || ''}
                                    onChange={e => handleUpdateLhppLink(idx, 'notes', e.target.value)}
                                    placeholder="Catatan per unit (opsional, misal: Kapasitas 10 Ton, SN: 12345, rev 1)..."
                                    className="w-full text-[11px] text-gray-700 border border-gray-200 rounded px-2.5 py-1 bg-white/80 focus:ring-1 focus:ring-indigo-400"
                                    disabled={!canManage}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {canManage && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleSaveLhppLinks}
                            disabled={isSavingLink}
                            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition"
                        >
                            {isSavingLink ? 'Menyimpan...' : 'Simpan Semua Link LHPP'}
                        </button>
                        <button
                            type="button"
                            onClick={handleAddLhppLink}
                            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
                        >
                            + Tambah Baris Unit Lainnya
                        </button>
                    </div>
                )}
            </div>

            {/* If there are previously uploaded LHPP files, display them */}
            {(job.documents || []).some(d => d.stage === 5 && d.type === 'LHPP') && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-[11px] font-medium text-gray-600 mb-1.5">File LHPP yang sudah diunggah:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {(job.documents || []).filter(d => d.stage === 5 && d.type === 'LHPP').map(doc => (
                            <DocChip
                                key={doc.id}
                                doc={doc}
                                canManage={canManageStageDocs(5)}
                                onDelete={deleteDoc}
                                jobId={job.id}
                                isINS={isINS}
                            />
                        ))}
                    </div>
                </div>
            )}

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            
            <div className="mt-4 flex flex-col gap-2">
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <button
                        type="button"
                        onClick={handleRejectStage}
                        disabled={processing || isMoving}
                        className="px-3.5 py-2 rounded text-xs sm:text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition whitespace-nowrap"
                    >
                        Tolak / Kembalikan
                    </button>
                    <button
                        type="submit"
                        disabled={processing || isMoving}
                        className="flex-1 px-4 py-2 rounded text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 shadow-sm flex items-center justify-center gap-1.5 transition"
                    >
                        {processing || isMoving ? '...' : 'Kirim ke Tim Ahli (Minta Approval) →'}
                    </button>
                    <button
                        type="button"
                        onClick={handleBypassStage5}
                        disabled={processing || isMoving}
                        className="px-3.5 py-2 rounded text-xs sm:text-sm font-bold text-amber-900 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 shadow-sm flex items-center justify-center gap-1.5 transition border border-amber-500 whitespace-nowrap"
                        title="Bypass langsung ke Stage 7 (Verifikasi ke Dinas)"
                    >
                        Bypass ke S7 ⚡
                    </button>
                </div>
            </div>
        </div>
    );
}
