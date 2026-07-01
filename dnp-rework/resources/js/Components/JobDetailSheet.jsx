import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import SmartRecommendation from './SmartRecommendation';
import { DOC_TYPES_BY_STAGE, STAGES } from '@/Constants';

export default function JobDetailSheet({ job, onClose, auth, canManage: propCanManage }) {
    const { data, setData, post, processing, errors } = useForm({
        next_stage: job.stage + 1,
        notes: ''
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [uploadStage, setUploadStage] = useState(null);
    const [uploadType, setUploadType] = useState('');
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const { permissions, user } = auth || {};
    const canManage = (() => {
        if (propCanManage !== undefined) return propCanManage;
        if (!permissions) return false;
        if (permissions === 'superadmin') return true;
        const perm = permissions[job.stage];
        return perm && (perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1');
    })();

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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file || !uploadStage || !uploadType) return;
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('stage', uploadStage);
        formData.append('type', uploadType);

        router.post(`/jobs/${job.id}/documents`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setUploadStage(null);
                setUploadType('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsUploading(false);
            },
            onError: (errors) => {
                alert(Object.values(errors).join('\n'));
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsUploading(false);
            }
        });
    };

    const deleteDoc = (doc) => {
        if (!confirm(`Hapus dokumen ${doc.name}?`)) return;
        router.delete(`/jobs/${job.id}/documents/${doc.id}`, {
            preserveScroll: true,
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Determine if user can view/upload docs for a specific stage
    const canViewStageDocs = (stageId) => {
        if (user.role === 'superadmin') return true;
        if (user.role === 'marketing' && job.owner_marketing === user.name) return true;
        const perm = permissions?.[stageId];
        return perm && (
            perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
            perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div className="relative w-screen max-w-md md:max-w-xl">
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
                            
                            {/* Tabs */}
                            <div className="flex mt-6 space-x-4 border-b border-blue-600 pb-2">
                                <button 
                                    className={`text-sm font-medium ${activeTab === 'overview' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-200 hover:text-white'}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Overview
                                </button>
                                <button 
                                    className={`text-sm font-medium ${activeTab === 'documents' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-200 hover:text-white'}`}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    Dokumen ({job.documents?.length || 0})
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 px-4 py-6 sm:px-6 space-y-6 bg-gray-50">
                            
                            {activeTab === 'overview' && (
                                <>
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

                                    <div className="bg-white p-4 rounded shadow-sm border">
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
                                        <div className="mt-6">
                                            <SmartRecommendation 
                                                job={job} 
                                                onSelectInspector={(insUser) => {
                                                    alert(`Inspektur ${insUser.name} dipilih. Lanjutkan Move Stage.`);
                                                    setData('notes', `Assigned to: ${insUser.name}`);
                                                }} 
                                            />
                                        </div>
                                    )}

                                    {/* Stage Progression Action */}
                                    {canManage && job.stage < 12 && (
                                        <div className="mt-6 bg-white p-4 rounded shadow-sm border">
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
                                </>
                            )}
                            
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    {STAGES.map(s => {
                                        const types = DOC_TYPES_BY_STAGE[s.id] || [];
                                        const docs = (job.documents || []).filter(d => d.stage === s.id);
                                        const isViewable = canViewStageDocs(s.id);
                                        
                                        if (!isViewable && docs.length === 0) return null; // hide if can't view and empty
                                        
                                        return (
                                            <div key={s.id} className="bg-white p-4 rounded shadow-sm border">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-xs font-mono text-gray-500 font-bold">STAGE {String(s.id).padStart(2, '0')}</div>
                                                        <div className="font-medium text-gray-900">{s.name}</div>
                                                    </div>
                                                    
                                                    {isViewable && (
                                                        uploadStage === s.id ? (
                                                            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                                                                <select 
                                                                    className="text-sm border-gray-300 rounded py-1 px-2"
                                                                    value={uploadType}
                                                                    onChange={e => setUploadType(e.target.value)}
                                                                >
                                                                    <option value="">Pilih jenis dokumen...</option>
                                                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                                <button 
                                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                                                    disabled={!uploadType || isUploading}
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                >
                                                                    {isUploading ? '...' : 'Pilih File'}
                                                                </button>
                                                                <button 
                                                                    className="text-gray-500 hover:text-gray-800 p-1"
                                                                    onClick={() => { setUploadStage(null); setUploadType(''); }}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-1"
                                                                onClick={() => setUploadStage(s.id)}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                                Upload
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                                
                                                {docs.length === 0 ? (
                                                    <div className="text-sm text-gray-400 italic py-2 border-t border-dashed">Belum ada dokumen.</div>
                                                ) : (
                                                    <div className="space-y-2 mt-3 pt-3 border-t">
                                                        {docs.map(doc => (
                                                            <div key={doc.id} className="flex items-center gap-3 p-2 bg-gray-50 border rounded text-sm">
                                                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900 truncate">{doc.type}</div>
                                                                    <div className="text-xs text-gray-500 truncate">{doc.name}</div>
                                                                </div>
                                                                <a 
                                                                    href={`/storage/${doc.path}`} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                                    title="Download"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                                </a>
                                                                {isViewable && (
                                                                    <button 
                                                                        onClick={() => deleteDoc(doc)}
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                        title="Hapus"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                <div className="mt-3 text-xs text-gray-400">
                                                    Wajib: {types.join(', ')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    <input 
                                        ref={fileInputRef} 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileSelect} 
                                        accept=".pdf,.jpg,.jpeg,.png,.zip,.docx,.xlsx"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
