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
        { href: '/reminder-suket', label: 'Reminder Suket', icon: ShieldCheck, roles: ['marketing', 'manager', 'admin', 'superadmin'] },
        { href: '/inventory', label: 'Alat & SKP', icon: Boxes, roles: ['admin', 'manager', 'inspektur', 'superadmin'] },
    ];

    return (
        <div className="min-h-screen flex flex-col text-gray-900 font-sans" style={{ background: 'var(--bg-deep)' }}>
            <style dangerouslySetInnerHTML={{__html: `
                :root {
                  --bg-deep: #F2EFE8;
                  --bg-card: #FFFFFF;
                  --ink: #111111;
                  --ink-soft: #666666;
                  --ink-faint: #AAAAAA;
                  --line: #E5E2DC;
                  --line-soft: #F0EDE6;
                  --ok: #15803d;
                  --warn: #b45309;
                  --bad: #b91c1c;
                  --info: #0369a1;
                  --accent: #b45309;
                }
                .dnp-serif {
                  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                }
                .dnp-mono {
                  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                }
                .panel {
                  background: var(--bg-card);
                  border: 1px solid var(--line);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .tag {
                  display: inline-flex;
                  align-items: center;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: 600;
                  letter-spacing: 0.05em;
                  text-transform: uppercase;
                }
                .tag-ok { background: #dcfce7; color: var(--ok); border: 1px solid #bbf7d0; }
                .tag-warn { background: #fef3c7; color: var(--warn); border: 1px solid #fde68a; }
                .tag-bad { background: #fee2e2; color: var(--bad); border: 1px solid #fecaca; }
                .tag-slate { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
            `}} />
            {/* Header */}
            <header className="border-b sticky top-0 z-10" style={{ background: 'var(--bg-deep)', borderColor: 'var(--line)' }}>
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded">
                            <HardHat size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] tracking-widest uppercase font-bold leading-none" style={{ color: 'var(--ink-soft)' }}>PT Delta Nusantara Persada</div>
                            <div className="text-base font-medium leading-tight mt-1 dnp-serif" style={{ fontSize: '18px', fontWeight: 600 }}>Riksa Uji · Monitoring System</div>
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
                <nav className="w-60 border-r px-4 py-6 shrink-0 overflow-y-auto" style={{ background: 'var(--bg-deep)', borderColor: 'var(--line)' }}>
                    <div className="text-[10px] tracking-widest uppercase font-bold mb-4 px-2" style={{ color: 'var(--ink-soft)' }}>Menu</div>
                    
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

                <main className="flex-1 overflow-x-auto p-6" style={{ background: 'var(--bg-deep)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
