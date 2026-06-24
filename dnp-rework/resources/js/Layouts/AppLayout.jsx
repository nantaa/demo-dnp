import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, Columns, List, Plus, Bell, LogOut, ShieldCheck, Boxes, HardHat 
} from 'lucide-react';
import { ROLES } from '../Constants';

export default function AppLayout({ header, children }) {
    const { auth } = usePage().props;
    const { user } = auth;
    const currentRoute = window.location.pathname;

    const navItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/kanban', label: 'Kanban Board', icon: Columns },
        { href: '/jobs', label: 'Daftar Job', icon: List },
        { href: '/jobs/create', label: 'Job Baru', icon: Plus, roles: ['marketing', 'manager', 'superadmin'] },
        { href: '/users', label: 'User Management', icon: ShieldCheck, roles: ['superadmin'] },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded">
                            <HardHat size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] tracking-widest uppercase text-gray-500 font-bold leading-none">PT Delta Nusantara Persada</div>
                            <div className="text-base font-medium leading-tight mt-1">Riksa Uji · Monitoring</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded">
                            <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold rounded">
                                {ROLES[user.role]?.label || 'USR'}
                            </div>
                            <div>
                                <div className="text-xs font-bold leading-none">{user.name}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{ROLES[user.role]?.name || user.role}</div>
                            </div>
                        </div>
                        <Link href={route('logout')} method="post" as="button" className="text-gray-500 hover:text-black">
                            <LogOut size={16} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden">
                <nav className="w-60 bg-white border-r px-4 py-6 shrink-0 overflow-y-auto">
                    <div className="text-[10px] tracking-widest uppercase text-gray-400 font-bold mb-4 px-2">Menu Utama</div>
                    
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            if (item.roles && !item.roles.includes(user.role)) return null;
                            
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

                <main className="flex-1 overflow-x-auto bg-gray-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
