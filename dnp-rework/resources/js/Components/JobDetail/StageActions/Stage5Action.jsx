import React, { useState } from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot } from '../constants';

export default function Stage5Action({
    job,
    state = {},
    actions = {},
    permissions = {},
}) {
    const {
        data,
        processing,
        s5Dates = {},
        setS5Dates = () => {},
    } = state;

    const {
        post,
        handleMoveStage,
        handleRejectStage,
        handleSaveS5Dates,
        triggerUpload,
        uploadFileDirectly,
        deleteDoc,
    } = actions;

    const { canManage, canManageStageDocs } = permissions;

    const [gdriveUrl, setGdriveUrl] = useState(job.gdrive_folder_url || '');

    const handleSaveGdrive = (e) => {
        e?.preventDefault();
        post(`/jobs/${job.id}/stage5-dates`, { ...s5Dates, gdrive_folder_url: gdriveUrl }, {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            {/* 3-Date Milestone Tracking */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900">
                        Milestone Tracking Penyusunan LHPP (Per-Unit)
                    </h4>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-black">
                        Lead Time Tracking
                    </span>
                </div>
                <p className="text-xs text-blue-800">
                    Catat 3 tanggal penting untuk tracking due date dan perhitungan otomatis lead time sub-fase laporan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                        <label className="block text-gray-700 font-bold mb-1">1. Data Teknis Diserahkan</label>
                        <input
                            type="date"
                            value={s5Dates.tgl_teknis_diserahkan || ''}
                            onChange={e => setS5Dates({ ...s5Dates, tgl_teknis_diserahkan: e.target.value })}
                            disabled={!canManage}
                            className="w-full border border-blue-300 rounded px-2 py-1.5 bg-white text-xs"
                        />
                        <span className="text-[10px] text-gray-500">Diterima dari inspektur</span>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-1">2. Pengerjaan Laporan Mulai</label>
                        <input
                            type="date"
                            value={s5Dates.tgl_laporan_mulai || ''}
                            onChange={e => setS5Dates({ ...s5Dates, tgl_laporan_mulai: e.target.value })}
                            disabled={!canManage}
                            className="w-full border border-blue-300 rounded px-2 py-1.5 bg-white text-xs"
                        />
                        <span className="text-[10px] text-gray-500">Admin mulai susun LHPP</span>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-1">3. Laporan Selesai</label>
                        <input
                            type="date"
                            value={s5Dates.tgl_laporan_selesai || ''}
                            onChange={e => setS5Dates({ ...s5Dates, tgl_laporan_selesai: e.target.value })}
                            disabled={!canManage}
                            className="w-full border border-blue-300 rounded px-2 py-1.5 bg-white text-xs"
                        />
                        <span className="text-[10px] text-gray-500">Siap review Stage 6</span>
                    </div>
                </div>

                {/* Lead Time calculation badges */}
                {s5Dates.tgl_teknis_diserahkan && s5Dates.tgl_laporan_selesai && (
                    <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                        <span className="text-[11px] font-extrabold text-blue-900">Lead Time LHPP:</span>
                        <span className="text-[11px] font-bold bg-white text-blue-800 border border-blue-300 px-2 py-0.5 rounded shadow-2xs">
                            Total Durasi: {Math.max(0, Math.round((new Date(s5Dates.tgl_laporan_selesai) - new Date(s5Dates.tgl_teknis_diserahkan)) / 86400000))} Hari
                        </span>
                    </div>
                )}
            </div>

            {/* Google Drive Folder Alternative Input */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span>📁 Tautan Google Drive Folder (Alternatif 5-File Bundle)</span>
                    </label>
                    {job.gdrive_folder_url && (
                        <a
                            href={job.gdrive_folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                            Buka Folder ↗
                        </a>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={gdriveUrl}
                        onChange={e => setGdriveUrl(e.target.value)}
                        disabled={!canManage}
                        className="flex-1 text-xs border border-amber-300 rounded px-2 py-1.5 bg-white"
                    />
                    {canManage && (
                        <button
                            type="button"
                            onClick={handleSaveGdrive}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-2xs"
                        >
                            Simpan Link
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-amber-800 italic">
                    Gunakan tautan Google Drive untuk kumpulan berkas draf teknis, BAP, atau sertifikat tambahan yang berukuran besar.
                </p>
            </div>

            {/* Upload Slots */}
            <p className="text-xs text-gray-500">Unggah dokumen LHPP dan BAP fisik lokal:</p>
            <div className="space-y-2">
                {(DOC_TYPES_BY_STAGE[5] || []).map(t => (
                    <UploadSlot
                        key={t}
                        type={t}
                        stageId={5}
                        docs={job.documents}
                        triggerUpload={triggerUpload}
                        uploadFileDirectly={uploadFileDirectly}
                        canManageStageDocs={canManageStageDocs}
                        deleteDoc={deleteDoc}
                    />
                ))}
            </div>

            <NoteField value={data.notes} onChange={e => actions.setData('notes', e.target.value)} />

            <MoveRow
                stage={5}
                processing={processing}
                disabled={!canManage}
                onReject={handleRejectStage}
            />
        </form>
    );
}
