import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, UploadSlot, fmtCurrency } from '../constants';

export default function Stage11Action({
    job,
    data,
    setData,
    s11Collection,
    setS11Collection,
    handleRejectStage,
    post,
    processing,
    canManage,
    canManageStageDocs,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
    onClose,
}) {
    return (
        <div className="space-y-4">
            {job.payment_retry_count > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-xs text-red-900 font-medium animate-pulse">
                    <strong>Hasil Verifikasi Finance: Pembayaran Belum Lunas / Pending!</strong><br />
                    Job dikembalikan dari Stage 11c untuk follow-up penagihan ulang oleh Marketing (Penagihan Ulang ke-{job.payment_retry_count}).
                    {job.payment_verification_notes && (
                        <span className="block mt-1 bg-white p-2 rounded border border-red-200 font-semibold text-red-800">
                            Catatan Finance: "{job.payment_verification_notes}"
                        </span>
                    )}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900">
                        Penagihan & Follow-up Pembayaran (Marketing)
                    </h4>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-black">
                        Delta v5-2-2
                    </span>
                </div>
                <p className="text-xs text-blue-800">
                    Lakukan penagihan kepada PIC Klien ({job.pic_klien || job.klien}) untuk pelunasan invoice senilai <strong>{fmtCurrency(job.nilai)}</strong>. Unggah bukti tagihan dan bukti transfer jika ada.
                </p>
            </div>

            <div className="bg-white border rounded-lg p-3 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Metode Follow-up Penagihan</label>
                        <input
                            type="text"
                            value={s11Collection.metode_penagihan}
                            onChange={e => setS11Collection({ ...s11Collection, metode_penagihan: e.target.value })}
                            disabled={!canManage}
                            placeholder="Email / Telepon / WhatsApp / Visit..."
                            className="w-full border rounded px-2 py-1.5"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Tanggal Terakhir Ditagih</label>
                        <input
                            type="date"
                            value={s11Collection.tgl_penagihan}
                            onChange={e => setS11Collection({ ...s11Collection, tgl_penagihan: e.target.value })}
                            disabled={!canManage}
                            className="w-full border rounded px-2 py-1.5"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-1">Catatan Penagihan / Konfirmasi Klien</label>
                    <textarea
                        rows={2}
                        value={s11Collection.catatan_penagihan}
                        onChange={e => setS11Collection({ ...s11Collection, catatan_penagihan: e.target.value })}
                        disabled={!canManage}
                        className="w-full border rounded px-2.5 py-1.5"
                        placeholder="Contoh: Klien mengonfirmasi transfer hari ini via Mandiri..."
                    />
                </div>
            </div>

            <div className="space-y-2">
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
                    />
                ))}
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <div className="flex gap-2 mt-4">
                <button
                    type="button"
                    onClick={handleRejectStage}
                    disabled={processing}
                    className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                    Kembalikan ke Invoice (Stage 10)
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        post(`/jobs/${job.id}/move`, {
                            data: { ...data, ...s11Collection, next_stage: 15 },
                            onSuccess: () => onClose()
                        });
                    }}
                    disabled={processing || !canManage}
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-40"
                >
                    {processing ? '...' : 'Serahkan ke Verifikasi Pembayaran (Stage 11c) →'}
                </button>
            </div>
        </div>
    );
}
