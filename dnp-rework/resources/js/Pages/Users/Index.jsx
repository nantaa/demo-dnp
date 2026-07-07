import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ROLES, STAGES } from '@/Constants';
import { Trash2, Shield, Plus, X } from 'lucide-react';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { showConfirm } from '../swal';

export default function UsersIndexWrapper(props) {
    return (
        <ErrorBoundary>
            <UsersIndex {...props} />
        </ErrorBoundary>
    );
}

function UsersIndex({ users = [], auth = {} }) {
    const [showNewUser, setShowNewUser] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // For permission modal
    const [renderError, setRenderError] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', 
        email: '', 
        password: '', 
        role: 'marketing',
        skp: '',
        skp_expired_at: '',
        spesialisasi: [],
        domisili: '',
        senior_level: false
    });

    if (renderError) {
        return <div className="p-10 text-red-500 font-bold">Render Error: {renderError}</div>;
    }

    try {

    const submitNewUser = (e) => {
        e.preventDefault();
        post('/users', {
            onSuccess: () => { reset(); setShowNewUser(false); },
        });
    };

    const deleteUser = async (user) => {
        const res = await showConfirm('Hapus User', `Hapus user ${user.name}?`);
        if (res.isConfirmed) {
            router.delete(`/users/${user.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="User Management" />
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Superadmin Only: Kelola user dan hak akses Stage-Gate.</p>
                </div>
                <button onClick={() => setShowNewUser(true)} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium">
                    <Plus size={16} /> User Baru
                </button>
            </div>

            <div className="bg-white rounded border shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-600">Nama</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Stage Ownership</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {(users || []).map(user => (
                            <tr key={user?.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-bold">{user?.name}</td>
                                <td className="px-4 py-3 text-gray-600">{user?.email}</td>
                                <td className="px-4 py-3">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono font-bold border border-gray-200">
                                        {(ROLES && ROLES[user?.role]?.label) || user?.role || 'UNK'}
                                    </span>
                                    {user?.role === 'inspektur' && (user?.inspector_profile || user?.inspectorProfile) && (
                                        <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                                            <div>SKP: {(user.inspector_profile || user.inspectorProfile).skp || '—'}</div>
                                            <div>AK3: {(() => {
                                                try {
                                                    const profile = user.inspector_profile || user.inspectorProfile;
                                                    const specs = typeof profile.spesialisasi === 'string'
                                                        ? JSON.parse(profile.spesialisasi)
                                                        : (profile.spesialisasi || []);
                                                    return Array.isArray(specs) ? specs.join(', ') : '—';
                                                } catch(e) {
                                                    return '—';
                                                }
                                            })()}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {user?.role === 'superadmin' ? (
                                        <span className="text-xs text-gray-500">Unrestricted (Semua Stage)</span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {(user?.stage_permissions || []).map(p => (
                                                <span key={p.id} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200" title={(STAGES || []).find(s => s.id == p.stage)?.name}>
                                                    S{p.stage}
                                                </span>
                                            ))}
                                            {(!user?.stage_permissions || user.stage_permissions.length === 0) && (
                                                <span className="text-xs text-red-500">No Access</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 flex items-center gap-2">
                                    {user?.role !== 'superadmin' && (
                                        <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded" title="Set Stage Permissions">
                                            <Shield size={16} />
                                        </button>
                                    )}
                                    {user?.id !== auth?.user?.id && (
                                        <button onClick={() => deleteUser(user)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded" title="Hapus User">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* NEW USER MODAL */}
            {showNewUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded w-full max-w-md shadow-xl border overflow-hidden">
                        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Tambah User Baru</h3>
                            <button onClick={() => setShowNewUser(false)} className="text-gray-500 hover:text-black"><X size={20} /></button>
                        </div>
                        <form onSubmit={submitNewUser} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Lengkap</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" required />
                                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Login</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" required />
                                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password Baru</label>
                                <input type="text" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role Sistem</label>
                                <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full px-3 py-2 border rounded text-sm bg-white" required>
                                    {Object.entries(ROLES).filter(([key]) => key !== 'superadmin').map(([key, r]) => (
                                        <option key={key} value={key}>{r.name} ({r.label})</option>
                                    ))}
                                </select>
                            </div>
                            {data.role === 'inspektur' && (
                                <div className="p-3 bg-gray-50 border rounded space-y-3">
                                    <div className="text-xs font-bold text-gray-500 uppercase">Profil Inspektur / Ahli K3</div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor SKP</label>
                                        <input type="text" value={data.skp} onChange={e => setData('skp', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="e.g. KEP.123/PPK-PNK3/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Berlaku s/d</label>
                                        <input type="date" value={data.skp_expired_at} onChange={e => setData('skp_expired_at', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Spesialisasi</label>
                                        <div className="grid grid-cols-2 gap-1.5 border p-2 rounded max-h-24 overflow-y-auto bg-white">
                                            {['PUBT', 'Listrik', 'Kebakaran', 'PAA', 'PTP', 'Elevator & Eskalator', 'Lift'].map(s => {
                                                const isChecked = data.spesialisasi.includes(s);
                                                return (
                                                    <label key={s} className="flex items-center gap-1 text-[11px] cursor-pointer">
                                                        <input type="checkbox" checked={isChecked} onChange={() => {
                                                            setData('spesialisasi', isChecked ? data.spesialisasi.filter(x => x !== s) : [...data.spesialisasi, s]);
                                                        }} />
                                                        AK3 {s}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Domisili</label>
                                            <input type="text" value={data.domisili} onChange={e => setData('domisili', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="e.g. Jakarta" />
                                        </div>
                                        <div className="flex items-center pt-5">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                                                <input type="checkbox" checked={data.senior_level} onChange={e => setData('senior_level', e.target.checked)} />
                                                Senior Level
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 border-t flex justify-end gap-2">
                                <button type="button" onClick={() => setShowNewUser(false)} className="px-4 py-2 border rounded text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800">Simpan User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PERMISSIONS MODAL */}
            {selectedUser && (
                <PermissionModal user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </AppLayout>
    );
    } catch (e) {
        if (!renderError) setRenderError(e.message);
        return <div className="p-10 text-red-500 font-bold">Render Error: {e.message}</div>;
    }
}

function PermissionModal({ user, onClose }) {
    // Initial state based on current permissions
    const currentStageIds = (user.stage_permissions || []).map(p => p.stage);
    const [selectedStages, setSelectedStages] = useState(currentStageIds);
    const [saving, setSaving] = useState(false);

    const toggleStage = (stageId) => {
        if (selectedStages.includes(stageId)) {
            setSelectedStages(selectedStages.filter(id => id !== stageId));
        } else {
            setSelectedStages([...selectedStages, stageId]);
        }
    };

    const savePermissions = () => {
        setSaving(true);
        router.post(`/users/${user.id}/permissions`, { stages: selectedStages }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSaving(false)
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded w-full max-w-lg shadow-xl border overflow-hidden">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Stage Access: {user.name}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black"><X size={20} /></button>
                </div>
                
                <div className="p-4">
                    <div className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 p-3 rounded">
                        <strong>RBAC Logic:</strong> Centang stage di bawah ini. {user.name} HANYA BISA mengedit job (dan menekan tombol Lanjut Stage) jika job tersebut SEDANG BERADA di stage yang dicentang.
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
                        {(STAGES || []).map(stage => (
                            <label key={stage.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStages.includes(stage.id) || selectedStages.includes(String(stage.id))}
                                    onChange={() => toggleStage(stage.id)}
                                    className="w-4 h-4 rounded text-black focus:ring-black"
                                />
                                <div className="flex-1">
                                    <div className="font-bold text-sm">Stage {stage.id}: {stage.name}</div>
                                    <div className="text-xs text-gray-500">Default Owner: {(ROLES && ROLES[stage.role]?.name) || stage.role}</div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 border rounded text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                        <button onClick={savePermissions} disabled={saving} className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800">
                            {saving ? 'Menyimpan...' : 'Simpan Permissions'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
