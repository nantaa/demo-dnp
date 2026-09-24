import React from 'react';
import { STAGE9_SUKET_STATUSES, DOC_TYPES_BY_STAGE } from '../../../Constants';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';

export default function Stage9Action({
    job,
    s9,
    setS9,
    handleSaveS9,
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Status Suket (Stage 9)</label>
                <select
                    value={s9.s9_progress_status}
                    onChange={e => setS9({ s9_progress_status: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                >
                    <option value="">-- Pilih Status Suket --</option>
                    {STAGE9_SUKET_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
            </div>
            <button
                type="button"
                onClick={handleSaveS9}
                className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
            >
                Simpan Status
            </button>
            {(DOC_TYPES_BY_STAGE[9] || []).map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={9}
                    docs={job.documents}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                />
            ))}
            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={handleRejectStage}
                    className="px-3 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200"
                >
                    Tolak
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
                >
                    {processing ? '...' : 'Lanjut ke Stage 10 →'}
                </button>
            </div>
        </div>
    );
}
