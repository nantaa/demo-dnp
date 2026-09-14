import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, UploadSlot } from '../constants';

export default function Stage14Action({
    job,
    data,
    setData,
    s11bDelivery,
    setS11bDelivery,
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
    const isPaymentVerified = job.payment_verification_status === 'Lunas' || job.paid === true;
    const hasBankStatement = job.bank_statement_attached === true || (job.documents || []).some(d =>
        d.stage === 15 ||
        d.type?.toLowerCase().includes('mutasi') ||
        d.type?.toLowerCase().includes('bank') ||
        d.type?.toLowerCase().includes('rekening') ||
        d.type === 'Bukti Bayar / Mutasi Rekening'
    );
    const hasDocumentDebt = job.document_debt && job.document_debt.length > 0;
    const canDeliver = isPaymentVerified && hasBankStatement && !hasDocumentDebt;

    return (
        <div className="space-y-4">
            {!canDeliver ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-xs text-red-900 space-y-3">
                    <div className="font-extrabold text-sm flex items-center gap-1.5 text-red-950">
                        Pengiriman SUKET Terkunci (Triple Hard-Gate v2.0)!
                    </div>
                    <p>
                        Berdasarkan SOP resmi dan spesifikasi v2.0, SUKET tidak dapat diserahkan/dikirim kepada klien sebelum 3 syarat gerbang berikut terpenuhi:
                    </p>
                    <div className="space-y-2 bg-white/80 p-3 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPaymentVerified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                {isPaymentVerified ? "Terpenuhi" : "Belum"}
                            </span>
                            <span className={isPaymentVerified ? "text-gray-700 font-medium" : "text-red-800 font-bold"}>
                                1. Pembayaran Diverifikasi Lunas di Stage 11c ({isPaymentVerified ? "Terverifikasi" : "Belum Lunas"})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasBankStatement ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                {hasBankStatement ? "Terpenuhi" : "Belum"}
                            </span>
                            <span className={hasBankStatement ? "text-gray-700 font-medium" : "text-red-800 font-bold"}>
                                2. Lampiran Bukti Mutasi Bank / Rekening Koran ({hasBankStatement ? "Terlampir" : "Belum Ada"})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${!hasDocumentDebt ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                {!hasDocumentDebt ? "Terpenuhi" : "Belum"}
                            </span>
                            <span className={!hasDocumentDebt ? "text-gray-700 font-medium" : "text-red-800 font-bold"}>
                                3. Bebas Hutang Dokumen Stage 2 ({!hasDocumentDebt ? "Lengkap" : `Ada ${job.document_debt.length} Dokumen Tertunda: ${job.document_debt.join(', ')}`})
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRejectStage}
                        className="px-3 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                    >
                        Kembalikan ke Verifikasi Keuangan (Stage 11c)
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-emerald-900 mb-1">
                            Stage 11b: Pengiriman SUKET ke Klien (Marketing)
                        </h4>
                        <p className="text-xs text-emerald-800">
                            Pembayaran terverifikasi LUNAS, rekening koran terlampir, dan seluruh dokumen lengkap. Kirimkan SUKET fisik/digital ke klien secara bertahap atau sekaligus.
                        </p>
                    </div>

                    <div className="bg-white border rounded-lg p-3 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">No. Resi / Tracking Ekspedisi</label>
                                <input
                                    type="text"
                                    value={s11bDelivery.no_resi}
                                    onChange={e => setS11bDelivery({ ...s11bDelivery, no_resi: e.target.value })}
                                    disabled={!canManage}
                                    placeholder="Contoh: JNE-9827361928"
                                    className="w-full border rounded px-2 py-1.5"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Nama Ekspedisi / Kurir</label>
                                <input
                                    type="text"
                                    value={s11bDelivery.ekspedisi}
                                    onChange={e => setS11bDelivery({ ...s11bDelivery, ekspedisi: e.target.value })}
                                    disabled={!canManage}
                                    placeholder="Kurir Internal / JNE / SiCepat..."
                                    className="w-full border rounded px-2 py-1.5"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Tanggal Pengiriman</label>
                                <input
                                    type="date"
                                    value={s11bDelivery.tgl_kirim_suket}
                                    onChange={e => setS11bDelivery({ ...s11bDelivery, tgl_kirim_suket: e.target.value })}
                                    disabled={!canManage}
                                    className="w-full border rounded px-2 py-1.5"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Pengiriman Batch ke-</label>
                                <input
                                    type="text"
                                    value={s11bDelivery.batch_no}
                                    onChange={e => setS11bDelivery({ ...s11bDelivery, batch_no: e.target.value })}
                                    disabled={!canManage}
                                    placeholder="Batch 1 (Semua Unit) / Batch 1 (20 Unit)..."
                                    className="w-full border rounded px-2 py-1.5"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Penerima di Klien / Tanda Terima</label>
                            <input
                                type="text"
                                value={s11bDelivery.tanda_terima_klien}
                                onChange={e => setS11bDelivery({ ...s11bDelivery, tanda_terima_klien: e.target.value })}
                                disabled={!canManage}
                                placeholder="Nama PIC Penerima & Tanda Tangan Tanda Terima..."
                                className="w-full border rounded px-2 py-1.5"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
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
                            Kembalikan ke Stage 11c
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                post(`/jobs/${job.id}/move`, {
                                    data: { ...data, ...s11bDelivery, next_stage: 12 },
                                    onSuccess: () => onClose()
                                });
                            }}
                            disabled={processing || !canManage}
                            className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-40"
                        >
                            {processing ? '...' : 'Selesaikan & Tutup Job (Stage 12 Closed) →'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
