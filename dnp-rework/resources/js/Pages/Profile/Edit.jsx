import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { User, Lock, Save, CheckCircle2 } from 'lucide-react';
import { ROLES } from '@/Constants';

export default function ProfileEdit(props) {
    const { auth = {}, user: propUser, status } = props || {};
    const user = propUser || auth?.user || {};

    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.post(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.post(route('profile.password'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppLayout>
            <Head title="Pengaturan Akun" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pengaturan Akun & Keamanan</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Kelola data profil pengguna dan perbarui kata sandi akun Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* User Card Info */}
                    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4 h-fit">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#0A385C] text-[#00A8E8] flex items-center justify-center font-bold text-base rounded-full border border-[#00A8E8]/40">
                                {ROLES[user?.role]?.label || 'USR'}
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-gray-900">{user?.name || 'User'}</h3>
                                <span className="inline-block text-xs bg-gray-100 border text-gray-700 font-semibold px-2 py-0.5 rounded mt-0.5">
                                    {ROLES[user?.role]?.name || user?.role || 'Pengguna'}
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-2 text-xs text-gray-600">
                            <div>
                                <span className="font-bold block text-gray-400 uppercase tracking-wider text-[10px]">Email</span>
                                {user.email}
                            </div>
                            {user.phone && (
                                <div>
                                    <span className="font-bold block text-gray-400 uppercase tracking-wider text-[10px]">WhatsApp / No. HP</span>
                                    {user.phone}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Forms Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* 1. Update Profile Info */}
                        <div className="bg-white border rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 font-bold text-gray-900 pb-3 border-b mb-4">
                                <User size={18} className="text-emerald-600" />
                                Informasi Profil
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap *</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={e => profileForm.setData('name', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black"
                                        required
                                    />
                                    {profileForm.errors.name && (
                                        <p className="text-xs text-red-600 mt-1">{profileForm.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Email *</label>
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={e => profileForm.setData('email', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black"
                                        required
                                    />
                                    {profileForm.errors.email && (
                                        <p className="text-xs text-red-600 mt-1">{profileForm.errors.email}</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                    >
                                        <Save size={16} />
                                        {profileForm.processing ? 'Menyimpan...' : 'Simpan Profil'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 2. Change Password */}
                        <div className="bg-white border rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 font-bold text-gray-900 pb-3 border-b mb-4">
                                <Lock size={18} className="text-blue-600" />
                                Ubah Password / Kata Sandi
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password Saat Ini *</label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.current_password}
                                        onChange={e => passwordForm.setData('current_password', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black"
                                        required
                                    />
                                    {passwordForm.errors.current_password && (
                                        <p className="text-xs text-red-600 mt-1">{passwordForm.errors.current_password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru *</label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={e => passwordForm.setData('password', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black"
                                        required
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="text-xs text-red-600 mt-1">{passwordForm.errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Password Baru *</label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                    >
                                        <CheckCircle2 size={16} />
                                        {passwordForm.processing ? 'Memproses...' : 'Perbarui Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
