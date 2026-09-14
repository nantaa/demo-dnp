import React from 'react';
import { DOC_TYPES_BY_STAGE } from '@/Constants';
import { NoteField, MoveRow, UploadSlot } from '../constants';

export default function Stage1Action(props) {
    const {
        job = {},
        state = {},
        actions = {},
        permissions = {},
    } = props;

    const data = state.data || props.data || {};
    const setData = actions.setData || props.setData || (() => {});
    const processing = state.processing ?? props.processing ?? false;
    const canManage = permissions.canManage ?? props.canManage ?? false;
    const canManageStageDocs = permissions.canManageStageDocs || props.canManageStageDocs || (() => false);
    const stage1DocOk = permissions.stage1DocOk ?? props.stage1DocOk ?? false;

    const handleMoveStage = actions.handleMoveStage || props.handleMoveStage || ((e) => e?.preventDefault());
    const handleRejectStage = actions.handleRejectStage || props.handleRejectStage || (() => {});
    const triggerUpload = actions.triggerUpload || props.triggerUpload || (() => {});
    const uploadFileDirectly = actions.uploadFileDirectly || props.uploadFileDirectly || (() => {});
    const deleteDoc = actions.deleteDoc || props.deleteDoc || (() => {});

    const terminValue = data.termin_pembayaran || job.termin_pembayaran || 'FULL';

    return (
        <form onSubmit={handleMoveStage} className="space-y-4">
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>Stage 1 — PO / SPK / Proposal:</strong> Upload dokumen kontrak awal dan tentukan termin pembayaran (FULL atau DP).
            </div>

            <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50 space-y-3">
                <label className="block text-xs font-bold text-gray-700">Termin Pembayaran Kontrak</label>
                <div className="flex gap-4">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-800 cursor-pointer">
                        <input
                            type="radio"
                            name="termin_pembayaran"
                            value="FULL"
                            checked={terminValue === 'FULL'}
                            onChange={() => setData('termin_pembayaran', 'FULL')}
                            disabled={!canManage}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>FULL (Pelunasan di Akhir)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-800 cursor-pointer">
                        <input
                            type="radio"
                            name="termin_pembayaran"
                            value="DP"
                            checked={terminValue === 'DP'}
                            onChange={() => setData('termin_pembayaran', 'DP')}
                            disabled={!canManage}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>DP (Uang Muka / Termin)</span>
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Unggah Dokumen Stage 1</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(DOC_TYPES_BY_STAGE[1] || []).map(t => (
                        <UploadSlot
                            key={t}
                            type={t}
                            stageId={1}
                            docs={job.documents || []}
                            triggerUpload={triggerUpload}
                            uploadFileDirectly={uploadFileDirectly}
                            canManageStageDocs={canManageStageDocs}
                            deleteDoc={deleteDoc}
                            isOptional={!['PO / SPK', 'Surat Permohonan', 'Surat Kuasa'].includes(t)}
                        />
                    ))}
                </div>
            </div>

            <NoteField value={data.notes || ''} onChange={e => setData('notes', e.target.value)} />

            <MoveRow
                stage={1}
                processing={processing}
                disabled={!canManage || !stage1DocOk}
                disabledMsg={!stage1DocOk ? 'Upload minimal satu dokumen PO/SPK, Surat Permohonan, atau Surat Kuasa.' : ''}
                onReject={handleRejectStage}
            />
        </form>
    );
}
