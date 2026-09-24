import React from 'react';
import { STAGE5_DECISIONS } from '../../../Constants';
import { parseLhppLinks, hasValidLhppLink } from '../helpers';
import NoteField from '../Common/NoteField';

export default function Stage6Action({
    job,
    s5,
    setS5,
    handleSaveS5,
    data,
    setData,
    processing,
    handleRejectStage
}) {
    const links = parseLhppLinks(job.link_lhpp, job.actual_units ?? job.units);
    const hasLinks = hasValidLhppLink(links);

    return (
        <div className="space-y-3">
            <p className="text-xs text-gray-500">Sebagai Tim Ahli / Kadiv Teknis, tinjau laporan teknis pekerjaan ini.</p>

            {/* Multi-Unit LHPP Links preview for Manager */}
            {(hasLinks || job.link_lhpp) && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2.5">
                    <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <span>Dokumen / Folder LHPP dari Tim Ahli ({links.length} Unit):</span>
                        </span>
                    </div>
                    <div className="space-y-2">
                        {links.map((item, idx) => (
                            <div key={item.id || idx} className="bg-white border border-indigo-100 rounded-lg p-2.5 text-xs shadow-sm space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] flex-shrink-0">
                                            Unit {item.unit_no || idx + 1}
                                        </span>
                                        <span className="font-bold text-gray-800 truncate">
                                            {item.label || `Unit ${idx + 1}`}
                                        </span>
                                    </div>
                                    {item.url ? (
                                        <a
                                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex-shrink-0 shadow-sm"
                                        >
                                            ↗ Buka Link
                                        </a>
                                    ) : (
                                        <span className="text-[11px] text-gray-400 italic flex-shrink-0">Belum diisi link</span>
                                    )}
                                </div>
                                {item.url && (
                                    <div className="text-[11px] text-gray-500 font-mono truncate" title={item.url}>
                                        {item.url}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="text-[11px] text-amber-800 bg-amber-50 rounded px-2 py-0.5 border border-amber-200/60 mt-1">
                                        <span className="font-semibold">Catatan Unit:</span> {item.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {job.s5_review_decision && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                    Keputusan sebelumnya: <strong>{STAGE5_DECISIONS.find(d => d.value === job.s5_review_decision)?.label}</strong>
                    {job.s5_review_notes && <span> — {job.s5_review_notes}</span>}
                </div>
            )}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Keputusan Review *</label>
                <select
                    value={s5.s5_review_decision}
                    onChange={e => setS5({ ...s5, s5_review_decision: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                >
                    <option value="">-- Pilih Keputusan --</option>
                    {STAGE5_DECISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Catatan MGR</label>
                <textarea
                    rows={3}
                    value={s5.s5_review_notes}
                    onChange={e => setS5({ ...s5, s5_review_notes: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    placeholder="Catatan kondisi, syarat, atau alasan penolakan…"
                />
            </div>
            <button
                type="button"
                onClick={handleSaveS5}
                className="w-full py-2 rounded text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
                Simpan Keputusan Review
            </button>
            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleRejectStage}
                    className="px-4 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                    Tolak / Kembalikan
                </button>
                <button
                    type="submit"
                    disabled={processing || !s5.s5_review_decision || s5.s5_review_decision === 'rejected'}
                    className="flex-1 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
                >
                    {processing ? '...' : 'Lanjut ke Stage 7 Penyerahan →'}
                </button>
            </div>
        </div>
    );
}
