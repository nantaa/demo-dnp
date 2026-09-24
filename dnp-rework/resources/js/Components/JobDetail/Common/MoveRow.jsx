import React from 'react';
import { STAGES } from '@/Constants';

export default function MoveRow({ disabled = false, disabledMsg = '', stage, processing, onReject }) {
    const getNextLabel = () => {
        if (stage === 4) return 'Lanjut ke Stage 5 (LHPP) →';
        if (stage === 13) return 'Lanjut ke Stage 5 (LHPP) →';
        if (stage === 10) return 'Lanjut ke Stage 11 (Penagihan) →';
        if (stage === 11) return 'Lanjut ke Stage 11b (Verifikasi Bayar) →';
        if (stage === 14) return 'Lanjut ke Stage 11c (Kirim SUKET) →';
        if (stage === 15) return 'Lanjut ke Stage 12 (Final Closing) →';
        if (stage === 12) return 'Selesaikan & Arsipkan ke Selesai →';
        const currIdx = STAGES.findIndex(s => s.id === stage);
        if (currIdx !== -1 && currIdx < STAGES.length - 1) {
            let next = STAGES[currIdx + 1];
            if (next.id === 13) {
                next = STAGES[currIdx + 2];
            }
            if (next) {
                return `Lanjut ke Stage ${next.displayId || next.id} (${next.short}) →`;
            }
        }
        return `Lanjut ke Stage ${stage + 1} →`;
    };

    return (
        <div className="mt-4 flex flex-col gap-2">
            {disabledMsg && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {disabledMsg}
                </div>
            )}
            <div className="flex gap-2">
                {[2, 4, 5, 7, 8, 9, 10, 13].includes(stage) && (
                    <button type="button" onClick={onReject} disabled={processing}
                        className="px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                        Tolak / Kembalikan
                    </button>
                )}
                <button type="submit" disabled={processing || disabled}
                    className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
                    {processing ? '...' : getNextLabel()}
                </button>
            </div>
        </div>
    );
}
