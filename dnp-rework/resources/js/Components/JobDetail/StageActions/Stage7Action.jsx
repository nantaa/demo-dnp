import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot } from '../constants';

export default function Stage7Action({
    job,
    data,
    setData,
    s7,
    setS7,
    handleSaveS7,
    processing,
    canManage,
    canManageStageDocs,
    handleMoveStage,
    handleRejectStage,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
}) {
    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Penyerahan ke Disnaker *</label>
                <input
                    type="date"
                    value={s7.tgl_submit_disnaker}
                    onChange={e => setS7({ tgl_submit_disnaker: e.target.value })}
                    disabled={!canManage}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    required
                />
            </div>

            {canManage && (
                <button
                    type="button"
                    onClick={handleSaveS7}
                    className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
                >
                    Simpan Tanggal Penyerahan
                </button>
            )}

            <div className="space-y-2">
                {(DOC_TYPES_BY_STAGE[7] || []).map(t => (
                    <UploadSlot
                        key={t}
                        type={t}
                        stageId={7}
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
                stage={7}
                processing={processing}
                disabled={!canManage || !s7.tgl_submit_disnaker}
                disabledMsg={!s7.tgl_submit_disnaker ? 'Isi tanggal penyerahan terlebih dahulu' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
