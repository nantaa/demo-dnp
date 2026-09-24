import React from 'react';
import { DOC_TYPES_BY_STAGE } from '../../../Constants';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage15Action({
    job,
    s15,
    setS15,
    handleSaveS15,
    triggerUpload,
    uploadFileDirectly,
    canManageStageDocs,
    deleteDoc,
    isINS,
    data,
    setData,
    processing,
    isMoving,
    handleRejectStage
}) {
    return (
        <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span>✅</span> Stage 11c — Kirim SUKET ke Klien (Marketing)
                </h4>
                <p className="text-xs text-emerald-700">
                    Pembayaran LUNAS telah diverifikasi oleh Finance. Silakan serahkan atau kirimkan dokumen resmi SUKET ke Klien.
                </p>
            </div>

            {/* No. Resi & Tgl Kirim */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-800">Informasi Pengiriman / Penyerahan SUKET</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[11px] text-gray-500 mb-1">No. Resi / Kurir (Opsional)</label>
                        <input
                            type="text"
                            value={s15.no_resi || ''}
                            onChange={e => setS15({ ...s15, no_resi: e.target.value })}
                            placeholder="Contoh: JNE-123456789, SiCepat-987..."
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] text-gray-500 mb-1">Tanggal Penyerahan (Opsional)</label>
                        <input
                            type="date"
                            value={s15.tgl_submit_mkt || ''}
                            onChange={e => setS15({ ...s15, tgl_submit_mkt: e.target.value })}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSaveS15}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap transition"
                >
                    Simpan Informasi SUKET
                </button>
            </div>

            <p className="text-xs text-gray-500 font-medium">Upload Tanda Terima / Bukti Pengiriman SUKET (Opsional):</p>
            {(DOC_TYPES_BY_STAGE[15] || []).map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={15}
                    docs={job.documents}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isOptional={true}
                    isINS={isINS}
                />
            ))}

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <MoveRow stage={15} processing={processing || isMoving} onReject={handleRejectStage} />
        </div>
    );
}
