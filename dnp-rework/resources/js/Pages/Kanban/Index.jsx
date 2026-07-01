import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import KanbanColumn from '@/Components/KanbanColumn';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { STAGES } from '@/Constants';

export default function KanbanIndex({ jobs, auth }) {
    const { permissions } = auth;
    const [selectedJob, setSelectedJob] = useState(null);

    const canManageStage = (stageId) => {
        if (permissions === 'superadmin') return true;
        const perm = permissions?.[stageId];
        return perm && (perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1');
    };

    const canViewStage = (stageId) => {
        if (permissions === 'superadmin') return true;
        const perm = permissions?.[stageId];
        return perm && (
            perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
            perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
        );
    };

    return (
        <AppLayout>
            <Head title="Kanban Board" />
            
            <div className="flex h-full overflow-x-auto space-x-4 pb-4">
                {STAGES.map((stage) => {
                    const hasViewPermission = canViewStage(stage.id);
                    const columnJobs = jobs.filter(j => {
                        if (j.stage !== stage.id) return false;
                        if (permissions === 'superadmin') return true;
                        if (auth.user.role === 'marketing' && j.owner_marketing === auth.user.name) {
                            return true;
                        }
                        return hasViewPermission;
                    });
                    const isLocked = !canManageStage(stage.id);

                    return (
                        <KanbanColumn 
                            key={stage.id} 
                            title={`${stage.id}. ${stage.name}`} 
                            count={columnJobs.length}
                            isLocked={isLocked}
                        >
                            {columnJobs.map(job => (
                                <div 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className="bg-white p-3 mb-2 rounded shadow-sm border border-gray-200 cursor-pointer hover:border-black transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                            {job.kode}
                                        </span>
                                        {job.units > 1 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                                {job.units} Unit
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 leading-tight mb-1">{job.klien}</h3>
                                    <p className="text-xs text-gray-500 mb-2 truncate">{job.pesawat} • {job.lokasi}</p>
                                    
                                    <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400">
                                        <span>Marketing: {job.owner_marketing}</span>
                                    </div>
                                </div>
                            ))}
                        </KanbanColumn>
                    );
                })}
            </div>

            {selectedJob && (
                <JobDetailSheet 
                    job={jobs.find(j => j.id === selectedJob.id) || selectedJob} 
                    onClose={() => setSelectedJob(null)} 
                    auth={auth} 
                />
            )}
        </AppLayout>
    );
}
