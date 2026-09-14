import React from 'react';
import { DOC_TYPES_BY_STAGE, STAGE5_DECISIONS } from '@/Constants';
import { NoteField, MoveRow, UploadSlot } from '../constants';

export default function Stage6Action({
    job,
    data,
    setData,
    s5,
    setS5,
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
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2.5">
                <p className="text-xs text-blue-900 font-medium">Sebagai Kadiv/MGR, tinjau laporan teknis dari Tim Ahli.</p>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-black shrink-0">
                    Revisi: {job.revision_count || 0} / 2
                </span>
            </div>

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
                    disabled={!canManage}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-semibold"
                    required
                >
                    <option value="">-- Pilih Keputusan --</option>
                    <option value="approved">Setuju - Laik (Lanjut ke Stage 7 Dinas)</option>
                    <option value="revision">Tolak / Revisi Teknis (Kembalikan ke Stage 5)</option>
                    <option value="tidak_laik">Tidak Laik (Perbaikan Klien & Retest Stage 4c)</option>
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Catatan Review</label>
                <textarea
                    rows={2}
                    value={s5.s5_review_notes}
                    onChange={e => setS5({ ...s5, s5_review_notes: e.target.value })}
                    disabled={!canManage}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400"
                    placeholder="Tuliskan catatan teknis hasil review..."
                />
            </div>

            <div className="space-y-2">
                {(DOC_TYPES_BY_STAGE[6] || []).map(t => (
                    <UploadSlot
                        key={t}
                        type={t}
                        stageId={6}
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
                stage={6}
                processing={processing}
                disabled={!canManage || !s5.s5_review_decision}
                disabledMsg={!s5.s5_review_decision ? 'Pilih keputusan review terlebih dahulu.' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
