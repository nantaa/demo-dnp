import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import KanbanColumn from '@/Components/KanbanColumn';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { STAGES } from '../Constants';

export default function KanbanIndex({ jobs, auth }) {
    const { permissions } = auth;
    const [selectedJob, setSelectedJob] = useState(null);

    const canManageStage = (stageId) => {
        if (permissions === 'superadmin') return true;
        return !!permissions[stageId];
    };

    return (
        <AppLayout>
            <Head title="Kanban Board" />
            
            <div className="flex h-full overflow-x-auto space-x-4 pb-4">
                {STAGES.map((stage) => {
                    const columnJobs = jobs.filter(j => j.stage === stage.id);
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
                    job={selectedJob} 
                    onClose={() => setSelectedJob(null)} 
                    auth={auth} 
                />
            )}
        </AppLayout>
    );
}
