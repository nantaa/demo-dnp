import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import KanbanColumn from '@/Components/KanbanColumn';
import JobDetailSheet from '@/Components/JobDetailSheet';

export default function Dashboard({ jobs }) {
    const { auth } = usePage().props;
    const { user, permissions } = auth;
    
    const [selectedJob, setSelectedJob] = useState(null);

    // Define the 12 stages dynamically
    const stages = [
        { id: 1, title: 'PO/SPK (Marketing)' },
        { id: 2, title: 'Verifikasi Dokumen (Admin)' },
        { id: 3, title: 'Penjadwalan + ST (Admin)' },
        { id: 4, title: 'Pelaksanaan Lapangan (Inspektur)' },
        { id: 5, title: 'Dokumen Review (Admin)' },
        { id: 6, title: 'LHPP & Peer Review (Inspektur/Kadiv)' },
        { id: 7, title: 'Penginputan SUKET (Admin)' },
        { id: 8, title: 'Disnaker (Kadiv/Mgr)' },
        { id: 9, title: 'Review SUKET (Admin)' },
        { id: 10, title: 'Penagihan (Finance)' },
        { id: 11, title: 'Pengiriman SUKET (Marketing)' },
        { id: 12, title: 'Closed' }
    ];

    // Helper to check if current user can edit/move this stage
    const canManageStage = (stageId) => {
        if (permissions === 'superadmin') return true;
        return permissions[stageId] && permissions[stageId].is_owner;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head title="DNP Monitor - Pipeline" />
            
            {/* Top Navigation */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">DNP Monitor Pipeline</h1>
                    <p className="text-sm text-gray-500">Logged in as {user.name} ({user.role})</p>
                </div>
                {canManageStage(1) && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
                        + New Job
                    </button>
                )}
            </header>

            {/* Kanban Board Area */}
            <main className="flex-1 overflow-x-auto p-6">
                <div className="flex space-x-6 min-w-max pb-4">
                    {stages.map(stage => {
                        const stageJobs = jobs.filter(j => j.stage === stage.id);
                        return (
                            <KanbanColumn 
                                key={stage.id} 
                                title={stage.title} 
                                count={stageJobs.length}
                                isLocked={!canManageStage(stage.id)}
                            >
                                {stageJobs.map(job => (
                                    <KanbanCard 
                                        key={job.id} 
                                        job={job} 
                                        onClick={() => setSelectedJob(job)} 
                                    />
                                ))}
                            </KanbanColumn>
                        );
                    })}
                </div>
            </main>

            {/* Slide-over Detail Sheet */}
            {selectedJob && (
                <JobDetailSheet 
                    job={selectedJob} 
                    onClose={() => setSelectedJob(null)} 
                    canManage={canManageStage(selectedJob.stage)}
                />
            )}
        </div>
    );
}

function KanbanCard({ job, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow mb-3"
        >
            <div className="text-xs font-semibold text-blue-600 mb-1">{job.kode}</div>
            <h3 className="font-bold text-gray-800 text-sm mb-2">{job.klien}</h3>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{job.pesawat}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{job.units} Unit(s)</span>
            </div>
            {/* EWS Warning Badge */}
            {job.stage === 8 && job.disnaker_deadline_at && (
                <div className="mt-2 text-xs text-red-600 font-semibold bg-red-50 p-1 rounded inline-block">
                    Deadline: {new Date(job.disnaker_deadline_at).toLocaleDateString()}
                </div>
            )}
        </div>
    );
}
