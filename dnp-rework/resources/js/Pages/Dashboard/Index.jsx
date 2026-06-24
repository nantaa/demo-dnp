import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { STAGES } from '@/Constants';

export default function DashboardIndex({ jobs, auth }) {
    const { user } = auth;
    
    // Derived stats
    const activeJobs = jobs.filter(j => j.stage < 12);
    const completedJobs = jobs.filter(j => j.stage === 12);
    const pipelineValue = activeJobs.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    // Role-specific metrics
    const isSuper = user.role === 'superadmin';
    const isMKT = user.role === 'marketing';
    const isADM = user.role === 'admin';
    const isINS = user.role === 'inspektur';
    const isFIN = user.role === 'finance';
    const isMGR = user.role === 'manager';

    return (
        <AppLayout>
            <Head title="Dashboard" />
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard {user.name} ({user.role})</h1>
                <p className="text-gray-500 text-sm mt-1">Role-Based Dashboard System.</p>
            </div>

            {/* SUPERADMIN VIEW */}
            {isSuper && (
                <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded">
                    <h2 className="font-bold text-purple-900 mb-2">Sistem Monitoring Keseluruhan</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Total Pipeline</div>
                            <div className="text-xl font-bold text-purple-700">{formatRp(pipelineValue)}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Job Aktif (Semua Stage)</div>
                            <div className="text-xl font-bold">{activeJobs.length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Laporan Selesai</div>
                            <div className="text-xl font-bold text-green-600">{completedJobs.length}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* MARKETING VIEW */}
            {isMKT && (
                <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded">
                    <h2 className="font-bold text-orange-900 mb-2">Marketing Funnel</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Penawaran Aktif (Stage 1)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 1 && j.owner_marketing === user.name).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Suket Kedaluwarsa (EWS)</div>
                            <div className="text-xl font-bold text-red-600">0</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN VIEW */}
            {isADM && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
                    <h2 className="font-bold text-blue-900 mb-2">Antrian Admin</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Antrian Verifikasi Dok (S2)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 2).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Butuh Jadwal (S3)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 3).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Review Dokumen Lap. (S5)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 5).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Input & Review SUKET (S7/S9)</div>
                            <div className="text-xl font-bold text-amber-600">{jobs.filter(j => j.stage === 7 || j.stage === 9).length}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* INSPEKTUR VIEW */}
            {isINS && (
                <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded">
                    <h2 className="font-bold text-teal-900 mb-2">Tugas Lapangan & LHPP</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Tugas Lapangan (S4)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 4).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Draft LHPP (S6)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 6).length}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* FINANCE VIEW */}
            {isFIN && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded">
                    <h2 className="font-bold text-green-900 mb-2">Dashboard Keuangan</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Siap Tagih (S10)</div>
                            <div className="text-xl font-bold text-green-700">{jobs.filter(j => j.stage === 10).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Piutang Berjalan</div>
                            <div className="text-xl font-bold text-red-600">Rp 0</div>
                        </div>
                    </div>
                </div>
            )}

            {/* MANAGER VIEW */}
            {isMGR && (
                <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded">
                    <h2 className="font-bold text-indigo-900 mb-2">Monitoring Kadiv / Manager</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Disnaker (S8)</div>
                            <div className="text-xl font-bold text-indigo-700">{jobs.filter(j => j.stage === 8).length}</div>
                        </div>
                        <div className="bg-white p-4 shadow-sm border rounded">
                            <div className="text-xs text-gray-500">Suket Review Pending (S9)</div>
                            <div className="text-xl font-bold">{jobs.filter(j => j.stage === 9).length}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded border shadow-sm overflow-hidden mb-8">
                <div className="px-5 py-4 border-b bg-gray-50 font-bold text-sm text-gray-700">
                    Distribusi per Stage Global
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
