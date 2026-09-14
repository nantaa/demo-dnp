import React from 'react';

export default function Stage12Action({
    user,
    handleReopenJob,
}) {
    return (
        <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <h4 className="text-sm font-bold text-emerald-900 mt-1">Pekerjaan Selesai & Ditutup (Closed)</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                    Seluruh proses sertifikasi, penyerahan Suket, dan pelunasan pembayaran telah selesai.
                </p>
            </div>

            {/* Reopen Button for Superadmin / Manager / Kadiv */}
            {['superadmin', 'manager', 'kadiv'].includes(user?.role?.toLowerCase()) && (
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleReopenJob}
                        className="w-full px-4 py-2.5 rounded text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                        Buka Kembali Job (Reopen) ke Stage 5
                    </button>
                </div>
            )}
        </div>
    );
}
