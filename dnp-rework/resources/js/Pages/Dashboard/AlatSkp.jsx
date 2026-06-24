import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';

export default function AlatSkpWrapper(props) {
    return (
        <ErrorBoundary>
            <AlatSkp {...props} />
        </ErrorBoundary>
    );
}

function AlatSkp({ inspectors = [], auth = {} }) {
    
    // Sort inspectors by expiration date (ascending)
    const sortedInspectors = [...inspectors].sort((a, b) => {
        if (!a.skp_expired_at) return 1;
        if (!b.skp_expired_at) return -1;
        return new Date(a.skp_expired_at) - new Date(b.skp_expired_at);
    });

    return (
        <AppLayout>
            <Head title="Manajemen Alat & SKP" />
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen SKP & Peralatan</h1>
                <p className="text-gray-500 text-sm mt-1">Monitoring status Surat Keputusan Penunjukan (SKP) Inspektur.</p>
            </div>

            <div className="bg-white rounded border shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-600">Nama Inspektur</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Spesialisasi</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Level</th>
                            <th className="px-4 py-3 font-medium text-gray-600">No. SKP</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Masa Berlaku</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedInspectors.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    Belum ada data Inspektur.
                                </td>
                            </tr>
                        ) : sortedInspectors.map(profile => {
                            const expiredDate = new Date(profile.skp_expired_at);
                            const now = new Date();
                            const diffTime = expiredDate - now;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            let statusClass = "bg-green-100 text-green-800 border-green-200";
                            let statusText = "Aktif";
                            
                            if (diffDays < 0) {
                                statusClass = "bg-red-100 text-red-800 border-red-200 font-bold";
                                statusText = "Kedaluwarsa";
                            } else if (diffDays <= 30) {
                                statusClass = "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold";
                                statusText = "Hampir Habis";
                            }

                            return (
                                <tr key={profile.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold text-gray-900">{profile.user?.name || 'Unknown User'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {profile.spesialisasi?.map((s, i) => (
                                                <span key={i} className="bg-gray-100 border px-1.5 py-0.5 rounded text-xs">{s}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        Level {profile.senior_level}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                        {profile.skp || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {profile.skp_expired_at ? expiredDate.toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs border ${statusClass}`}>
                                            {statusText}
                                        </span>
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
