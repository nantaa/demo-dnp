import React from 'react';

export default function ReviseInvoiceModal({
    show,
    onClose,
    formData,
    onChange,
    onSubmit,
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
                <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Revisi Data Invoice (Finance)</h3>
                        <p className="text-xs text-gray-500">Perbarui invoice kapan saja tanpa mengubah stage alur kerja</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Invoice *</label>
                        <input
                            type="text"
                            value={formData.invoice_no}
                            onChange={e => onChange({ ...formData, invoice_no: e.target.value })}
                            className="w-full text-sm border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500"
                            placeholder="INV/2026/..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Total Nilai Tagihan (Rp) *</label>
                        <input
                            type="number"
                            value={formData.total_invoice_amount}
                            onChange={e => onChange({ ...formData, total_invoice_amount: e.target.value })}
                            className="w-full text-sm border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Invoice Diterbitkan</label>
                        <input
                            type="date"
                            value={formData.tgl_invoice_issued}
                            onChange={e => onChange({ ...formData, tgl_invoice_issued: e.target.value })}
                            className="w-full text-sm border rounded px-2.5 py-1.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Revisi / Alasan Perubahan</label>
                        <textarea
                            rows={2}
                            value={formData.revision_notes}
                            onChange={e => onChange({ ...formData, revision_notes: e.target.value })}
                            className="w-full text-sm border rounded px-2.5 py-1.5"
                            placeholder="Contoh: Koreksi PPN / perubahan termin sesuai kesepakatan klien..."
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs"
                        >
                            Simpan Revisi Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
