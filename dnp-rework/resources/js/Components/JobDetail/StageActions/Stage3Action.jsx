import React from 'react';
import { DOC_TYPES_BY_STAGE, INDONESIA_PROVINCES } from '@/Constants';
import { NoteField, MoveRow, UploadSlot, fmtCurrency } from '../constants';

export default function Stage3Action(props) {
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
    const canManageStageDocs = permissions.canManageStageDocs || props.canManageStageDocs || (() => false);

    const scheduleDays = state.scheduleDays || props.scheduleDays || [];
    const setScheduleDays = actions.setScheduleDays || props.setScheduleDays || (() => {});
    const recommendations = props.recommendations || state.recommendations || { recommended: [], eliminated: [] };
    const masterData = props.masterData || state.masterData || { alat_uji: [], sertifikat_pjk3: [] };
    const s3ScheduleValid = permissions.s3ScheduleValid ?? props.s3ScheduleValid ?? false;

    const handleMoveStage = actions.handleMoveStage || props.handleMoveStage || ((e) => e?.preventDefault());
    const handleRejectStage = actions.handleRejectStage || props.handleRejectStage || (() => {});
    const triggerUpload = actions.triggerUpload || props.triggerUpload || (() => {});
    const uploadFileDirectly = actions.uploadFileDirectly || props.uploadFileDirectly || (() => {});
    const deleteDoc = actions.deleteDoc || props.deleteDoc || (() => {});

    const isDpUnpaid = job.termin_pembayaran === 'DP' && !job.dp_paid && !job.paid;
    const dpAmt = job.dp_amount || ((job.nilai || 0) * (job.dp_percentage || 30) / 100);

    const allInspectors = [
        ...(recommendations.recommended || []),
        ...(recommendations.eliminated || []),
    ];

    const allSelectedInspectorIds = [...new Set((scheduleDays || []).flatMap(d => d.inspector_ids || []))];

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            {isDpUnpaid && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-xs text-red-900 font-semibold space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                        <span>Surat Tugas Diblokir (DP Hard-Gate)</span>
                    </div>
                    <p>
                        Skema pembayaran job ini adalah <strong>Uang Muka (DP)</strong> senilai <strong>{fmtCurrency(dpAmt)}</strong>. Penerbitan Surat Tugas diblokir sampai Finance mengonfirmasi penerimaan DP.
                    </p>
                </div>
            )}

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
                                    const isOverloaded = item.statuses ? item.statuses.some(st => st === 'Overload') : false;

                                    return (
                                        <button
                                            key={uid}
                                            type="button"
                                            onClick={() => {
                                                const currentIds = day.inspector_ids || [];
                                                const updatedIds = isSelected
                                                    ? currentIds.filter(id => id !== uid)
                                                    : [...currentIds, uid];
                                                const updatedDays = scheduleDays.map((d, i) =>
                                                    i === dayIdx ? { ...d, inspector_ids: updatedIds } : d
                                                );
                                                setScheduleDays(updatedDays);
                                                const combined = [...new Set(updatedDays.flatMap(d => d.inspector_ids))];
                                                setData('inspector_ids', combined);
                                            }}
                                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                                            }`}
                                        >
                                            {item.user.name}
                                            {isOverloaded && <span className="text-[10px] text-red-500 font-bold">⚠️</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Tim Pembuat Laporan (Report Writer) */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tim Pembuat Laporan (Report Writer)</label>
                <select
                    value={data.report_writer_id || ''}
                    onChange={e => setData('report_writer_id', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-400"
                >
                    <option value="">-- Pilih dari Personel Terjadwal (Default: Personel Pertama) --</option>
                    {allSelectedInspectorIds.map(id => {
                        const rec = allInspectors.find(r => r.user.id === id);
                        return (
                            <option key={id} value={id}>
                                {rec?.user?.name || `Inspector #${id}`}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Master Data: Alat Uji & SKP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Peralatan Uji Terpakai</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {(masterData.alat_uji || []).map(alat => {
                            const isSelected = (data.alat_ids || []).includes(alat.id);
                            return (
                                <label key={alat.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                            const current = data.alat_ids || [];
                                            setData('alat_ids', isSelected ? current.filter(id => id !== alat.id) : [...current, alat.id]);
                                        }}
                                        className="rounded text-indigo-600"
                                    />
                                    <span className="truncate">{alat.nama_alat} ({alat.kode_alat})</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Sertifikat SKP PJK3 Terlampir</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {(masterData.sertifikat_pjk3 || []).map(cert => {
                            const isSelected = (data.cert_ids || []).includes(cert.id);
                            return (
                                <label key={cert.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                            const current = data.cert_ids || [];
                                            setData('cert_ids', isSelected ? current.filter(id => id !== cert.id) : [...current, cert.id]);
                                        }}
                                        className="rounded text-indigo-600"
                                    />
                                    <span className="truncate">{cert.nomor_skp} - {cert.bidang_skp}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Unggah Surat Tugas & Dokumen Tambahan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(DOC_TYPES_BY_STAGE[3] || []).map(t => (
                        <UploadSlot
                            key={t}
                            type={t}
                            stageId={3}
                            docs={job.documents}
                            triggerUpload={triggerUpload}
                            uploadFileDirectly={uploadFileDirectly}
                            canManageStageDocs={canManageStageDocs}
                            deleteDoc={deleteDoc}
                        />
                    ))}
                </div>
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={3}
                processing={processing}
                disabled={!canManage || isDpUnpaid || !s3ScheduleValid || !data.disnaker_tujuan}
                disabledMsg={
                    isDpUnpaid
                        ? 'Surat Tugas diblokir sampai DP terbayar (DP Hard-Gate).'
                        : !s3ScheduleValid
                        ? 'Lengkapi tanggal & personel untuk setiap hari penjadwalan.'
                        : !data.disnaker_tujuan
                        ? 'Pilih Disnaker Tujuan.'
                        : ''
                }
                onReject={handleRejectStage}
            />
        </form>
    );
}
