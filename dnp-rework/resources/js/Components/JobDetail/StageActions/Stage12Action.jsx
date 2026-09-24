import React from 'react';
import { DOC_TYPES_BY_STAGE } from '../../../Constants';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';

export default function Stage12Action({
    job,
    triggerUpload,
    uploadFileDirectly,
    canManageStageDocs,
    deleteDoc,
    isINS,
    user,
    permissions,
    data,
    setData,
    processing,
    handleReopenJob
}) {
    const isFinOrSuper = user?.role === 'finance' || user?.role === 'superadmin' || permissions === 'superadmin';
    const isSuperOnly = user?.role === 'superadmin' || permissions === 'superadmin';

    return (
        <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <h4 className="text-base font-bold text-emerald-900 mt-2">Stage 12 - Final Financial Closing (Closed)</h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                    Seluruh proses sertifikasi, penagihan, verifikasi pelunasan pembayaran, dan penyerahan SUKET ke klien telah selesai dan terverifikasi.
                </p>
            </div>

            <p className="text-xs font-semibold text-gray-700 mt-3 mb-1">Dokumen Rekap &amp; Closing Final (Opsional):</p>
            {(DOC_TYPES_BY_STAGE[12] || []).map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={12}
                    docs={job.documents}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isOptional={true}
                    isINS={isINS}
                />
            ))}

            {isFinOrSuper && (
                <div className="bg-teal-50 border border-teal-300 rounded-lg p-3.5 space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                        Selesaikan dan Arsipkan Pekerjaan
                    </div>
                    <p className="text-[11px] text-teal-800">
                        Setelah semua dokumen closing selesai, klik tombol di bawah untuk mengarsipkan pekerjaan ini ke status Selesai. Job akan disembunyikan dari Kanban dan hanya bisa dipulihkan oleh Superadmin.
                    </p>
                    <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    <button
                        type="submit"
                        disabled={processing}
                        onClick={() => setData('next_stage', 16)}
                        className="px-3.5 py-2 rounded text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition flex items-center gap-1.5"
                    >
                        {processing ? '...' : 'Selesaikan dan Arsipkan Pekerjaan'}
                    </button>
                </div>
            )}

            {isSuperOnly && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        Fitur Khusus Superadmin: Buka Kembali Pekerjaan
                    </div>
                    <p className="text-[11px] text-amber-800">
                        Jika terdapat revisi pembayaran, perbaikan data, atau pembatalan penutupan, Superadmin dapat membuka kembali pekerjaan ini ke stage sebelumnya.
                    </p>
                    <button
                        type="button"
                        onClick={handleReopenJob}
                        className="px-3.5 py-2 rounded text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-1.5"
                    >
                        Buka Kembali Pekerjaan (Re-open Job)
                    </button>
                </div>
            )}
        </div>
    );
}
