import React from 'react';
import { STAGE8_DISNAKER_STATUSES, DOC_TYPES_BY_STAGE } from '../../../Constants';
import { daysElapsed, getSlaTag } from '../helpers';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage8Action({
    job,
    s8,
    setS8,
    handleSaveS8,
    triggerUpload,
    uploadFileDirectly,
    canManageStageDocs,
    deleteDoc,
    isINS,
    data,
    setData,
    processing,
    handleRejectStage
}) {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status Disnaker (Progress)</label>
                <select
                    value={s8.s8_progress_status}
                    onChange={e => setS8({ ...s8, s8_progress_status: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-medium"
                >
                    <option value="">-- Pilih Status Disnaker --</option>
                    {STAGE8_DISNAKER_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
            </div>
            {s8.s8_progress_status === 'stuck' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                    <label className="block text-xs font-bold text-red-800">
                        Keterangan Kendala di Disnaker
                    </label>
                    <textarea
                        rows={2}
                        value={s8.s8_delay_reason || ''}
                        onChange={e => setS8({ ...s8, s8_delay_reason: e.target.value })}
                        placeholder="Jelaskan alasan terkendala (misal: Menunggu tanda tangan Kadis, pejabat dinas luar, dll)..."
                        className="w-full text-xs border border-red-300 rounded px-2.5 py-1.5 bg-white text-gray-800 focus:ring-1 focus:ring-red-400"
                    />
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Dokumen Diserahkan ke Disnaker</label>
                    <input
                        type="date"
                        value={s8.tgl_doc_submitted_disnaker}
                        onChange={e => setS8({ ...s8, tgl_doc_submitted_disnaker: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Dokumen Diterima Kembali</label>
                    <input
                        type="date"
                        value={s8.tgl_doc_received_disnaker}
                        onChange={e => setS8({ ...s8, tgl_doc_received_disnaker: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    />
                </div>
            </div>
            {/* SLA indicator */}
            {s8.tgl_doc_submitted_disnaker && (() => {
                const d = daysElapsed(s8.tgl_doc_submitted_disnaker);
                const tag = getSlaTag(d, 30);
                return (
                    <div className={`rounded p-2 text-xs font-semibold ${tag?.cls}`}>
                        {d} hari dari penyerahan dokumen (SLA: 30 hari) — {tag?.label}
                    </div>
                );
            })()}
            <button
                type="button"
                onClick={handleSaveS8}
                className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
            >
                Simpan Data Disnaker
            </button>
            {(DOC_TYPES_BY_STAGE[8] || []).map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={8}
                    docs={job.documents}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                />
            ))}
            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <MoveRow stage={8} processing={processing} onReject={handleRejectStage} />
        </div>
    );
}
