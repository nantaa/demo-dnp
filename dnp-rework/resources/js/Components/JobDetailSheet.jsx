import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import SmartRecommendation from './SmartRecommendation';

export default function JobDetailSheet({ job, onClose, canManage }) {
    const { data, setData, post, processing, errors } = useForm({
        next_stage: job.stage + 1,
        notes: ''
    });

    const handleMoveStage = (e) => {
        e.preventDefault();
        post(`/jobs/${job.id}/move`, {
            onSuccess: () => onClose()
        });
    };

    const handleRejectStage = () => {
        if (!confirm(`Tolak dan kembalikan ke Stage ${job.stage - 1}? Pastikan notes sudah diisi.`)) return;
        if (!data.notes) {
            alert('Notes / Alasan penolakan wajib diisi!');
            return;
        }
        post(`/jobs/${job.id}/reject`, {
            onSuccess: () => onClose()
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="relative w-screen max-w-md">
                    <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                        
                        {/* Header */}
                        <div className="px-6 py-6 bg-blue-700 sm:px-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white" id="slide-over-title">
                                    {job.klien}
                                </h2>
                                <button type="button" className="text-blue-200 hover:text-white" onClick={onClose}>
                                    <span className="sr-only">Close panel</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-1">
                                <p className="text-sm text-blue-200">{job.kode} &bull; {job.pesawat}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 px-4 py-6 sm:px-6 space-y-6">
                            
                            {/* Alert for Read Only */}
                            {!canManage && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3 text-sm text-yellow-700">
                                            <p>You have <strong>View-Only</strong> access to this stage. Editing is locked.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Job Overview</h3>
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Marketing PIC</dt>
                                        <dd className="font-medium text-gray-900">{job.owner_marketing}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Lokasi</dt>
                                        <dd className="font-medium text-gray-900">{job.lokasi}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Nilai Kontrak</dt>
                                        <dd className="font-medium text-gray-900">
                                            {canManage ? `Rp ${Number(job.nilai).toLocaleString('id-ID')}` : '*** HIDDEN ***'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Units</dt>
                                        <dd className="font-medium text-gray-900">{job.units}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Smart Recommendation for Stage 3 (Penjadwalan) */}
                            {job.stage === 3 && canManage && (
                                <div className="mt-6 border-t pt-6">
                                    <SmartRecommendation 
                                        job={job} 
                                        onSelectInspector={(user) => {
                                            alert(`Inspektur ${user.name} dipilih. Lanjutkan Move Stage.`);
                                            setData('notes', `Assigned to: ${user.name}`);
                                        }} 
                                    />
                                </div>
                            )}

                            {/* Stage Progression Action */}
                            {canManage && job.stage < 12 && (
                                <div className="mt-8 border-t pt-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">Move to Next Stage</h3>
                                    <form onSubmit={handleMoveStage}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Notes / Keterangan</label>
                                            <textarea 
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                                                rows="3"
                                                value={data.notes}
                                                onChange={e => setData('notes', e.target.value)}
                                            ></textarea>
                                        </div>
                                        <div className="flex gap-2">
                                            {(job.stage === 5 || job.stage === 9) && (
                                                <button 
                                                    type="button" 
                                                    onClick={handleRejectStage}
                                                    disabled={processing}
                                                    className="w-1/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    {processing ? '...' : `Tolak (ke S${job.stage - 1})`}
                                                </button>
                                            )}
                                            <button 
                                                type="submit" 
                                                disabled={processing}
                                                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                {processing ? 'Processing...' : `Lanjut ke Stage ${job.stage + 1}`}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
