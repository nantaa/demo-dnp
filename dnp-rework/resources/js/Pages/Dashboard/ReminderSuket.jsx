import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';

export default function ReminderSuketWrapper(props) {
    return (
        <ErrorBoundary>
            <ReminderSuket {...props} />
        </ErrorBoundary>
    );
}

function KPICard({ label, value, sub, icon: Icon, accentClass = 'text-gray-500' }) {
    return (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col relative">
            <div className="flex justify-between items-start">
                <div className="text-xs tracking-wider uppercase text-gray-500 font-semibold">
                    {label}
                </div>
                <Icon size={18} className={accentClass} />
            </div>
            <div className={`text-4xl font-semibold mt-3 ${accentClass !== 'text-gray-500' ? accentClass : 'text-gray-900'}`}>
                {value}
            </div>
            <div className="text-sm text-gray-500 mt-2">
                {sub}
            </div>
        </div>
    );
}

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

const daysBetween = (d1, d2) => {
    if (!d1 || !d2) return null;
    const a = new Date(d1);
    const b = new Date(d2);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
};

function StatusBadge({ status, children }) {
    let cls = 'bg-gray-100 text-gray-700 border-gray-200';
    if (status === 'valid') cls = 'bg-green-100 text-green-700 border-green-200';
    if (status === 'expiring_soon') cls = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status === 'expired') cls = 'bg-red-100 text-red-700 border-red-200';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
            {children}
        </span>
    );
}

function ReminderSuket({ jobs = [] }) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const sukets = useMemo(() => {
        const rows = [];
        jobs.forEach(j => {
            if (j.units_tracking && Array.isArray(j.units_tracking)) {
                j.units_tracking.forEach((u, i) => {
                    if (u.no_suket) {
                        rows.push({
                            key: `${j.id}-u${i}`,
                            job: j,
                            kode: j.kode,
                            klien: j.klien,
                            unit_label: u.unit_label || `Unit ${u.unit_no}`,
                            no_suket: u.no_suket,
                            tgl_suket: u.tgl_suket,
                            expired_at: u.suket_expired_at,
                            validity_months: u.suket_validity_months,
                        });
                    }
                });
            } else if (j.no_suket) {
                // Fallback for older data format
                rows.push({
                    key: j.id,
                    job: j,
                    kode: j.kode,
                    klien: j.klien,
                    unit_label: `${j.units || 1} unit (single)`,
                    no_suket: j.no_suket,
                    tgl_suket: j.tgl_suket,
                    expired_at: j.suket_expired_at,
                    validity_months: j.suket_validity_months,
                });
            }
        });
        return rows;
    }, [jobs]);

    const rowStatus = (row) => {
        const days = daysBetween(todayStr, row.expired_at);
        if (days < 0) return 'expired';
        if (days <= 90) return 'expiring_soon';
        return 'valid';
    };

    const expired = sukets.filter(r => rowStatus(r) === 'expired');
    const expiringSoon = sukets.filter(r => rowStatus(r) === 'expiring_soon');
    const valid = sukets.filter(r => rowStatus(r) === 'valid');

    const renderList = (list, label) => {
        if (list.length === 0) return null;
        return (
            <div className="mb-8">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1">{label} · {list.length}</div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                <th className="p-4 font-semibold">Kode-Unit</th>
                                <th className="p-4 font-semibold">Klien</th>
                                <th className="p-4 font-semibold">Unit / No Suket</th>
                                <th className="p-4 font-semibold">Tgl Terbit</th>
                                <th className="p-4 font-semibold">Berlaku Sampai</th>
                                <th className="p-4 font-semibold">Masa Berlaku</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((row) => {
                                const st = rowStatus(row);
                                const days = daysBetween(todayStr, row.expired_at);
                                const validityLabel = row.validity_months >= 12 ? `${row.validity_months / 12} tahun` : `${row.validity_months} bulan`;
                                
                                return (
                                    <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                                        <td className="p-4 align-top">
                                            <Link href={`/jobs?search=${row.kode}`} className="font-mono font-bold text-blue-600 hover:underline">
                                                {row.kode}
                                            </Link>
                                        </td>
                                        <td className="p-4 align-top font-medium text-gray-900">{row.klien}</td>
                                        <td className="p-4 align-top">
                                            <div className="font-semibold text-gray-900">{row.unit_label}</div>
                                            <div className="font-mono text-xs text-gray-500 mt-1">{row.no_suket}</div>
                                        </td>
                                        <td className="p-4 align-top font-mono text-xs text-gray-700">{formatDate(row.tgl_suket)}</td>
                                        <td className="p-4 align-top">
                                            <div className="font-mono text-xs text-gray-900">{formatDate(row.expired_at)}</div>
                                            <div className="text-[10px] text-gray-500 mt-1">
                                                {days < 0 ? `Expired ${Math.abs(days)} hari lalu` : `${days} hari lagi`}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-xs text-gray-600">{validityLabel || '—'}</td>
                                        <td className="p-4 align-top text-center">
                                            <StatusBadge status={st}>{{ expired: 'EXPIRED', expiring_soon: 'EXPIRING', valid: 'VALID' }[st]}</StatusBadge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <Head title="Reminder Suket" />
            
            <div className="pb-8">
                <div className="mb-6 px-1">
                    <div className="text-xs tracking-widest uppercase text-gray-500 font-bold">Re-Inspection Reminder</div>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">Database Masa Berlaku Suket</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        Reminder otomatis per-unit: setiap Suket dilacak independen sesuai masa berlaku. Alert H-90 untuk re-inspeksi.
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <KPICard label="Expired" value={expired.length} sub="Perlu kontak klien" icon={AlertCircle} accentClass={expired.length > 0 ? 'text-red-600' : 'text-gray-500'} />
                    <KPICard label="Akan Expire (≤90h)" value={expiringSoon.length} sub="Schedule re-inspeksi" icon={Clock} accentClass={expiringSoon.length > 0 ? 'text-yellow-600' : 'text-gray-500'} />
                    <KPICard label="Valid" value={valid.length} sub="Suket aktif" icon={ShieldCheck} accentClass="text-green-600" />
                </div>

                {sukets.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
                        <ShieldCheck size={32} className="mx-auto mb-3 opacity-40" />
                        <div className="font-medium text-gray-900">Belum ada Suket terbit.</div>
                        <div className="text-xs mt-1">Suket akan muncul di sini setelah Kadiv RU input No Suket dari Disnaker di Tahap 6.</div>
                    </div>
                ) : (
                    <>
                        {renderList(expired, 'Expired')}
                        {renderList(expiringSoon, 'Akan Expire (≤90 hari)')}
                        {renderList(valid, 'Valid')}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
