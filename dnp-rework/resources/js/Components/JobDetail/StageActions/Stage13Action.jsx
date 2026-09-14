import React from 'react';
import { NoteField } from '../constants';

export default function Stage13Action(props) {
    const {
        job = {},
        state = {},
        actions = {},
        permissions = {},
    } = props;

    const data = state.data || props.data || {};
    const setData = actions.setData || props.setData || (() => {});
    const processing = state.processing ?? props.processing ?? false;
    const canSeeNilai = permissions.canSeeNilai ?? props.canSeeNilai ?? true;

    const editForm = state.editForm || props.editForm || {
        data: { units: job.units || 1, nilai: job.nilai || '' },
        setData: () => {},
        processing: false,
    };

    const handleUpdateJob = actions.handleUpdateJob || props.handleUpdateJob || (() => {});
    const handleRejectStage = actions.handleRejectStage || props.handleRejectStage || (() => {});
    const handleJobSplit = actions.handleJobSplit || props.handleJobSplit || (() => {});
    const post = actions.post || props.post || (() => {});
    const onClose = props.onClose || (() => {});

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
                            value={editForm.data?.units ?? job.units ?? 1}
                            onChange={e => editForm.setData && editForm.setData('units', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                    {canSeeNilai && (
                        <div>
                            <label className="block text-gray-600 mb-1">Nilai Kontrak / Invoice (Rp)</label>
                            <input
                                type="number"
                                value={editForm.data?.nilai ?? job.nilai ?? ''}
                                onChange={e => editForm.setData && editForm.setData('nilai', e.target.value)}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                            />
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

            <NoteField value={data.notes || ''} onChange={e => setData('notes', e.target.value)} />

            <div className="flex gap-2 mt-4 flex-wrap">
                <button
                    type="button"
                    onClick={handleRejectStage}
                    disabled={processing}
                    className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                    Tolak / Kembali ke Stage 4
                </button>
                <button
                    type="button"
                    onClick={handleJobSplit}
                    className="px-3 py-2 rounded text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1"
                >
                    Pecah Job
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        post(`/jobs/${job.id}/move`, {
                            data: { ...data, next_stage: 16 },
                            onSuccess: () => onClose()
                        });
                    }}
                    disabled={processing}
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                >
                    {processing ? '...' : 'Jadwalkan Ulang (Stage 4c) →'}
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
                    className="px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                >
                    {processing ? '...' : 'Bypass ke Stage 5 (LHPP) →'}
                </button>
            </div>
        </div>
    );
}
