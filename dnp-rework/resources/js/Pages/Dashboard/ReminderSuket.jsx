import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';

export default function ReminderSuketWrapper(props) {
    return (
        <ErrorBoundary>
            <ReminderSuket {...props} />
        </ErrorBoundary>
    );
}

function ReminderSuket({ jobs = [], auth = {} }) {
    const { user } = auth;
    
    // Disnaker jobs are now Stage 8 in the new 12-stage pipeline
    const disnakerJobs = jobs.filter(j => j.stage === 8);
    
    // Sort by deadline
    disnakerJobs.sort((a, b) => new Date(a.disnaker_deadline_at) - new Date(b.disnaker_deadline_at));

    return (
        <AppLayout>
            <Head title="Reminder Suket" />
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reminder Suket (Disnaker)</h1>
                <p className="text-gray-500 text-sm mt-1">Sistem Peringatan Dini (EWS) 30 Hari Pengurusan Disnaker.</p>
            </div>

            <div className="bg-white rounded border shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-600">Kode Job</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Klien</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Tanggal Masuk (S8)</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Deadline Disnaker</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {disnakerJobs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    Tidak ada job yang sedang diurus di Disnaker.
                                </td>
                            </tr>
                        ) : disnakerJobs.map(job => {
                            const deadline = new Date(job.disnaker_deadline_at);
                            const now = new Date();
                            const diffTime = deadline - now;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            let statusClass = "bg-green-100 text-green-800 border-green-200";
                            let statusText = `${diffDays} Hari Lagi`;
                            
                            if (diffDays < 0) {
                                statusClass = "bg-red-100 text-red-800 border-red-200 font-bold";
                                statusText = `Terlambat ${Math.abs(diffDays)} Hari`;
                            } else if (diffDays <= 7) {
                                statusClass = "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold";
                            }

                            return (
                                <tr key={job.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold">{job.kode}</td>
                                    <td className="px-4 py-3">{job.klien} <span className="text-gray-400 text-xs block">{job.pesawat}</span></td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {job.stage_started_at ? new Date(job.stage_started_at).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {job.disnaker_deadline_at ? deadline.toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {job.disnaker_deadline_at ? (
                                            <span className={`px-2 py-1 rounded text-xs border ${statusClass}`}>
                                                {statusText}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Belum Diset</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link href={route('kanban')} className="text-blue-600 hover:text-blue-800 text-xs font-bold underline">
                                            Lihat di Kanban
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
