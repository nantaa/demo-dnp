import React from 'react';
import { NoteField } from '../constants';

export default function Stage17Action({
    job,
    data,
    setData,
    s4d,
    setS4d,
    s4dUnitMismatch,
    handleSaveS4d,
    handleRejectStage,
    post,
    processing,
    canManage,
    onClose,
}) {
    return (
        <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1">
                <h4 className="text-xs font-bold text-purple-900">
                    Stage 4d: Riksa Uji Ulang / Pelaksanaan Lapangan Ulang (Inspektur)
                </h4>
                <p className="text-xs text-purple-800">
                    Lakukan pemeriksaan fisik dan pengujian ulang untuk unit yang telah dijadwalkan ulang.
                </p>
            </div>

            {/* Konfirmasi Unit RU Ulang */}
            <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Hasil Riksa Uji Ulang di Lapangan</p>
                <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-600">Jumlah Unit Diperiksa:</label>
                    <input
                        type="number"
                        min="1"
                        value={s4d.actual_units}
                        onChange={e => setS4d({ ...s4d, actual_units: e.target.value })}
                        disabled={!canManage}
                        className="w-20 text-sm border rounded px-2 py-1 font-semibold text-center"
                    />
                    <span className="text-xs text-gray-500">(dari total {job.units} unit)</span>
                </div>
                {s4dUnitMismatch && (
                    <div className="bg-amber-50 border border-amber-300 rounded p-2 text-xs text-amber-800 space-y-1">
                        <p className="font-semibold">⚠️ Jumlah unit berbeda dari total kontrak!</p>
                        <input
                            type="text"
                            value={s4d.unit_count_notes}
                            onChange={e => setS4d({ ...s4d, unit_count_notes: e.target.value })}
                            disabled={!canManage}
                            className="w-full text-sm border rounded px-2 py-1.5"
                            placeholder="Jelaskan alasan unit mismatch pada RU Ulang..."
                        />
                    </div>
                )}

                <div className="pt-2 border-t">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status Kelayakan RU Ulang *</label>
                    <select
                        value={s4d.ru_ulang_status}
                        onChange={e => setS4d({ ...s4d, ru_ulang_status: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border rounded px-2.5 py-1.5 font-medium"
                    >
                        <option value="lolos">Lolos / Memenuhi Syarat K3 (Lanjut ke LHPP)</option>
                        <option value="rework">Perlu Riksa Uji Ulang Tambahan (Loop 4c/4d)</option>
                        <option value="tidak_laik">Tidak Laik / Gagal Teknis (Kirim ke MGR Stage 6)</option>
                    </select>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={handleSaveS4d}
                        className="mt-2 px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded font-medium"
                    >
                        Simpan Data RU Ulang
                    </button>
                )}
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <div className="flex gap-2 mt-4 flex-wrap">
                <button
                    type="button"
                    onClick={handleRejectStage}
                    disabled={processing}
                    className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                    Tolak / Kembali ke 4c
                </button>
                {s4d.ru_ulang_status === 'lolos' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            post(`/jobs/${job.id}/move`, {
                                data: { ...data, next_stage: 5 },
                                onSuccess: () => onClose()
                            });
                        }}
                        disabled={processing || !canManage}
                        className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                    >
                        {processing ? '...' : 'Selesai RU Ulang — Lanjut Penyusunan LHPP (Stage 5) →'}
                    </button>
                )}
                {s4d.ru_ulang_status === 'rework' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            post(`/jobs/${job.id}/move`, {
                                data: { ...data, next_stage: 16 },
                                onSuccess: () => onClose()
                            });
                        }}
                        disabled={processing || !canManage}
                        className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                    >
                        {processing ? '...' : 'Kembali ke Penjadwalan Ulang (Stage 4c) →'}
                    </button>
                )}
                {s4d.ru_ulang_status === 'tidak_laik' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            post(`/jobs/${job.id}/move`, {
                                data: { ...data, next_stage: 6, s5_review_decision: 'tidak_laik' },
                                onSuccess: () => onClose()
                            });
                        }}
                        disabled={processing || !canManage}
                        className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                    >
                        {processing ? '...' : 'Serahkan ke Review Manager (Stage 6) →'}
                    </button>
                )}
            </div>
        </div>
    );
}
