import React from 'react';
import { DOC_TYPES_BY_STAGE } from '../../../Constants';
import { fmt } from '../helpers';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage11Action({
    job,
    s11,
    setS11,
    handleSaveS11,
    canSeeNilai,
    canEditNilai,
    canReviseInvoiceMonth,
    setShowReviseInvoiceModal,
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
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                <h4 className="text-xs font-bold text-sky-900 mb-1">
                    Stage 11 — Penagihan / Follow-up (Marketing)
                </h4>
                <p className="text-xs text-sky-700">
                    Lakukan follow-up dan penagihan ke klien atas invoice yang telah diterbitkan Finance.
                </p>
            </div>

            {job.invoice_no && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <span className="font-bold text-[#0A385C]">Invoice:</span> {job.invoice_no}
                        {canSeeNilai && job.total_invoice_amount > 0 && (
                            <span className="ml-2 font-semibold text-gray-800">• Rp {Number(job.total_invoice_amount).toLocaleString('id-ID')}</span>
                        )}
                        {job.tgl_invoice_issued && (
                            <span className="ml-2 text-gray-500">• Tgl: {fmt(job.tgl_invoice_issued)}</span>
                        )}
                        <span className="block text-[11px] text-gray-500">Revisi invoice ditangani Finance secara paralel tanpa menghambat alur kerja.</span>
                    </div>
                    {canEditNilai && (
                        <button
                            type="button"
                            onClick={() => setShowReviseInvoiceModal(true)}
                            disabled={!canReviseInvoiceMonth}
                            className={`text-xs font-bold px-2 py-1 rounded self-start sm:self-auto border transition-colors ${
                                canReviseInvoiceMonth
                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                            title={canReviseInvoiceMonth ? 'Revisi Invoice' : 'Batas waktu revisi invoice (bulan yang sama) telah berakhir'}
                        >
                            Revisi Invoice
                        </button>
                    )}
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-800">Tanggal Follow-up / Penyerahan Tagihan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                        type="date"
                        value={s11.tgl_submit_mkt || ''}
                        onChange={e => setS11({ ...s11, tgl_submit_mkt: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                        type="text"
                        value={s11.notes || ''}
                        onChange={e => setS11({ ...s11, notes: e.target.value })}
                        placeholder="Catatan respon klien (Opsional)"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSaveS11}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-700 text-white hover:bg-gray-800 transition"
                >
                    Simpan Data Follow-up
                </button>
            </div>

            <p className="text-xs text-gray-500 font-medium">Dokumen Pendukung Tagihan / Follow-up (Opsional):</p>
            {(DOC_TYPES_BY_STAGE[11] || []).map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={11}
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
            <MoveRow stage={11} processing={processing || isMoving} onReject={handleRejectStage} />
        </div>
    );
}
