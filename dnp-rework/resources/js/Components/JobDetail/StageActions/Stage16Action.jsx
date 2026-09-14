import React from 'react';
import { INDONESIA_PROVINCES } from '@/Constants';
import SmartRecommendation from '../../SmartRecommendation';
import { NoteField, MoveRow } from '../constants';

export default function Stage16Action(props) {
    const {
        job = {},
        state = {},
        actions = {},
        permissions = {},
    } = props;

    const data = state.data || props.data || {};
    const setData = actions.setData || props.setData || (() => {});
    const processing = state.processing ?? props.processing ?? false;
    const canManage = permissions.canManage ?? props.canManage ?? false;

    const s4c = state.s4c || props.s4c || {};
    const setS4c = actions.setS4c || props.setS4c || (() => {});
    const scheduleDays = state.scheduleDays || props.scheduleDays || [];
    const setScheduleDays = actions.setScheduleDays || props.setScheduleDays || (() => {});
    const recommendations = props.recommendations || state.recommendations || { recommended: [], eliminated: [] };
    const masterData = props.masterData || state.masterData || { alat_uji: [], sertifikat_pjk3: [] };

    const handleJobSplit = actions.handleJobSplit || props.handleJobSplit || (() => {});
    const handleMoveStage = actions.handleMoveStage || props.handleMoveStage || ((e) => e?.preventDefault());
    const handleRejectStage = actions.handleRejectStage || props.handleRejectStage || (() => {});
    const onClose = props.onClose || (() => {});

    const allInspectors = [
        ...(recommendations.recommended || []),
        ...(recommendations.eliminated || []),
    ];

    const allSelectedInspectorIds = [...new Set((scheduleDays || []).flatMap(d => d.inspector_ids || []))];

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-900 mb-1">
                        Stage 4c: Penjadwalan Ulang / Reschedule (Admin)
                    </h4>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">
                        Reschedule Loop: {job.reschedule_count || 0} / 3
                    </span>
                </div>
                <p className="text-xs text-amber-800">
                    Terdapat unit yang tertunda/rusak saat Riksa Uji. Tentukan tanggal inspeksi ulang, tim ahli, dan alat uji untuk Riksa Uji Ulang (Stage 4d).
                </p>
            </div>

            {/* Exceeded Max Reschedule Alert & Job Split Option */}
            {(job.reschedule_count || 0) >= 3 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3.5 space-y-2">
                    <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                        <span>Batas Reschedule Tercapai ({job.reschedule_count || 3}/3)</span>
                    </div>
                    <p className="text-xs text-red-800">
                        Berdasarkan SOP v2.0, Kadiv / Manager Teknis wajib memutuskan tindak lanjut unit yang tertunda:
                    </p>
                    <div className="flex gap-2 pt-1 flex-wrap">
                        <button
                            type="button"
                            onClick={handleJobSplit}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs"
                        >
                            Opsi A: Pecah Job (Job Split)
                        </button>
                        <button
                            type="button"
                            onClick={() => router.post(`/jobs/${job.id}/move`, { data: { ...data, next_stage: 12, notes: 'Ditutup sebagai Gagal Uji (Closed as Failed)' } }, { onSuccess: () => onClose() })}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-xs"
                        >
                            Opsi B: Tutup Job Gagal
                        </button>
                    </div>
                </div>
            )}

            {/* Informasi Reschedule */}
            <div className="bg-white border rounded-lg p-3 space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Penjadwalan Ulang *</label>
                    <select
                        value={s4c.reschedule_reason}
                        onChange={e => setS4c({ ...s4c, reschedule_reason: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-amber-400"
                        required
                    >
                        <option value="">-- Pilih Alasan Reschedule --</option>
                        <option value="Unit belum siap / rusak di lokasi">Unit belum siap / rusak di lokasi</option>
                        <option value="Permintaan Klien (operasional pabrik berjalan)">Permintaan Klien (operasional pabrik berjalan)</option>
                        <option value="Cuaca ekstrim / kendala teknis lapangan">Cuaca ekstrim / kendala teknis lapangan</option>
                        <option value="Penambahan unit baru hasil aktualisasi">Penambahan unit baru hasil aktualisasi</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Tanggal Jadwal Baru RU Ulang *</label>
                        <input
                            type="date"
                            value={s4c.tgl_reschedule}
                            onChange={e => {
                                const val = e.target.value;
                                setS4c({ ...s4c, tgl_reschedule: val });
                                if (scheduleDays.length > 0 && !scheduleDays[0].date) {
                                    setScheduleDays(scheduleDays.map((d, i) => i === 0 ? { ...d, date: val } : d));
                                }
                            }}
                            disabled={!canManage}
                            className="w-full border rounded px-2 py-1.5 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Catatan Tambahan</label>
                        <input
                            type="text"
                            placeholder="Catatan inspektur / perlengkapan..."
                            value={s4c.reschedule_notes}
                            onChange={e => setS4c({ ...s4c, reschedule_notes: e.target.value })}
                            disabled={!canManage}
                            className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Schedule Builder */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Jam Mulai RU Ulang *</label>
                        <input
                            type="time"
                            value={data.jam_mulai}
                            onChange={e => setData('jam_mulai', e.target.value)}
                            disabled={!canManage}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Disnaker Tujuan *</label>
                        <select
                            value={data.disnaker_tujuan}
                            onChange={e => setData('disnaker_tujuan', e.target.value)}
                            disabled={!canManage}
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

                {/* Jadwal Pelaksanaan Multi-Day */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900">Jadwal Pelaksanaan RU Ulang</span>
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

                    {scheduleDays.map((day, dayIdx) => (
                        <div key={dayIdx} className="bg-white border border-indigo-200 rounded-lg p-3">
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
                                        ✕
                                    </button>
                                )}
                            </div>

                            <p className="text-[10px] text-gray-500 mb-1.5">Inspektur pada Hari {dayIdx + 1}:</p>
                            {allInspectors.length === 0 ? (
                                <p className="text-[11px] text-gray-400 italic">Memuat data inspektur...</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {allInspectors.map(item => {
                                        const uid = item.user.id;
                                        const isSelected = (day.inspector_ids || []).includes(uid);
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
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                }`}
                                            >
                                                {item.user.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Smart Recommendation */}
                <SmartRecommendation
                    job={job}
                    selectedInspectorIds={allSelectedInspectorIds}
                    onSelectInspector={(insUser) => {
                        const uid = insUser.id;
                        const isInAll = scheduleDays.every(d => (d.inspector_ids || []).includes(uid));
                        setScheduleDays(scheduleDays.map(d => ({
                            ...d,
                            inspector_ids: isInAll
                                ? d.inspector_ids.filter(id => id !== uid)
                                : (d.inspector_ids || []).includes(uid)
                                    ? d.inspector_ids
                                    : [...(d.inspector_ids || []), uid],
                        })));
                    }}
                />
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={16}
                processing={processing}
                disabled={!canManage || !s4c.reschedule_reason || !s4c.tgl_reschedule}
                disabledMsg={!s4c.reschedule_reason || !s4c.tgl_reschedule ? 'Lengkapi alasan & tanggal reschedule.' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
