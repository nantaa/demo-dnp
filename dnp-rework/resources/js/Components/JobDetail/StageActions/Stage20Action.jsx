import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot, fmtCurrency } from '../constants';

export default function Stage20Action({
    job,
    data,
    setData,
    s20,
    setS20,
    processing,
    canManage,
    canManageStageDocs,
    handleMoveStage,
    handleRejectStage,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
}) {
    const isDocUploaded = (job.documents || []).some(d => d.stage === 20);

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-900">
                <strong>Stage 1d — Konfirmasi & Verifikasi Bayar DP (Finance):</strong>
                <p className="mt-1">
                    Verifikasi pembayaran uang muka (DP) pada rekening koran. Setelah diverifikasi, Surat Tugas (Stage 3) akan terbuka.
                </p>
            </div>

            <div className="bg-gray-50/60 p-3.5 border rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-gray-500">Nomor Invoice DP:</span>
                        <div className="font-bold text-gray-800">{job.dp_invoice_no || '—'}</div>
                    </div>
                    <div>
                        <span className="text-gray-500">Nominal Tagihan DP:</span>
                        <div className="font-bold text-emerald-700">{fmtCurrency(job.dp_amount)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Status Verifikasi DP *</label>
                        <select
                            value={s20?.dp_payment_status || 'verified'}
                            onChange={e => setS20({ ...s20, dp_payment_status: e.target.value })}
                            disabled={!canManage}
                            className="w-full text-sm border rounded px-2.5 py-1.5 font-bold text-emerald-800 bg-white"
                        >
                            <option value="verified">Verified (DP Masuk / Lunas)</option>
                            <option value="pending">Pending (Belum Masuk Rekening)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal DP Diterima</label>
                        <input
                            type="date"
                            value={s20?.tgl_dp_paid || ''}
                            onChange={e => setS20({ ...s20, tgl_dp_paid: e.target.value })}
                            disabled={!canManage}
                            className="w-full text-sm border rounded px-2.5 py-1.5"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Unggah Bukti Transfer / Rekening Koran DP</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(DOC_TYPES_BY_STAGE[20] || []).map(t => (
                        <UploadSlot
                            key={t}
                            type={t}
                            stageId={20}
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
                stage={20}
                processing={processing}
                disabled={!canManage || s20?.dp_payment_status !== 'verified'}
                disabledMsg={s20?.dp_payment_status !== 'verified' ? 'Pilih status Verified untuk mengkonfirmasi DP.' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
