import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { showError, showSuccess } from '@/swal';
import { 
    LayoutDashboard, Columns, List, Plus, Bell, LogOut, ShieldCheck, Boxes, HardHat, Menu, X, User as UserIcon, FileSpreadsheet
} from 'lucide-react';
import NotificationBell from '@/Components/NotificationBell';
import { ROLES } from '../Constants';
import logoImg from '../../images/logo.png';

// Concentric arc "ulir / thread" decoration — radiates from a corner
function ThreadDecor({ size = 220, color = '#00A8E8', opacity = 0.15, origin = 'br', count = 8, strokeWidth = 1.5 }) {
    const arcs = [];
    const step = size / count;
    for (let i = 1; i <= count; i++) {
        const r = i * step;
        let d = '';
        if (origin === 'br') d = `M ${size} ${size - r} A ${r} ${r} 0 0 0 ${size - r} ${size}`;
        if (origin === 'bl') d = `M 0 ${size - r} A ${r} ${r} 0 0 1 ${r} ${size}`;
        if (origin === 'tr') d = `M ${size - r} 0 A ${r} ${r} 0 0 1 ${size} ${r}`;
        if (origin === 'tl') d = `M ${r} 0 A ${r} ${r} 0 0 0 0 ${r}`;
        arcs.push(
            <path key={i} d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                opacity={opacity + (i / count) * 0.12} />
        );
    }
    return (
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
            style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
            {arcs}
        </svg>
    );
}

