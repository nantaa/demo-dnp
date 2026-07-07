import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { showError, showSuccess } from '../swal';
import { 
    LayoutDashboard, Columns, List, Plus, Bell, LogOut, ShieldCheck, Boxes, HardHat, Menu, X
} from 'lucide-react';
import { ROLES } from '../Constants';

export default function AppLayout({ header, children }) {
    const { auth } = usePage().props;
    const { user } = auth;
    const currentRoute = window.location.pathname;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Intercept global inertia events
        const removeErrorListener = router.on('error', (event) => {
            const errs = event.detail.errors;
            if (errs && Object.keys(errs).length > 0) {
                const msgs = Object.values(errs).flat().join('\n');
                showError('Validasi Gagal', msgs);
            }
        });
        
        const removeExceptionListener = router.on('exception', (event) => {
            event.preventDefault(); // Prevent default modal
            let msg = event.detail.exception?.message || 'Terjadi kesalahan sistem.';
            if (event.detail.response?.status === 403) {
                msg = event.detail.response.data?.message || 'Akses Ditolak (403).';
            }
            showError('Server Error', msg);
        });

        return () => {
            removeErrorListener();
            removeExceptionListener();
        };
    }, []);

    const navItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/kanban', label: 'Kanban', icon: Columns },
        { href: '/jobs', label: 'Daftar Job', icon: List },
        { href: '/jobs/create', label: 'Job Baru', icon: Plus, roles: ['marketing', 'manager', 'superadmin'] },
        { href: '/users', label: 'Users', icon: ShieldCheck, roles: ['superadmin'] },
        { href: '/reminder-suket', label: 'Reminder Suket', icon: Bell, roles: ['marketing', 'manager', 'admin', 'superadmin'] },
        { href: '/inventory', label: 'Alat & SKP', icon: Boxes, roles: ['admin', 'manager', 'inspektur', 'superadmin'] },
    ];

    const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="bg-white border-b sticky top-0 z-30">
                <div className="px-3 sm:px-6 py-3 flex items-center justify-between">
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden p-2 rounded hover:bg-gray-100 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded flex-shrink-0">
                            <HardHat size={18} />
                        </div>
                        <div>
                            <div className="hidden sm:block text-[10px] tracking-widest uppercase text-gray-500 font-bold leading-none">
                                PT Delta Nusantara Persada
                            </div>
                            <div className="text-sm sm:text-base font-medium leading-tight sm:mt-1">
                                <span className="hidden sm:inline">Riksa Uji · </span>Monitoring
                            </div>
                        </div>
                    </div>

                    {/* Right: User info + Logout */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gray-50 border border-gray-200 rounded">
                            <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold rounded flex-shrink-0">
                                {ROLES[user.role]?.label || 'USR'}
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-xs font-bold leading-none">{user.name}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{ROLES[user.role]?.name || user.role}</div>
                            </div>
                            <div className="sm:hidden text-xs font-bold">{user.name.split(' ')[0]}</div>
                        </div>
                        <Link href={route('logout')} method="post" as="button" className="text-gray-500 hover:text-black p-1">
                            <LogOut size={16} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Mobile Sidebar Overlay ─────────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Mobile Sidebar Drawer ──────────────────────────────────── */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-4 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded">
                            <HardHat size={18} />
                        </div>
                        <span className="font-bold text-sm">DNP Monitor</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 rounded hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                {/* User info in drawer */}
                <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-bold rounded-full">
                            {ROLES[user.role]?.label || 'USR'}
                        </div>
                        <div>
                            <div className="font-bold text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{ROLES[user.role]?.name || user.role}</div>
                        </div>
                    </div>
                </div>

                <nav className="px-3 py-4 overflow-y-auto">
                    <div className="text-[10px] tracking-widest uppercase text-gray-400 font-bold mb-3 px-2">Menu Utama</div>
                    <div className="space-y-1">
                        {visibleNav.map((item) => {
                            const active = currentRoute === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <Link href={route('logout')} method="post" as="button"
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full">
                            <LogOut size={18} />
                            Keluar
                        </Link>
                    </div>
                </nav>
            </div>

            {/* ── Desktop Sidebar + Main ─────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop sidebar — hidden on mobile */}
                <nav className="hidden lg:flex w-60 bg-white border-r px-4 py-6 shrink-0 overflow-y-auto flex-col">
                    <div className="text-[10px] tracking-widest uppercase text-gray-400 font-bold mb-4 px-2">Menu Utama</div>
                    <div className="space-y-1 flex-1">
                        {visibleNav.map((item) => {
                            const active = currentRoute === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                        active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Main content — add bottom padding on mobile for bottom nav */}
                <main className="flex-1 overflow-x-auto bg-gray-50 p-3 sm:p-6 pb-20 lg:pb-6">
                    {children}
                </main>
            </div>

            {/* ── Mobile Bottom Navigation Bar ──────────────────────────── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg safe-area-pb">
                <div className="flex items-center justify-around px-1 py-1">
                    {visibleNav.slice(0, 5).map((item) => {
                        const active = currentRoute === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-w-[52px] transition-colors ${
                                    active ? 'text-black' : 'text-gray-400'
                                }`}
                            >
                                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                                <span className={`text-[9px] font-semibold leading-tight text-center ${active ? 'text-black' : 'text-gray-400'}`}>
                                    {item.label.split(' ')[0]}
                                </span>
                            </Link>
                        );
                    })}
                    {/* More button if more than 5 nav items */}
                    {visibleNav.length > 5 && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-w-[52px] text-gray-400"
                        >
                            <Menu size={20} strokeWidth={1.5} />
                            <span className="text-[9px] font-semibold">Lainnya</span>
                        </button>
                    )}
                </div>
            </nav>
        </div>
    );
}
