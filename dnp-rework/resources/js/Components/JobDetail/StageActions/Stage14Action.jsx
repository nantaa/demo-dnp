import React from 'react';
import { DOC_TYPES_BY_STAGE } from '../../../Constants';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage14Action({
    job,
    s14,
    setS14,
    handleSaveS14,
    user,
    canSeeNilai,
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
    const isFinAuth = user?.role === 'finance' || user?.isSuperadmin || user?.role === 'superadmin';

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-bold text-blue-900 mb-1">
                    Stage 11b — Verifikasi Bayar & PPh: Lunas (Finance)
                </h4>
                <p className="text-xs text-blue-700">
                    Verifikasi status pembayaran dan bukti potong PPh dari klien. Dokumen SUKET hanya dapat dikirim ke klien setelah status pembayaran diverifikasi LUNAS.
                </p>
            </div>

            {job.invoice_no && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
                    <span className="font-bold text-[#0A385C]">Invoice:</span> {job.invoice_no}
                    {canSeeNilai && job.total_invoice_amount > 0 && (
                        <span className="ml-2 font-semibold text-gray-800">• Tagihan: Rp {Number(job.total_invoice_amount).toLocaleString('id-ID')}</span>
                    )}
                </div>
            )}
            
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status Pembayaran 11b *</label>
                <select
                    value={s14.s14_payment_status || 'pending'}
                    onChange={e => setS14({ ...s14, s14_payment_status: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 font-medium"
                    disabled={!isFinAuth}
                >
                    <option value="pending">Pending (Belum Lunas)</option>
                    <option value="partial">Partial (Dibayar Sebagian)</option>
                    <option value="paid">Paid (Lunas Sempurna)</option>
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Pembayaran & Potong PPh</label>
                <textarea
                    rows={2}
                    value={s14.s14_payment_notes || ''}
                    onChange={e => setS14({ ...s14, s14_payment_notes: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5"
                    placeholder="Contoh: Transfer BCA tgl 20 Aug, Bukti Potong PPh 23 terlampir 2%, lunas..."
                    disabled={!isFinAuth}
                />
            </div>

            {isFinAuth && (
                <button
                    type="button"
                    onClick={handleSaveS14}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-sm transition"
                >
                    Simpan Status Pembayaran 11b
                </button>
            )}

            <p className="text-xs font-semibold text-gray-700 mt-3 mb-1">Dokumen Pendukung Pembayaran & PPh (Opsional):</p>
            {(DOC_TYPES_BY_STAGE[14] || []).map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={14}
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
            
            {isFinAuth ? (
                <MoveRow
                    stage={14}
                    processing={processing || isMoving}
                    onReject={handleRejectStage}
                    disabled={s14.s14_payment_status !== 'paid'}
                    disabledMsg={s14.s14_payment_status !== 'paid' ? 'Pekerjaan hanya dapat dilanjutkan ke Pengiriman SUKET (11c) setelah status pembayaran Lunas (Paid).' : ''}
                />
            ) : (
                <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded p-3 text-center">
                    Hanya <strong>Finance</strong> yang berwenang memverifikasi pembayaran dan meloloskan ke Pengiriman SUKET.
                </div>
            )}
        </div>
    );
}
