import React from 'react';
import { STAGE1_REQUIRED_DOCS, DOC_TYPES_BY_STAGE } from '../../../Constants';
import UploadSlot from '../Common/UploadSlot';
import NoteField from '../Common/NoteField';
import MoveRow from '../Common/MoveRow';

export default function Stage1Action({
    job,
    data,
    setData,
    processing,
    stage1DocOk,
    handleRejectStage,
    triggerUpload,
    uploadFileDirectly,
    canManageStageDocs,
    deleteDoc,
    isINS
}) {
    return (
        <div className="space-y-3">
            <p className="text-xs text-gray-500">Upload minimal salah satu dokumen berikut untuk melanjutkan:</p>
            {STAGE1_REQUIRED_DOCS.map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={1}
                    docs={job.documents}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                />
            ))}
            <p className="text-xs text-gray-400 mt-1">Dokumen opsional tambahan:</p>
            {(DOC_TYPES_BY_STAGE[1] || []).filter(t => !STAGE1_REQUIRED_DOCS.includes(t) && t !== 'Dokumen Tambahan').map(t => (
                <UploadSlot
                    key={t}
                    type={t}
                    stageId={1}
                    docs={job.documents}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isOptional={true}
                    isINS={isINS}
                />
            ))}
            <UploadSlot
                type="Dokumen Tambahan"
                stageId={1}
                docs={job.documents}
                triggerUpload={triggerUpload}
                uploadFileDirectly={uploadFileDirectly}
                canManageStageDocs={canManageStageDocs}
                deleteDoc={deleteDoc}
                isOptional={true}
                isINS={isINS}
            />
            <NoteField value={data.notes} onChange={e => setData('notes', e.target.value)} />
            <MoveRow
                stage={1}
                processing={processing}
                onReject={handleRejectStage}
                disabled={!stage1DocOk}
                disabledMsg={!stage1DocOk ? 'Upload minimal 1 dokumen utama (PO/SPK, Surat Permohonan, atau Surat Kuasa)' : ''}
            />
        </div>
    );
}
