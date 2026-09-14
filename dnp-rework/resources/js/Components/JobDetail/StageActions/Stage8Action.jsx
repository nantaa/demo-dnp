import React from 'react';
import { DOC_TYPES_BY_STAGE, STAGE8_DISNAKER_STATUSES } from '@/Constants';
import { NoteField, MoveRow, UploadSlot, daysElapsed, getSlaTag } from '../constants';

export default function Stage8Action({
    job,
    data,
    setData,
    s8,
    setS8,
    handleSaveS8,
    processing,
    canManage,
    canManageStageDocs,
    handleMoveStage,
    handleRejectStage,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
}) {
    const d = s8.tgl_doc_submitted_disnaker ? daysElapsed(s8.tgl_doc_submitted_disnaker) : null;
    const tag = getSlaTag(d, 30);

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status Disnaker (Progress)</label>
                <select
                    value={s8.s8_progress_status}
                    onChange={e => setS8({ ...s8, s8_progress_status: e.target.value })}
                    disabled={!canManage}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-medium"
                >
                    <option value="">-- Pilih Status Disnaker --</option>
                    {STAGE8_DISNAKER_STATUSES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Dokumen Diserahkan ke Disnaker</label>
                    <input
                        type="date"
                        value={s8.tgl_doc_submitted_disnaker}
                        onChange={e => setS8({ ...s8, tgl_doc_submitted_disnaker: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Dokumen Diterima Kembali</label>
                    <input
                        type="date"
                        value={s8.tgl_doc_received_disnaker}
                        onChange={e => setS8({ ...s8, tgl_doc_received_disnaker: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    />
                </div>
            </div>

            {/* SLA indicator */}
            {d != null && (
                <div className={`rounded p-2 text-xs font-semibold ${tag?.cls}`}>
                    {d} hari dari penyerahan dokumen (SLA: 30 hari) — {tag?.label}
                </div>
            )}

            {canManage && (
                <button
                    type="button"
                    onClick={handleSaveS8}
                    className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
                >
                    Simpan Data Disnaker
                </button>
            )}

            <div className="space-y-2">
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
                    />
                ))}
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={8}
                processing={processing}
                disabled={!canManage}
                onReject={handleRejectStage}
            />
        </form>
    );
}