export default function AppLayout({ header, children }) {
    const { auth = {} } = usePage().props || {};
    const user = auth?.user || {};
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
        { href: '/pelaporan', label: 'Pelaporan', icon: FileSpreadsheet, roles: ['superadmin', 'manager'] },
        { href: '/users', label: 'Users', icon: ShieldCheck, roles: ['superadmin'] },
        { href: '/reminder-suket', label: 'Reminder Suket', icon: Bell, roles: ['marketing', 'manager', 'admin', 'superadmin'] },
        { href: '/inventory', label: 'Alat & SKP', icon: Boxes, roles: ['admin', 'manager', 'inspektur', 'superadmin'] },
    ];

    const userRole = (user?.role || '').toLowerCase();
    const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(userRole));

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col text-gray-900 font-sans">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs relative">
                {/* DNP Top Gradient Line Accent */}
                <div className="h-1.5 bg-gradient-to-r from-[#063970] via-[#0A385C] to-[#00A8E8]" />

                <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between">
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-[#0A385C]"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <img src={logoImg} alt="PT Delta Nusantara Persada" className="h-9 w-auto object-contain shrink-0" />
                            <div>
                                <div className="hidden sm:block text-[10px] tracking-widest uppercase text-[#0A385C] font-extrabold leading-none">
                                    PT Delta Nusantara Persada
                                </div>
                                <div className="text-sm sm:text-base font-bold leading-tight text-slate-800 sm:mt-0.5">
                                    <span className="hidden sm:inline text-[#00A8E8]">Riksa Uji · </span>Monitoring
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: User info + Notification Bell + Profile + Logout */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <NotificationBell />
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-[#00A8E8] rounded-full hover:bg-slate-100 transition-all shadow-2xs">
                            <div className="w-6 h-6 bg-[#0A385C] text-[#00A8E8] flex items-center justify-center text-[10px] font-extrabold rounded-full flex-shrink-0 border border-[#00A8E8]/40">
                                {ROLES[user?.role]?.label || 'USR'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="text-xs font-bold leading-none text-slate-800">{user?.name || 'User'}</div>
                                <div className="text-[9px] font-semibold text-[#0A385C] tracking-wide uppercase mt-0.5">{ROLES[user?.role]?.name || user?.role || 'Pengguna'}</div>
                            </div>
                            <div className="sm:hidden text-xs font-bold text-slate-800">{(user?.name || 'User').split(' ')[0]}</div>
                        </Link>
                        <Link href="/profile" title="Pengaturan Akun" className="text-slate-500 hover:text-[#0A385C] p-1 transition-colors">
                            <UserIcon size={18} />
                        </Link>
                        <Link href={route('logout')} method="post" as="button" title="Keluar" className="text-slate-400 hover:text-red-600 p-1 transition-colors">
                            <LogOut size={18} />
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
            <div className={`fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ background: 'linear-gradient(180deg, #0A1F3A 0%, #0A385C 100%)' }}
            >
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="DNP Logo" className="h-8 w-auto object-contain shrink-0" />
                        <span className="font-bold text-sm text-white">DNP Monitor</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 rounded hover:bg-white/10 text-white/70">
                        <X size={18} />
                    </button>
                </div>

                {/* User info in drawer */}
                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/40 flex items-center justify-center text-sm font-bold rounded-full">
                            {ROLES[user.role]?.label || 'USR'}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-white">{user.name}</div>
                            <div className="text-xs text-slate-400">{ROLES[user.role]?.name || user.role}</div>
                        </div>
                    </div>
                </div>

                <nav className="px-3 py-4 overflow-y-auto flex-1">
                    <div className="text-[10px] tracking-widest uppercase text-[#00A8E8]/60 font-bold mb-3 px-2">Menu Utama</div>
                    <div className="space-y-0.5">
                        {visibleNav.map((item) => {
                            const active = currentRoute === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        active
                                            ? 'bg-[#00A8E8]/15 text-[#00A8E8] border-l-[3px] border-[#00A8E8]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                                    }`}
                                >
                                    <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                        <Link href={route('logout')} method="post" as="button"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full">
                            <LogOut size={18} />
                            Keluar
                        </Link>
                    </div>
                </nav>

                {/* Thread decoration at bottom of mobile drawer */}
                <div className="pointer-events-none select-none flex justify-end">
                    <ThreadDecor size={100} color="#00A8E8" opacity={0.08} origin="br" count={6} strokeWidth={1} />
                </div>
            </div>

            {/* ── Desktop Sidebar + Main ─────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop sidebar — hidden on mobile */}
                <nav className="hidden lg:flex w-60 shrink-0 overflow-y-auto flex-col relative"
                    style={{ background: 'linear-gradient(180deg, #0A1F3A 0%, #0A2D50 60%, #0A385C 100%)' }}
                >
                    <div className="px-4 pt-5 pb-3">
                        <div className="text-[10px] tracking-widest uppercase text-[#00A8E8]/60 font-bold mb-4 px-1">Menu Utama</div>
                        <div className="space-y-0.5">
                            {visibleNav.map((item) => {
                                const active = currentRoute === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            active
                                                ? 'bg-[#00A8E8]/15 text-[#00A8E8] border-l-[3px] border-[#00A8E8]'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                                        }`}
                                    >
                                        <Icon size={17} strokeWidth={active ? 2.5 : 1.5} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Thread/Ulir decoration at sidebar bottom */}
                    <div className="mt-auto pointer-events-none select-none flex justify-end">
                        <ThreadDecor size={160} color="#00A8E8" opacity={0.08} origin="br" count={9} strokeWidth={1.5} />
                    </div>
                </nav>

                {/* Main content — add bottom padding on mobile for bottom nav */}
                <main className="flex-1 overflow-x-auto bg-slate-100 p-3 sm:p-6 pb-20 lg:pb-6">
                    {children}
                </main>
            </div>

            {/* ── Mobile Bottom Navigation Bar ──────────────────────────── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t shadow-lg safe-area-pb"
                style={{ background: 'linear-gradient(90deg, #0A1F3A 0%, #0A385C 100%)' }}
            >
                <div className="flex items-center justify-around px-1 py-1">
                    {visibleNav.slice(0, 5).map((item) => {
                        const active = currentRoute === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-w-[52px] transition-colors ${
                                    active ? 'text-[#00A8E8]' : 'text-slate-500'
                                }`}
                            >
                                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                                <span className={`text-[9px] font-semibold leading-tight text-center ${active ? 'text-[#00A8E8]' : 'text-slate-500'}`}>
                                    {item.label.split(' ')[0]}
                                </span>
                            </Link>
                        );
                    })}
                    {/* More button if more than 5 nav items */}
                    {visibleNav.length > 5 && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-w-[52px] text-slate-500"
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
