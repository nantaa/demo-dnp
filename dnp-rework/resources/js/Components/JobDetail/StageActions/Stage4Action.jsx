import React, { useState } from 'react';
import { STAGE4_PHOTO_TYPES, parseJsonArray } from '@/Constants';
import { NoteField, DocChip, fmt } from '../constants';

export default function Stage4Action({
    job,
    state = {},
    actions = {},
    permissions = {},
}) {
    const {
        data,
        processing,
        s4 = {},
        setS4 = () => {},
        photoNotes = {},
        setPhotoNotes = () => {},
    } = state;

    const {
        post,
        handleSaveS4,
        uploadPhoto,
        triggerUpload,
        uploadFileDirectly,
        deleteDoc,
    } = actions;

    const { canManage, canManageStageDocs } = permissions;

    const [selectedAbsenDay, setSelectedAbsenDay] = useState(0);

    const schedDays = parseJsonArray(job.schedule_days);
    const getDocs = (stage, type) => (job.documents || []).filter(d => d.stage === stage && (!type || d.type === type));

    const actualUnitsVal = s4.actual_units ?? job.actual_units ?? job.units ?? 1;
    const s4UnitMismatch = parseInt(actualUnitsVal) !== parseInt(job.units);

    return (
        <div className="space-y-4">
            {/* Unit Count Confirmation */}
            <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Konfirmasi Unit Lapangan</p>
                <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-600">Jumlah Unit Terperiksa:</label>
                    <input
                        type="number"
                        min="1"
                        value={actualUnitsVal}
                        onChange={e => setS4({ ...s4, actual_units: e.target.value })}
                        disabled={!canManage}
                        className="w-20 text-sm border rounded px-2 py-1 font-semibold text-center"
                    />
                    <span className="text-xs text-gray-500">(dari {job.units} unit di PO/SPK)</span>
                </div>
                {s4UnitMismatch && (
                    <div className="bg-amber-50 border border-amber-300 rounded p-2 text-xs text-amber-800 space-y-1">
                        <p className="font-semibold">⚠️ Jumlah unit berbeda dari PO/SPK!</p>
                        <input
                            type="text"
                            value={s4.unit_count_notes || ''}
                            onChange={e => setS4({ ...s4, unit_count_notes: e.target.value })}
                            disabled={!canManage}
                            className="w-full text-sm border rounded px-2 py-1.5"
                            placeholder="Jelaskan mengapa jumlah berbeda…"
                        />
                    </div>
                )}
                {canManage && (
                    <button
                        type="button"
                        onClick={handleSaveS4}
                        className="mt-2 px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded font-medium"
                    >
                        Simpan Data Lapangan
                    </button>
                )}
            </div>

            {/* Daily Attendance Photo Section */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-950">Foto Absensi Tim Riksa Uji (Per Hari)</p>
                    <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                        {schedDays.length > 0 ? `${schedDays.length} Hari Jadwal` : '1 Hari Jadwal'}
                    </span>
                </div>

                {schedDays.length > 1 && (
                    <div>
                        <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                            Pilih Hari Penugasan:
                        </label>
                        <select
                            value={selectedAbsenDay}
                            onChange={e => setSelectedAbsenDay(Number(e.target.value))}
                            className="w-full text-xs border border-indigo-300 rounded px-2 py-1.5 bg-white font-medium"
                        >
                            {schedDays.map((day, idx) => (
                                <option key={idx} value={idx}>
                                    Hari {idx + 1} ({fmt(day.date)}) — {day.inspector_ids?.length || 0} Inspektur
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-indigo-900">
                        Absensi: <strong>Hari {selectedAbsenDay + 1}</strong> {schedDays[selectedAbsenDay]?.date ? `(${fmt(schedDays[selectedAbsenDay]?.date)})` : ''}
                    </div>
                    <button
                        type="button"
                        onClick={() => uploadPhoto(`Foto Absensi Hari ${selectedAbsenDay + 1}`)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-2xs"
                    >
                        + Upload Foto Absensi
                    </button>
                </div>

                {/* Show uploaded attendance photos */}
                {getDocs(4).filter(d => d.type?.toLowerCase().includes('absen')).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-indigo-200">
                        {getDocs(4).filter(d => d.type?.toLowerCase().includes('absen')).map(d => (
                            <DocChip key={d.id} doc={d} canManage={canManageStageDocs(4)} onDelete={deleteDoc} />
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Documentation */}
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
                                            <DocChip key={d.id} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} />
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
                                    className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-semibold"
                                >
                                    Upload Foto
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <NoteField value={data.notes} onChange={e => actions.setData('notes', e.target.value)} />

            {/* Stage 4 Routing */}
            <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50 space-y-2.5">
                <p className="text-xs font-bold text-gray-800">
                    Pilih Hasil & Jalur Lanjutan RU Lapangan:
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={(e) => actions.handleMoveStage(e, { next_stage: 5 })}
                        disabled={processing || !canManage}
                        className="w-full px-4 py-2.5 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        Path A: Lolos Penuh (Semua Unit Sesuai) → Lanjut ke Stage 5 (LHPP)
                    </button>
                    <button
                        type="button"
                        onClick={(e) => actions.handleMoveStage(e, { next_stage: 13 })}
                        disabled={processing || !canManage}
                        className="w-full px-4 py-2 rounded text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        Path B: Unit Belum Siap / Mismatch Logistik → Stage 4b (Aktualisasi MKT)
                    </button>
                    <button
                        type="button"
                        onClick={(e) => actions.handleMoveStage(e, { next_stage: 6, s5_review_decision: 'tidak_laik' })}
                        disabled={processing || !canManage}
                        className="w-full px-4 py-2 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        Path C: Unit Rusak / Temuan Teknis → Stage 6 (Review Laporan / Tidak Laik)
                    </button>
                </div>
            </div>
        </div>
    );
}
