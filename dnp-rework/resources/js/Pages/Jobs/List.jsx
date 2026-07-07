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
        if (auth.user.role === 'marketing' && job.owner_marketing === auth.user.name) return true;
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

    const handleExportCSV = () => {
        if (filteredJobs.length === 0) return alert('Tidak ada data untuk diexport');
        
        const headers = ['Kode', 'Klien', 'Pesawat', 'Unit', 'Lokasi', 'Stage', 'Marketing', 'Tgl Pelaksanaan'];
        const rows = filteredJobs.map(job => [
            job.kode,
            `"${job.klien}"`,
            `"${job.pesawat}"`,
            job.units,
            `"${job.lokasi}"`,
            job.stage,
            `"${job.owner_marketing}"`,
            job.tgl_pelaksanaan || ''
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `jobs_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getSlaBadge = (job) => {
        if (job.stage === 4 && job.tgl_pelaksanaan) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const pelDate = new Date(job.tgl_pelaksanaan);
            pelDate.setHours(0,0,0,0);
            const diffDays = Math.round((today - pelDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-300">HARI H</span>;
            } else if (diffDays > 0) {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-bold border border-red-300">OVERDUE</span>;
            } else {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-800 font-bold border border-yellow-300">H {diffDays}</span>;
            }
        }

        const stageInfo = STAGES.find(s => s.id === job.stage);
        let slaDays = stageInfo?.sla;
        if (!slaDays) return null;
        if (job.stage === 6) slaDays *= (job.units || 1);
        const diffDays = Math.ceil(Math.abs(new Date() - new Date(job.stage_started_at || job.updated_at)) / 86400000);
        let status = 'ON TRACK', color = 'bg-green-100 text-green-800';
        if (diffDays > slaDays) { status = 'OVERDUE'; color = 'bg-red-100 text-red-800 font-bold'; }
        else if (diffDays >= slaDays - 1) { status = 'WARNING'; color = 'bg-yellow-100 text-yellow-800 font-bold'; }
        return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${color}`}>{status} {diffDays}/{slaDays}d</span>;
    };

    return (
        <AppLayout>
            <Head title="Daftar Job" />

            {/* Header toolbar — stacks on mobile */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daftar Job</h1>
                <div className="flex gap-2 sm:gap-4">
                    <input
                        type="text"
                        placeholder="Cari Kode / Klien..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2 border rounded text-sm sm:w-64"
                    />
                    {['marketing', 'manager', 'superadmin'].includes(auth.user.role) && (
                        <Link href={route('jobs.create')} className="bg-black text-white px-3 sm:px-4 py-2 rounded text-sm font-medium whitespace-nowrap">
                            + Job Baru
                        </Link>
                    )}
                    <button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium whitespace-nowrap">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* ── Mobile Card View ─────────────────────────────────── */}
            <div className="sm:hidden space-y-2">
                {filteredJobs.map(job => {
                    const stageInfo = STAGES.find(s => s.id === job.stage);
                    return (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className="bg-white border rounded-lg p-3 shadow-sm cursor-pointer active:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-1.5">
                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{job.kode}</span>
                                <div className="flex items-center gap-1.5">
                                    {getSlaBadge(job)}
                                    <span className="text-xs bg-gray-100 border px-2 py-0.5 rounded font-medium">S{stageInfo?.displayId || job.stage}</span>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{job.klien}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{job.pesawat} • {job.lokasi}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-400">{stageInfo?.name}</span>
                                <span className="text-xs text-gray-400">{job.owner_marketing}</span>
                            </div>
                        </div>
                    );
                })}
                {filteredJobs.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">Tidak ada data job ditemukan.</div>
                )}
            </div>

            {/* ── Desktop Table View ───────────────────────────────── */}
            <div className="hidden sm:block bg-white border rounded shadow-sm overflow-hidden">
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
                                            <span className="text-[10px] text-gray-500">{stageInfo?.displayId || job.stage}</span>
                                            {stageInfo?.name}
                                        </span>
                                        <span className="ml-2">{getSlaBadge(job)}</span>
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
