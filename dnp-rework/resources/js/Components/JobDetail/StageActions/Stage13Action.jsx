import React from 'react';
import { fmtCurrency } from '../helpers';
import NoteField from '../Common/NoteField';

export default function Stage13Action({
    job,
    editForm,
    canSeeNilai,
    canEditNilai,
    showTgl15Warning,
    handleUpdateJob,
    data,
    setData,
    processing,
    handleRejectStage,
    post,
    onClose
}) {
    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="text-xs font-bold text-amber-900 mb-1">
                    Stage 4b: Aktualisasi Unit (Marketing)
                </h4>
                <p className="text-xs text-amber-800">
                    Hasil pemeriksaan lapangan: <strong>{job.actual_units ?? job.units} Unit</strong> (Unit awal: {job.units} Unit).
                    {job.unit_count_notes && <span className="block mt-1 italic font-medium">Catatan: "{job.unit_count_notes}"</span>}
                </p>
            </div>

            <div className="bg-white border rounded-lg p-3 space-y-3">
                <h5 className="text-xs font-semibold text-gray-700">Penyesuaian Detail Job</h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <label className="block text-gray-600 mb-1">Jumlah Unit Baru</label>
                        <input
                            type="number"
                            min="1"
                            value={editForm.data.units}
                            onChange={e => editForm.setData('units', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                    {canSeeNilai && (
                        <div>
                            <label className="block text-gray-600 mb-1">Nilai Kontrak / Invoice (Rp)</label>
                            {canEditNilai ? (
                                <>
                                    {showTgl15Warning && (
                                        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5 mb-1">
                                            Perhatian: Sudah lewat tanggal 15 bulan ini. Perubahan data keuangan berisiko terhadap pelaporan pajak.
                                        </div>
                                    )}
                                    <input
                                        type="number"
                                        value={editForm.data.nilai}
                                        onChange={e => editForm.setData('nilai', e.target.value)}
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                    />
                                </>
                            ) : (
                                <p className="text-sm font-medium text-gray-700">{fmtCurrency(editForm.data.nilai)}</p>
                            )}
                            {editForm.data.nilai > 0 && (() => {
                                const total = parseFloat(editForm.data.nilai || 0);
                                const dpp = Math.round(total / 1.12);
                                const ppn = total - dpp;
                                return (
                                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1 flex justify-between">
                                        <span>DPP: <strong>Rp {dpp.toLocaleString('id-ID')}</strong></span>
                                        <span>PPN (12%): <strong>Rp {ppn.toLocaleString('id-ID')}</strong></span>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleUpdateJob}
                    disabled={editForm.processing}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
                >
                    Simpan Penyesuaian Job
                </button>
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <div className="flex gap-2 mt-4">
                <button
                    type="button"
                    onClick={handleRejectStage}
                    disabled={processing}
                    className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                    Tolak / Kembalikan
                </button>
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
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                >
                    {processing ? '...' : 'Lanjut ke Stage 5 (LHPP) →'}
                </button>
            </div>
        </div>
    );
}
