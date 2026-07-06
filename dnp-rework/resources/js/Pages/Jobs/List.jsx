import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { STAGES } from '@/Constants';

export default function JobList({ jobs, auth }) {
    const { permissions } = auth;
    const queryParams = new URLSearchParams(window.location.search);
    const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
    const [selectedJob, setSelectedJob] = useState(null);

    const visibleJobs = jobs.filter(job => {
        if (permissions === 'superadmin' || auth.user.role === 'admin' || auth.user.role === 'manager') return true;
        if (auth.user.role === 'marketing' && job.owner_marketing === auth.user.name) {
            return true;
        }
        const perm = permissions?.[job.stage];
        return perm && (
            perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
            perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
        );
    });

    const filteredJobs = visibleJobs.filter(j => 
        j.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.klien.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <Head title="Daftar Job" />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Daftar Job</h1>
                
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Cari Kode / Klien..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded text-sm w-64"
                    />
                    <Link href={route('jobs.create')} className="bg-black text-white px-4 py-2 rounded text-sm font-medium">
                        + Job Baru
                    </Link>
                </div>
            </div>

            <div className="bg-white border rounded shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-600">Kode</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Klien</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Pesawat</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Stage</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Marketing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredJobs.map(job => {
                            const stageInfo = STAGES.find(s => s.id === job.stage);
                            let slaDays = stageInfo?.sla;
                            let slaBadge = null;
                            if (slaDays) {
                                if (job.stage === 6) slaDays *= (job.units || 1);
                                const startDate = new Date(job.stage_started_at || job.updated_at);
                                const diffTime = Math.abs(new Date() - startDate);
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                let status = 'ON TRACK';
                                let color = 'bg-green-100 text-green-800';
                                if (diffDays > slaDays) {
                                    status = 'OVERDUE';
                                    color = 'bg-red-100 text-red-800 font-bold';
                                } else if (diffDays >= slaDays - 1) {
                                    status = 'WARNING';
                                    color = 'bg-yellow-100 text-yellow-800 font-bold';
                                }
                                
                                slaBadge = (
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ml-2 ${color}`} title={`${diffDays} hari terpakai dari SLA ${slaDays} hari`}>
                                        {status} {diffDays}/{slaDays}d
                                    </span>
                                );
                            }

                            return (
                                <tr 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-mono text-xs">{job.kode}</td>
                                    <td className="px-4 py-3 font-bold">{job.klien}</td>
                                    <td className="px-4 py-3 text-gray-600">{job.pesawat} ({job.units} unit)</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 border text-xs font-medium">
                                            <span className="text-[10px] text-gray-500">{job.stage}</span>
                                            {stageInfo?.name}
                                        </span>
                                        {slaBadge}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{job.owner_marketing}</td>
                                </tr>
                            );
                        })}
                        {filteredJobs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    Tidak ada data job ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
