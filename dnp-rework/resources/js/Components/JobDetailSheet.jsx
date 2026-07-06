import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import SmartRecommendation from './SmartRecommendation';
import { DOC_TYPES_BY_STAGE, STAGES } from '@/Constants';

export default function JobDetailSheet({ job, onClose, auth, canManage: propCanManage }) {
    const { data, setData, post, processing, errors } = useForm({
        next_stage: job.stage + 1,
        notes: '',
        inspector_ids: job.inspectors ? job.inspectors.map(i => i.id) : []
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [uploadStage, setUploadStage] = useState(null);
    const [uploadType, setUploadType] = useState('');
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const editForm = useForm({
        klien: job.klien || '',
        pesawat: job.pesawat || '',
        lokasi: job.lokasi || '',
        nilai: job.nilai || '',
        units: job.units || 1,
    });

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
        if (job.stage === 3 && (!data.inspector_ids || data.inspector_ids.length === 0)) {
            alert('Silakan pilih salah satu ahli K3 / inspektur terlebih dahulu!');
            return;
        }
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

    const handleUpdateJob = (e) => {
        e.preventDefault();
        editForm.put(`/jobs/${job.id}`, {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleVerifikasiOK = () => {
        if (!confirm('Tandai dokumen LENGKAP dan lanjut ke Penjadwalan?')) return;
        post(`/jobs/${job.id}/move`, {
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
    
    const canViewStageDocs = (stageId) => {
        if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'manager') return true;
        if (user.role === 'marketing' && job.owner_marketing === user.name) return true;
        const perm = permissions?.[stageId];
        return perm && (
            perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
            perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
        );
    };

    const canManageStageDocs = (stageId) => {
        if (user.role === 'superadmin' || user.role === 'manager') return true;
        if (user.role === 'marketing' && job.owner_marketing === user.name && (stageId === 1 || stageId === 11)) return true;
        const perm = permissions?.[stageId];
        return perm && (perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1');
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
                                    Timeline
                                </button>
                                <button 
                                    className={`text-sm font-medium ${activeTab === 'documents' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-200 hover:text-white'}`}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    Dokumen ({job.documents?.length || 0})
                                </button>
                                <button 
                                    className={`text-sm font-medium ${activeTab === 'riwayat' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-200 hover:text-white'}`}
                                    onClick={() => setActiveTab('riwayat')}
                                >
                                    Riwayat ({job.history_logs?.length || 0})
                                </button>
                                <button 
                                    className={`text-sm font-medium ${activeTab === 'edit' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-200 hover:text-white'}`}
                                    onClick={() => setActiveTab('edit')}
                                >
                                    Info & Edit
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 px-4 py-6 sm:px-6 space-y-6 bg-gray-50">
                            
                            {activeTab === 'overview' && (
                                <>
                                    {!canManage && (
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                            <div className="flex">
                                                <div className="ml-3 text-sm text-yellow-700">
                                                    <p>You have <strong>View-Only</strong> access to this stage. Editing is locked.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {job.stage === 2 && canManage && (
                                        <div className="bg-white p-4 rounded shadow-sm border border-blue-200">
                                            <h3 className="font-semibold text-blue-900 border-b pb-2 mb-3">Verifikasi Dokumen Klien</h3>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700">Catatan Verifikasi / Kekurangan</label>
                                                <textarea 
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                                                    rows="3"
                                                    value={data.notes}
                                                    onChange={e => setData('notes', e.target.value)}
                                                    placeholder="Tuliskan catatan jika ada dokumen yang kurang, atau 'Lengkap' jika OK."
                                                ></textarea>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={handleRejectStage}
                                                    disabled={processing}
                                                    className="w-1/2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                                                >
                                                    {processing ? '...' : 'TIDAK (Kembalikan ke PO)'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={handleVerifikasiOK}
                                                    disabled={processing}
                                                    className="w-1/2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                                >
                                                    {processing ? '...' : 'LENGKAP (Lanjut ke Stage 3)'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {job.stage === 3 && canManage && (
                                        <div className="mt-2 mb-6">
                                            <SmartRecommendation 
                                                job={job} 
                                                onSelectInspector={(insUser) => {
                                                    setData({
                                                        ...data,
                                                        notes: `Assigned to: ${insUser.name}`,
                                                        inspector_ids: [insUser.id]
                                                    });
                                                }} 
                                            />
                                        </div>
                                    )}

                                    {canManage && job.stage !== 2 && job.stage < 12 && (
                                        <div className="mt-4 bg-white p-4 rounded shadow-sm border">
                                            <h3 className="font-semibold text-gray-900 mb-3">Move to Next Stage</h3>
                                            <form onSubmit={handleMoveStage}>
                                                {job.stage === 3 && (
                                                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200 text-xs">
                                                        <div className="font-bold text-blue-800 uppercase mb-1">Status Penugasan Ahli K3</div>
                                                        {data.inspector_ids && data.inspector_ids.length > 0 ? (
                                                            <div className="font-medium text-blue-900 flex items-center gap-1.5">
                                                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                                                Telah dipilih (Notes: {data.notes || '—'})
                                                            </div>
                                                        ) : (
                                                            <div className="font-medium text-red-600 flex items-center gap-1.5">
                                                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                                                Belum ada ahli K3 yang dipilih. Silakan klik "Pilih Terbaik" atau "Pilih" pada saran di atas.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                            
                            {activeTab === 'riwayat' && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Riwayat Aktivitas</h3>
                                    {(!job.history_logs || job.history_logs.length === 0) ? (
                                        <div className="text-sm text-gray-400 italic">Belum ada riwayat aktivitas.</div>
                                    ) : (
                                        <div className="relative border-l border-gray-200 ml-3 space-y-6">
                                            {job.history_logs.map(log => (
                                                <div key={log.id} className="relative pl-6">
                                                    <span className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                                    </span>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {new Date(log.created_at).toLocaleString('id-ID')} &bull; Stage {log.stage} &bull; <span className="font-medium text-gray-700">{log.user?.name || 'Sistem'}</span>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{log.action}</div>
                                                    {log.notes && <div className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded border border-gray-100">{log.notes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'edit' && (
                                <div className="bg-white p-4 rounded shadow-sm border">
                                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                                        <h3 className="font-semibold text-gray-900">Info & Edit Job</h3>
                                        {!isEditing && canManage && (
                                            <button 
                                                onClick={() => setIsEditing(true)} 
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Edit Data
                                            </button>
                                        )}
                                    </div>
                                    
                                    {!isEditing ? (
                                        <dl className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <dt className="text-gray-500">Marketing PIC</dt>
                                                <dd className="font-medium text-gray-900">{job.owner_marketing}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Klien</dt>
                                                <dd className="font-medium text-gray-900">{job.klien}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Pesawat</dt>
                                                <dd className="font-medium text-gray-900">{job.pesawat}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Lokasi</dt>
                                                <dd className="font-medium text-gray-900">{job.lokasi}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Nilai Kontrak</dt>
                                                <dd className="font-medium text-gray-900">
                                                    {canManage || user.role === 'finance' ? `Rp ${Number(job.nilai).toLocaleString('id-ID')}` : '*** HIDDEN ***'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Units</dt>
                                                <dd className="font-medium text-gray-900">{job.units}</dd>
                                            </div>
                                            <div className="col-span-2">
                                                <dt className="text-gray-500">Inspektur / Ahli K3 Ditugaskan</dt>
                                                <dd className="font-medium text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 mt-0.5">
                                                    {job.inspectors && job.inspectors.length > 0 
                                                        ? job.inspectors.map(i => i.name).join(', ') 
                                                        : 'Belum ditugaskan'}
                                                </dd>
                                            </div>
                                        </dl>
                                    ) : (
                                        <form onSubmit={handleUpdateJob} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Klien</label>
                                                <input type="text" value={editForm.data.klien} onChange={e => editForm.setData('klien', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Pesawat</label>
                                                <input type="text" value={editForm.data.pesawat} onChange={e => editForm.setData('pesawat', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                                                <input type="text" value={editForm.data.lokasi} onChange={e => editForm.setData('lokasi', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Nilai Kontrak (Rp)</label>
                                                    <input type="number" value={editForm.data.nilai} onChange={e => editForm.setData('nilai', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Jumlah Unit</label>
                                                    <input type="number" value={editForm.data.units} onChange={e => editForm.setData('units', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required min="1" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                                    Batal
                                                </button>
                                                <button type="submit" disabled={editForm.processing} className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                                    Simpan Perubahan
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                            
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    {STAGES.map(s => {
                                        const types = DOC_TYPES_BY_STAGE[s.id] || [];
                                        const docs = (job.documents || []).filter(d => d.stage === s.id);
                                        const isViewable = canViewStageDocs(s.id);
                                        const isManageable = canManageStageDocs(s.id);
                                        
                                        if (!isViewable && docs.length === 0) return null; // hide if can't view and empty
                                        
                                        return (
                                            <div key={s.id} className="bg-white p-4 rounded shadow-sm border">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-xs font-mono text-gray-500 font-bold">STAGE {String(s.id).padStart(2, '0')}</div>
                                                        <div className="font-medium text-gray-900">{s.name}</div>
                                                    </div>
                                                    
                                                    {isManageable && (
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
                                                                {isManageable && (
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
