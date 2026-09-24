import React from 'react';

export default function Stage16Action({
    job,
    user,
    permissions,
    handleReopenJob
}) {
    const isSuperOnly = user?.role === 'superadmin' || permissions === 'superadmin';

    return (
        <div className="space-y-4">
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">&#x2705;</div>
                <h4 className="text-lg font-extrabold text-emerald-900">Pekerjaan Selesai dan Diarsipkan</h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
                    Job ini telah diselesaikan oleh Finance dan diarsipkan. Tidak muncul di Kanban board regular.
                </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p><span className="font-semibold text-gray-700">Klien:</span> {job.klien || job.client_nama}</p>
                <p><span className="font-semibold text-gray-700">Invoice:</span> {job.invoice_no || '-'}</p>
                <p><span className="font-semibold text-gray-700">Nilai Invoice:</span> Rp {job.total_invoice_amount ? Number(job.total_invoice_amount).toLocaleString('id-ID') : '-'}</p>
                <p><span className="font-semibold text-gray-700">Status Bayar:</span> {(job.payment_status === 'paid' || job.paid) ? 'Lunas' : 'Belum Lunas'}</p>
            </div>

            {isSuperOnly && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        Pulihkan Pekerjaan (Superadmin)
                    </div>
                    <p className="text-[11px] text-amber-800">
                        Jika pekerjaan ini perlu ditangani kembali (revisi, klaim, atau keperluan darurat), Superadmin dapat memulihkan job ini ke stage yang relevan.
                    </p>
                    <button
                        type="button"
                        onClick={handleReopenJob}
                        className="px-3.5 py-2 rounded text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-1.5"
                    >
                        Pulihkan Job dari Arsip Selesai
                    </button>
                </div>
            )}
        </div>
    );
}
