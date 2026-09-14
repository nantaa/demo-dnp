import React from 'react';
import { DOC_TYPES_BY_STAGE, PROGRESS_STATUSES } from '@/Constants';
import { NoteField, MoveRow, UploadSlot, fmtCurrency } from '../constants';

export default function Stage10Action({
    job,
    state = {},
    actions = {},
    permissions = {},
}) {
    const {
        data,
        processing,
        s10 = {},
        setS10 = () => {},
    } = state;

    const {
        handleSaveS10,
        handleMoveStage,
        handleRejectStage,
        triggerUpload,
        uploadFileDirectly,
        deleteDoc,
    } = actions;

    const { canManage, canManageStageDocs } = permissions;

    const hasInvoiceDoc10 = (job.documents || []).some(d =>
        ['Invoice (PDF)', 'Invoice', 'Faktur / Invoice', 'Kwitansi Tagihan', 'Faktur Pajak'].includes(d.type)
    );

    const s10CanMove = s10.invoice_no?.trim() &&
        s10.total_invoice_amount &&
        parseFloat(s10.total_invoice_amount) > 0 &&
        s10.tgl_invoice_issued &&
        hasInvoiceDoc10;

    const s10DisabledMsg = !s10.invoice_no?.trim()
        ? 'Isi Nomor Invoice terlebih dahulu'
        : (!s10.total_invoice_amount || parseFloat(s10.total_invoice_amount) <= 0)
        ? 'Isi Total Invoice (Nilai Tagihan) dengan benar'
        : !s10.tgl_invoice_issued
        ? 'Isi Tanggal Invoice Diterbitkan terlebih dahulu'
        : !hasInvoiceDoc10
        ? 'Upload Dokumen "Invoice (PDF)" atau "Faktur Pajak" terlebih dahulu'
        : '';

    const currentDay = new Date().getDate();
    const isNearTaxCutoff = currentDay >= 12 && currentDay <= 18;

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            {/* Tax Cutoff Reminder Banner */}
            <div className={`p-3 rounded-lg border text-xs space-y-1 ${isNearTaxCutoff ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                        <span>📅 Periode Tutup Buku Pajak: Tanggal 15 Setiap Bulan</span>
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-black">
                        Finance Rule
                    </span>
                </div>
                <p className="text-[11px] opacity-90">
                    Pastikan Faktur Pajak dan Invoice diterbitkan pada masa pajak yang sama sebelum tanggal 15 agar tidak terjadi denda atau keterlambatan pelaporan pajak.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Invoice *</label>
                    <input
                        type="text"
                        value={s10.invoice_no || ''}
                        placeholder="Contoh: INV/2026/001"
                        onChange={e => setS10({ ...s10, invoice_no: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Invoice (Rp) *</label>
                    <input
                        type="number"
                        value={s10.total_invoice_amount || ''}
                        onChange={e => setS10({ ...s10, total_invoice_amount: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Invoice Diterbitkan *</label>
                    <input
                        type="date"
                        value={s10.tgl_invoice_issued || ''}
                        onChange={e => setS10({ ...s10, tgl_invoice_issued: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Submit ke MKT</label>
                    <input
                        type="date"
                        value={s10.tgl_submit_mkt || ''}
                        onChange={e => setS10({ ...s10, tgl_submit_mkt: e.target.value })}
                        disabled={!canManage}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    />
                </div>
            </div>

            {canManage && (
                <button
                    type="button"
                    onClick={handleSaveS10}
                    className="px-3 py-1.5 rounded text-xs font-bold bg-gray-700 text-white hover:bg-gray-800"
                >
                    Simpan Data Invoice
                </button>
            )}

            <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Dokumen Invoice & Faktur Pajak:</p>
                {(DOC_TYPES_BY_STAGE[10] || []).map(t => (
                    <UploadSlot
                        key={t}
                        type={t}
                        stageId={10}
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
                stage={10}
                processing={processing}
                disabled={!s10CanMove}
                disabledMsg={s10DisabledMsg}
                onReject={handleRejectStage}
            />
        </form>
    );
}
