import React from 'react';

export default function RevisePoModal({ show, onClose, form, setForm, onSubmit }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
                <div className="flex items-center justify-between border-b pb-3">
                    <div>
                        <h3 className="text-base font-black text-[#0A385C]">Revisi Data PO / SPK</h3>
                        <p className="text-xs text-gray-500">Ubah detail PO tanpa mengubah alur tahapan/stage job.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">x</button>
                </div>
                <form onSubmit={onSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Nomor PO / SPK / Proposal *</label>
                        <input
                            type="text"
                            required
                            value={form.no_po || ''}
                            onChange={e => setForm(prev => ({ ...prev, no_po: e.target.value }))}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                            placeholder="PO/SPK/..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Tanggal PO</label>
                            <input
                                type="date"
                                value={form.tgl_po || ''}
                                onChange={e => setForm(prev => ({ ...prev, tgl_po: e.target.value }))}
                                className="w-full border rounded px-2.5 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Termin Pembayaran</label>
                            <select
                                value={form.termin_pembayaran || 'FULL'}
                                onChange={e => setForm(prev => ({ ...prev, termin_pembayaran: e.target.value }))}
                                className="w-full border rounded px-2.5 py-1.5 text-sm"
                            >
                                <option value="FULL">FULL</option>
                                <option value="TERMIN">TERMIN</option>
                                <option value="CBD">CBD</option>
                                <option value="DP">DP</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Nilai Kontrak (Sesudah PPN 12%) *</label>
                        <input
                            type="number"
                            min="0"
                            required
                            value={form.nilai || ''}
                            onChange={e => setForm(prev => ({ ...prev, nilai: e.target.value }))}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                        />
                        {form.nilai && parseFloat(form.nilai) > 0 && (() => {
                            const total = parseFloat(form.nilai || 0);
                            const dpp = Math.round(total / 1.12);
                            const ppn = total - dpp;
                            return (
                                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2 mt-1.5 flex justify-between">
                                    <span>DPP (Sebelum PPN): <strong>Rp {dpp.toLocaleString('id-ID')}</strong></span>
                                    <span>PPN (12%): <strong>Rp {ppn.toLocaleString('id-ID')}</strong></span>
                                </div>
                            );
                        })()}
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Alasan / Catatan Revisi</label>
                        <textarea
                            rows={2}
                            value={form.revision_notes || ''}
                            onChange={e => setForm(prev => ({ ...prev, revision_notes: e.target.value }))}
                            placeholder="Catatan alasan perubahan data PO..."
                            className="w-full border rounded px-2.5 py-1.5 text-xs"
                        />
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
                            className="px-4 py-1.5 rounded text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs"
                        >
                            Simpan Revisi PO
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
