import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { UploadSlot, fmtCurrency } from '../constants';

export default function Stage15Action({
    job,
    s11c,
    setS11c,
    handleSaveS11c,
    processing,
    canManage,
    canManageStageDocs,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
}) {
    return (
        <div className="space-y-4">
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span>Stage 11c: Verifikasi Pembayaran (Finance)</span>
                    </h4>
                    <div className="flex items-center gap-1.5">
                        <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                            Retry: {job.payment_retry_count || 0} / 5
                        </span>
                        <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                            HARD GATE v2.0
                        </span>
                    </div>
                </div>
                <p className="text-xs text-purple-800">
                    Finance memvalidasi mutasi bank dan kepastian dana masuk sebelum SUKET dapat dirilis ke klien. Jika belum lunas, kembalikan ke Stage 11.
                </p>
            </div>

            {(job.payment_retry_count || 0) >= 5 && (
                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 text-xs text-red-900">
                    <p className="font-extrabold text-sm mb-1">Eskalasi Pembayaran Macet (Maksimal 5x Terlampaui)!</p>
                    <p>
                        Penagihan telah gagal / partial sebanyak 5 kali. Sistem telah mengeskalasi kasus ini ke Kepala Divisi dan Manager untuk pembekuan job / tindakan penanganan khusus.
                    </p>
                </div>
            )}

            {/* Rekonsiliasi Tagihan vs Penerimaan */}
            <div className="bg-white border rounded-lg p-3 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-gray-500 font-semibold block mb-1">Nilai Kontrak / Invoice</span>
                        <span className="text-sm font-bold text-gray-900">{fmtCurrency(job.nilai)}</span>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Dana Masuk Rekening (Rp) *</label>
                        <input
                            type="number"
                            value={s11c.amount_received}
                            onChange={e => setS11c({ ...s11c, amount_received: e.target.value })}
                            disabled={!canManage}
                            className="w-full border rounded px-2 py-1.5 text-sm font-bold text-emerald-700"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">No. Referensi / Mutasi Bank *</label>
                        <input
                            type="text"
                            placeholder="Contoh: BCA-TRF-98234710..."
                            value={s11c.bank_ref}
                            onChange={e => setS11c({ ...s11c, bank_ref: e.target.value })}
                            disabled={!canManage}
                            className="w-full border rounded px-2 py-1.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Keputusan Status Pembayaran *</label>
                        <select
                            value={s11c.verification_status}
                            onChange={e => setS11c({ ...s11c, verification_status: e.target.value })}
                            disabled={!canManage}
                            className="w-full border rounded px-2 py-1.5 font-bold"
                        >
                            <option value="Lunas">Lunas (Dana Diterima Penuh)</option>
                            <option value="Partial / Pending">Partial / Pending (Belum Lunas)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                        Catatan Verifikasi Keuangan {s11c.verification_status === 'Partial / Pending' && <span className="text-red-500">* (Wajib diisi jika Partial/Pending)</span>}
                    </label>
                    <textarea
                        rows={2}
                        value={s11c.verification_notes}
                        onChange={e => setS11c({ ...s11c, verification_notes: e.target.value })}
                        disabled={!canManage}
                        className="w-full border rounded px-2.5 py-1.5"
                        placeholder={s11c.verification_status === 'Partial / Pending' ? 'Sebutkan kekurangan transfer atau alasan penolakan...' : 'Keterangan mutasi / rekening koran...'}
                    />
                </div>
            </div>

            <div className="space-y-2">
                {(DOC_TYPES_BY_STAGE[15] || []).map(t => (
                    <UploadSlot
                        key={t}
                        type={t}
                        stageId={15}
                        docs={job.documents}
                        triggerUpload={triggerUpload}
                        uploadFileDirectly={uploadFileDirectly}
                        canManageStageDocs={canManageStageDocs}
                        deleteDoc={deleteDoc}
                        isOptional={true}
                    />
                ))}
            </div>

            {/* Decision Buttons */}
            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={() => handleSaveS11c('Partial / Pending')}
                    disabled={processing || !canManage}
                    className="px-4 py-2 rounded text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1 disabled:opacity-40"
                >
                    Partial/Pending (Loop ke Stage 11)
                </button>
                <button
                    type="button"
                    onClick={() => handleSaveS11c('Lunas')}
                    disabled={processing || !canManage}
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1 disabled:opacity-40"
                >
                    Verifikasi Lunas & Buka Kirim SUKET (Stage 11b) →
                </button>
            </div>
        </div>
    );
}
