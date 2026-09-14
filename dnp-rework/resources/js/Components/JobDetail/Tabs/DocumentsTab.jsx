import React from 'react';
import { STAGES } from '@/Constants';
import { fmt } from '../constants';

export default function DocumentsTab({
    job,
    permissions,
    actions,
}) {
    const { canViewStageDocs, canManageStageDocs } = permissions;
    const { deleteDoc } = actions;

    const getDocs = (stageId) => {
        return (job.documents || []).filter(d => d.stage === stageId);
    };

    return (
        <div className="space-y-4">
            {STAGES.map(stage => {
                if (!canViewStageDocs(stage.id)) return null;
                const docs = getDocs(stage.id);
                if (docs.length === 0) return null;
                return (
                    <div key={stage.id} className="border rounded-lg p-4">
                        <h4 className="font-bold text-sm text-gray-700 mb-3 pb-2 border-b">
                            Stage {stage.displayId || stage.id}: {stage.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {docs.map(doc => (
                                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-gray-50 border rounded text-sm">
                                    <div>
                                        <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-2">
                                            {doc.name}
                                        </a>
                                        <div className="text-xs text-gray-500 mt-1 ml-6">
                                            {doc.type} • Uploaded by {doc.uploaded_by_user_id} • {fmt(doc.created_at)}
                                        </div>
                                    </div>
                                    {canManageStageDocs(doc.stage) && (
                                        <button onClick={() => deleteDoc(doc.id)} className="text-red-500 hover:text-red-700 font-medium px-2 py-1 sm:mt-0 mt-2 text-xs border border-red-200 rounded">
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {(!job.documents || job.documents.length === 0) && (
                <div className="text-center py-10 text-gray-400">Belum ada dokumen yang diunggah.</div>
            )}
        </div>
    );
}
