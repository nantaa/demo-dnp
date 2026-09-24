import React from 'react';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage7Action({
    job,
    s7,
    setS7,
    handleSaveS7,
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Penyerahan ke Disnaker *</label>
                <input
                    type="date"
                    value={s7.tgl_submit_disnaker}
                    onChange={e => setS7({ tgl_submit_disnaker: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
            </div>
            <button
                type="button"
                onClick={handleSaveS7}
                className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
            >
                Simpan Tanggal Penyerahan
            </button>
            <UploadSlot
                type="Bukti Penyerahan ke Disnaker"
                stageId={7}
                docs={job.documents}
                triggerUpload={triggerUpload}
                uploadFileDirectly={uploadFileDirectly}
                canManageStageDocs={canManageStageDocs}
                deleteDoc={deleteDoc}
                isINS={isINS}
            />
            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <MoveRow
                stage={7}
                processing={processing}
                onReject={handleRejectStage}
                disabled={!s7.tgl_submit_disnaker}
                disabledMsg={!s7.tgl_submit_disnaker ? 'Isi tanggal penyerahan terlebih dahulu' : ''}
            />
        </div>
    );
}
