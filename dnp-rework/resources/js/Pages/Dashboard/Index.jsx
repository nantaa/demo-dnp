import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { STAGES } from '../Constants';

export default function DashboardIndex({ jobs, auth }) {
    const { user } = auth;
    
    // Derived stats
    const activeJobs = jobs.filter(j => j.stage < 11);
    const completedJobs = jobs.filter(j => j.stage === 11);
    
    const pipelineValue = activeJobs.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    return (
        <AppLayout>
            <Head title="Dashboard" />
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard {user.role}</h1>
                <p className="text-gray-500 text-sm mt-1">Overview data berdasarkan peran Anda di sistem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded border shadow-sm">
                    <div className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Job Aktif</div>
                    <div className="text-3xl font-bold">{activeJobs.length}</div>
                </div>
                <div className="bg-white p-5 rounded border shadow-sm">
                    <div className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Total Pipeline</div>
                    <div className="text-3xl font-bold text-orange-600">{formatRp(pipelineValue)}</div>
                </div>
                <div className="bg-white p-5 rounded border shadow-sm">
                    <div className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Job Selesai</div>
                    <div className="text-3xl font-bold text-green-600">{completedJobs.length}</div>
                </div>
            </div>

            <div className="bg-white rounded border shadow-sm overflow-hidden mb-8">
                <div className="px-5 py-4 border-b bg-gray-50 font-bold text-sm text-gray-700">
                    Distribusi per Stage
                </div>
                <div className="divide-y">
                    {STAGES.map(stage => {
                        const count = activeJobs.filter(j => j.stage === stage.id).length;
                        return (
                            <div key={stage.id} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold font-mono">
                                        {stage.id}
                                    </div>
                                    <div className="text-sm font-medium">{stage.name}</div>
                                </div>
                                <div className="font-bold text-lg">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="flex justify-end">
                <Link href={route('kanban')} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800">
                    Buka Kanban Board &rarr;
                </Link>
            </div>
            
        </AppLayout>
    );
}
