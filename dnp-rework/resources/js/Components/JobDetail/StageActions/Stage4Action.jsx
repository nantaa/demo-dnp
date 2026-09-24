import React from 'react';
import { STAGE4_PHOTO_TYPES } from '../../../Constants';
import DocChip from '../Common/DocChip';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage4Action({
    job,
    s4,
    setS4,
    s4UnitMismatch,
    handleSaveS4,
    getDocs,
    photoNotes,
    setPhotoNotes,
    uploadPhoto,
    canManageStageDocs,
    deleteDoc,
    isINS,
    data,
    setData,
    processing,
    handleRejectStage,
    handleRouteTo13,
    post,
    onClose
}) {
    return (
        <div className="space-y-4">
            {/* Unit Count */}
            <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Jumlah Alat yang Benar-benar Diperiksa</p>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="0"
                        value={s4.actual_units}
                        onChange={e => setS4({ ...s4, actual_units: e.target.value })}
                        className="w-24 text-sm border rounded px-2 py-1.5"
                    />
                    <span className="text-xs text-gray-500">dari {job.units} unit dalam Job</span>
                    {s4UnitMismatch && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">TIDAK COCOK</span>
                    )}
                </div>
                {s4UnitMismatch && (
                    <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Alasan / Catatan *</label>
                        <textarea
                            rows={2}
                            value={s4.unit_count_notes}
                            onChange={e => setS4({ ...s4, unit_count_notes: e.target.value })}
                            className="w-full text-sm border rounded px-2 py-1.5"
                            placeholder="Jelaskan mengapa jumlah berbeda…"
                        />
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleSaveS4}
                    className="mt-2 px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded font-medium"
                >
                    Simpan Data Lapangan
                </button>
            </div>

            {/* Photo Uploads */}
            <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Foto Dokumentasi Wajib</p>
                <div className="space-y-2">
                    {STAGE4_PHOTO_TYPES.map(type => {
                        const existing = getDocs(4, type);
                        return (
                            <div key={type} className="border border-dashed rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-700">{type}</span>
                                    {existing.length > 0 && <span className="text-xs text-green-600 font-bold">Terupload</span>}
                                </div>
                                {existing.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {existing.map(d => (
                                            <DocChip
                                                key={d.id}
                                                doc={d}
                                                canManage={canManageStageDocs(d.stage)}
                                                onDelete={deleteDoc}
                                                isINS={isINS}
                                            />
                                        ))}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="Catatan foto (opsional)"
                                    value={photoNotes[type] || ''}
                                    onChange={e => setPhotoNotes({ ...photoNotes, [type]: e.target.value })}
                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 mb-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => uploadPhoto(type)}
                                    className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                                >
                                    Upload Foto
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            {/* Stage 4 Navigation Buttons */}
            {s4UnitMismatch ? (
                <div className="border border-amber-200 rounded-lg p-3.5 bg-amber-50/80 space-y-3">
                    <p className="text-xs font-semibold text-amber-900">
                        Perhatian: Jumlah alat yang diperiksa ({s4.actual_units}) tidak sesuai dengan jumlah unit awal ({job.units}).
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                post(`/jobs/${job.id}/move`, {
                                    data: { ...data, next_stage: 5 },
                                    onSuccess: () => onClose()
                                });
                            }}
                            disabled={processing}
                            className="w-full px-4 py-2.5 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center justify-center gap-1"
                        >
                            Lanjut ke Stage 5 (Penyusunan LHPP) →
                        </button>
                        <button
                            type="button"
                            onClick={handleRouteTo13}
                            disabled={processing}
                            className="w-full px-4 py-2 rounded text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs flex items-center justify-center gap-1"
                        >
                            Perbarui Unit di Stage 4b (Aktualisasi Unit MKT) →
                        </button>
                    </div>
                </div>
            ) : (
                <MoveRow stage={4} processing={processing} onReject={handleRejectStage} />
            )}
        </div>
    );
}
