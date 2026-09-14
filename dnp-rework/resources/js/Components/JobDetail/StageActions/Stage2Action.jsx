import React from 'react';
import { STAGE2_VERIFY_CHECKLIST, DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot } from '../constants';

export default function Stage2Action({
    job,
    data,
    setData,
    s2Verify,
    handleSetS2Status,
    stage2Bypass,
    stage2CanMove,
    isMGR,
    handleApproveAsManager,
    handleAskApproval,
    handleBypassStage2WithJustification,
    processing,
    canManage,
    canManageStageDocs,
    handleMoveStage,
    handleRejectStage,
    triggerUpload,
    uploadFileDirectly,
    deleteDoc,
}) {
    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div className="space-y-3">
                {stage2Bypass && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800 font-medium">
                        Kadiv/MGR sudah menyetujui. Admin dapat melanjutkan.
                    </div>
                )}
                {job.peer_review_status === 'requested' && isMGR && (
                    <div className="bg-blue-50 border border-blue-300 rounded p-3 flex items-center justify-between">
                        <span className="text-sm text-blue-800 font-medium">Admin meminta persetujuan Anda.</span>
                        <button
                            type="button"
                            onClick={handleApproveAsManager}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700"
                        >
                            Setujui
                        </button>
                    </div>
                )}
                {job.peer_review_status === 'requested' && !isMGR && (
                    <div className="px-3 py-2 rounded text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                        Menunggu persetujuan Kadiv/MGR…
                    </div>
                )}

                {/* ── Verification Checklist Table ── */}
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                    <div
                        className="grid bg-gray-100 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wide"
                        style={{ gridTemplateColumns: '2.5rem 1fr 7rem 10.5rem' }}
                    >
                        <div className="px-2 py-2 text-center">NO</div>
                        <div className="px-3 py-2">DOKUMEN</div>
                        <div className="px-2 py-2 text-center">FILE</div>
                        <div className="px-2 py-2 text-center">STATUS VERIFIKASI</div>
                    </div>

                    {STAGE2_VERIFY_CHECKLIST.map((item) => {
                        const docs = (job.documents || []).filter(d =>
                            (d.stage === 1 || d.stage === 2) && d.type === item.type
                        );
                        const hasFile = docs.length > 0;
                        const status = s2Verify[item.type];
                        const setStatus = (v) => handleSetS2Status(item.type, v);

                        return (
                            <div
                                key={item.type}
                                className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors items-start"
                                style={{ gridTemplateColumns: '2.5rem 1fr 7rem 10.5rem' }}
                            >
                                <div className="px-2 py-3 text-center font-bold text-gray-400">{item.no}</div>
                                <div className="px-3 py-3">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                        <span className="font-medium text-gray-800">{item.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                                            item.badge === 'WAJIB' ? 'border-red-400 text-red-600' : 'border-gray-400 text-gray-500'
                                        }`}>
                                            {item.badge}
                                        </span>
                                        {item.badge2 && (
                                            <span className="px-1.5 py-0.5 rounded border border-blue-400 text-blue-600 text-[10px] font-bold">
                                                {item.badge2}
                                            </span>
                                        )}
                                    </div>
                                    {item.hint && (
                                        <p className="text-[10px] text-gray-400 italic mt-0.5">{item.hint}</p>
                                    )}
                                </div>

                                <div className="px-2 py-3 flex flex-col items-center gap-1">
                                    {item.noVerify ? (
                                        <span className="px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-[10px] flex items-center gap-1 cursor-not-allowed" title="Dokumen bersifat privat & tidak perlu dibaca Admin">
                                            Privat / Unreadable
                                        </span>
                                    ) : item.isManual ? (
                                        <span className="px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-500 font-semibold text-[10px]">MANUAL</span>
                                    ) : hasFile ? (
                                        docs.map(d => (
                                            <a
                                                key={d.id}
                                                href={`/storage/${d.path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-2 py-1 rounded bg-green-50 border border-green-300 text-green-700 font-semibold text-[10px] hover:underline truncate max-w-[80px]"
                                                title={d.name}
                                            >
                                                {d.name.split('.').pop().toUpperCase()}
                                            </a>
                                        ))
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => triggerUpload(2, item.type)}
                                            className="px-2 py-1 rounded bg-red-50 border border-red-300 text-red-600 font-semibold text-[10px] hover:bg-red-100 flex items-center gap-1"
                                        >
                                            KOSONG
                                        </button>
                                    )}
                                    {hasFile && !item.noVerify && canManageStageDocs(2) && (
                                        <button
                                            type="button"
                                            onClick={() => triggerUpload(2, item.type)}
                                            className="text-[10px] text-blue-500 hover:underline"
                                        >
                                            + ganti
                                        </button>
                                    )}
                                </div>

                                <div className="px-2 py-3 flex items-center justify-center gap-1 flex-wrap">
                                    {item.noVerify ? (
                                        <span className="text-[10px] text-gray-400 italic">-</span>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setStatus(status === 'ok' ? '' : 'ok')}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                                                    status === 'ok'
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                                        : 'border-gray-300 text-gray-600 bg-white hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700'
                                                }`}
                                            >
                                                OK
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatus(status === 'tidak' ? '' : 'tidak')}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                                                    status === 'tidak'
                                                        ? 'bg-red-600 text-white border-red-600 shadow-xs scale-105'
                                                        : 'border-gray-300 text-gray-600 bg-white hover:bg-red-50 hover:border-red-400 hover:text-red-700'
                                                }`}
                                            >
                                                TIDAK
                                            </button>
                                            {item.hasNa && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStatus(status === 'na' ? '' : 'na')}
                                                    className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                                                        status === 'na'
                                                            ? 'bg-gray-600 text-white border-gray-600 shadow-xs scale-105'
                                                            : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-800'
                                                    }`}
                                                >
                                                    N/A
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!stage2CanMove && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {canManage && job.peer_review_status !== 'requested' && (
                            <button
                                type="button"
                                onClick={handleAskApproval}
                                className="px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-300 rounded text-xs font-semibold hover:bg-yellow-100"
                            >
                                Minta Persetujuan Kadiv/MGR (Bypass)
                            </button>
                        )}
                        {isMGR && (
                            <button
                                type="button"
                                onClick={handleBypassStage2WithJustification}
                                className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-bold hover:bg-emerald-100"
                            >
                                Bypass Dokumen Teknis (Kadiv/MGR)
                            </button>
                        )}
                    </div>
                )}
            </div>

            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={2}
                processing={processing}
                disabled={!canManage || !stage2CanMove}
                disabledMsg={!stage2CanMove ? 'Dokumen belum lengkap. Minta persetujuan Kadiv/MGR atau lengkapi dokumen.' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
