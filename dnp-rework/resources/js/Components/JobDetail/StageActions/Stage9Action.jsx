import React from 'react';
import { DOC_TYPES_BY_STAGE, PROGRESS_STATUSES } from '@/Constants';
import { NoteField, MoveRow, UploadSlot } from '../constants';

export default function Stage9Action({
    job,
    data,
    setData,
    s9,
    setS9,
    s9Suket,
    setS9Suket,
    handleSaveS9,
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-900">
                        Tracking Durasi Pengurusan SUKET Disnaker
                    </h4>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-black">
                        Delta v5-2-2
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <label className="block text-gray-700 font-bold mb-1">Tanggal Input SUKET *</label>
                        <input
                            type="date"
                            value={s9Suket.tgl_input_suket}
                            onChange={e => setS9Suket({ ...s9Suket, tgl_input_suket: e.target.value })}
                            disabled={!canManage}
                            className="w-full border border-emerald-300 rounded px-2 py-1.5 bg-white text-xs"
                        />
                        <span className="text-[10px] text-gray-500">Titik awal pencatatan waktu</span>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-1">Tanggal SUKET Terbit / Selesai</label>
                        <input
                            type="date"
                            value={s9Suket.tgl_suket_selesai}
                            onChange={e => setS9Suket({ ...s9Suket, tgl_suket_selesai: e.target.value })}
                            disabled={!canManage}
                            className="w-full border border-emerald-300 rounded px-2 py-1.5 bg-white text-xs"
                        />
                        <span className="text-[10px] text-gray-500">SUKET fisik diterima</span>
                    </div>
                </div>
                {s9Suket.tgl_input_suket && (
                    <div className="pt-2 border-t border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <span>Durasi Pengurusan:</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                            {s9Suket.tgl_suket_selesai
                                ? `${Math.max(0, Math.round((new Date(s9Suket.tgl_suket_selesai) - new Date(s9Suket.tgl_input_suket)) / 86400000))} Hari Kalender (Selesai)`
                                : `${Math.max(0, Math.round((new Date() - new Date(s9Suket.tgl_input_suket)) / 86400000))} Hari Berjalan`}
                        </span>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status Progress</label>
                <select
                    value={s9.s9_progress_status}
                    onChange={e => setS9({ s9_progress_status: e.target.value })}
                    disabled={!canManage}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                >
                    <option value="">-- Pilih Status --</option>
                    {PROGRESS_STATUSES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            {canManage && (
                <button
                    type="button"
                    onClick={handleSaveS9}
                    className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
                >
                    Simpan Status
                </button>
            )}

            <div className="space-y-2">
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
                    />
                ))}
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={9}
                processing={processing}
                disabled={!canManage}
                onReject={handleRejectStage}
            />
        </form>
    );
}
