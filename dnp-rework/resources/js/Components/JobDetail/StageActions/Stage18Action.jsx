import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot, fmtCurrency } from '../constants';

export default function Stage18Action({
    job,
    data,
    setData,
    s18,
    setS18,
    processing,
    canManage,
    canManageStageDocs,
    handleMoveStage,
    handleRejectStage,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
}) {
    const isDocUploaded = (job.documents || []).some(d => d.stage === 18);

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-900">
                <strong>Stage 1b — Invoicing DP (Admin Keuangan / Finance):</strong>
                <p className="mt-1">
                    Buat dan terbitkan invoice uang muka (DP) untuk pekerjaan ini.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/60 p-3.5 border rounded-lg">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Invoice DP *</label>
                    <input
                        type="text"
                        value={s18?.dp_invoice_no || ''}
                        onChange={e => setS18({ ...s18, dp_invoice_no: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500"
                        placeholder="DP/INV/2026/..."
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nominal DP (Rp) *</label>
                    <input
                        type="number"
                        value={s18?.dp_amount || ''}
                        onChange={e => setS18({ ...s18, dp_amount: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500"
                        placeholder="Contoh: 5000000"
                        required
                    />
                    {job.nilai && (
                        <p className="text-[10px] text-gray-500 mt-1">
                            Total Kontrak: {fmtCurrency(job.nilai)}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Terbit Invoice DP</label>
                    <input
                        type="date"
                        value={s18?.tgl_dp_issued || ''}
                        onChange={e => setS18({ ...s18, tgl_dp_issued: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border rounded px-2.5 py-1.5"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Unggah Dokumen Invoice DP</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(DOC_TYPES_BY_STAGE[18] || []).map(t => (
                        <UploadSlot
                            key={t}
                            type={t}
                            stageId={18}
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
                stage={18}
                processing={processing}
                disabled={!canManage || !s18?.dp_invoice_no}
                disabledMsg={!s18?.dp_invoice_no ? 'Isi Nomor Invoice DP terlebih dahulu.' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
