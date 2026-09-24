import React from 'react';

export default function ReviseInvoiceModal({ show, onClose, form, setForm, onSubmit }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
                <div className="flex items-center justify-between border-b pb-3">
                    <div>
                        <h3 className="text-base font-black text-[#0A385C]">Revisi Data Invoice & Faktur Pajak</h3>
                        <p className="text-xs text-gray-500">Perbarui nomor atau tanggal invoice tanpa membatalkan proses.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">x</button>
                </div>
                <form onSubmit={onSubmit} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block font-bold text-gray-700 mb-1">Nomor Invoice *</label>
                            <input
                                type="text"
                                required
                                value={form.invoice_no || ''}
                                onChange={e => setForm(prev => ({ ...prev, invoice_no: e.target.value }))}
                                className="w-full border rounded px-2.5 py-1.5 text-sm"
                                placeholder="INV/2026/..."
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block font-bold text-gray-700 mb-1">Total Tagihan (Rp) *</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={form.total_invoice_amount || ''}
                                onChange={e => setForm(prev => ({ ...prev, total_invoice_amount: e.target.value }))}
                                className="w-full border rounded px-2.5 py-1.5 text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Tanggal Terbit Invoice</label>
                            <input
                                type="date"
                                value={form.tgl_invoice_issued || ''}
                                onChange={e => setForm(prev => ({ ...prev, tgl_invoice_issued: e.target.value }))}
                                className="w-full border rounded px-2.5 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Nomor Faktur Pajak</label>
                            <input
                                type="text"
                                value={form.no_faktur_pajak || ''}
                                onChange={e => setForm(prev => ({ ...prev, no_faktur_pajak: e.target.value }))}
                                className="w-full border rounded px-2.5 py-1.5 text-sm"
                                placeholder="010.000-..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Tanggal Faktur Pajak</label>
                        <input
                            type="date"
                            value={form.tgl_faktur_pajak || ''}
                            onChange={e => setForm(prev => ({ ...prev, tgl_faktur_pajak: e.target.value }))}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Alasan / Catatan Revisi</label>
                        <textarea
                            rows={2}
                            value={form.revision_notes || ''}
                            onChange={e => setForm(prev => ({ ...prev, revision_notes: e.target.value }))}
                            placeholder="Catatan alasan perubahan data invoice..."
                            className="w-full border rounded px-2.5 py-1.5 text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3 border-gray-100">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1" htmlFor="revise-invoice-file">Unggah File Invoice Baru (PDF)</label>
                            <input
                                id="revise-invoice-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => setForm(prev => ({ ...prev, invoice_file: e.target.files[0] }))}
                                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 mb-1" htmlFor="revise-faktur-file">Unggah File Faktur Pajak Baru (PDF)</label>
                            <input
                                id="revise-faktur-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => setForm(prev => ({ ...prev, faktur_file: e.target.files[0] }))}
                                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 rounded text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                        >
                            Simpan Revisi Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
