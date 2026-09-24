import React from 'react';
import { INDONESIA_PROVINCES } from '../../../Constants';
import SmartRecommendation from '../../SmartRecommendation';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage3Action({
    job,
    data,
    setData,
    processing,
    isMoving,
    scheduleDays,
    setScheduleDays,
    recommendations,
    allSelectedInspectorIds,
    masterData,
    s3ScheduleValid,
    handleRejectStage
}) {
    return (
        <div className="space-y-4">
            {/* Row 1: Jam Mulai + Disnaker */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jam Mulai *</label>
                    <input
                        type="time"
                        value={data.jam_mulai}
                        onChange={e => setData('jam_mulai', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-400"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Disnaker Tujuan *</label>
                    <select
                        value={data.disnaker_tujuan}
                        onChange={e => setData('disnaker_tujuan', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-400"
                        required
                    >
                        <option value="">-- Pilih Disnaker Provinsi --</option>
                        {data.disnaker_tujuan &&
                            !INDONESIA_PROVINCES.includes(data.disnaker_tujuan) &&
                            !INDONESIA_PROVINCES.map(p => `Disnaker Prov. ${p}`).includes(data.disnaker_tujuan) && (
                            <option value={data.disnaker_tujuan}>{data.disnaker_tujuan}</option>
                        )}
                        {INDONESIA_PROVINCES.map(prov => {
                            const val = `Disnaker Prov. ${prov}`;
                            return <option key={prov} value={val}>{val}</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* ── Schedule Builder ── */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-3">
                {/* Header: title + add/remove day controls */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">Jadwal Pelaksanaan</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-indigo-700">Hari:</span>
                        <button
                            type="button"
                            onClick={() => scheduleDays.length > 1 && setScheduleDays(prev => prev.slice(0, -1))}
                            disabled={scheduleDays.length <= 1}
                            className="w-6 h-6 rounded border border-indigo-300 bg-white text-indigo-700 font-bold text-sm leading-none flex items-center justify-center hover:bg-indigo-100 disabled:opacity-40"
                        >
                            −
                        </button>
                        <span className="text-sm font-bold text-indigo-900 w-5 text-center">{scheduleDays.length}</span>
                        <button
                            type="button"
                            onClick={() => setScheduleDays(prev => [...prev, { date: '', inspector_ids: [] }])}
                            className="w-6 h-6 rounded border border-indigo-300 bg-white text-indigo-700 font-bold text-sm leading-none flex items-center justify-center hover:bg-indigo-100"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Day rows */}
                {scheduleDays.map((day, dayIdx) => {
                    const allInspectors = [
                        ...(recommendations.recommended || []),
                        ...(recommendations.eliminated  || []),
                    ];
                    return (
                        <div key={dayIdx} className="bg-white border border-indigo-200 rounded-lg p-3">
                            {/* Day header: label + date picker + remove */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded shrink-0">
                                    Hari {dayIdx + 1}
                                </span>
                                <input
                                    type="date"
                                    value={day.date}
                                    onChange={e => {
                                        const updated = scheduleDays.map((d, i) =>
                                            i === dayIdx ? { ...d, date: e.target.value } : d
                                        );
                                        setScheduleDays(updated);
                                    }}
                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-400"
                                />
                                {scheduleDays.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setScheduleDays(prev => prev.filter((_, i) => i !== dayIdx))}
                                        className="text-red-400 hover:text-red-600 text-base leading-none px-1 shrink-0"
                                        title="Hapus hari ini"
                                    >
                                        x
                                    </button>
                                )}
                            </div>

                            {/* Inspector chips */}
                            <p className="text-[10px] text-gray-500 mb-1.5">Inspektur pada Hari {dayIdx + 1}:</p>
                            {allInspectors.length === 0 ? (
                                <p className="text-[11px] text-gray-400 italic">Memuat data inspektur...</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {allInspectors.map(item => {
                                        const uid = item.user.id;
                                        const isSelected = day.inspector_ids.includes(uid);
                                        const isOverloaded = item.statuses
                                            ? item.statuses.some(st => st === 'Overload')
                                            : false;
                                        return (
                                            <button
                                                type="button"
                                                key={uid}
                                                onClick={() => {
                                                    const updated = scheduleDays.map((d, i) => {
                                                        if (i !== dayIdx) return d;
                                                        const ids = d.inspector_ids.includes(uid)
                                                            ? d.inspector_ids.filter(id => id !== uid)
                                                            : [...d.inspector_ids, uid];
                                                        return { ...d, inspector_ids: ids };
                                                    });
                                                    setScheduleDays(updated);
                                                }}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : isOverloaded
                                                            ? 'bg-gray-50 text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                }`}
                                            >
                                                {isSelected && <span>✓</span>}
                                                {item.user.name}
                                                {isOverloaded && !isSelected && <span className="text-red-400 text-[9px] font-bold">!</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {!day.date && (
                                <p className="text-[10px] text-red-500 mt-1">Pilih tanggal untuk hari ini</p>
                            )}
                            {day.inspector_ids.length === 0 && (
                                <p className="text-[10px] text-red-500 mt-0.5">Pilih minimal 1 inspektur untuk hari ini</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Smart Recommendation — quick-fill to all days */}
            <SmartRecommendation
                job={job}
                selectedInspectorIds={allSelectedInspectorIds}
                onSelectInspector={(insUser) => {
                    const uid = insUser.id;
                    const isInAll = scheduleDays.every(d => d.inspector_ids.includes(uid));
                    setScheduleDays(scheduleDays.map(d => ({
                        ...d,
                        inspector_ids: isInAll
                            ? d.inspector_ids.filter(id => id !== uid)
                            : d.inspector_ids.includes(uid)
                                ? d.inspector_ids
                                : [...d.inspector_ids, uid],
                    })));
                }}
            />

            {/* Penanggung Jawab Laporan / Penyusun LHPP */}
            <div className="bg-white border rounded-lg p-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Penanggung Jawab Laporan / Penyusun LHPP
                </label>
                <select
                    value={data.report_writer_id || ''}
                    onChange={e => setData('report_writer_id', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-400"
                >
                    <option value="">-- Pilih Penanggung Jawab Laporan (Opsional) --</option>
                    {[
                        ...(recommendations.recommended || []),
                        ...(recommendations.eliminated || [])
                    ].map(item => (
                        <option key={item.user.id} value={item.user.id}>
                            {item.user.name} ({item.user.role})
                        </option>
                    ))}
                </select>
            </div>

            {/* Alat Uji */}
            {masterData.alat_uji.length > 0 && (
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Alat Uji yang Digunakan</label>
                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded p-2">
                        {masterData.alat_uji.map(a => (
                            <label key={a.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.alat_ids.includes(a.id)}
                                    onChange={() => {
                                        const ids = data.alat_ids.includes(a.id)
                                            ? data.alat_ids.filter(x => x !== a.id)
                                            : [...data.alat_ids, a.id];
                                        setData('alat_ids', ids);
                                    }}
                                    className="rounded"
                                />
                                {a.nama}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <MoveRow
                stage={3}
                processing={processing || isMoving}
                onReject={handleRejectStage}
                disabled={!s3ScheduleValid || !data.disnaker_tujuan}
                disabledMsg={!data.disnaker_tujuan ? 'Pilih Disnaker Tujuan' : !s3ScheduleValid ? 'Lengkapi jadwal dan inspektur tiap hari' : ''}
            />
        </div>
    );
}
