import React from 'react';
import { PROGRESS_STATUSES, DOC_TYPES_BY_STAGE } from '../../../Constants';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage10Action({
    job,
    s10,
    setS10,
    canEditNilai,
    showTgl15Warning,
    handleSaveS10,
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
    const hasInvoiceDoc10 = (job.documents || []).some(d => ['Invoice (PDF)', 'Invoice', 'Faktur / Invoice'].includes(d.type));
    const s10CanMove = s10.invoice_no?.trim() && s10.total_invoice_amount && parseFloat(s10.total_invoice_amount) > 0 && s10.tgl_invoice_issued && hasInvoiceDoc10;
    const s10DisabledMsg = !s10.invoice_no?.trim() ? 'Isi Nomor Invoice terlebih dahulu' :
        (!s10.total_invoice_amount || parseFloat(s10.total_invoice_amount) <= 0) ? 'Isi Total Invoice (Nilai Tagihan) dengan benar' :
        !s10.tgl_invoice_issued ? 'Isi Tanggal Invoice Diterbitkan terlebih dahulu' :
        !hasInvoiceDoc10 ? 'Upload Dokumen "Invoice (PDF)" terlebih dahulu' : '';

    return (
        <div className="space-y-3">
            {showTgl15Warning && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                    <strong>Peringatan Tanggal 15:</strong> Sudah melewati batas tanggal 15 bulan berjalan. Perubahan data nilai invoice dan faktur pajak berisiko terhadap pelaporan pajak.
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Invoice *</label>
                    <input
                        type="text"
                        value={s10.invoice_no || ''}
                        placeholder="Contoh: INV/2026/001"
                        onChange={e => setS10({ ...s10, invoice_no: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Invoice (Rp) *</label>
                    <input
                        type="number"
                        value={s10.total_invoice_amount || ''}
                        onChange={e => setS10({ ...s10, total_invoice_amount: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Invoice Diterbitkan *</label>
                    <input
                        type="date"
                        value={s10.tgl_invoice_issued || ''}
                        onChange={e => setS10({ ...s10, tgl_invoice_issued: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Submit ke MKT</label>
                    <input
                        type="date"
                        value={s10.tgl_submit_mkt || ''}
                        onChange={e => setS10({ ...s10, tgl_submit_mkt: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Faktur Pajak</label>
                    <input
                        type="text"
                        value={s10.no_faktur_pajak || ''}
                        placeholder="Contoh: 010.000-26.00000001"
                        onChange={e => setS10({ ...s10, no_faktur_pajak: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Faktur Pajak</label>
                    <input
                        type="date"
                        value={s10.tgl_faktur_pajak || ''}
                        onChange={e => setS10({ ...s10, tgl_faktur_pajak: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status Progress</label>
                    <select
                        value={s10.s10_progress_status || ''}
                        onChange={e => setS10({ ...s10, s10_progress_status: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                        disabled={!canEditNilai}
                    >
                        <option value="">-- Pilih Status --</option>
                        {PROGRESS_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
            </div>
            {canEditNilai && (
                <button
                    type="button"
                    onClick={handleSaveS10}
                    className="px-4 py-2 rounded text-sm font-semibold bg-gray-700 text-white hover:bg-gray-800"
                >
                    Simpan Data Invoice & Faktur
                </button>
            )}
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
                    isINS={isINS}
                />
            ))}
            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <MoveRow
                stage={10}
                processing={processing || isMoving}
                onReject={handleRejectStage}
                disabled={!s10CanMove}
                disabledMsg={s10DisabledMsg}
            />
        </div>
    );
}
