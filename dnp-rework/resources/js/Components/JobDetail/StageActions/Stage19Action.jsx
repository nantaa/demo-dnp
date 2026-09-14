import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot, fmtCurrency } from '../constants';

export default function Stage19Action({
    job,
    data,
    setData,
    s19,
    setS19,
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
            <div className="bg-sky-50/70 border border-sky-300 rounded-lg p-3 text-xs text-sky-900">
                <strong>Stage 1c — Penagihan DP (Marketing):</strong>
                <p className="mt-1">
                    Kirimkan invoice DP ke klien dan lakukan konfirmasi tindak lanjut pembayaran uang muka.
                </p>
            </div>

            <div className="bg-gray-50/60 p-3.5 border rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-gray-500">Nomor Invoice DP:</span>
                        <div className="font-bold text-gray-800">{job.dp_invoice_no || s19?.dp_invoice_no || '—'}</div>
                    </div>
                    <div>
                        <span className="text-gray-500">Nominal Tagihan DP:</span>
                        <div className="font-bold text-emerald-700">{fmtCurrency(job.dp_amount || s19?.dp_amount)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Kirim Invoice DP</label>
                        <input
                            type="date"
                            value={s19?.tgl_kirim_dp || ''}
                            onChange={e => setS19({ ...s19, tgl_kirim_dp: e.target.value })}
                            disabled={!canManage}
                            className="w-full text-sm border rounded px-2.5 py-1.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Status Penagihan DP</label>
                        <select
                            value={s19?.dp_billing_status || 'sent'}
                            onChange={e => setS19({ ...s19, dp_billing_status: e.target.value })}
                            disabled={!canManage}
                            className="w-full text-sm border rounded px-2.5 py-1.5 font-medium"
                        >
                            <option value="sent">Terkirim ke Klien</option>
                            <option value="confirmed">Klien Konfirmasi Akan Bayar</option>
                            <option value="pending">Menunggu Pembayaran</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Unggah Bukti Penagihan DP (Opsional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(DOC_TYPES_BY_STAGE[19] || []).map(t => (
                        <UploadSlot
                            key={t}
                            type={t}
                            stageId={19}
                            docs={job.documents}
                            triggerUpload={triggerUpload}
                            uploadFileDirectly={uploadFileDirectly}
                            canManageStageDocs={canManageStageDocs}
                            deleteDoc={deleteDoc}
                            isOptional={true}
                        />
                    ))}
                </div>
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={19}
                processing={processing}
                disabled={!canManage}
                onReject={handleRejectStage}
            />
        </form>
    );
}
